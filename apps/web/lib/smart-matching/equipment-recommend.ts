/**
 * 운동기구 매칭 서비스
 * @description W-1 연동 기반 운동기구/장비 추천
 */

import type { WorkoutType, ExerciseDifficulty } from '@/types/workout';

// ============================================
// 타입 정의
// ============================================

export type WorkoutEquipmentCategory =
  | 'cardio'
  | 'strength'
  | 'resistance'
  | 'flexibility'
  | 'wearable'
  | 'apparel'
  | 'accessory'
  | 'supplement';

export type WorkoutGoal =
  | 'weight_loss'
  | 'muscle_gain'
  | 'endurance'
  | 'flexibility'
  | 'health'
  | 'body_shaping';

export type BudgetLevel = 'basic' | 'intermediate' | 'advanced';
export type SpaceSize = 'small' | 'medium' | 'large';
export type Priority = 'essential' | 'recommended' | 'optional';

export interface EquipmentRecommendation {
  id: string;
  name: string;
  category: WorkoutEquipmentCategory;
  priority: Priority;
  priceRange: { min: number; max: number };
  description: string;
  reason: string;
  affiliateUrl?: string;
  imageUrl?: string;
}

export interface WorkoutEquipmentMatch {
  workoutGoal: WorkoutGoal;
  fitnessLevel: ExerciseDifficulty;
  preferredWorkouts: WorkoutType[];
  homeGym: boolean;
  recommendations: {
    category: WorkoutEquipmentCategory;
    priority: Priority;
    items: EquipmentRecommendation[];
    reason: string;
  }[];
}

export interface HomeGymSetup {
  budget: BudgetLevel;
  spaceSize: SpaceSize;
  goals: WorkoutGoal[];
  essentialSet: {
    items: EquipmentRecommendation[];
    totalCost: number;
    description: string;
  };
  expandedSet?: {
    items: EquipmentRecommendation[];
    totalCost: number;
    description: string;
  };
  purchasePlan: {
    phase: number;
    items: EquipmentRecommendation[];
    cost: number;
    description: string;
  }[];
}

// ============================================
// 장비 데이터베이스
// ============================================

