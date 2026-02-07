/**
 * 레시피 매칭 시스템
 * @description Phase K-4 - 냉장고 재료 기반 레시피 추천
 */

// 영양 목표
export type NutritionGoal = 'diet' | 'bulk' | 'lean' | 'maintenance';

export const NUTRITION_GOAL_LABELS: Record<NutritionGoal, string> = {
  diet: '다이어트',
  bulk: '벌크업',
  lean: '린매스',
  maintenance: '유지',
};

// 식재료 카테고리
export type IngredientCategory = 'vegetable' | 'meat' | 'seafood' | 'dairy' | 'grain' | 'seasoning';

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  vegetable: '채소',
  meat: '육류',
  seafood: '해산물',
  dairy: '유제품',
  grain: '곡물',
  seasoning: '양념',
};

// 레시피 재료
export interface RecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
  optional?: boolean;
  category: IngredientCategory;
}

// 레시피
export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  nutritionInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  cookTime: number; // 분
  difficulty: 'easy' | 'medium' | 'hard';
  nutritionGoals: NutritionGoal[];
  tags: string[];
  imageUrl?: string;
}

// 레시피 매칭 결과
export interface RecipeMatchResult {
  recipe: Recipe;
  matchScore: number; // 0-100
  matchedIngredients: string[];
  missingIngredients: string[];
  availabilityRate: number; // 보유 재료 비율 (0-1)
  matchReason: string;
}

// 목표별 영양 기준
export const NUTRITION_TARGETS: Record<
  NutritionGoal,
  {
    calorieMultiplier: number;
    proteinPerKg: number;
    carbRatio: number;
    fatRatio: number;
    description: string;
  }
> = {
  diet: {
    calorieMultiplier: 0.8,
    proteinPerKg: 1.6,
    carbRatio: 0.35,
    fatRatio: 0.25,
    description: '체중 감량을 위한 칼로리 제한',
  },
  bulk: {
    calorieMultiplier: 1.15,
    proteinPerKg: 2.0,
    carbRatio: 0.45,
    fatRatio: 0.25,
    description: '근육량 증가를 위한 칼로리 서플러스',
  },
  lean: {
    calorieMultiplier: 1.05,
    proteinPerKg: 2.2,
    carbRatio: 0.4,
    fatRatio: 0.25,
    description: '지방을 최소화하면서 근육 증가',
  },
  maintenance: {
    calorieMultiplier: 1.0,
    proteinPerKg: 1.4,
    carbRatio: 0.45,
    fatRatio: 0.3,
    description: '현재 체중 유지',
  },
};

