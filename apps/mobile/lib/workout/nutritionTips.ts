/**
 * N-1 연동 준비: 운동 후 영양 팁 로직
 *
 * 스펙 참조: docs/phase2/docs/W-1-feature-spec-template-v1.1-final.md (5.2절)
 * - W-1 → N-1 연동: 운동 후 단백질 보충 가이드
 * - "오늘 운동에 맞는 식단 추천"
 * - "[식단 분석 받기]" 버튼
 */

// 운동 타입 (W-1에서 정의)
export type WorkoutType = 'toner' | 'builder' | 'burner' | 'mover' | 'flexer';

// 운동 강도
export type WorkoutIntensity = 'low' | 'medium' | 'high';

// 영양 팁 인터페이스
export interface NutritionTip {
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'protein' | 'carbs' | 'hydration' | 'recovery' | 'general';
}

// 운동 후 영양 추천 인터페이스
export interface PostWorkoutNutrition {
  proteinTips: NutritionTip[];
  mealTips: NutritionTip[];
  hydrationTip: NutritionTip;
  timing: {
    optimal: string;  // 최적 섭취 시간
    deadline: string; // 권장 마감 시간
  };
}

// 소모 칼로리 예상 (운동 타입과 시간 기반)
export interface CalorieEstimate {
  total: number;
  perMinute: number;
}

// 운동 타입별 칼로리 소모율 (kcal/분)
const CALORIE_RATES: Record<WorkoutType, number> = {
  toner: 6,      // 토닝 - 중간 강도
  builder: 8,    // 근력 - 높은 강도
  burner: 10,    // 유산소 - 최고 강도
  mover: 7,      // 기능성 - 중상 강도
  flexer: 4,     // 유연성 - 낮은 강도
};

// 운동 타입별 단백질 팁
const PROTEIN_TIPS: Record<WorkoutType, NutritionTip[]> = {
  builder: [
    {
      icon: '🥩',
      title: '고단백 식사',
      description: '근력 운동 후 30분~1시간 내에 체중 1kg당 0.3g의 단백질을 섭취하면 근육 회복에 효과적이에요.',
      priority: 'high',
      category: 'protein',
    },
    {
      icon: '🥛',
      title: '유청 단백질 추천',
      description: '빠른 흡수를 위해 유청 단백질 쉐이크가 좋아요. 없다면 닭가슴살, 계란도 좋은 선택이에요.',
      priority: 'medium',
      category: 'protein',
    },
  ],
  toner: [
    {
      icon: '🥗',
      title: '균형 잡힌 단백질',
      description: '토닝 운동 후에는 살코기, 두부, 콩류로 적당한 단백질을 섭취해 주세요.',
      priority: 'medium',
      category: 'protein',
    },
  ],
  burner: [
    {
      icon: '🍌',
      title: '탄수화물 + 단백질',
      description: '유산소 운동 후에는 바나나와 함께 단백질을 섭취하면 에너지 회복이 빨라요.',
      priority: 'high',
      category: 'protein',
    },
    {
      icon: '🥤',
      title: '회복 음료',
      description: '초콜릿 우유는 탄수화물과 단백질 비율이 좋아 운동 후 회복에 효과적이에요.',
      priority: 'medium',
      category: 'recovery',
    },
  ],
  mover: [
    {
      icon: '🥚',
      title: '양질의 단백질',
      description: '기능성 운동 후에는 계란, 연어 등 양질의 단백질로 근육을 보충해 주세요.',
      priority: 'medium',
      category: 'protein',
    },
  ],
  flexer: [
    {
      icon: '🥜',
      title: '가벼운 단백질',
      description: '스트레칭 후에는 견과류, 그릭 요거트 정도의 가벼운 단백질이면 충분해요.',
      priority: 'low',
      category: 'protein',
    },
  ],
};

