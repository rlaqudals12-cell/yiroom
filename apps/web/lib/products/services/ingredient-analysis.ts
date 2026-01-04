/**
 * AI 성분 분석 서비스
 * @description Gemini AI를 사용한 화장품 성분 분석 및 요약
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CosmeticIngredient } from '@/types/ingredient';

// =============================================================================
// 상수 정의
// =============================================================================

/** API 타임아웃 (3초) */
const TIMEOUT_MS = 3000;

/** 최대 재시도 횟수 */
const MAX_RETRIES = 2;

// =============================================================================
// 타입 정의
// =============================================================================

/**
 * AI 성분 키워드
 */
export interface AIIngredientKeyword {
  label: string;
  score: number;
  relatedIngredients: string[];
}

/**
 * AI 성분 분석 요약 결과
 */
export interface AIIngredientSummary {
  /** 핵심 키워드 (최대 5개) */
  keywords: AIIngredientKeyword[];
  /** 한줄 요약 */
  summary: string;
  /** 추천 포인트 */
  recommendPoints: string[];
  /** 주의 포인트 */
  cautionPoints: string[];
  /** 피부타입별 추천도 (0-100) */
  skinTypeRecommendation: {
    oily: number;
    dry: number;
    sensitive: number;
    combination: number;
    normal: number;
  };
}

// =============================================================================
// Mock 데이터 (AI Fallback)
// =============================================================================

/**
 * Mock AI 성분 요약 생성
 */
export function generateMockIngredientSummary(
  ingredients: CosmeticIngredient[]
): AIIngredientSummary {
  // 성분 기능 분석
  const functionCounts: Record<string, number> = {};
  const hasMoisturizer = ingredients.some((i) => i.functions.some((f) => f.includes('보습')));
  const hasWhitening = ingredients.some((i) => i.functions.some((f) => f.includes('미백')));
  const hasSoothing = ingredients.some((i) => i.functions.some((f) => f.includes('진정')));
  const hasAntiaging = ingredients.some((i) =>
    i.functions.some((f) => f.includes('항산화') || f.includes('주름'))
  );

  // 주의 성분 확인
  const cautionCount = ingredients.filter((i) => i.isCaution20).length;
  const allergenCount = ingredients.filter((i) => i.isAllergen).length;

  // 기능별 집계
  ingredients.forEach((ing) => {
    ing.functions.forEach((func) => {
      functionCounts[func] = (functionCounts[func] || 0) + 1;
    });
  });

  // 키워드 생성
  const keywords: AIIngredientKeyword[] = [];

  if (hasMoisturizer) {
    keywords.push({
      label: '보습력우수',
      score: 0.92,
      relatedIngredients: ingredients
        .filter((i) => i.functions.some((f) => f.includes('보습')))
        .slice(0, 3)
        .map((i) => i.nameKo),
    });
  }

  if (hasWhitening) {
    keywords.push({
      label: '톤업효과',
      score: 0.85,
      relatedIngredients: ingredients
        .filter((i) => i.functions.some((f) => f.includes('미백')))
        .slice(0, 3)
        .map((i) => i.nameKo),
    });
  }

  if (hasSoothing) {
    keywords.push({
      label: '진정케어',
      score: 0.88,
      relatedIngredients: ingredients
        .filter((i) => i.functions.some((f) => f.includes('진정')))
        .slice(0, 3)
        .map((i) => i.nameKo),
    });
  }

  if (hasAntiaging) {
    keywords.push({
      label: '안티에이징',
      score: 0.82,
      relatedIngredients: ingredients
        .filter((i) => i.functions.some((f) => f.includes('항산화') || f.includes('주름')))
        .slice(0, 3)
        .map((i) => i.nameKo),
    });
  }

  if (cautionCount === 0) {
    keywords.push({
      label: '저자극',
      score: 0.95,
      relatedIngredients: [],
    });
  }

  // 요약 문장 생성
  const summaryParts: string[] = [];
  if (hasMoisturizer) summaryParts.push('보습');
  if (hasWhitening) summaryParts.push('미백');
  if (hasSoothing) summaryParts.push('진정');
  if (hasAntiaging) summaryParts.push('안티에이징');

  const summary =
    summaryParts.length > 0
      ? `${summaryParts.join(', ')} 효과가 기대되는 제형으로, ${cautionCount === 0 ? '자극이 적어 데일리 사용에 적합합니다.' : '일부 주의 성분이 있어 민감성 피부는 주의가 필요합니다.'}`
      : '기본적인 피부 케어에 적합한 제품입니다.';

  // 추천/주의 포인트
  const recommendPoints: string[] = [];
  const cautionPoints: string[] = [];

  if (hasMoisturizer) recommendPoints.push('히알루론산 등 보습 성분이 풍부해요');
  if (hasWhitening) recommendPoints.push('나이아신아마이드로 톤업 기대!');
  if (hasSoothing) recommendPoints.push('판테놀/센텔라로 진정 케어');
  if (cautionCount === 0) recommendPoints.push('20가지 주의 성분 무첨가');

  if (cautionCount > 0) cautionPoints.push(`주의 성분 ${cautionCount}개 포함`);
  if (allergenCount > 0) cautionPoints.push(`알레르기 유발 가능 성분 ${allergenCount}개`);
  if (ingredients.some((i) => i.ewgScore && i.ewgScore >= 7))
    cautionPoints.push('EWG 7등급 이상 성분 포함');

  // 피부타입별 추천도
  const skinTypeRecommendation = {
    oily: 75,
    dry: 80,
    sensitive: cautionCount === 0 ? 85 : 60,
    combination: 78,
    normal: 82,
  };

  if (hasMoisturizer) {
    skinTypeRecommendation.dry += 10;
    skinTypeRecommendation.oily -= 5;
  }

  if (hasSoothing) {
    skinTypeRecommendation.sensitive += 10;
  }

  // 범위 제한
  Object.keys(skinTypeRecommendation).forEach((key) => {
    const k = key as keyof typeof skinTypeRecommendation;
    skinTypeRecommendation[k] = Math.min(100, Math.max(0, skinTypeRecommendation[k]));
  });

  return {
    keywords: keywords.slice(0, 5),
    summary,
    recommendPoints: recommendPoints.slice(0, 3),
    cautionPoints: cautionPoints.slice(0, 3),
    skinTypeRecommendation,
  };
}