// 샘플 레시피 데이터
export const SAMPLE_RECIPES: Recipe[] = [
  {
    id: 'recipe-1',
    name: '닭가슴살 샐러드',
    description: '고단백 저칼로리 다이어트 샐러드',
    ingredients: [
      { name: '닭가슴살', quantity: '150', unit: 'g', category: 'meat' },
      { name: '양상추', quantity: '100', unit: 'g', category: 'vegetable' },
      { name: '방울토마토', quantity: '50', unit: 'g', category: 'vegetable' },
      { name: '오이', quantity: '50', unit: 'g', category: 'vegetable' },
      { name: '올리브오일', quantity: '1', unit: '큰술', category: 'seasoning' },
      { name: '레몬즙', quantity: '1', unit: '큰술', optional: true, category: 'seasoning' },
    ],
    steps: [
      '닭가슴살을 삶거나 그릴에 굽습니다.',
      '양상추, 오이, 방울토마토를 씻어 먹기 좋게 썹니다.',
      '닭가슴살을 얇게 썰어 채소 위에 올립니다.',
      '올리브오일과 레몬즙을 뿌려 완성합니다.',
    ],
    nutritionInfo: { calories: 280, protein: 35, carbs: 8, fat: 12 },
    cookTime: 15,
    difficulty: 'easy',
    nutritionGoals: ['diet', 'lean'],
    tags: ['샐러드', '고단백', '저탄수화물'],
  },
  {
    id: 'recipe-2',
    name: '계란 볶음밥',
    description: '간단하고 든든한 한 끼',
    ingredients: [
      { name: '밥', quantity: '200', unit: 'g', category: 'grain' },
      { name: '계란', quantity: '2', unit: '개', category: 'dairy' },
      { name: '대파', quantity: '30', unit: 'g', category: 'vegetable' },
      { name: '당근', quantity: '30', unit: 'g', optional: true, category: 'vegetable' },
      { name: '식용유', quantity: '1', unit: '큰술', category: 'seasoning' },
      { name: '간장', quantity: '1', unit: '큰술', category: 'seasoning' },
      { name: '소금', quantity: '약간', unit: '', category: 'seasoning' },
    ],
    steps: [
      '계란을 풀어 스크램블로 만들어 따로 둡니다.',
      '팬에 기름을 두르고 다진 대파와 당근을 볶습니다.',
      '밥을 넣고 센 불에서 빠르게 볶습니다.',
      '간장과 소금으로 간을 하고 스크램블 계란을 넣어 섞습니다.',
    ],
    nutritionInfo: { calories: 450, protein: 15, carbs: 55, fat: 18 },
    cookTime: 15,
    difficulty: 'easy',
    nutritionGoals: ['maintenance', 'bulk'],
    tags: ['볶음밥', '간편식', '탄수화물'],
  },
  {
    id: 'recipe-3',
    name: '연어 스테이크',
    description: '오메가3 풍부한 건강식',
    ingredients: [
      { name: '연어', quantity: '200', unit: 'g', category: 'seafood' },
      { name: '레몬', quantity: '1/2', unit: '개', category: 'vegetable' },
      { name: '아스파라거스', quantity: '100', unit: 'g', optional: true, category: 'vegetable' },
      { name: '올리브오일', quantity: '1', unit: '큰술', category: 'seasoning' },
      { name: '소금', quantity: '약간', unit: '', category: 'seasoning' },
      { name: '후추', quantity: '약간', unit: '', category: 'seasoning' },
    ],
    steps: [
      '연어에 소금, 후추로 밑간합니다.',
      '팬에 올리브오일을 두르고 중불에서 연어를 굽습니다.',
      '한 면당 3-4분씩 굽습니다.',
      '아스파라거스를 같이 구워 곁들이고 레몬즙을 뿌립니다.',
    ],
    nutritionInfo: { calories: 380, protein: 42, carbs: 5, fat: 22 },
    cookTime: 20,
    difficulty: 'medium',
    nutritionGoals: ['diet', 'lean', 'maintenance'],
    tags: ['스테이크', '고단백', '오메가3'],
  },
  {
    id: 'recipe-4',
    name: '그릭요거트 볼',
    description: '단백질 풍부한 아침 식사',
    ingredients: [
      { name: '그릭요거트', quantity: '200', unit: 'g', category: 'dairy' },
      { name: '바나나', quantity: '1', unit: '개', category: 'vegetable' },
      { name: '블루베리', quantity: '50', unit: 'g', optional: true, category: 'vegetable' },
      { name: '그래놀라', quantity: '30', unit: 'g', optional: true, category: 'grain' },
      { name: '꿀', quantity: '1', unit: '큰술', optional: true, category: 'seasoning' },
    ],
    steps: [
      '그릭요거트를 그릇에 담습니다.',
      '바나나를 슬라이스하여 올립니다.',
      '블루베리와 그래놀라를 토핑합니다.',
      '꿀을 뿌려 완성합니다.',
    ],
    nutritionInfo: { calories: 320, protein: 20, carbs: 45, fat: 8 },
    cookTime: 5,
    difficulty: 'easy',
    nutritionGoals: ['diet', 'maintenance'],
    tags: ['아침식사', '요거트', '간편식'],
  },
  {
    id: 'recipe-5',
    name: '소고기 덮밥',
    description: '든든한 벌크업 식사',
    ingredients: [
      { name: '소고기', quantity: '150', unit: 'g', category: 'meat' },
      { name: '밥', quantity: '250', unit: 'g', category: 'grain' },
      { name: '양파', quantity: '1/2', unit: '개', category: 'vegetable' },
      { name: '대파', quantity: '30', unit: 'g', category: 'vegetable' },
      { name: '간장', quantity: '2', unit: '큰술', category: 'seasoning' },
      { name: '설탕', quantity: '1', unit: '큰술', category: 'seasoning' },
      { name: '참기름', quantity: '1', unit: '작은술', category: 'seasoning' },
    ],
    steps: [
      '소고기를 먹기 좋게 썰어 양념합니다.',
      '양파를 채 썰어 팬에 먼저 볶습니다.',
      '소고기를 넣고 같이 볶습니다.',
      '밥 위에 올리고 대파를 얹어 완성합니다.',
    ],
    nutritionInfo: { calories: 650, protein: 35, carbs: 70, fat: 22 },
    cookTime: 25,
    difficulty: 'easy',
    nutritionGoals: ['bulk', 'maintenance'],
    tags: ['덮밥', '고단백', '한식'],
  },
  {
    id: 'recipe-6',
    name: '두부 스테이크',
    description: '식물성 단백질 다이어트 식사',
    ingredients: [
      { name: '두부', quantity: '300', unit: 'g', category: 'dairy' },
      { name: '양파', quantity: '1/2', unit: '개', category: 'vegetable' },
      { name: '버섯', quantity: '50', unit: 'g', optional: true, category: 'vegetable' },
      { name: '간장', quantity: '2', unit: '큰술', category: 'seasoning' },
      { name: '식용유', quantity: '1', unit: '큰술', category: 'seasoning' },
    ],
    steps: [
      '두부를 1.5cm 두께로 썰어 물기를 제거합니다.',
      '팬에 기름을 두르고 두부를 노릇하게 굽습니다.',
      '양파와 버섯을 넣고 함께 볶습니다.',
      '간장 소스를 뿌려 완성합니다.',
    ],
    nutritionInfo: { calories: 250, protein: 20, carbs: 12, fat: 15 },
    cookTime: 20,
    difficulty: 'easy',
    nutritionGoals: ['diet', 'lean'],
    tags: ['채식', '저칼로리', '두부'],
  },
  {
    id: 'recipe-7',
    name: '오트밀 프로틴 볼',
    description: '운동 후 간식',
    ingredients: [
      { name: '오트밀', quantity: '100', unit: 'g', category: 'grain' },
      { name: '프로틴 파우더', quantity: '30', unit: 'g', category: 'dairy' },
      { name: '땅콩버터', quantity: '2', unit: '큰술', category: 'seasoning' },
      { name: '꿀', quantity: '1', unit: '큰술', category: 'seasoning' },
      { name: '우유', quantity: '50', unit: 'ml', optional: true, category: 'dairy' },
    ],
    steps: [
      '오트밀, 프로틴 파우더, 땅콩버터, 꿀을 섞습니다.',
      '반죽이 되직해지면 우유를 조금씩 넣어 농도를 조절합니다.',
      '작은 공 모양으로 빚어줍니다.',
      '냉장고에서 30분 이상 굳힙니다.',
    ],
    nutritionInfo: { calories: 350, protein: 25, carbs: 40, fat: 12 },
    cookTime: 10,
    difficulty: 'easy',
    nutritionGoals: ['bulk', 'lean'],
    tags: ['간식', '프로틴', '운동후'],
  },
  {
    id: 'recipe-8',
    name: '새우 볶음밥',
    description: '해산물 볶음밥',
    ingredients: [
      { name: '새우', quantity: '100', unit: 'g', category: 'seafood' },
      { name: '밥', quantity: '200', unit: 'g', category: 'grain' },
      { name: '계란', quantity: '1', unit: '개', category: 'dairy' },
      { name: '대파', quantity: '30', unit: 'g', category: 'vegetable' },
      { name: '식용유', quantity: '1', unit: '큰술', category: 'seasoning' },
      { name: '소금', quantity: '약간', unit: '', category: 'seasoning' },
    ],
    steps: [
      '새우는 깨끗이 손질합니다.',
      '팬에 기름을 두르고 새우를 볶아 따로 둡니다.',
      '계란을 풀어 스크램블을 만들고 밥을 넣어 볶습니다.',
      '새우를 넣고 대파를 올려 완성합니다.',
    ],
    nutritionInfo: { calories: 420, protein: 25, carbs: 50, fat: 14 },
    cookTime: 20,
    difficulty: 'easy',
    nutritionGoals: ['maintenance'],
    tags: ['볶음밥', '해산물', '간편식'],
  },
  {
    id: 'recipe-9',
    name: '닭가슴살 파스타',
    description: '고단백 파스타',
    ingredients: [
      { name: '파스타', quantity: '100', unit: 'g', category: 'grain' },
      { name: '닭가슴살', quantity: '150', unit: 'g', category: 'meat' },
      { name: '토마토소스', quantity: '100', unit: 'g', category: 'seasoning' },
      { name: '올리브오일', quantity: '1', unit: '큰술', category: 'seasoning' },
      { name: '마늘', quantity: '2', unit: '쪽', category: 'vegetable' },
      { name: '파슬리', quantity: '약간', unit: '', optional: true, category: 'vegetable' },
    ],
    steps: [
      '파스타를 삶아 건져둡니다.',
      '닭가슴살을 한입 크기로 썰어 굽습니다.',
      '마늘을 볶다가 토마토소스를 넣습니다.',
      '파스타와 닭가슴살을 넣고 섞어 완성합니다.',
    ],
    nutritionInfo: { calories: 520, protein: 40, carbs: 55, fat: 15 },
    cookTime: 25,
    difficulty: 'medium',
    nutritionGoals: ['bulk', 'maintenance'],
    tags: ['파스타', '고단백', '양식'],
  },
  {
    id: 'recipe-10',
    name: '시금치 달걀찜',
    description: '영양 가득 부드러운 달걀찜',
    ingredients: [
      { name: '계란', quantity: '3', unit: '개', category: 'dairy' },
      { name: '시금치', quantity: '50', unit: 'g', category: 'vegetable' },
      { name: '물', quantity: '150', unit: 'ml', category: 'seasoning' },
      { name: '소금', quantity: '약간', unit: '', category: 'seasoning' },
      { name: '참기름', quantity: '약간', unit: '', optional: true, category: 'seasoning' },
    ],
    steps: [
      '시금치를 데쳐서 물기를 짜고 잘게 다집니다.',
      '계란을 풀고 물, 소금을 넣어 섞습니다.',
      '시금치를 넣고 그릇에 담아 찜기에 올립니다.',
      '중불에서 15분 정도 찝니다.',
    ],
    nutritionInfo: { calories: 200, protein: 18, carbs: 3, fat: 13 },
    cookTime: 20,
    difficulty: 'easy',
    nutritionGoals: ['diet', 'lean', 'maintenance'],
    tags: ['한식', '달걀찜', '저탄수화물'],
  },
];

