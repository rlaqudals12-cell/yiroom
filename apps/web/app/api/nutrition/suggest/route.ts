/**
 * N-1 AI 식단 추천 API
 *
 * 통합 컨텍스트 기반 맞춤 식사 추천
 * - 피부 분석(S-1) + 체형 분석(C-1) 연동
 * - user_preferences 기반 알레르기/기피 음식 자동 필터링
 * - 대중적이고 구하기 쉬운 한국 음식 위주
 * - 가성비 좋은 메뉴 추천
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getAllergies, getDislikedFoods } from '@/lib/preferences';
import type { NutritionGoal, MealType, TrafficLight } from '@/types/nutrition';

// 요청 타입
interface MealSuggestionRequest {
  goal: NutritionGoal;
  mealType: MealType;
  remainingCalories: number;
  allergies?: string[]; // Fallback용 (호환성)
  skinConcerns?: string[];
  bodyType?: string;
}

// 추천 음식 타입
interface SuggestedFood {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  trafficLight: TrafficLight;
  reason: string;
  whereToGet: string;
  priceRange: '저렴' | '보통' | '비쌈';
  cookingTime?: string;
  tags: string[];
}

// 대중적인 한국 음식 데이터베이스 (구하기 쉬운 메뉴)
const POPULAR_KOREAN_FOODS: Record<string, SuggestedFood[]> = {
  // 아침 메뉴
  breakfast: [
    {
      name: '계란 토스트',
      description: '식빵에 계란 프라이를 올린 간단 아침',
      calories: 280,
      protein: 12,
      carbs: 28,
      fat: 14,
      trafficLight: 'green',
      reason: '단백질과 탄수화물 균형 좋음',
      whereToGet: '집에서 조리 (편의점 식빵 + 계란)',
      priceRange: '저렴',
      cookingTime: '5분',
      tags: ['간편', '단백질', '아침'],
    },
    {
      name: '그릭요거트 + 그래놀라',
      description: '고단백 요거트에 그래놀라 토핑',
      calories: 320,
      protein: 18,
      carbs: 38,
      fat: 10,
      trafficLight: 'green',
      reason: '고단백, 유산균 풍부',
      whereToGet: '편의점, 마트',
      priceRange: '보통',
      tags: ['고단백', '간편', '장건강'],
    },
    {
      name: '삼각김밥 + 우유',
      description: '편의점 삼각김밥과 저지방 우유',
      calories: 350,
      protein: 10,
      carbs: 50,
      fat: 12,
      trafficLight: 'yellow',
      reason: '빠르고 저렴한 아침',
      whereToGet: '편의점',
      priceRange: '저렴',
      tags: ['편의점', '빠른식사'],
    },
  ],
  // 점심 메뉴
  lunch: [
    {
      name: '닭가슴살 도시락',
      description: '닭가슴살 + 현미밥 + 채소 도시락',
      calories: 450,
      protein: 35,
      carbs: 45,
      fat: 12,
      trafficLight: 'green',
      reason: '고단백 저지방, 다이어트에 최적',
      whereToGet: '편의점, 도시락 전문점',
      priceRange: '보통',
      tags: ['고단백', '다이어트', '도시락'],
    },
    {
      name: '비빔밥',
      description: '야채 듬뿍 비빔밥 (고추장 반만)',
      calories: 520,
      protein: 15,
      carbs: 75,
      fat: 16,
      trafficLight: 'green',
      reason: '다양한 영양소, 채소 풍부',
      whereToGet: '한식당, 구내식당',
      priceRange: '보통',
      tags: ['한식', '채소', '균형식'],
    },
    {
      name: '제육볶음 정식',
      description: '제육볶음 + 밥 + 반찬',
      calories: 650,
      protein: 25,
      carbs: 70,
      fat: 28,
      trafficLight: 'yellow',
      reason: '든든한 한끼, 단백질 충분',
      whereToGet: '한식당, 백반집',
      priceRange: '보통',
      tags: ['한식', '든든함'],
    },
    {
      name: '샐러드 + 닭가슴살',
      description: '신선 채소 샐러드에 닭가슴살 토핑',
      calories: 380,
      protein: 30,
      carbs: 20,
      fat: 18,
      trafficLight: 'green',
      reason: '저탄수, 고단백, 다이어트 최적',
      whereToGet: '편의점, 샐러드 전문점',
      priceRange: '보통',
      tags: ['다이어트', '저탄수', '샐러드'],
    },
  ],
  // 저녁 메뉴
  dinner: [
    {
      name: '삼계탕',
      description: '영양 가득 삼계탕 (반마리)',
      calories: 420,
      protein: 35,
      carbs: 25,
      fat: 20,
      trafficLight: 'green',
      reason: '고단백, 콜라겐 풍부, 피부에 좋음',
      whereToGet: '삼계탕 전문점',
      priceRange: '보통',
      cookingTime: '30분 (배달 시)',
      tags: ['한식', '보양식', '피부'],
    },
    {
      name: '된장찌개 정식',
      description: '된장찌개 + 밥 + 반찬',
      calories: 480,
      protein: 18,
      carbs: 60,
      fat: 18,
      trafficLight: 'green',
      reason: '발효식품, 장건강에 좋음',
      whereToGet: '한식당, 백반집',
      priceRange: '저렴',
      tags: ['한식', '발효식품', '가성비'],
    },
    {
      name: '연어 샐러드',
      description: '연어 + 야채 샐러드 (드레싱 별도)',
      calories: 380,
      protein: 28,
      carbs: 15,
      fat: 24,
      trafficLight: 'green',
      reason: '오메가3 풍부, 피부 탄력에 좋음',
      whereToGet: '편의점, 샐러드 전문점',
      priceRange: '비쌈',
      tags: ['오메가3', '피부', '저탄수'],
    },
  ],
  // 간식 메뉴
  snack: [
    {
      name: '바나나 + 아몬드',
      description: '바나나 1개 + 아몬드 10알',
      calories: 200,
      protein: 5,
      carbs: 28,
      fat: 10,
      trafficLight: 'green',
      reason: '자연식품, 에너지 보충',
      whereToGet: '편의점, 마트',
      priceRange: '저렴',
      tags: ['자연식품', '간편', '에너지'],
    },
    {
      name: '단백질 바',
      description: '고단백 프로틴 바',
      calories: 220,
      protein: 20,
      carbs: 22,
      fat: 8,
      trafficLight: 'yellow',
      reason: '운동 후 간식으로 좋음',
      whereToGet: '편의점',
      priceRange: '보통',
      tags: ['고단백', '운동'],
    },
    {
      name: '고구마 1개',
      description: '삶은 고구마 중간 크기 1개',
      calories: 130,
      protein: 2,
      carbs: 30,
      fat: 0,
      trafficLight: 'green',
      reason: '식이섬유 풍부, 포만감 좋음',
      whereToGet: '편의점 (군고구마), 마트',
      priceRange: '저렴',
      tags: ['식이섬유', '자연식품', '포만감'],
    },
  ],
};

// 피부 고민별 추천 음식 태그
const SKIN_CONCERN_FOODS: Record<string, string[]> = {
  hydration: ['수분', '수박', '오이', '토마토'],
  oil: ['저지방', '채소', '녹차'],
  wrinkles: ['콜라겐', '비타민C', '연어', '삼계탕'],
  elasticity: ['오메가3', '연어', '아보카도'],
  pigmentation: ['비타민C', '레몬', '딸기'],
  trouble: ['저당', '채소', '발효식품'],
};

// 목표별 추천 우선순위
const GOAL_PREFERENCES: Record<NutritionGoal, { maxCalories: number; preferTags: string[] }> = {
  weight_loss: { maxCalories: 400, preferTags: ['다이어트', '저탄수', '고단백', '저칼로리'] },
  maintain: { maxCalories: 600, preferTags: ['균형식', '한식'] },
  muscle: { maxCalories: 700, preferTags: ['고단백', '단백질', '운동'] },
  skin: { maxCalories: 500, preferTags: ['피부', '콜라겐', '비타민C', '오메가3'] },
  health: { maxCalories: 550, preferTags: ['자연식품', '발효식품', '균형식'] },
};

/**
 * 컨텍스트 기반 음식 필터링 및 정렬
 */