const EQUIPMENT_DATABASE: EquipmentRecommendation[] = [
  // 유산소
  {
    id: 'eq-1',
    name: '접이식 러닝머신',
    category: 'cardio',
    priority: 'recommended',
    priceRange: { min: 300000, max: 800000 },
    description: '가정용 유산소 운동의 기본 장비',
    reason: '날씨와 상관없이 실내에서 유산소 운동 가능',
  },
  {
    id: 'eq-2',
    name: '실내 자전거',
    category: 'cardio',
    priority: 'recommended',
    priceRange: { min: 200000, max: 500000 },
    description: '저충격 유산소 운동에 적합',
    reason: '관절에 무리 없이 지속적인 유산소 운동 가능',
  },
  {
    id: 'eq-3',
    name: '줄넘기',
    category: 'cardio',
    priority: 'essential',
    priceRange: { min: 10000, max: 30000 },
    description: '공간 효율적인 고강도 유산소',
    reason: '적은 비용으로 높은 칼로리 소모',
  },
  // 근력
  {
    id: 'eq-4',
    name: '조절식 덤벨 세트',
    category: 'strength',
    priority: 'essential',
    priceRange: { min: 100000, max: 300000 },
    description: '다양한 무게 조절 가능한 덤벨',
    reason: '전신 근력 운동의 필수 장비',
  },
  {
    id: 'eq-5',
    name: '바벨 세트',
    category: 'strength',
    priority: 'recommended',
    priceRange: { min: 200000, max: 500000 },
    description: '올림픽 바벨과 원판 세트',
    reason: '복합 운동에 필수적인 장비',
  },
  {
    id: 'eq-6',
    name: '케틀벨',
    category: 'strength',
    priority: 'recommended',
    priceRange: { min: 30000, max: 80000 },
    description: '기능성 운동에 적합한 장비',
    reason: '전신 운동과 심폐 향상에 효과적',
  },
  // 저항
  {
    id: 'eq-7',
    name: '저항 밴드 세트',
    category: 'resistance',
    priority: 'essential',
    priceRange: { min: 15000, max: 40000 },
    description: '다양한 강도의 탄성 밴드',
    reason: '공간 효율적이고 다용도로 활용 가능',
  },
  {
    id: 'eq-8',
    name: '튜빙 밴드',
    category: 'resistance',
    priority: 'optional',
    priceRange: { min: 10000, max: 25000 },
    description: '손잡이가 있는 튜빙 밴드',
    reason: '상체 운동에 특히 효과적',
  },
  // 유연성
  {
    id: 'eq-9',
    name: '요가 매트',
    category: 'flexibility',
    priority: 'essential',
    priceRange: { min: 20000, max: 60000 },
    description: '운동의 기본 매트',
    reason: '모든 바닥 운동에 필수',
  },
  {
    id: 'eq-10',
    name: '폼롤러',
    category: 'flexibility',
    priority: 'recommended',
    priceRange: { min: 15000, max: 40000 },
    description: '근막 이완용 롤러',
    reason: '운동 전후 근육 회복에 효과적',
  },
  {
    id: 'eq-11',
    name: '스트레칭 스트랩',
    category: 'flexibility',
    priority: 'optional',
    priceRange: { min: 10000, max: 20000 },
    description: '스트레칭 보조 도구',
    reason: '유연성 향상에 도움',
  },
  // 웨어러블
  {
    id: 'eq-12',
    name: '스마트워치',
    category: 'wearable',
    priority: 'recommended',
    priceRange: { min: 200000, max: 500000 },
    description: '운동 추적 및 심박수 모니터링',
    reason: '운동 효과 측정과 동기부여에 도움',
  },
  // 의류
  {
    id: 'eq-13',
    name: '운동화',
    category: 'apparel',
    priority: 'essential',
    priceRange: { min: 80000, max: 200000 },
    description: '용도에 맞는 운동화',
    reason: '부상 방지와 운동 효율 향상',
  },
  {
    id: 'eq-14',
    name: '운동복 세트',
    category: 'apparel',
    priority: 'essential',
    priceRange: { min: 50000, max: 150000 },
    description: '흡습 속건 기능의 운동복',
    reason: '쾌적한 운동 환경 유지',
  },
  // 액세서리
  {
    id: 'eq-15',
    name: '운동 장갑',
    category: 'accessory',
    priority: 'optional',
    priceRange: { min: 15000, max: 40000 },
    description: '웨이트 트레이닝용 장갑',
    reason: '손바닥 보호 및 그립력 향상',
  },
  {
    id: 'eq-16',
    name: '리프팅 벨트',
    category: 'accessory',
    priority: 'optional',
    priceRange: { min: 30000, max: 80000 },
    description: '허리 보호용 벨트',
    reason: '중량 운동 시 허리 부상 방지',
  },
  // 보조제
  {
    id: 'eq-17',
    name: '단백질 보충제',
    category: 'supplement',
    priority: 'recommended',
    priceRange: { min: 30000, max: 80000 },
    description: '유청 단백질 파우더',
    reason: '근육 회복과 성장에 도움',
  },
  {
    id: 'eq-18',
    name: 'BCAA',
    category: 'supplement',
    priority: 'optional',
    priceRange: { min: 20000, max: 50000 },
    description: '분지쇄 아미노산 보충제',
    reason: '운동 중 근육 보호 효과',
  },
];

// ============================================
// 매칭 로직
// ============================================

/**
 * 운동 목표 기반 장비 추천
 */