// =============================================================================
// Gemini AI 분석
// =============================================================================

const INGREDIENT_ANALYSIS_PROMPT = `
You are a cosmetic formulation expert and dermatologist.

Analyze the following cosmetic ingredients list and provide:

1. Key feature keywords (max 5) in Korean:
   - Examples: "피지발란스", "보습력우수", "저자극", "미백효과", "안티에이징", "진정케어"
   - Each keyword should have a confidence score (0-1)

2. One-sentence summary in Korean (under 50 characters)
   - Focus on main benefits and suitability

3. Recommendation points (max 3) in Korean
   - Specific benefits of this ingredient combination

4. Caution points (max 3) in Korean if any concerning ingredients
   - Only include if there are actual concerns

5. Skin type recommendation scores (0-100):
   - oily: score for oily skin
   - dry: score for dry skin
   - sensitive: score for sensitive skin
   - combination: score for combination skin
   - normal: score for normal skin

Ingredients:
{ingredients}

IMPORTANT: Return ONLY valid JSON, no markdown or explanation.
Return as JSON:
{
  "keywords": [{"label": "키워드", "score": 0.95, "relatedIngredients": ["성분1", "성분2"]}],
  "summary": "한줄 요약 (50자 이내)",
  "recommendPoints": ["추천 포인트1", "추천 포인트2"],
  "cautionPoints": ["주의 포인트1"],
  "skinTypeRecommendation": {"oily": 85, "dry": 70, "sensitive": 75, "combination": 80, "normal": 82}
}
`;

/**
 * 타임아웃이 있는 Promise 래퍼
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * Gemini AI를 사용한 성분 분석
 * - 3초 타임아웃 + 2회 재시도 적용
 */
export async function analyzeIngredientsWithAI(
  ingredients: CosmeticIngredient[]
): Promise<AIIngredientSummary> {
  // Mock 모드 확인
  if (process.env.FORCE_MOCK_AI === 'true') {
    console.log('[IngredientAnalysis] Using mock (FORCE_MOCK_AI=true)');
    return generateMockIngredientSummary(ingredients);
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.warn('[IngredientAnalysis] No API key, using mock');
    return generateMockIngredientSummary(ingredients);
  }

  // 성분 목록 문자열 생성
  const ingredientsList = ingredients
    .map((ing) => {
      const parts = [ing.nameKo];
      if (ing.ewgScore) parts.push(`(EWG ${ing.ewgScore})`);
      if (ing.functions.length > 0) parts.push(`[${ing.functions.join(', ')}]`);
      if (ing.isCaution20) parts.push('⚠️주의성분');
      if (ing.isAllergen) parts.push('⚠️알레르기');
      return parts.join(' ');
    })
    .join('\n');

  const prompt = INGREDIENT_ANALYSIS_PROMPT.replace('{ingredients}', ingredientsList);

  // 재시도 로직
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
      });

      // 타임아웃 적용
      const result = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
      const response = result.response;
      const text = response.text();

      // JSON 파싱
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini');
      }

      const parsed = JSON.parse(jsonMatch[0]) as AIIngredientSummary;

      // 유효성 검증
      if (!parsed.keywords || !parsed.summary || !parsed.skinTypeRecommendation) {
        throw new Error('Missing required fields in response');
      }

      console.log('[IngredientAnalysis] AI analysis completed');
      return parsed;
    } catch (error) {
      const isLastAttempt = attempt === MAX_RETRIES;
      console.warn(
        `[IngredientAnalysis] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`,
        error instanceof Error ? error.message : error
      );

      if (isLastAttempt) {
        console.error('[IngredientAnalysis] All retries failed, using mock');
        return generateMockIngredientSummary(ingredients);
      }

      // 재시도 전 짧은 대기
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // 이론적으로 도달 불가능하지만 타입 안전성을 위해
  return generateMockIngredientSummary(ingredients);
}
