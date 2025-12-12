/**
 * N-1 음식 분석 Mock 데이터 생성기
 * AI 실패 시 Fallback으로 사용
 */

import {
  GeminiFoodAnalysisResult,
  FoodAnalysisInput,
  GeminiMealSuggestionResult,
  MealSuggestionInput,
} from '@/lib/gemini';

/**
 * Mock 음식 데이터베이스
 * 자주 먹는 한국 음식 + 기본 영양정보
 */
const MOCK_FOODS: Record<
  string,
  Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    trafficLight: 'green' | 'yellow' | 'red';
  }>
> = {
  breakfast: [
    {
      name: '계란 프라이',
      portion: '1개 (약 50g)',
      calories: 90,
      protein: 6,
      carbs: 1,
      fat: 7,
      trafficLight: 'yellow',
    },
    {
      name: '흰쌀밥',
      portion: '1공기 (약 210g)',
      calories: 310,
      protein: 6,
      carbs: 68,
      fat: 1,
      trafficLight: 'yellow',
    },
    {
      name: '김치',
      portion: '1접시 (약 50g)',
      calories: 15,
      protein: 1,
      carbs: 2,
      fat: 0,
      fiber: 2,
      trafficLight: 'green',
    },
  ],
  lunch: [
    {
      name: '된장찌개',
      portion: '1그릇 (약 300ml)',
      calories: 150,
      protein: 10,
      carbs: 12,
      fat: 6,
      fiber: 3,
      trafficLight: 'yellow',
    },
    {
      name: '흰쌀밥',
      portion: '1공기 (약 210g)',
      calories: 310,
      protein: 6,
      carbs: 68,
      fat: 1,
      trafficLight: 'yellow',
    },
    {
      name: '제육볶음',
      portion: '1인분 (약 150g)',
      calories: 320,
      protein: 22,
      carbs: 15,
      fat: 18,
      trafficLight: 'yellow',
    },
  ],
  dinner: [
    {
      name: '삼겹살',
      portion: '1인분 (약 200g)',
      calories: 580,
      protein: 28,
      carbs: 0,
      fat: 52,
      trafficLight: 'red',
    },
    {
      name: '상추쌈',
      portion: '1접시 (약 50g)',
      calories: 8,
      protein: 1,
      carbs: 1,
      fat: 0,
      fiber: 1,
      trafficLight: 'green',
    },
    {
      name: '흰쌀밥',
      portion: '1공기 (약 210g)',
      calories: 310,
      protein: 6,
      carbs: 68,
      fat: 1,
      trafficLight: 'yellow',
    },
  ],
  snack: [
    {
      name: '바나나',
      portion: '1개 (약 120g)',
      calories: 105,
      protein: 1,
      carbs: 27,
      fat: 0,
      fiber: 3,
      trafficLight: 'green',
    },
  ],
};

/**
 * Mock 음식 분석 인사이트
 */
const MOCK_INSIGHTS: Record<string, string[]> = {
  balanced: [
    '균형 잡힌 식사입니다. 단백질과 탄수화물의 비율이 적절해요.',
    '다양한 영양소를 골고루 섭취하고 있어요.',
    '식이섬유가 포함된 좋은 식사입니다.',
  ],
  highCalorie: [
    '칼로리가 다소 높은 식사입니다. 다음 끼니는 가볍게 드시는 것을 추천해요.',
    '맛있는 식사네요! 하지만 칼로리를 조절하면 더 좋을 것 같아요.',
    '에너지가 많이 필요할 때 좋은 식사입니다.',
  ],
  lowCalorie: [
    '저칼로리 식사입니다. 활동량이 많다면 간식을 추가해도 좋아요.',
    '가벼운 식사네요. 단백질을 보충하면 포만감이 더 오래 갈 거예요.',
    '건강한 식사입니다. 채소 섭취량이 좋아요.',
  ],
  highProtein: [
    '단백질이 풍부한 식사입니다. 운동 후에 딱 좋아요!',
    '근육 성장에 도움이 되는 고단백 식사입니다.',
  ],
};