export function getEquipmentRecommendations(
  goal: WorkoutGoal,
  fitnessLevel: ExerciseDifficulty,
  homeGym: boolean = true
): WorkoutEquipmentMatch {
  // 목표별 우선 카테고리
  const goalCategories: Record<WorkoutGoal, WorkoutEquipmentCategory[]> = {
    weight_loss: ['cardio', 'resistance', 'flexibility'],
    muscle_gain: ['strength', 'supplement', 'accessory'],
    endurance: ['cardio', 'wearable', 'supplement'],
    flexibility: ['flexibility', 'apparel'],
    health: ['cardio', 'flexibility', 'wearable'],
    body_shaping: ['strength', 'resistance', 'cardio'],
  };

  const preferredCategories = goalCategories[goal];

  // 카테고리별 추천 생성
  const recommendations = preferredCategories.map((category, index) => {
    const categoryItems = EQUIPMENT_DATABASE.filter((eq) => eq.category === category);

    // 레벨에 따른 필터링
    const filteredItems =
      fitnessLevel === 'beginner'
        ? categoryItems.filter((eq) => eq.priority !== 'optional')
        : categoryItems;

    // 홈짐 여부에 따른 조정
    const adjustedItems = homeGym
      ? filteredItems
      : filteredItems.filter((eq) => !['cardio'].includes(eq.category) || eq.id === 'eq-3');

    return {
      category,
      priority: (index === 0 ? 'essential' : index === 1 ? 'recommended' : 'optional') as Priority,
      items: adjustedItems,
      reason: getCategoryReason(category, goal),
    };
  });

  return {
    workoutGoal: goal,
    fitnessLevel,
    preferredWorkouts: getPreferredWorkouts(goal),
    homeGym,
    recommendations,
  };
}

/**
 * 카테고리별 추천 이유
 */
function getCategoryReason(category: WorkoutEquipmentCategory, goal: WorkoutGoal): string {
  const reasons: Record<string, Record<string, string>> = {
    cardio: {
      weight_loss: '체지방 감량의 핵심인 유산소 운동 장비',
      endurance: '지구력 향상을 위한 필수 장비',
      health: '심폐 건강 유지를 위한 기본 장비',
    },
    strength: {
      muscle_gain: '근육량 증가에 필수적인 근력 운동 장비',
      body_shaping: '체형 교정과 근력 향상에 효과적',
    },
    resistance: {
      weight_loss: '가정에서 쉽게 할 수 있는 저항 운동 장비',
      body_shaping: '특정 부위 타겟팅에 효과적',
    },
    flexibility: {
      flexibility: '유연성 향상의 필수 장비',
      health: '부상 방지와 회복에 중요',
    },
    supplement: {
      muscle_gain: '근육 성장 지원을 위한 영양 보충',
      endurance: '운동 수행 능력 향상 지원',
    },
    wearable: {
      endurance: '운동 강도 및 효과 측정에 유용',
      health: '일상 활동량 모니터링에 도움',
    },
    apparel: {
      flexibility: '움직임에 편안한 운동복 필요',
    },
    accessory: {
      muscle_gain: '안전하고 효과적인 근력 운동 보조',
    },
  };

  return reasons[category]?.[goal] ?? `${goal} 달성을 위한 추천 장비`;
}

/**
 * 목표별 선호 운동 타입
 */
function getPreferredWorkouts(goal: WorkoutGoal): WorkoutType[] {
  const workoutMap: Record<WorkoutGoal, WorkoutType[]> = {
    weight_loss: ['burner', 'mover'],
    muscle_gain: ['builder', 'toner'],
    endurance: ['mover', 'burner'],
    flexibility: ['flexer', 'mover'],
    health: ['mover', 'flexer', 'toner'],
    body_shaping: ['toner', 'builder'],
  };

  return workoutMap[goal];
}

/**
 * 홈짐 구성 추천
 */
