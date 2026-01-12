/**
 * 레시피 변형 시스템 - 다이어트/건강식 대체 재료
 * @description M-2-2+ - 일반 레시피를 목표별 건강식으로 변형
 */

import { Recipe } from './recipe-matcher';

// 영양 목표 타입 (recipe-matcher와 통합)
export type VariationGoal = 'diet' | 'lean' | 'bulk' | 'allergen_free';

// 대체 재료 정보
export interface SubstituteInfo {
  name: string;
  ratio: number; // 대체 비율 (1.0 = 동량, 1.3 = 1.3배 사용)
  benefit: string; // 건강 효과
  goal: VariationGoal; // 목표 타입
  tips?: string; // 조리 팁
}

// 건강한 대체 재료 매핑 (한국 가정식 위주)
export const INGREDIENT_SUBSTITUTES: Record<string, SubstituteInfo[]> = {
  // 당류
  설탕: [
    { name: '알룰로스', ratio: 1.3, benefit: '칼로리 95% 감소', goal: 'diet' },
    { name: '스테비아', ratio: 0.5, benefit: '제로 칼로리', goal: 'diet' },
    { name: '에리스리톨', ratio: 1.0, benefit: '칼로리 90% 감소', goal: 'diet' },
  ],
  물엿: [{ name: '올리고당', ratio: 1.0, benefit: '혈당 지수 낮음', goal: 'diet' }],

  // 밀가루/탄수화물
  밀가루: [
    { name: '아몬드가루', ratio: 1.0, benefit: '저탄수화물', goal: 'diet' },
    { name: '코코넛가루', ratio: 0.3, benefit: '글루텐프리', goal: 'allergen_free' },
    { name: '귀리가루', ratio: 1.0, benefit: '식이섬유 증가', goal: 'lean' },
  ],
  쌀: [
    { name: '콜리플라워 라이스', ratio: 1.0, benefit: '칼로리 85% 감소', goal: 'diet' },
    { name: '곤약밥', ratio: 1.0, benefit: '저칼로리', goal: 'diet' },
  ],
  밥: [
    { name: '콜리플라워 라이스', ratio: 1.0, benefit: '칼로리 85% 감소', goal: 'diet' },
    { name: '곤약밥', ratio: 1.0, benefit: '저칼로리', goal: 'diet' },
    { name: '현미밥', ratio: 1.0, benefit: '식이섬유 증가', goal: 'lean' },
  ],

  // 면류
  '라면 사리': [
    { name: '곤약면', ratio: 1.0, benefit: '칼로리 90% 감소', goal: 'diet' },
    { name: '두부면', ratio: 1.0, benefit: '단백질 증가', goal: 'lean' },
  ],
  파스타: [
    { name: '곤약면', ratio: 1.0, benefit: '칼로리 90% 감소', goal: 'diet' },
    { name: '통밀 파스타', ratio: 1.0, benefit: '식이섬유 증가', goal: 'lean' },
    { name: '렌틸콩 파스타', ratio: 1.0, benefit: '단백질 증가', goal: 'lean' },
  ],

  // 유제품
  생크림: [
    { name: '두유 크림', ratio: 1.0, benefit: '유제품 대체', goal: 'allergen_free' },
    { name: '그릭요거트', ratio: 0.8, benefit: '단백질 증가', goal: 'lean' },
  ],
  우유: [
    { name: '두유', ratio: 1.0, benefit: '유제품 대체', goal: 'allergen_free' },
    { name: '아몬드밀크', ratio: 1.0, benefit: '칼로리 50% 감소', goal: 'diet' },
  ],

  // 오일/지방
  식용유: [
    { name: '올리브오일', ratio: 1.0, benefit: '불포화지방', goal: 'lean' },
    { name: '아보카도오일', ratio: 1.0, benefit: '고발연점', goal: 'lean' },
    {
      name: '스프레이 오일',
      ratio: 0.3,
      benefit: '칼로리 70% 감소',
      goal: 'diet',
      tips: '기름 사용량을 최소화',
    },
  ],
  참기름: [{ name: '들기름', ratio: 1.0, benefit: '오메가3 풍부', goal: 'lean' }],

  // 소스/양념
  마요네즈: [
    { name: '그릭요거트', ratio: 1.0, benefit: '칼로리 70% 감소', goal: 'diet' },
    { name: '아보카도', ratio: 0.8, benefit: '건강한 지방', goal: 'lean' },
  ],
  간장: [{ name: '코코넛 아미노스', ratio: 1.0, benefit: '저염', goal: 'diet' }],
  고추장: [
    {
      name: '저염 고추장',
      ratio: 1.0,
      benefit: '나트륨 30% 감소',
      goal: 'diet',
      tips: '기존 레시피보다 양 줄이기',
    },
  ],

  // 육류 (칼로리 감소)
  돼지고기: [
    { name: '닭가슴살', ratio: 1.0, benefit: '지방 70% 감소', goal: 'diet' },
    { name: '두부', ratio: 1.2, benefit: '식물성 단백질', goal: 'diet' },
  ],
  소고기: [
    { name: '닭가슴살', ratio: 1.0, benefit: '지방 60% 감소', goal: 'diet' },
    { name: '살코기', ratio: 1.0, benefit: '지방 줄임', goal: 'lean' },
  ],

  // 기타
  감자: [
    { name: '고구마', ratio: 1.0, benefit: '식이섬유 증가', goal: 'lean' },
    {
      name: '제거',
      ratio: 0,
      benefit: '탄수화물 감소',
      goal: 'diet',
      tips: '감자 제외하고 조리',
    },
  ],
  치즈: [
    { name: '저지방 치즈', ratio: 1.0, benefit: '지방 50% 감소', goal: 'diet' },
    { name: '두부 크림치즈', ratio: 1.0, benefit: '식물성 대체', goal: 'allergen_free' },
  ],
};

