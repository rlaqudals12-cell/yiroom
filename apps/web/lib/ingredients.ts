/**
 * 성분 분석 시스템 (하이브리드 방식)
 *
 * Week 6: 성분 DB + AI 분석 통합
 * - DB 우선 조회 (빠름, 일관성)
 * - DB에 없는 성분은 AI 분석
 * - 결과 통합하여 반환
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { productLogger } from '@/lib/utils/logger';

// =============================================================================
// 상수 정의
// =============================================================================

/** API 타임아웃 (3초) */
const TIMEOUT_MS = 3000;

/** 최대 재시도 횟수 */
const MAX_RETRIES = 2;

// Gemini 클라이언트 초기화
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 타임아웃이 있는 Promise 래퍼
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`[Ingredients] Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * 피부 타입 정의
 */
export type SkinType = 'dry' | 'oily' | 'sensitive' | 'combination' | 'normal';

/**
 * 성분 경고 레벨
 */
export type WarningLevel = 'high' | 'medium' | 'low';

/**
 * 성분 경고 정보
 */
export interface IngredientWarning {
  ingredient: string;
  ingredientEn?: string;
  level: WarningLevel;
  ewgGrade: number;
  reason: string;
  alternatives?: string[];
  source: 'db' | 'ai';
}

/**
 * DB에서 조회된 성분 정보
 */
export interface DBIngredient {
  id: string;
  name_ko: string;
  name_en: string | null;
  aliases: string[] | null;
  ewg_grade: number | null;
  warning_dry: number;
  warning_oily: number;
  warning_sensitive: number;
  warning_combination: number;
  category: string | null;
  description: string | null;
  side_effects: string | null;
  alternatives: string[] | null;
}

/**
 * 피부 타입에 따른 경고 레벨 계산
 */
function getWarningLevel(ingredient: DBIngredient, skinType: SkinType): number {
  switch (skinType) {
    case 'dry':
      return ingredient.warning_dry;
    case 'oily':
      return ingredient.warning_oily;
    case 'sensitive':
      return ingredient.warning_sensitive;
    case 'combination':
      return ingredient.warning_combination;
    default:
      // normal: 모든 경고 레벨의 평균
      return Math.round(
        (ingredient.warning_dry +
          ingredient.warning_oily +
          ingredient.warning_sensitive +
          ingredient.warning_combination) /
          4
      );
  }
}

/**
 * 숫자 레벨을 문자열 레벨로 변환
 */
function numToWarningLevel(num: number): WarningLevel {
  if (num >= 4) return 'high';
  if (num >= 3) return 'medium';
  return 'low';
}

/**
 * DB에서 성분 검색
 * 한글명, 영문명, 별칭(aliases) 모두 검색
 * 검색 우선순위: 정확매칭 > 별칭매칭 > 부분매칭
 */
async function searchIngredientInDB(ingredientName: string): Promise<DBIngredient | null> {
  const supabase = createServiceRoleClient();
  const searchTerm = ingredientName.toLowerCase().trim();

  // 1. 정확한 매칭 먼저 시도 (name_ko, name_en)
  const { data: exactMatch } = await supabase
    .from('ingredients')
    .select('*')
    .or(`name_ko.ilike.${searchTerm},name_en.ilike.${searchTerm}`)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (exactMatch) {
    return exactMatch as DBIngredient;
  }

  // 2. 모든 활성 성분 조회 후 별칭에서 검색
  // PostgreSQL 배열 검색의 한계로 클라이언트 측 필터링 수행
  const { data: allIngredients } = await supabase
    .from('ingredients')
    .select('*')
    .eq('is_active', true)
    .not('aliases', 'is', null);

  if (allIngredients && allIngredients.length > 0) {
    // 별칭 정확 매칭
    const aliasExactMatch = allIngredients.find((ing) =>
      ing.aliases?.some((alias: string) => alias.toLowerCase() === searchTerm)
    );
    if (aliasExactMatch) {
      return aliasExactMatch as DBIngredient;
    }

    // 별칭 부분 매칭
    const aliasPartialMatch = allIngredients.find((ing) =>
      ing.aliases?.some(
        (alias: string) =>
          alias.toLowerCase().includes(searchTerm) || searchTerm.includes(alias.toLowerCase())
      )
    );
    if (aliasPartialMatch) {
      return aliasPartialMatch as DBIngredient;
    }
  }

  // 3. 이름 부분 매칭 시도 (name_ko, name_en)
  const { data: partialMatch } = await supabase
    .from('ingredients')
    .select('*')
    .or(`name_ko.ilike.%${searchTerm}%,name_en.ilike.%${searchTerm}%`)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (partialMatch) {
    return partialMatch as DBIngredient;
  }

  return null;
}

/**
 * AI로 성분 분석 (Gemini)
 * DB에 없는 성분에 대해 호출
 * - 3초 타임아웃 + 2회 재시도 적용
 */
async function analyzeIngredientWithAI(
  ingredientName: string,
  skinType: SkinType
): Promise<IngredientWarning | null> {
  // Mock 모드 확인
  if (process.env.FORCE_MOCK_AI === 'true') {
    productLogger.info('[Ingredients] Using mock (FORCE_MOCK_AI=true)');
    return null; // AI 분석 스킵, DB 결과만 사용
  }

  // Gemini 미설정 시 null 반환
  if (!genAI) {
    productLogger.debug('[Ingredients] Gemini not configured, skipping AI analysis');
    return null;
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `You are a cosmetic ingredient expert. Analyze the following ingredient for skin safety.