function filterAndRankFoods(
  foods: SuggestedFood[],
  goal: NutritionGoal,
  remainingCalories: number,
  skinConcerns: string[],
  allergies: string[],
  dislikedFoods: string[]
): SuggestedFood[] {
  const prefs = GOAL_PREFERENCES[goal];
  const maxCal = Math.min(prefs.maxCalories, remainingCalories);

  // 피부 고민 관련 선호 태그 추가
  const skinTags: string[] = [];
  for (const concern of skinConcerns) {
    const tags = SKIN_CONCERN_FOODS[concern];
    if (tags) {
      skinTags.push(...tags);
    }
  }

  // 모든 기피 항목 통합
  const allAvoids = [...allergies, ...dislikedFoods].map((item) => item.toLowerCase());

  return (
    foods
      // 칼로리 필터
      .filter((food) => food.calories <= maxCal)
      // 알레르기/기피 음식 필터 (간단한 문자열 매칭)
      .filter((food) => {
        const foodText = `${food.name} ${food.description} ${food.tags.join(' ')}`.toLowerCase();
        return !allAvoids.some((avoid) => foodText.includes(avoid));
      })
      // 점수 계산 후 정렬
      .map((food) => {
        let score = 0;

        // 목표 관련 태그 매칭
        for (const tag of food.tags) {
          if (prefs.preferTags.includes(tag)) score += 10;
        }

        // 피부 고민 관련 태그 매칭
        for (const tag of food.tags) {
          if (skinTags.includes(tag)) score += 15;
        }

        // 가성비 보너스
        if (food.priceRange === '저렴') score += 5;

        // 녹색 신호등 보너스
        if (food.trafficLight === 'green') score += 8;

        return { food, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.food)
  );
}

/**
 * 컨텍스트 메시지 생성
 */
function generateContextMessage(
  goal: NutritionGoal,
  skinConcerns: string[],
  bodyType?: string
): string {
  const messages: string[] = [];

  // 목표별 메시지
  const goalMessages: Record<NutritionGoal, string> = {
    weight_loss: '저칼로리 고단백 위주로 추천했어요',
    maintain: '균형 잡힌 영양을 고려했어요',
    muscle: '근육 성장에 도움되는 단백질 위주예요',
    skin: '피부 건강에 좋은 음식을 골랐어요',
    health: '건강한 자연식품 위주로 추천해요',
  };
  messages.push(goalMessages[goal]);

  // 피부 고민 메시지
  if (skinConcerns.length > 0) {
    const concernLabels: Record<string, string> = {
      hydration: '수분 보충',
      oil: '피지 조절',
      wrinkles: '주름 개선',
      elasticity: '탄력 강화',
      pigmentation: '미백',
      trouble: '트러블 진정',
    };
    const labels = skinConcerns.slice(0, 2).map((c) => concernLabels[c] || c);
    messages.push(`+ ${labels.join(', ')} 고려`);
  }

  // 체형 메시지
  if (bodyType) {
    const bodyLabels: Record<string, string> = {
      S: '스트레이트 체형',
      W: '웨이브 체형',
      N: '내추럴 체형',
    };
    const label = bodyLabels[bodyType] || bodyType;
    messages.push(`(${label} 맞춤)`);
  }

  return messages.join(' ');
}

/**
 * POST: AI 식단 추천
 */
export async function POST(request: Request) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 파싱
    const body: MealSuggestionRequest = await request.json();
    const {
      goal,
      mealType,
      remainingCalories,
      allergies: fallbackAllergies = [],
      skinConcerns = [],
      bodyType,
    } = body;

    // Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // user_preferences에서 알레르기/기피 음식 조회 (Fallback 포함)
    const allergies = await getAllergies(supabase, userId, fallbackAllergies);
    const dislikedFoods = await getDislikedFoods(supabase, userId);

    console.log('[N-1 Suggest] Allergies:', allergies);
    console.log('[N-1 Suggest] Disliked foods:', dislikedFoods);

    // 해당 식사 시간대 음식 가져오기
    const baseFoods = POPULAR_KOREAN_FOODS[mealType] || POPULAR_KOREAN_FOODS.lunch;

    // 필터링 및 랭킹
    const rankedFoods = filterAndRankFoods(
      baseFoods,
      goal,
      remainingCalories,
      skinConcerns,
      allergies,
      dislikedFoods
    );

    // 상위 3개 선택 (없으면 기본 메뉴 제공)
    let suggestions = rankedFoods.slice(0, 3);
    if (suggestions.length === 0) {
      suggestions = baseFoods.slice(0, 2);
    }

    // 피부 고민에 따른 추천 이유 업데이트
    if (skinConcerns.length > 0) {
      suggestions = suggestions.map((food) => {
        let updatedReason = food.reason;

        // 피부 관련 태그가 있으면 이유 보강
        const skinTags = skinConcerns.flatMap((c) => SKIN_CONCERN_FOODS[c] || []);
        const matchingTags = food.tags.filter((t) => skinTags.includes(t));

        if (matchingTags.length > 0) {
          updatedReason += ` (피부에도 좋아요!)`;
        }

        return { ...food, reason: updatedReason };
      });
    }

    // 총 칼로리 계산
    const totalCalories = suggestions.reduce((sum, f) => sum + f.calories, 0);

    // 컨텍스트 메시지 생성
    const contextMessage = generateContextMessage(goal, skinConcerns, bodyType);

    return NextResponse.json({
      mealType,
      suggestions,
      contextMessage,
      totalCalories,
    });
  } catch (error) {
    console.error('[Meal Suggest API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