// 운동 타입별 식사 추천
const MEAL_TIPS: Record<WorkoutType, NutritionTip[]> = {
  builder: [
    {
      icon: '🍗',
      title: '근육 성장 식단',
      description: '닭가슴살 + 현미밥 + 채소로 완벽한 근육 성장 식단을 만들어 보세요.',
      priority: 'high',
      category: 'general',
    },
    {
      icon: '🥦',
      title: '채소 섭취',
      description: '브로콜리, 시금치 등 녹색 채소는 근육 회복에 필요한 비타민과 미네랄을 제공해요.',
      priority: 'medium',
      category: 'general',
    },
  ],
  toner: [
    {
      icon: '🥙',
      title: '저칼로리 고단백',
      description: '토닝 목표라면 저칼로리 고단백 식단이 효과적이에요. 샐러드 + 그릴드 치킨 추천!',
      priority: 'medium',
      category: 'general',
    },
  ],
  burner: [
    {
      icon: '🍠',
      title: '복합 탄수화물',
      description: '유산소 운동 후에는 고구마, 귀리 등 복합 탄수화물로 에너지를 보충해 주세요.',
      priority: 'high',
      category: 'carbs',
    },
    {
      icon: '🍎',
      title: '과일 섭취',
      description: '사과, 오렌지 등 과일로 자연스럽게 당분과 비타민을 보충하세요.',
      priority: 'medium',
      category: 'carbs',
    },
  ],
  mover: [
    {
      icon: '🍲',
      title: '균형 식단',
      description: '탄수화물, 단백질, 지방의 균형 잡힌 식사로 전반적인 체력을 유지하세요.',
      priority: 'medium',
      category: 'general',
    },
  ],
  flexer: [
    {
      icon: '🫖',
      title: '가벼운 간식',
      description: '요가나 스트레칭 후에는 허브차와 함께 가벼운 간식이면 충분해요.',
      priority: 'low',
      category: 'general',
    },
  ],
};

// 수분 보충 팁 (운동 강도별)
const HYDRATION_TIPS: Record<WorkoutIntensity, NutritionTip> = {
  high: {
    icon: '💧',
    title: '수분 보충 필수',
    description: '고강도 운동 후에는 체중의 1.5배만큼 수분을 보충해야 해요. 500ml 이상 마시세요!',
    priority: 'high',
    category: 'hydration',
  },
  medium: {
    icon: '💧',
    title: '충분한 수분 섭취',
    description: '운동 후 30분 내에 물 300-500ml를 마시면 회복이 빨라져요.',
    priority: 'medium',
    category: 'hydration',
  },
  low: {
    icon: '💧',
    title: '수분 보충',
    description: '가벼운 운동 후에도 물 한 잔은 꼭 마시세요.',
    priority: 'low',
    category: 'hydration',
  },
};

// 섭취 타이밍 (운동 타입별)
const TIMING: Record<WorkoutType, { optimal: string; deadline: string }> = {
  builder: { optimal: '30분 이내', deadline: '2시간 이내' },
  toner: { optimal: '1시간 이내', deadline: '2시간 이내' },
  burner: { optimal: '30분 이내', deadline: '1시간 이내' },
  mover: { optimal: '1시간 이내', deadline: '2시간 이내' },
  flexer: { optimal: '식사 시간에 맞춰', deadline: '편한 시간에' },
};

/**
 * 운동 강도 추론 (시간 기반)
 */
export function inferIntensity(
  workoutType: WorkoutType,
  durationMinutes: number
): WorkoutIntensity {
  // 유연성 운동은 항상 낮은 강도
  if (workoutType === 'flexer') {
    return 'low';
  }

  // 버너(유산소)는 시간에 따라 강도 증가
  if (workoutType === 'burner') {
    if (durationMinutes >= 40) return 'high';
    if (durationMinutes >= 20) return 'medium';
    return 'low';
  }

  // 빌더(근력)는 짧아도 고강도 가능
  if (workoutType === 'builder') {
    if (durationMinutes >= 30) return 'high';
    if (durationMinutes >= 15) return 'medium';
    return 'low';
  }

  // 토너, 무버는 중간 정도
  if (durationMinutes >= 45) return 'high';
  if (durationMinutes >= 25) return 'medium';
  return 'low';
}