Ingredient: "${ingredientName}"
User skin type: ${skinType}

Respond ONLY with a JSON object (no markdown, no extra text):
{
  "isHarmful": true/false,
  "warningLevel": "high" | "medium" | "low",
  "ewgGrade": 1-10,
  "reason": "Brief explanation in Korean (1-2 sentences)",
  "alternatives": ["Alternative 1", "Alternative 2"] or null
}

Guidelines:
- high: Known irritant, allergen, or harmful (EWG 7-10)
- medium: May cause issues for ${skinType} skin (EWG 4-6)
- low: Generally safe but mild caution (EWG 1-3)
- If the ingredient is generally safe, set isHarmful to false
- Consider the user's skin type when evaluating risk`;

  // 재시도 로직
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 타임아웃 적용
      const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
      const response = result.response;
      const text = response.text().trim();

      // JSON 파싱
      let cleanText = text;
      if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
      if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
      if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText) as {
        isHarmful: boolean;
        warningLevel: WarningLevel;
        ewgGrade: number;
        reason: string;
        alternatives: string[] | null;
      };

      // 해롭지 않으면 null 반환
      if (!parsed.isHarmful) {
        productLogger.debug(`[Ingredients] ${ingredientName} is safe`);
        return null;
      }

      productLogger.info(`[Ingredients] AI analysis completed for: ${ingredientName}`);
      return {
        ingredient: ingredientName,
        level: parsed.warningLevel,
        ewgGrade: parsed.ewgGrade,
        reason: parsed.reason,
        alternatives: parsed.alternatives || undefined,
        source: 'ai',
      };
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;
      productLogger.warn(
        `[Ingredients] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed for ${ingredientName}:`,
        error instanceof Error ? error.message : error
      );

      if (isLastAttempt) {
        productLogger.error(`[Ingredients] All retries failed for: ${ingredientName}`);
        return null; // AI 실패 시 null 반환 (DB 결과만 사용)
      }

      // 재시도 전 짧은 대기
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // 이론적으로 도달 불가능하지만 타입 안전성을 위해
  return null;
}

/**
 * 성분 목록 분석 (하이브리드)
 *
 * @param ingredients - 분석할 성분 목록 (한글 또는 영문)
 * @param skinType - 사용자 피부 타입
 * @returns 경고 성분 목록 (위험도 높은 순 정렬)
 */