/**
 * Mock 음식 분석 결과 생성
 * AI 실패 시 Fallback으로 사용
 */
export function generateMockFoodAnalysis(
  input: FoodAnalysisInput
): GeminiFoodAnalysisResult {
  const mealType = input.mealType || 'lunch';
  const foods = MOCK_FOODS[mealType] || MOCK_FOODS.lunch;

  // 총 영양소 계산
  const totals = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // 인사이트 선택
  let insightType: keyof typeof MOCK_INSIGHTS = 'balanced';
  if (totals.calories > 800) {
    insightType = 'highCalorie';
  } else if (totals.calories < 300) {
    insightType = 'lowCalorie';
  } else if (totals.protein > 30) {
    insightType = 'highProtein';
  }

  const insights = MOCK_INSIGHTS[insightType];
  const insight = insights[Math.floor(Math.random() * insights.length)];

  return {
    foods: foods.map((food) => ({
      ...food,
      confidence: 0.75 + Math.random() * 0.15, // 0.75~0.90 랜덤 신뢰도
    })),
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    insight,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Mock 식단 추천 데이터
 */
const MOCK_MEAL_SUGGESTIONS: Record<
  string,
  Array<{
    name: string;
    estimatedCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    trafficLight: 'green' | 'yellow' | 'red';
    reason: string;
    difficulty: 'easy' | 'medium' | 'hard';
    cookingTime?: number;
    ingredients?: string[];
  }>
> = {
  weight_loss: [
    {
      name: '닭가슴살 샐러드',
      estimatedCalories: 280,
      protein: 32,
      carbs: 15,
      fat: 10,
      trafficLight: 'green',
      reason: '고단백 저칼로리로 체중 감량에 효과적',
      difficulty: 'easy',
      cookingTime: 15,
      ingredients: ['닭가슴살', '양상추', '방울토마토', '드레싱'],
    },
    {
      name: '두부 스테이크',
      estimatedCalories: 220,
      protein: 18,
      carbs: 8,
      fat: 14,
      trafficLight: 'green',
      reason: '식물성 단백질로 포만감이 좋음',
      difficulty: 'easy',
      cookingTime: 20,
      ingredients: ['두부', '올리브오일', '간장', '마늘'],
    },
  ],
  muscle: [
    {
      name: '소고기 덮밥',
      estimatedCalories: 650,
      protein: 42,
      carbs: 65,
      fat: 22,
      trafficLight: 'yellow',
      reason: '고단백 고탄수화물로 근육 성장에 최적',
      difficulty: 'medium',
      cookingTime: 25,
      ingredients: ['소고기', '밥', '양파', '계란'],
    },
    {
      name: '연어 스테이크',
      estimatedCalories: 450,
      protein: 38,
      carbs: 5,
      fat: 28,
      trafficLight: 'yellow',
      reason: '오메가3와 고품질 단백질 풍부',
      difficulty: 'medium',
      cookingTime: 20,
      ingredients: ['연어', '올리브오일', '레몬', '허브'],
    },
  ],
  maintain: [
    {
      name: '비빔밥',
      estimatedCalories: 550,
      protein: 18,
      carbs: 75,
      fat: 18,
      trafficLight: 'yellow',
      reason: '다양한 채소와 균형 잡힌 영양소',
      difficulty: 'medium',
      cookingTime: 30,
      ingredients: ['밥', '나물', '계란', '고추장'],
    },
    {
      name: '된장찌개 정식',
      estimatedCalories: 520,
      protein: 22,
      carbs: 68,
      fat: 16,
      trafficLight: 'yellow',
      reason: '한식 기본 정식으로 균형 잡힌 식사',
      difficulty: 'medium',
      cookingTime: 25,
      ingredients: ['된장', '두부', '호박', '밥'],
    },
  ],
  skin: [
    {
      name: '아보카도 토스트',
      estimatedCalories: 350,
      protein: 12,
      carbs: 35,
      fat: 18,
      trafficLight: 'green',
      reason: '비타민E와 건강한 지방으로 피부 건강에 좋음',
      difficulty: 'easy',
      cookingTime: 10,
      ingredients: ['아보카도', '통밀빵', '계란', '토마토'],
    },
    {
      name: '연어 포케',
      estimatedCalories: 420,
      protein: 28,
      carbs: 40,
      fat: 16,
      trafficLight: 'green',
      reason: '오메가3가 풍부하여 피부 탄력에 도움',
      difficulty: 'easy',
      cookingTime: 15,
      ingredients: ['연어', '밥', '아보카도', '오이'],
    },
  ],
  health: [
    {
      name: '현미밥 정식',
      estimatedCalories: 480,
      protein: 20,
      carbs: 72,
      fat: 12,
      trafficLight: 'green',
      reason: '식이섬유가 풍부하고 영양 균형이 좋음',
      difficulty: 'medium',
      cookingTime: 30,
      ingredients: ['현미밥', '생선구이', '나물', '된장국'],
    },
    {
      name: '채소 볶음밥',
      estimatedCalories: 420,
      protein: 15,
      carbs: 62,
      fat: 14,
      trafficLight: 'yellow',
      reason: '다양한 채소로 비타민과 미네랄 섭취',
      difficulty: 'easy',
      cookingTime: 20,
      ingredients: ['밥', '당근', '양파', '계란', '완두콩'],
    },
  ],
};

/**
 * Mock 식사 추천 팁
 */
const MOCK_TIPS: Record<string, string[]> = {
  weight_loss: [
    '식사 전 물 한 잔을 마시면 포만감이 더 빨리 와요.',
    '천천히 씹어 먹으면 적은 양으로도 만족감을 느낄 수 있어요.',
  ],
  muscle: [
    '운동 후 30분 이내에 단백질을 섭취하면 효과적이에요.',
    '탄수화물도 충분히 섭취해야 근육이 잘 성장해요.',
  ],
  maintain: [
    '규칙적인 식사 시간을 유지하는 것이 좋아요.',
    '다양한 색깔의 음식을 골고루 먹어보세요.',
  ],
  skin: [
    '수분 섭취를 충분히 해주세요. 피부 건강의 기본이에요.',
    '비타민C가 풍부한 과일을 함께 드시면 좋아요.',
  ],
  health: [
    '가공식품보다 자연식품을 선택해주세요.',
    '나트륨 섭취를 줄이면 건강에 도움이 됩니다.',
  ],
};

/**
 * Mock 식단 추천 결과 생성
 * AI 실패 시 Fallback으로 사용
 */
export function generateMockMealSuggestion(
  input: MealSuggestionInput
): GeminiMealSuggestionResult {
  const goal = input.goal;
  const suggestions = MOCK_MEAL_SUGGESTIONS[goal] || MOCK_MEAL_SUGGESTIONS.maintain;
  const tips = MOCK_TIPS[goal] || MOCK_TIPS.maintain;

  // 남은 칼로리에 맞게 필터링
  const filteredMeals = suggestions.filter(
    (meal) => meal.estimatedCalories <= input.remainingCalories + 100
  );

  // 필터링 후 결과가 없으면 기본 제공
  const meals = filteredMeals.length > 0 ? filteredMeals : suggestions.slice(0, 2);

  // 총 영양소 계산 (첫 번째 추천 기준)
  const firstMeal = meals[0];

  return {
    meals,
    totalCalories: firstMeal.estimatedCalories,
    nutritionBalance: {
      protein: firstMeal.protein,
      carbs: firstMeal.carbs,
      fat: firstMeal.fat,
    },
    tips,
  };
}
