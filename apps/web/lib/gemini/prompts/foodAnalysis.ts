/**
 * N-1 음식 분석 AI 프롬프트 모듈
 * Task 2.2: 음식 분석 AI 프롬프트
 *
 * 기능:
 * - 한국 음식 인식 최적화 프롬프트
 * - 다중 음식 인식 지원
 * - 신호등 시스템 (green/yellow/red)
 * - 응답 파싱 및 검증
 */

import type { GeminiFoodAnalysisResult } from '@/lib/gemini';

/**
 * 신호등 색상 타입
 */
export type TrafficLightColor = 'green' | 'yellow' | 'red';

/**
 * 식사 타입
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * 분석된 음식 항목
 */
export interface AnalyzedFoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  trafficLight: TrafficLightColor;
  confidence: number;
  foodId?: string;
}

/**
 * 음식 분석 응답 검증 결과
 */
export interface FoodAnalysisValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 신호등 색상 기준 (눔 방식 - 칼로리 밀도 kcal/g)
 * 100g 기준 칼로리로 환산:
 * - green: 칼로리 밀도 < 1.0 → 100kcal/100g 미만
 * - yellow: 칼로리 밀도 1.0~2.5 → 100~250kcal/100g
 * - red: 칼로리 밀도 > 2.5 → 250kcal/100g 초과
 */
export const TRAFFIC_LIGHT_THRESHOLDS = {
  green: { maxCalories: 100, description: '저칼로리 (밀도 < 1.0)' },
  yellow: { minCalories: 100, maxCalories: 250, description: '적당한 칼로리 (밀도 1.0~2.5)' },
  red: { minCalories: 250, description: '고칼로리 (밀도 > 2.5)' },
} as const;

/**
 * 표준 서빙 사이즈 (g)
 */
export const STANDARD_SERVING_SIZES: Record<string, number> = {
  밥: 210,
  '국/찌개': 300,
  고기: 150,
  반찬: 60,
  면류: 350,
  샐러드: 200,
  과일: 150,
  빵: 80,
  음료: 250,
};

/**
 * 식사 타입 라벨
 */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

/**
 * 음식 분석 프롬프트 빌더
 *
 * @param mealType - 식사 타입 (선택)
 * @returns AI 프롬프트 문자열
 */
export function buildFoodAnalysisPrompt(mealType?: MealType): string {
  const mealTypeText = mealType ? MEAL_TYPE_LABELS[mealType] : '식사';

  return `당신은 전문 영양사이자 음식 분석 AI입니다. 업로드된 ${mealTypeText} 사진을 분석하여 음식과 영양 정보를 추정해주세요.

## 한국 음식 인식 가이드

한국 음식을 정확히 인식해주세요:
- 밥류: 흰밥, 현미밥, 잡곡밥, 비빔밥, 볶음밥, 김밥 등
- 국/찌개: 된장찌개, 김치찌개, 순두부찌개, 미역국, 설렁탕 등
- 반찬: 김치, 나물, 조림, 볶음, 젓갈 등
- 고기: 삼겹살, 불고기, 갈비, 치킨, 제육볶음 등
- 면류: 라면, 짜장면, 냉면, 잔치국수 등
- 기타: 떡볶이, 순대, 튀김, 만두 등

## 신호등 시스템 기준 (눔 방식 - 칼로리 밀도 기준)

- **green (녹색)**: 칼로리 밀도 1.0 미만 (100g당 100kcal 미만)
  - 적은 양으로도 포만감 → 자유롭게 섭취 가능
  - 예시: 채소, 과일, 무지방 유제품, 달걀흰자, 흰살생선, 두부, 곤약

- **yellow (노란색)**: 칼로리 밀도 1.0~2.5 (100g당 100~250kcal)
  - 적당히 섭취 권장
  - 예시: 현미밥, 잡곡, 저지방 육류, 연어, 고등어, 달걀, 그릭요거트

- **red (빨간색)**: 칼로리 밀도 2.5 초과 (100g당 250kcal 초과)
  - 소량만 섭취 권장
  - 예시: 흰쌀밥, 튀김, 패스트푸드, 삼겹살, 치즈, 과자, 아이스크림

## 응답 형식

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "foods": [
    {
      "name": "[음식명 - 한국어]",
      "portion": "[1인분 (약 Xg)]",
      "calories": [칼로리 kcal],
      "protein": [단백질 g],
      "carbs": [탄수화물 g],
      "fat": [지방 g],
      "fiber": [식이섬유 g - 있으면],
      "trafficLight": "[green|yellow|red]",
      "confidence": [0.7-0.95 인식 신뢰도]
    }
  ],
  "totalCalories": [총 칼로리],
  "totalProtein": [총 단백질],
  "totalCarbs": [총 탄수화물],
  "totalFat": [총 지방],
  "mealType": "[breakfast|lunch|dinner|snack]",
  "insight": "[이 식사에 대한 간단한 영양 조언 1-2문장]"
}

## 다중 음식 인식

- 한 접시에 여러 음식이 있으면 각각 분리하여 분석
- 밥 + 국 + 반찬 조합 시 개별 항목으로 분석
- 정식/백반 형태면 구성 요소별로 분석

## 양 추정 가이드

- 밥 1공기: 약 210g (310kcal)
- 국/찌개 1그릇: 약 300ml (100-200kcal)
- 고기 1인분: 약 150g
- 반찬 1접시: 약 50-80g
- 면류 1인분: 약 350g

## 주의사항

- 한국어로 음식명을 작성해주세요
- 신뢰도(confidence)는 이미지 품질과 음식 식별 정확도에 따라 0.7-0.95 사이로 설정
- 영양정보는 일반적인 조리법 기준으로 추정
- 불확실한 경우 신뢰도를 낮추고 가장 유사한 음식으로 분석`;
}

