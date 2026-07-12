/**
 * AI 성분 분석 서비스
 * @description Gemini AI를 사용한 화장품 성분 분석 및 요약
 */

import { generateContent, isGeminiAvailable } from '@/lib/gemini/client';
import type { CosmeticIngredient } from '@/types/ingredient';
import { extractJsonObject } from '@/lib/utils/json-extract';

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
  /**
   * 법적 고지 — 화장품법 §13 대응.
   * 성분 분석은 성분의 일반적 특성에 기반한 참고 정보일 뿐,
   * 기능성화장품 심사 결과나 제품의 효능·효과 보장이 아님을 명시한다.
   */
  disclaimer: string;
}

/**
 * 성분 분석 고지 문구 (항상 결과에 포함).
 * 미백·주름개선 등은 식약처 기능성화장품 심사를 거쳐야 표시할 수 있으므로,
 * 여기서는 성분의 일반적 특성만 서술하고 효능 단정을 하지 않는다.
 */
const INGREDIENT_DISCLAIMER =
  '성분의 일반적 특성을 바탕으로 한 참고 정보로, 기능성화장품 심사 결과나 제품의 효능·효과를 보장하지 않아요.';

// =============================================================================
// Mock 데이터 (AI Fallback)
// =============================================================================

/**
 * Mock AI 성분 요약 생성
 */
// eslint-disable-next-line sonarjs/cognitive-complexity -- complex business logic
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

  // 효능 단정(미백효과·안티에이징 등) 대신 '어떤 성분군이 들어 있는지' 사실만 표기 (화장품법 §13)
  if (hasMoisturizer) {
    keywords.push({
      label: '보습 성분',
      score: 0.92,
      relatedIngredients: ingredients
        .filter((i) => i.functions.some((f) => f.includes('보습')))
        .slice(0, 3)
        .map((i) => i.nameKo),
    });
  }

  if (hasWhitening) {
    keywords.push({
      label: '브라이트닝 성분',
      score: 0.85,
      relatedIngredients: ingredients
        .filter((i) => i.functions.some((f) => f.includes('미백')))
        .slice(0, 3)
        .map((i) => i.nameKo),
    });
  }

  if (hasSoothing) {
    keywords.push({
      label: '진정 성분',
      score: 0.88,
      relatedIngredients: ingredients
        .filter((i) => i.functions.some((f) => f.includes('진정')))
        .slice(0, 3)
        .map((i) => i.nameKo),
    });
  }

  if (hasAntiaging) {
    keywords.push({
      label: '항산화 성분',
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

  // 요약 문장 생성 — '효과가 기대된다'는 단정 대신 '어떤 성분군이 포함됐다'는 사실만 서술
  const summaryParts: string[] = [];
  if (hasMoisturizer) summaryParts.push('보습');
  if (hasWhitening) summaryParts.push('브라이트닝');
  if (hasSoothing) summaryParts.push('진정');
  if (hasAntiaging) summaryParts.push('항산화');

  const cautionSuffix =
    cautionCount === 0
      ? '자극 우려 성분은 확인되지 않았어요.'
      : '일부 주의 성분이 있어 민감성 피부는 참고가 필요해요.';
  const summary =
    summaryParts.length > 0
      ? `${summaryParts.join(', ')} 계열 성분이 포함된 제형이에요. ${cautionSuffix}`
      : '기본적인 피부 케어에 두루 쓰이는 성분으로 구성된 제품이에요.';

  // 추천/주의 포인트 — 성분 구성 사실 위주 (효능 단정 금지)
  const recommendPoints: string[] = [];
  const cautionPoints: string[] = [];

  if (hasMoisturizer) recommendPoints.push('히알루론산 등 보습 성분이 함께 들어 있어요');
  if (hasWhitening) recommendPoints.push('나이아신아마이드 등 브라이트닝 성분이 들어 있어요');
  if (hasSoothing) recommendPoints.push('판테놀·센텔라 등 진정 성분이 들어 있어요');
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
    disclaimer: INGREDIENT_DISCLAIMER,
  };
}

// =============================================================================
// Gemini AI 분석
// =============================================================================

// 한국 화장품법 §13(부당한 표시·광고 금지) 대응:
// 미백·주름개선 등 '효능·효과'는 식약처 기능성화장품 심사를 거쳐야 표시 가능하므로,
// 프롬프트에서 효능 단정 키워드 생성을 금지하고 '성분의 일반적 특성' 사실 서술만 요청한다.
const INGREDIENT_ANALYSIS_PROMPT = `
You are a cosmetic ingredient information assistant. You describe the general,
commonly-known characteristics of ingredients. You are NOT diagnosing skin or
promising results.

Analyze the following cosmetic ingredients list and provide FACTUAL, ingredient-based
information only. Write everything in natural, polite Korean.

STRICT RULES (Korean Cosmetics Act §13):
- Do NOT claim finished-product efficacy such as "미백효과", "안티에이징", "주름개선",
  "탄력 개선", "노화 방지", or any medicinal/treatment effect.
- Describe which KIND of ingredients are present (e.g. "보습 성분", "브라이트닝 성분",
  "진정 성분", "항산화 성분"), NOT what result the product will achieve.
- Do NOT use definitive expressions like "효과가 있다", "개선됩니다", "치료".
- These are reference notes only, unrelated to functional-cosmetic (기능성화장품) review.

Provide:

1. Key ingredient-group keywords (max 5) in Korean, describing composition as fact:
   - Examples: "보습 성분", "브라이트닝 성분", "진정 성분", "항산화 성분", "저자극", "피지 케어 성분"
   - Each keyword should have a confidence score (0-1)

2. One-sentence summary in Korean (under 50 characters)
   - Describe the ingredient composition factually, not a promised effect

3. Recommendation points (max 3) in Korean
   - Which notable ingredients are included (composition facts, not promised results)

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
  // Mock 모드 또는 API 키 미설정
  if (!isGeminiAvailable()) {
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
      // 타임아웃 적용
      const result = await withTimeout(generateContent({ contents: prompt }), TIMEOUT_MS);
      const text = result.text;

      // JSON 파싱 (정규식 대신 문자열 탐색으로 ReDoS 방지)
      const jsonStr = extractJsonObject(text);
      if (!jsonStr) {
        throw new Error('Invalid JSON response from Gemini');
      }

      const parsed = JSON.parse(jsonStr) as AIIngredientSummary;

      // 유효성 검증
      if (!parsed.keywords || !parsed.summary || !parsed.skinTypeRecommendation) {
        throw new Error('Missing required fields in response');
      }

      // 고지 문구는 AI 응답을 신뢰하지 않고 서버에서 항상 강제 주입 (화장품법 §13)
      parsed.disclaimer = INGREDIENT_DISCLAIMER;

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