/**
 * 매칭 이유 생성
 */
function generateMatchReason(matchScore: number, matchedCount: number): string {
  if (matchScore >= 80) {
    return `보유 재료 ${matchedCount}개로 바로 만들 수 있어요!`;
  } else if (matchScore >= 50) {
    return `재료가 대부분 있어요. 몇 가지만 추가하면 완성!`;
  } else {
    return `새로운 레시피를 도전해보세요!`;
  }
}

/**
 * 목표에 맞는 레시피 필터링
 */
export function getRecipesByGoal(goal: NutritionGoal): Recipe[] {
  return SAMPLE_RECIPES.filter((recipe) => recipe.nutritionGoals.includes(goal));
}

// 유사 재료 매핑 (세만틱 매칭)
export const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  닭가슴살: ['닭안심', '닭다리살', '닭고기'],
  양파: ['대파', '쪽파', '부추', '양파'],
  간장: ['진간장', '양조간장', '국간장', '간장'],
  고추장: ['초고추장', '쌈장', '고추장'],
  두부: ['순두부', '연두부', '부침두부', '두부'],
  토마토: ['방울토마토', '대추방울토마토', '토마토'],
  버섯: ['양송이', '느타리', '팽이버섯', '새송이', '표고버섯', '버섯'],
  마늘: ['다진마늘', '마늘가루', '마늘'],
  생강: ['생강즙', '생강가루', '생강'],
  파: ['대파', '쪽파', '실파', '파'],
  고기: ['소고기', '돼지고기', '닭고기', '양고기'],
  새우: ['칵테일새우', '흰다리새우', '왕새우', '새우'],
  계란: ['달걀', '계란'],
  우유: ['저지방우유', '무지방우유', '우유'],
  치즈: ['모짜렐라', '체다치즈', '파마산', '치즈'],
  밥: ['현미밥', '잡곡밥', '쌀밥', '밥'],
  면: ['파스타', '국수', '스파게티', '면'],
  식용유: ['올리브오일', '카놀라유', '해바라기유', '포도씨유', '식용유'],
};