/**
 * JSON 응답에서 코드 블록 제거
 */
function cleanJsonResponse(text: string): string {
  let cleanText = text.trim();

  // JSON 코드 블록 제거
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7);
  }
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }

  return cleanText.trim();
}

/**
 * 음식 항목 유효성 검증
 */
function validateFoodItem(
  food: unknown,
  index: number
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!food || typeof food !== 'object') {
    errors.push(`음식 항목 ${index + 1}: 유효하지 않은 형식`);
    return { isValid: false, errors, warnings };
  }

  const f = food as Record<string, unknown>;

  // 필수 필드 검증
  if (!f.name || typeof f.name !== 'string') {
    errors.push(`음식 항목 ${index + 1}: 이름(name) 필수`);
  }

  if (typeof f.calories !== 'number' || f.calories < 0) {
    errors.push(`음식 항목 ${index + 1}: 칼로리(calories) 필수 (양수)`);
  }

  if (typeof f.protein !== 'number' || f.protein < 0) {
    errors.push(`음식 항목 ${index + 1}: 단백질(protein) 필수 (양수)`);
  }

  if (typeof f.carbs !== 'number' || f.carbs < 0) {
    errors.push(`음식 항목 ${index + 1}: 탄수화물(carbs) 필수 (양수)`);
  }

  if (typeof f.fat !== 'number' || f.fat < 0) {
    errors.push(`음식 항목 ${index + 1}: 지방(fat) 필수 (양수)`);
  }

  // 신호등 색상 검증
  if (!['green', 'yellow', 'red'].includes(f.trafficLight as string)) {
    warnings.push(`음식 항목 ${index + 1}: 신호등 색상 누락, 기본값 적용`);
  }

  // 신뢰도 검증
  if (typeof f.confidence !== 'number' || f.confidence < 0 || f.confidence > 1) {
    warnings.push(`음식 항목 ${index + 1}: 신뢰도 범위 오류, 기본값 적용`);
  }

  // 영양소 합계 검증 (칼로리 = 단백질*4 + 탄수화물*4 + 지방*9 근사치)
  if (typeof f.calories === 'number' && typeof f.protein === 'number' &&
      typeof f.carbs === 'number' && typeof f.fat === 'number') {
    const calculatedCalories = f.protein * 4 + f.carbs * 4 + f.fat * 9;
    const diff = Math.abs(f.calories - calculatedCalories);
    if (diff > f.calories * 0.3) {
      warnings.push(`음식 항목 ${index + 1}: 영양소 합계와 칼로리 차이가 큼`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * 신호등 색상 자동 계산 (눔 방식)
 * 칼로리 밀도 (kcal/g) = 칼로리 / 그램수
 * - green: 밀도 < 1.0 (100g당 100kcal 미만)
 * - yellow: 밀도 1.0~2.5 (100g당 100~250kcal)
 * - red: 밀도 > 2.5 (100g당 250kcal 초과)
 */
export function calculateTrafficLight(
  calories: number,
  portionGrams: number
): TrafficLightColor {
  if (portionGrams <= 0) return 'yellow';

  const caloriesPer100g = (calories / portionGrams) * 100;

  // green: < 100 (밀도 < 1.0)
  if (caloriesPer100g < TRAFFIC_LIGHT_THRESHOLDS.green.maxCalories) {
    return 'green';
  }
  // yellow: 100~250 (밀도 1.0~2.5)
  if (caloriesPer100g <= TRAFFIC_LIGHT_THRESHOLDS.yellow.maxCalories) {
    return 'yellow';
  }
  // red: > 250 (밀도 > 2.5)
  return 'red';
}

/**
 * 서빙 크기에서 그램 추출
 * 예: "1인분 (약 210g)" -> 210
 */
export function extractGramsFromPortion(portion: string): number | null {
  const match = portion.match(/(\d+)\s*g/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * 음식 분석 응답 파싱 및 검증
 *
 * @param responseText - AI 응답 텍스트
 * @returns 파싱된 결과 또는 에러
 */
export function parseFoodAnalysisResponse(responseText: string): {
  data: GeminiFoodAnalysisResult | null;
  validation: FoodAnalysisValidationResult;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // JSON 파싱
  let parsed: Record<string, unknown>;
  try {
    const cleanedText = cleanJsonResponse(responseText);
    parsed = JSON.parse(cleanedText);
  } catch {
    errors.push('JSON 파싱 실패: 유효하지 않은 응답 형식');
    return {
      data: null,
      validation: { isValid: false, errors, warnings },
    };
  }

  // foods 배열 검증
  if (!Array.isArray(parsed.foods) || parsed.foods.length === 0) {
    errors.push('foods 배열이 비어있거나 유효하지 않음');
    return {
      data: null,
      validation: { isValid: false, errors, warnings },
    };
  }

  // 각 음식 항목 검증
  const validatedFoods: AnalyzedFoodItem[] = [];
  for (let i = 0; i < parsed.foods.length; i++) {
    const food = parsed.foods[i];
    const validation = validateFoodItem(food, i);

    errors.push(...validation.errors);
    warnings.push(...validation.warnings);

    if (validation.isValid) {
      const f = food as Record<string, unknown>;

      // 신호등 색상 기본값 또는 자동 계산
      let trafficLight = f.trafficLight as TrafficLightColor;
      if (!['green', 'yellow', 'red'].includes(trafficLight)) {
        const grams = extractGramsFromPortion(f.portion as string || '');
        trafficLight = grams
          ? calculateTrafficLight(f.calories as number, grams)
          : 'yellow';
      }

      // 신뢰도 기본값
      let confidence = f.confidence as number;
      if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
        confidence = 0.75;
      }

      validatedFoods.push({
        name: f.name as string,
        portion: (f.portion as string) || '1인분',
        calories: f.calories as number,
        protein: f.protein as number,
        carbs: f.carbs as number,
        fat: f.fat as number,
        fiber: typeof f.fiber === 'number' ? f.fiber : undefined,
        trafficLight,
        confidence,
        foodId: typeof f.foodId === 'string' ? f.foodId : undefined,
      });
    }
  }

  if (validatedFoods.length === 0) {
    errors.push('유효한 음식 항목이 없음');
    return {
      data: null,
      validation: { isValid: false, errors, warnings },
    };
  }

  // 총 영양소 계산 (AI 응답값 또는 합계)
  const totalCalories = typeof parsed.totalCalories === 'number'
    ? parsed.totalCalories
    : validatedFoods.reduce((sum, f) => sum + f.calories, 0);

  const totalProtein = typeof parsed.totalProtein === 'number'
    ? parsed.totalProtein
    : validatedFoods.reduce((sum, f) => sum + f.protein, 0);

  const totalCarbs = typeof parsed.totalCarbs === 'number'
    ? parsed.totalCarbs
    : validatedFoods.reduce((sum, f) => sum + f.carbs, 0);

  const totalFat = typeof parsed.totalFat === 'number'
    ? parsed.totalFat
    : validatedFoods.reduce((sum, f) => sum + f.fat, 0);

  // mealType 검증
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const mealType = validMealTypes.includes(parsed.mealType as string)
    ? (parsed.mealType as MealType)
    : undefined;

  // insight 검증
  const insight = typeof parsed.insight === 'string' ? parsed.insight : undefined;

  const result: GeminiFoodAnalysisResult = {
    foods: validatedFoods,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    mealType,
    insight,
  };

  return {
    data: result,
    validation: {
      isValid: errors.length === 0,
      errors,
      warnings,
    },
  };
}

/**
 * 음식 분석 응답 간단 파싱 (검증 없이)
 * 테스트나 Mock 데이터 처리용
 */
export function parseSimpleFoodResponse(responseText: string): GeminiFoodAnalysisResult {
  const { data, validation } = parseFoodAnalysisResponse(responseText);

  if (!data) {
    throw new Error(`음식 분석 파싱 실패: ${validation.errors.join(', ')}`);
  }

  return data;
}

/**
 * 음식 분석 결과 요약 생성
 */
export function summarizeFoodAnalysis(result: GeminiFoodAnalysisResult): string {
  const foodNames = result.foods.map(f => f.name).join(', ');
  const greenCount = result.foods.filter(f => f.trafficLight === 'green').length;
  const yellowCount = result.foods.filter(f => f.trafficLight === 'yellow').length;
  const redCount = result.foods.filter(f => f.trafficLight === 'red').length;

  let summary = `${foodNames} (총 ${result.totalCalories}kcal)`;

  if (greenCount > 0 || yellowCount > 0 || redCount > 0) {
    summary += ` - 🟢${greenCount} 🟡${yellowCount} 🔴${redCount}`;
  }

  return summary;
}
