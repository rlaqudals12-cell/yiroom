/**
 * 영양/레시피 전용 RAG 검색
 *
 * @description Phase K - 냉장고 인벤토리 기반 레시피 추천을 위한 RAG 시스템
 *
 * ## 데이터 소스 현황
 * - **user_inventory**: 실 데이터 연결 완료 (냉장고 재료 조회)
 * - **recipes**: Mock 데이터 사용 (recipes 테이블 미생성 - 향후 확장 예정)
 *
 * ## 향후 확장
 * 1. recipes 테이블 생성 시 MOCK_RECIPES → DB 조회로 전환
 * 2. 사용자 선호 레시피 저장 기능 추가
 * 3. 외부 레시피 API 연동 (만개의 레시피 등)
 *
 * @see docs/specs/SDD-N1-NUTRITION.md
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { coachLogger } from '@/lib/utils/logger';
import type { UserContext } from './types';

/** 영양 목표 */
type NutritionGoal = 'diet' | 'bulk' | 'lean' | 'maintenance';

/** 레시피 추천 결과 */
export interface RecipeRecommendation {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cookTime: number; // 분
  difficulty: 'easy' | 'medium' | 'hard';
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  matchReason: string;
}

/** 식재료 아이템 */
export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
}

/** 영양 검색 결과 */
export interface NutritionSearchResult {
  hasPantryItems: boolean;
  pantryItems: PantryItem[];
  recommendations: RecipeRecommendation[];
  goalTips: string[];
  expiringItems: PantryItem[];
}

/** 질문 의도 분석 */
type NutritionIntent = 'recipe' | 'meal' | 'snack' | 'protein' | 'diet' | 'general';

/** 질문에서 영양 목표 추출 */
function detectNutritionGoal(query: string): NutritionGoal | null {
  const lowerQuery = query.toLowerCase();

  if (
    lowerQuery.includes('다이어트') ||
    lowerQuery.includes('살') ||
    lowerQuery.includes('체중 감량')
  ) {
    return 'diet';
  }
  if (lowerQuery.includes('벌크업') || lowerQuery.includes('근육') || lowerQuery.includes('증량')) {
    return 'bulk';
  }
  if (lowerQuery.includes('린매스') || lowerQuery.includes('린') || lowerQuery.includes('체지방')) {
    return 'lean';
  }

  return null;
}

/** 질문 의도 추출 */
function analyzeNutritionIntent(query: string): NutritionIntent {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('레시피') || lowerQuery.includes('만들') || lowerQuery.includes('요리')) {
    return 'recipe';
  }
  if (
    lowerQuery.includes('저녁') ||
    lowerQuery.includes('점심') ||
    lowerQuery.includes('아침') ||
    lowerQuery.includes('식사')
  ) {
    return 'meal';
  }
  if (lowerQuery.includes('간식') || lowerQuery.includes('야식')) {
    return 'snack';
  }
  if (lowerQuery.includes('단백질') || lowerQuery.includes('프로틴')) {
    return 'protein';
  }
  if (lowerQuery.includes('다이어트') || lowerQuery.includes('칼로리')) {
    return 'diet';
  }

  return 'general';
}

/** 목표별 영양 팁 */
const GOAL_TIPS: Record<NutritionGoal, string[]> = {
  diet: [
    '고단백 저칼로리 식단을 유지하세요',
    '야채를 충분히 섭취하면 포만감이 오래가요',
    '단백질은 체중 1kg당 1.2-1.6g을 목표로 하세요',
    '정제 탄수화물보다 통곡물을 선택하세요',
  ],
  bulk: [
    '칼로리 잉여 상태를 유지하세요 (TDEE +300~500kcal)',
    '단백질은 체중 1kg당 1.6-2.2g을 섭취하세요',
    '탄수화물을 충분히 섭취해 에너지를 확보하세요',
    '운동 전후 영양 섭취 타이밍이 중요해요',
  ],
  lean: [
    '약간의 칼로리 잉여로 천천히 근육을 키우세요',
    '단백질은 체중 1kg당 2g 이상 섭취하세요',
    '복합 탄수화물 위주로 선택하세요',
    '지방은 건강한 불포화지방 위주로 섭취하세요',
  ],
  maintenance: [
    '균형 잡힌 영양소 비율을 유지하세요',
    '단백질은 체중 1kg당 1.2-1.6g이 적당해요',
    '다양한 색깔의 채소를 섭취하세요',
    '수분 섭취를 충분히 하세요',
  ],
};

/** 의도별 팁 */
const INTENT_TIPS: Record<NutritionIntent, string[]> = {
  recipe: ['냉장고에 있는 재료로 간단하게 만들어보세요', '남은 재료 활용 레시피를 추천해드릴게요'],
  meal: ['균형 잡힌 한 끼를 구성해보세요', '단백질 + 탄수화물 + 채소 조합이 좋아요'],
  snack: ['견과류나 그릭요거트가 좋은 간식이에요', '과일은 적당량이 좋아요 (과당 주의)'],
  protein: [
    '닭가슴살, 달걀, 두부가 대표적인 단백질 식품이에요',
    '유청 단백질 보충제도 도움이 돼요',
  ],
  diet: ['저칼로리 고단백 식품을 선택하세요', '허기질 때는 채소나 달걀을 드세요'],
  general: ['균형 잡힌 식단이 가장 중요해요', '규칙적인 식사 시간을 유지하세요'],
};