export function getHomeGymSetup(
  budget: BudgetLevel,
  spaceSize: SpaceSize,
  goals: WorkoutGoal[]
): HomeGymSetup {
  // 예산별 최대 금액
  const budgetLimits: Record<BudgetLevel, number> = {
    basic: 200000,
    intermediate: 500000,
    advanced: 1000000,
  };

  const maxBudget = budgetLimits[budget];

  // 공간별 제외 장비
  const spaceExclusions: Record<SpaceSize, string[]> = {
    small: ['eq-1', 'eq-5'], // 러닝머신, 바벨 제외
    medium: ['eq-1'], // 러닝머신만 제외
    large: [],
  };

  const excludedIds = spaceExclusions[spaceSize];

  // 필수 장비 선정
  const essentialItems = EQUIPMENT_DATABASE.filter(
    (eq) =>
      eq.priority === 'essential' &&
      !excludedIds.includes(eq.id) &&
      eq.priceRange.min <= maxBudget * 0.5
  );

  const essentialCost = essentialItems.reduce((sum, eq) => sum + eq.priceRange.min, 0);

  // 확장 장비 (중급 이상)
  const expandedItems =
    budget !== 'basic'
      ? EQUIPMENT_DATABASE.filter(
          (eq) =>
            eq.priority === 'recommended' &&
            !excludedIds.includes(eq.id) &&
            !essentialItems.includes(eq)
        ).slice(0, 5)
      : undefined;

  const expandedCost = expandedItems?.reduce((sum, eq) => sum + eq.priceRange.min, 0) ?? 0;

  // 단계별 구매 계획
  const purchasePlan = [
    {
      phase: 1,
      items: essentialItems.slice(0, 3),
      cost: essentialItems.slice(0, 3).reduce((sum, eq) => sum + eq.priceRange.min, 0),
      description: '운동 시작을 위한 기본 장비',
    },
    {
      phase: 2,
      items: essentialItems.slice(3),
      cost: essentialItems.slice(3).reduce((sum, eq) => sum + eq.priceRange.min, 0),
      description: '루틴 정착 후 추가 장비',
    },
  ];

  if (expandedItems && expandedItems.length > 0) {
    purchasePlan.push({
      phase: 3,
      items: expandedItems,
      cost: expandedCost,
      description: '목표 달성 가속화를 위한 추가 장비',
    });
  }

  return {
    budget,
    spaceSize,
    goals,
    essentialSet: {
      items: essentialItems,
      totalCost: essentialCost,
      description: '홈짐 시작을 위한 필수 장비 세트',
    },
    expandedSet: expandedItems
      ? {
          items: expandedItems,
          totalCost: expandedCost,
          description: '운동 효과 극대화를 위한 추가 장비',
        }
      : undefined,
    purchasePlan,
  };
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 카테고리 라벨 반환
 */
export function getCategoryLabel(category: WorkoutEquipmentCategory): string {
  const labels: Record<WorkoutEquipmentCategory, string> = {
    cardio: '유산소',
    strength: '근력',
    resistance: '저항',
    flexibility: '유연성',
    wearable: '웨어러블',
    apparel: '운동복',
    accessory: '액세서리',
    supplement: '보조제',
  };

  return labels[category];
}

/**
 * 목표 라벨 반환
 */
export function getGoalLabel(goal: WorkoutGoal): string {
  const labels: Record<WorkoutGoal, string> = {
    weight_loss: '체중 감량',
    muscle_gain: '근육 증가',
    endurance: '지구력 향상',
    flexibility: '유연성 향상',
    health: '건강 유지',
    body_shaping: '체형 교정',
  };

  return labels[goal];
}

/**
 * 가격 포맷팅
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

/**
 * 예산 라벨 반환
 */
export function getBudgetLabel(budget: BudgetLevel): string {
  const labels: Record<BudgetLevel, string> = {
    basic: '입문 (20만원 이하)',
    intermediate: '중급 (50만원 이하)',
    advanced: '고급 (100만원 이하)',
  };

  return labels[budget];
}