/**
 * 유사 재료 찾기
 */
export function findSimilarIngredient(ingredient: string, pantryItems: string[]): string | null {
  const lowerIngredient = ingredient.toLowerCase();

  // 정확히 일치하는 항목 찾기
  const exactMatch = pantryItems.find((item) => item.toLowerCase() === lowerIngredient);
  if (exactMatch) return exactMatch;

  // 부분 일치 찾기
  const partialMatch = pantryItems.find(
    (item) =>
      item.toLowerCase().includes(lowerIngredient) || lowerIngredient.includes(item.toLowerCase())
  );
  if (partialMatch) return partialMatch;

  // 유사어 찾기
  for (const [key, synonyms] of Object.entries(INGREDIENT_SYNONYMS)) {
    // ingredient가 이 유사어 그룹에 속하는지 확인 (key 또는 synonyms 배열에 있으면)
    const ingredientInGroup =
      key.toLowerCase() === lowerIngredient ||
      key.toLowerCase().includes(lowerIngredient) ||
      lowerIngredient.includes(key.toLowerCase()) ||
      synonyms.some(
        (syn) =>
          syn.toLowerCase() === lowerIngredient ||
          syn.toLowerCase().includes(lowerIngredient) ||
          lowerIngredient.includes(syn.toLowerCase())
      );

    if (ingredientInGroup) {
      // 동의어 그룹의 모든 단어 (key + synonyms)가 pantry에 있는지 확인
      const allSynonyms = [key, ...synonyms];
      const match = pantryItems.find((item) =>
        allSynonyms.some(
          (syn) =>
            item.toLowerCase().includes(syn.toLowerCase()) ||
            syn.toLowerCase().includes(item.toLowerCase())
        )
      );
      if (match) return match;
    }
  }

  return null;
}