// 레시피 변형 정보
export interface RecipeVariation {
  type: VariationGoal;
  name: string; // 예: "다이어트 찜닭"
  description: string;
  substitutions: {
    original: string;
    substitute: string;
    benefit: string;
  }[];
  nutritionChange: {
    caloriesReduction: number; // 퍼센트 (양수: 감소, 음수: 증가)
    proteinChange: number; // 퍼센트 (양수: 증가, 음수: 감소)
    carbsChange: number; // 퍼센트
  };
  tips: string[];
}

// 재료 이름 정규화 (유사어 처리)
function normalizeIngredientName(name: string): string {
  const normalized = name.toLowerCase().trim();

  // 유사어 매핑
  const synonyms: Record<string, string> = {
    식용유: '식용유',
    올리브오일: '식용유',
    카놀라유: '식용유',
    포도씨유: '식용유',
    설탕: '설탕',
    백설탕: '설탕',
    황설탕: '설탕',
    밥: '밥',
    쌀밥: '밥',
    현미밥: '밥',
    잡곡밥: '밥',
  };

  return synonyms[normalized] || normalized;
}

/**
 * 레시피 변형 생성
 */
export function generateRecipeVariations(recipe: Recipe, goal?: VariationGoal): RecipeVariation[] {
  const goals: VariationGoal[] = goal ? [goal] : ['diet', 'lean', 'bulk'];
  const variations: RecipeVariation[] = [];

  for (const currentGoal of goals) {
    const substitutions: RecipeVariation['substitutions'] = [];
    const tips: string[] = [];
    let caloriesReduction = 0;
    let proteinChange = 0;
    let carbsChange = 0;

    // 각 재료별 대체 가능 여부 확인
    for (const ingredient of recipe.ingredients) {
      const normalizedName = normalizeIngredientName(ingredient.name);
      const substitutes = INGREDIENT_SUBSTITUTES[normalizedName];

      if (!substitutes) continue;

      // 목표에 맞는 대체 재료 찾기
      const substitute = substitutes.find((s) => s.goal === currentGoal);
      if (!substitute) continue;

      // 대체 재료 추가
      substitutions.push({
        original: ingredient.name,
        substitute: substitute.name,
        benefit: substitute.benefit,
      });

      // 팁 추가
      if (substitute.tips) {
        tips.push(`${ingredient.name} → ${substitute.name}: ${substitute.tips}`);
      }

      // 영양 변화 추정 (간략)
      if (substitute.benefit.includes('칼로리')) {
        const match = substitute.benefit.match(/(\d+)%/);
        if (match) {
          const percent = parseInt(match[1]);
          caloriesReduction += percent * 0.15; // 재료별 칼로리 기여도 추정 15%
        }
      }

      if (substitute.benefit.includes('단백질')) {
        proteinChange += 10; // 단백질 10% 증가 추정
      }

      if (substitute.benefit.includes('탄수화물') || normalizedName === '밥') {
        carbsChange += 20; // 탄수화물 20% 감소 추정
      }
    }

    // 대체 재료가 없으면 변형 추가 안 함
    if (substitutions.length === 0) continue;

    // 변형 레시피 생성
    variations.push({
      type: currentGoal,
      name: `${getGoalLabel(currentGoal)} ${recipe.name}`,
      description: getVariationDescription(currentGoal, recipe.name),
      substitutions,
      nutritionChange: {
        caloriesReduction: Math.round(caloriesReduction),
        proteinChange: Math.round(proteinChange),
        carbsChange: Math.round(carbsChange),
      },
      tips,
    });
  }

  return variations;
}

/**
 * 목표별 라벨
 */
function getGoalLabel(goal: VariationGoal): string {
  const labels: Record<VariationGoal, string> = {
    diet: '다이어트',
    lean: '린매스',
    bulk: '벌크업',
    allergen_free: '알레르기 프리',
  };
  return labels[goal];
}

/**
 * 변형 설명 생성
 */
function getVariationDescription(goal: VariationGoal, recipeName: string): string {
  const descriptions: Record<VariationGoal, string> = {
    diet: `칼로리를 줄인 다이어트 버전의 ${recipeName}입니다.`,
    lean: `단백질을 높이고 지방을 줄인 린매스 버전의 ${recipeName}입니다.`,
    bulk: `칼로리와 단백질을 높인 벌크업 버전의 ${recipeName}입니다.`,
    allergen_free: `알레르기 유발 재료를 대체한 ${recipeName}입니다.`,
  };
  return descriptions[goal];
}

/**
 * 특정 재료에 대한 대체 재료 조회
 */
export function getSubstitutesForIngredient(
  ingredientName: string,
  goal?: VariationGoal
): SubstituteInfo[] {
  const normalizedName = normalizeIngredientName(ingredientName);
  const substitutes = INGREDIENT_SUBSTITUTES[normalizedName];

  if (!substitutes) return [];

  return goal ? substitutes.filter((s) => s.goal === goal) : substitutes;
}