export async function analyzeIngredients(
  ingredients: string[],
  skinType: SkinType = 'normal'
): Promise<IngredientWarning[]> {
  const warnings: IngredientWarning[] = [];
  const unknownIngredients: string[] = [];

  // 1. DB에서 각 성분 검색
  for (const ingredientName of ingredients) {
    // 빈 문자열 스킵
    if (!ingredientName.trim()) continue;

    const dbResult = await searchIngredientInDB(ingredientName.trim());

    if (dbResult) {
      // DB에서 찾음
      const warningNum = getWarningLevel(dbResult, skinType);

      // 경고 레벨이 2 이상인 경우만 추가
      if (warningNum >= 2) {
        warnings.push({
          ingredient: dbResult.name_ko,
          ingredientEn: dbResult.name_en || undefined,
          level: numToWarningLevel(warningNum),
          ewgGrade: dbResult.ewg_grade || 5,
          reason: dbResult.side_effects || '주의가 필요한 성분입니다.',
          alternatives: dbResult.alternatives || undefined,
          source: 'db',
        });
      }
    } else {
      // DB에 없음 → AI 분석 대상
      unknownIngredients.push(ingredientName);
    }
  }

  // 2. DB에 없는 성분 AI 분석 (Gemini)
  if (unknownIngredients.length > 0) {
    // 병렬 처리로 성능 최적화 (최대 5개씩)
    const batchSize = 5;
    for (let i = 0; i < unknownIngredients.length; i += batchSize) {
      const batch = unknownIngredients.slice(i, i + batchSize);
      const aiResults = await Promise.all(
        batch.map((name) => analyzeIngredientWithAI(name, skinType))
      );
      for (const result of aiResults) {
        if (result) {
          warnings.push(result);
        }
      }
    }
  }

  // 3. 위험도 높은 순으로 정렬
  return warnings.sort((a, b) => {
    const levelOrder = { high: 3, medium: 2, low: 1 };
    return levelOrder[b.level] - levelOrder[a.level];
  });
}

/**
 * 피부 타입별 주의 성분 조회
 * 특정 피부 타입에 대한 모든 주의 성분 반환
 */
export async function getWarningIngredientsForSkinType(
  skinType: SkinType
): Promise<DBIngredient[]> {
  const supabase = createServiceRoleClient();

  // 피부 타입에 따른 컬럼 선택
  let warningColumn: string;
  switch (skinType) {
    case 'dry':
      warningColumn = 'warning_dry';
      break;
    case 'oily':
      warningColumn = 'warning_oily';
      break;
    case 'sensitive':
      warningColumn = 'warning_sensitive';
      break;
    case 'combination':
      warningColumn = 'warning_combination';
      break;
    default:
      warningColumn = 'warning_sensitive'; // normal은 민감성 기준
  }

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .gte(warningColumn, 3) // 주의 레벨 3 이상
    .eq('is_active', true)
    .order(warningColumn, { ascending: false });

  if (error) {
    productLogger.error('Failed to fetch warning ingredients:', error);
    return [];
  }

  return (data as DBIngredient[]) || [];
}

/**
 * EWG 등급별 성분 조회
 */
export async function getIngredientsByEWGGrade(minGrade: number = 7): Promise<DBIngredient[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .gte('ewg_grade', minGrade)
    .eq('is_active', true)
    .order('ewg_grade', { ascending: false });

  if (error) {
    productLogger.error('Failed to fetch ingredients by EWG grade:', error);
    return [];
  }

  return (data as DBIngredient[]) || [];
}

/**
 * 모든 활성 성분 조회
 */
export async function getAllIngredients(): Promise<DBIngredient[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('is_active', true)
    .order('name_ko');

  if (error) {
    productLogger.error('Failed to fetch all ingredients:', error);
    return [];
  }

  return (data as DBIngredient[]) || [];
}