/**
 * 레시피 매칭 점수 계산
 */
interface MatchScoreDetails {
  ingredientScore: number; // 재료 매칭 점수 (50%)
  essentialScore: number; // 필수 재료 보유 점수 (30%)
  expiryBonus: number; // 유통기한 임박 재료 사용 보너스 (20%)
  totalScore: number;
  availabilityRate: number; // 보유 재료 비율 (0-1)
}

function calculateMatchScore(
  recipe: Recipe,
  pantryItems: string[],
  expiringItems: string[] = []
): MatchScoreDetails {
  const requiredIngredients = recipe.ingredients.filter((ing) => !ing.optional);
  const totalRequired = requiredIngredients.length;

  // 매칭된 재료 찾기 (세만틱 매칭 포함)
  const matchedCount = requiredIngredients.filter((ing) =>
    findSimilarIngredient(ing.name, pantryItems)
  ).length;

  // 재료 매칭 점수 (50%)
  const ingredientScore = totalRequired > 0 ? (matchedCount / totalRequired) * 50 : 0;

  // 필수 재료 보유 점수 (30%)
  // 고기, 해산물, 주재료 카테고리가 있는지 확인
  const essentialCategories: IngredientCategory[] = ['meat', 'seafood', 'grain'];
  const hasEssentialIngredient = recipe.ingredients
    .filter((ing) => !ing.optional && essentialCategories.includes(ing.category))
    .every((ing) => findSimilarIngredient(ing.name, pantryItems));

  const essentialScore = hasEssentialIngredient ? 30 : 0;

  // 유통기한 임박 재료 사용 보너스 (20%)
  const usesExpiringIngredients = recipe.ingredients.some((ing) =>
    expiringItems.some((expiring) => findSimilarIngredient(ing.name, [expiring]))
  );

  const expiryBonus = usesExpiringIngredients ? 20 : 0;

  const totalScore = ingredientScore + essentialScore + expiryBonus;
  const availabilityRate = totalRequired > 0 ? matchedCount / totalRequired : 0;

  return {
    ingredientScore,
    essentialScore,
    expiryBonus,
    totalScore: Math.round(totalScore),
    availabilityRate,
  };
}