/**
 * Mock 레시피 데이터
 *
 * @description
 * recipes 테이블이 아직 생성되지 않아 Mock 데이터 사용.
 * 향후 recipes 테이블 생성 시 DB 조회로 전환 예정.
 *
 * @todo recipes 테이블 생성 후 DB 연동
 * @see SDD-N1-NUTRITION.md "레시피 데이터베이스" 섹션
 */
const MOCK_RECIPES: RecipeRecommendation[] = [
  {
    id: '1',
    name: '닭가슴살 샐러드',
    description: '고단백 저칼로리 다이어트 샐러드',
    calories: 350,
    protein: 35,
    carbs: 15,
    fat: 12,
    cookTime: 15,
    difficulty: 'easy',
    matchScore: 0,
    matchedIngredients: [],
    missingIngredients: [],
    matchReason: '',
  },
  {
    id: '2',
    name: '현미밥 도시락',
    description: '균형 잡힌 건강 도시락',
    calories: 550,
    protein: 25,
    carbs: 65,
    fat: 15,
    cookTime: 30,
    difficulty: 'medium',
    matchScore: 0,
    matchedIngredients: [],
    missingIngredients: [],
    matchReason: '',
  },
  {
    id: '3',
    name: '그릭요거트 볼',
    description: '아침 식사용 단백질 볼',
    calories: 300,
    protein: 20,
    carbs: 35,
    fat: 8,
    cookTime: 5,
    difficulty: 'easy',
    matchScore: 0,
    matchedIngredients: [],
    missingIngredients: [],
    matchReason: '',
  },
  {
    id: '4',
    name: '소고기 볶음밥',
    description: '벌크업을 위한 고칼로리 볶음밥',
    calories: 700,
    protein: 35,
    carbs: 80,
    fat: 22,
    cookTime: 20,
    difficulty: 'medium',
    matchScore: 0,
    matchedIngredients: [],
    missingIngredients: [],
    matchReason: '',
  },
];

/** 레시피 필터링 */
function filterRecipesByGoal(
  recipes: RecipeRecommendation[],
  goal: NutritionGoal | null
): RecipeRecommendation[] {
  if (!goal) return recipes;

  return recipes.filter((recipe) => {
    switch (goal) {
      case 'diet':
        return recipe.calories < 500 && recipe.protein > 20;
      case 'bulk':
        return recipe.calories > 500 && recipe.protein > 25;
      case 'lean':
        return recipe.protein > 25 && recipe.fat < 20;
      case 'maintenance':
        return true; // 모든 레시피 허용
      default:
        return true;
    }
  });
}

/** 냉장고 기반 영양 검색 */
export async function searchNutritionItems(
  userContext: UserContext | null,
  query: string,
  userId?: string
): Promise<NutritionSearchResult> {
  try {
    const goal =
      detectNutritionGoal(query) || (userContext?.nutrition?.goal as NutritionGoal) || null;
    const intent = analyzeNutritionIntent(query);

    const result: NutritionSearchResult = {
      hasPantryItems: false,
      pantryItems: [],
      recommendations: [],
      goalTips: goal ? GOAL_TIPS[goal] : INTENT_TIPS[intent],
      expiringItems: [],
    };

    // userId가 있으면 냉장고에서 검색
    if (userId) {
      const supabase = createClerkSupabaseClient();

      const { data: pantryItems, error } = await supabase
        .from('user_inventory')
        .select('id, name, metadata, expiry_date')
        .eq('clerk_user_id', userId)
        .eq('category', 'pantry')
        .limit(30);

      if (error) {
        coachLogger.error('[NutritionRAG] DB query error:', error);
      }

      if (pantryItems && pantryItems.length > 0) {
        result.hasPantryItems = true;

        // 식재료 변환
        result.pantryItems = pantryItems.map((item) => {
          const metadata = item.metadata as Record<string, unknown>;
          return {
            id: item.id,
            name: item.name,
            quantity: (metadata?.quantity as number) || 1,
            unit: (metadata?.unit as string) || '개',
            expiryDate: item.expiry_date || undefined,
          };
        });

        // 유통기한 임박 아이템 (7일 이내)
        const today = new Date();
        const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        result.expiringItems = result.pantryItems.filter((item) => {
          if (!item.expiryDate) return false;
          const expiry = new Date(item.expiryDate);
          return expiry <= weekLater;
        });

        // 보유 재료명 추출
        const ingredientNames = result.pantryItems.map((item) => item.name.toLowerCase());

        // 레시피 매칭
        const recipes = filterRecipesByGoal(MOCK_RECIPES, goal);

        // 매칭 점수 계산
        result.recommendations = recipes
          .map((recipe) => {
            // 간단한 재료 매칭 (실제로는 레시피별 재료 목록 필요)
            const recipeIngredients = getRecipeIngredients(recipe.name);
            const matched = recipeIngredients.filter((ing) =>
              ingredientNames.some((name) => name.includes(ing) || ing.includes(name))
            );
            const missing = recipeIngredients.filter(
              (ing) => !ingredientNames.some((name) => name.includes(ing) || ing.includes(name))
            );

            const matchScore =
              recipeIngredients.length > 0
                ? Math.round((matched.length / recipeIngredients.length) * 100)
                : 50;

            return {
              ...recipe,
              matchScore,
              matchedIngredients: matched,
              missingIngredients: missing,
              matchReason: generateMatchReason(matchScore, matched.length, goal),
            };
          })
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 3);
      }
    }

    // 냉장고 아이템이 없으면 기본 추천
    if (result.recommendations.length === 0) {
      result.recommendations = filterRecipesByGoal(MOCK_RECIPES, goal)
        .slice(0, 3)
        .map((recipe) => ({
          ...recipe,
          matchScore: 50,
          matchReason: '기본 추천 레시피',
        }));
    }

    return result;
  } catch (error) {
    coachLogger.error('[NutritionRAG] Search error:', error);
    return {
      hasPantryItems: false,
      pantryItems: [],
      recommendations: [],
      goalTips: ['균형 잡힌 식단을 유지하세요!'],
      expiringItems: [],
    };
  }
}

