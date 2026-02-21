/**
 * Gemini Mock Fallback 데이터
 * AI 호출 실패 시 사용되는 대체 결과
 */
import type { PersonalColorSeason, SkinType, BodyType } from '@yiroom/shared';

import type {
  PersonalColorAnalysisResult,
  SkinAnalysisResult,
  BodyAnalysisResult,
  FoodAnalysisResult,
  TrafficLight,
} from './types';
import { getSeasonColors } from './utils';

export function generateMockPersonalColorResult(
  answers: Record<number, string>
): PersonalColorAnalysisResult {
  const warmCount = Object.values(answers).filter((v) => v === 'warm').length;
  const coolCount = Object.values(answers).filter((v) => v === 'cool').length;

  let season: PersonalColorSeason;
  if (warmCount > coolCount) {
    season = Math.random() > 0.5 ? 'Spring' : 'Autumn';
  } else {
    season = Math.random() > 0.5 ? 'Summer' : 'Winter';
  }

  return {
    season,
    confidence: 0.75,
    colors: getSeasonColors(season),
    description: '문진 결과를 기반으로 분석되었습니다.',
  };
}

export function generateMockSkinResult(): SkinAnalysisResult {
  const types: SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];
  const skinType = types[Math.floor(Math.random() * types.length)];

  return {
    skinType,
    metrics: {
      moisture: Math.floor(Math.random() * 40) + 40,
      oil: Math.floor(Math.random() * 40) + 30,
      pores: Math.floor(Math.random() * 30) + 50,
      wrinkles: Math.floor(Math.random() * 30) + 60,
      pigmentation: Math.floor(Math.random() * 30) + 50,
      sensitivity: Math.floor(Math.random() * 40) + 30,
      elasticity: Math.floor(Math.random() * 30) + 55,
    },
    concerns: ['수분 부족', '유분 과다'],
    recommendations: ['보습 강화', '순한 클렌저 사용'],
  };
}

export function generateMockBodyResult(height: number, weight: number): BodyAnalysisResult {
  const bmi = weight / (height / 100) ** 2;
  const types: BodyType[] = [
    'Rectangle',
    'Triangle',
    'InvertedTriangle',
    'Hourglass',
    'Oval',
    'Athletic',
  ];
  const bodyType = types[Math.floor(Math.random() * types.length)];

  return {
    bodyType,
    bmi: Math.round(bmi * 10) / 10,
    proportions: {
      shoulderHipRatio: 0.9 + Math.random() * 0.3,
      waistHipRatio: 0.7 + Math.random() * 0.2,
    },
    recommendations: ['허리 강조', 'A라인 실루엣'],
    avoidItems: ['박시한 옷', '일자 핏'],
  };
}

// 한국 음식 Mock 데이터베이스
const MOCK_FOODS: {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  trafficLight: TrafficLight;
}[] = [
  { name: '비빔밥', calories: 550, protein: 18, carbs: 65, fat: 12, trafficLight: 'yellow' },
  { name: '된장찌개', calories: 120, protein: 9, carbs: 8, fat: 5, trafficLight: 'green' },
  { name: '김치찌개', calories: 150, protein: 12, carbs: 10, fat: 6, trafficLight: 'green' },
  { name: '불고기', calories: 350, protein: 28, carbs: 15, fat: 20, trafficLight: 'yellow' },
  { name: '삼겹살', calories: 500, protein: 25, carbs: 2, fat: 45, trafficLight: 'red' },
  { name: '라면', calories: 500, protein: 10, carbs: 70, fat: 18, trafficLight: 'red' },
  { name: '샐러드', calories: 80, protein: 3, carbs: 10, fat: 3, trafficLight: 'green' },
  { name: '치킨', calories: 450, protein: 35, carbs: 15, fat: 28, trafficLight: 'red' },
  { name: '김밥', calories: 320, protein: 8, carbs: 45, fat: 12, trafficLight: 'yellow' },
  { name: '떡볶이', calories: 380, protein: 6, carbs: 65, fat: 10, trafficLight: 'red' },
];

export function generateMockFoodResult(): FoodAnalysisResult {
  const numFoods = Math.floor(Math.random() * 3) + 1;
  const selectedFoods: FoodAnalysisResult['foods'] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < numFoods; i++) {
    let food;
    do {
      food = MOCK_FOODS[Math.floor(Math.random() * MOCK_FOODS.length)];
    } while (usedNames.has(food.name));

    usedNames.add(food.name);
    selectedFoods.push({
      id: `food-${Date.now()}-${i}`,
      ...food,
      portion: 1,
      confidence: 0.7 + Math.random() * 0.25,
    });
  }

  const totals = selectedFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    foods: selectedFoods,
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    insight: 'AI 분석이 불가하여 예시 데이터가 표시됩니다. 음식을 직접 수정해주세요.',
  };
}