/**
 * 레시피 매칭 추천 (고도화)
 */
export function recommendRecipes(
  userIngredients: string[],
  options?: {
    goal?: NutritionGoal;
    maxMissingIngredients?: number;
    maxCookTime?: number;
    minMatchScore?: number;
    expiringItems?: string[];
  }
): RecipeMatchResult[] {
  const normalizedUserIngredients = userIngredients.map((ing) => ing.toLowerCase());
  const normalizedExpiringItems = (options?.expiringItems || []).map((ing) => ing.toLowerCase());

  let recipes = options?.goal ? getRecipesByGoal(options.goal) : SAMPLE_RECIPES;

  // 조리 시간 필터
  if (options?.maxCookTime) {
    recipes = recipes.filter((r) => r.cookTime <= options.maxCookTime!);
  }

  const results = recipes
    .map((recipe) => {
      const requiredIngredients = recipe.ingredients.filter((ing) => !ing.optional);

      // 세만틱 매칭 사용
      const matched = requiredIngredients.filter((ing) =>
        findSimilarIngredient(ing.name, normalizedUserIngredients)
      );

      const missing = requiredIngredients.filter(
        (ing) => !findSimilarIngredient(ing.name, normalizedUserIngredients)
      );

      // 고도화된 점수 계산
      const scoreDetails = calculateMatchScore(
        recipe,
        normalizedUserIngredients,
        normalizedExpiringItems
      );

      return {
        recipe,
        matchScore: scoreDetails.totalScore,
        matchedIngredients: matched.map((i) => i.name),
        missingIngredients: missing.map((i) => i.name),
        availabilityRate: scoreDetails.availabilityRate,
        matchReason: generateMatchReason(scoreDetails.totalScore, matched.length),
      };
    })
    .filter((result) => {
      // 최소 매칭 점수 필터 (기본 30)
      const minScore = options?.minMatchScore ?? 30;
      if (result.matchScore < minScore) return false;

      // 최대 누락 재료 수 필터 (기본 3)
      const maxMissing = options?.maxMissingIngredients ?? 3;
      if (result.missingIngredients.length > maxMissing) return false;

      return true;
    });

  // 매칭 점수 순 정렬
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * 목표별 일일 칼로리 계산
 */
export function calculateDailyCalories(
  weight: number, // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive',
  goal: NutritionGoal
): number {
  // Harris-Benedict 공식 (평균)
  const bmr = weight * 24; // 간단화된 BMR 계산

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };

  const tdee = bmr * activityMultipliers[activityLevel];
  return Math.round(tdee * NUTRITION_TARGETS[goal].calorieMultiplier);
}