/**
 * 칼로리 소모량 계산
 */
export function estimateCaloriesBurned(
  workoutType: WorkoutType,
  durationMinutes: number,
  bodyWeightKg: number = 60 // 기본값
): CalorieEstimate {
  const baseRate = CALORIE_RATES[workoutType];
  // 체중 보정 (60kg 기준)
  const weightMultiplier = bodyWeightKg / 60;
  const adjustedRate = baseRate * weightMultiplier;

  return {
    total: Math.round(adjustedRate * durationMinutes),
    perMinute: Math.round(adjustedRate * 10) / 10,
  };
}

/**
 * 운동 후 영양 팁 생성
 */
export function getPostWorkoutNutritionTips(
  workoutType: WorkoutType,
  durationMinutes: number
): PostWorkoutNutrition {
  const intensity = inferIntensity(workoutType, durationMinutes);

  return {
    proteinTips: PROTEIN_TIPS[workoutType] || [],
    mealTips: MEAL_TIPS[workoutType] || [],
    hydrationTip: HYDRATION_TIPS[intensity],
    timing: TIMING[workoutType],
  };
}

/**
 * 간단한 영양 메시지 생성 (결과 페이지용)
 */
export function getQuickNutritionMessage(
  workoutType: WorkoutType,
  durationMinutes: number,
  caloriesBurned?: number
): { icon: string; title: string; message: string } {
  const calories = caloriesBurned || estimateCaloriesBurned(workoutType, durationMinutes).total;
  const intensity = inferIntensity(workoutType, durationMinutes);

  if (workoutType === 'builder') {
    return {
      icon: '💪',
      title: '운동 후 영양 가이드',
      message: `${calories}kcal 소모! 30분 내에 단백질을 섭취하면 근육 성장에 효과적이에요.`,
    };
  }

  if (workoutType === 'burner') {
    return {
      icon: '🔥',
      title: '운동 후 영양 가이드',
      message: `${calories}kcal 소모! 탄수화물과 단백질을 함께 섭취해 에너지를 보충하세요.`,
    };
  }

  if (intensity === 'high') {
    return {
      icon: '⚡',
      title: '운동 후 영양 가이드',
      message: `${calories}kcal 소모! 고강도 운동 후에는 충분한 영양 섭취가 중요해요.`,
    };
  }

  return {
    icon: '🍽️',
    title: '운동 후 영양 가이드',
    message: `${calories}kcal 소모! 균형 잡힌 식사로 건강을 유지하세요.`,
  };
}

/**
 * 단백질 권장량 계산 (g)
 */
export function calculateProteinRecommendation(
  workoutType: WorkoutType,
  bodyWeightKg: number = 60
): { min: number; max: number; unit: string } {
  // 근력 운동: 체중 1kg당 0.25-0.4g
  if (workoutType === 'builder') {
    return {
      min: Math.round(bodyWeightKg * 0.25),
      max: Math.round(bodyWeightKg * 0.4),
      unit: 'g',
    };
  }

  // 유산소: 체중 1kg당 0.15-0.25g
  if (workoutType === 'burner') {
    return {
      min: Math.round(bodyWeightKg * 0.15),
      max: Math.round(bodyWeightKg * 0.25),
      unit: 'g',
    };
  }

  // 기타: 체중 1kg당 0.15-0.3g
  return {
    min: Math.round(bodyWeightKg * 0.15),
    max: Math.round(bodyWeightKg * 0.3),
    unit: 'g',
  };
}

// 상수 내보내기 (테스트 및 외부 사용)
export {
  CALORIE_RATES,
  PROTEIN_TIPS,
  MEAL_TIPS,
  HYDRATION_TIPS,
  TIMING,
};