/** 레시피별 재료 목록 (Mock) */
function getRecipeIngredients(recipeName: string): string[] {
  const ingredientMap: Record<string, string[]> = {
    닭가슴살샐러드: ['닭가슴살', '양상추', '토마토', '오이', '드레싱'],
    '닭가슴살 샐러드': ['닭가슴살', '양상추', '토마토', '오이', '드레싱'],
    현미밥도시락: ['현미', '달걀', '시금치', '당근', '소금'],
    '현미밥 도시락': ['현미', '달걀', '시금치', '당근', '소금'],
    그릭요거트볼: ['그릭요거트', '바나나', '블루베리', '그래놀라', '꿀'],
    '그릭요거트 볼': ['그릭요거트', '바나나', '블루베리', '그래놀라', '꿀'],
    소고기볶음밥: ['소고기', '밥', '달걀', '파', '간장'],
    '소고기 볶음밥': ['소고기', '밥', '달걀', '파', '간장'],
  };

  return ingredientMap[recipeName] || [];
}

/** 매칭 이유 생성 */
function generateMatchReason(
  score: number,
  matchedCount: number,
  goal: NutritionGoal | null
): string {
  const parts: string[] = [];

  if (score >= 80) {
    parts.push(`냉장고 재료 ${matchedCount}개로 바로 만들 수 있어요`);
  } else if (score >= 50) {
    parts.push(`일부 재료가 있어요 (${matchedCount}개 일치)`);
  } else {
    parts.push('재료 구매가 필요해요');
  }

  if (goal === 'diet') {
    parts.push('다이어트에 적합');
  } else if (goal === 'bulk') {
    parts.push('벌크업에 적합');
  } else if (goal === 'lean') {
    parts.push('린매스에 적합');
  }

  return parts.join(', ');
}

/** RAG 결과를 프롬프트용 문자열로 변환 */
export function formatNutritionForPrompt(result: NutritionSearchResult): string {
  if (result.recommendations.length === 0) {
    if (result.goalTips.length > 0) {
      let context = '\n\n## 영양 팁\n';
      result.goalTips.forEach((tip) => {
        context += `- ${tip}\n`;
      });
      return context;
    }
    return '';
  }

  let context = '\n\n## 레시피 추천\n';

  // 유통기한 임박 알림
  if (result.expiringItems.length > 0) {
    context += '\n### ⚠️ 유통기한 임박 재료\n';
    result.expiringItems.forEach((item) => {
      context += `- ${item.name} (${item.expiryDate}까지)\n`;
    });
    context += '\n';
  }

  // 레시피 추천
  context += '\n### 추천 레시피\n';
  result.recommendations.forEach((recipe, i) => {
    context += `${i + 1}. ${recipe.name}\n`;
    context += `   - ${recipe.description}\n`;
    context += `   - 칼로리: ${recipe.calories}kcal | 단백질: ${recipe.protein}g\n`;
    context += `   - 조리 시간: ${recipe.cookTime}분 | 난이도: ${recipe.difficulty}\n`;
    context += `   - 매칭률: ${recipe.matchScore}%\n`;
    if (recipe.matchReason) {
      context += `   - ${recipe.matchReason}\n`;
    }
    if (recipe.matchedIngredients.length > 0) {
      context += `   - 있는 재료: ${recipe.matchedIngredients.join(', ')}\n`;
    }
    if (recipe.missingIngredients.length > 0) {
      context += `   - 필요한 재료: ${recipe.missingIngredients.join(', ')}\n`;
    }
  });

  // 영양 팁
  if (result.goalTips.length > 0) {
    context += '\n### 영양 팁\n';
    result.goalTips.forEach((tip) => {
      context += `- ${tip}\n`;
    });
  }

  return context;
}