/**
 * 목표별 일일 단백질 계산
 */
export function calculateDailyProtein(weight: number, goal: NutritionGoal): number {
  return Math.round(weight * NUTRITION_TARGETS[goal].proteinPerKg);
}

// 목표별 매크로 계산 결과
export interface GoalBasedMacros {
  dailyCalories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  goal: NutritionGoal;
  goalLabel: string;
  description: string;
}

/**
 * 목표별 칼로리 + 매크로(단백질/탄수화물/지방) 통합 계산
 *
 * NUTRITION_TARGETS의 목표별 비율을 사용:
 * - diet: 칼로리 80%, 단백질 1.6g/kg, 탄수화물 35%, 지방 25%
 * - bulk: 칼로리 115%, 단백질 2.0g/kg, 탄수화물 45%, 지방 25%
 * - lean: 칼로리 105%, 단백질 2.2g/kg, 탄수화물 40%, 지방 25%
 * - maintenance: 칼로리 100%, 단백질 1.4g/kg, 탄수화물 45%, 지방 30%
 *
 * @param tdee - 총 에너지 소비량 (kcal/day)
 * @param weight - 체중 (kg)
 * @param goal - 영양 목표 (diet/bulk/lean/maintenance)
 */
export function calculateGoalBasedMacros(
  tdee: number,
  weight: number,
  goal: NutritionGoal
): GoalBasedMacros {
  if (tdee <= 0 || weight <= 0) {
    return {
      dailyCalories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      goal,
      goalLabel: NUTRITION_GOAL_LABELS[goal],
      description: NUTRITION_TARGETS[goal].description,
    };
  }

  const target = NUTRITION_TARGETS[goal];
  const dailyCalories = Math.round(tdee * target.calorieMultiplier);

  // 단백질: 체중 기반 (g/kg)
  const protein = Math.round(weight * target.proteinPerKg);
  const proteinCalories = protein * 4;

  // 지방: 목표별 비율
  const fatCalories = dailyCalories * target.fatRatio;
  const fat = Math.round(fatCalories / 9);

  // 탄수화물: 나머지 칼로리
  const carbsCalories = Math.max(0, dailyCalories - proteinCalories - fatCalories);
  const carbs = Math.round(carbsCalories / 4);

  return {
    dailyCalories,
    protein,
    carbs,
    fat,
    goal,
    goalLabel: NUTRITION_GOAL_LABELS[goal],
    description: target.description,
  };
}

// 영양 온보딩 목표 → 레시피 목표 매핑
type OnboardingNutritionGoal = 'weight_loss' | 'maintain' | 'muscle' | 'skin' | 'health';

const GOAL_MAPPING: Record<OnboardingNutritionGoal, NutritionGoal> = {
  weight_loss: 'diet',
  maintain: 'maintenance',
  muscle: 'bulk',
  skin: 'maintenance',
  health: 'maintenance',
};

/**
 * 온보딩 영양 목표를 레시피/피트니스 목표로 변환
 *
 * 매핑:
 * - weight_loss → diet (칼로리 제한)
 * - muscle → bulk (칼로리 잉여)
 * - maintain/skin/health → maintenance (유지)
 */
export function mapToFitnessGoal(onboardingGoal: OnboardingNutritionGoal): NutritionGoal {
  return GOAL_MAPPING[onboardingGoal] ?? 'maintenance';
}

/**
 * 4가지 목표 전체에 대한 매크로 비교표 생성
 *
 * 온보딩 후 사용자에게 각 목표별 칼로리/매크로를 비교하여
 * 목표 변경 시 참고할 수 있도록 함
 */
export function calculateAllGoalComparisons(tdee: number, weight: number): GoalBasedMacros[] {
  const goals: NutritionGoal[] = ['diet', 'bulk', 'lean', 'maintenance'];
  return goals.map((goal) => calculateGoalBasedMacros(tdee, weight, goal));
}
