/**
 * N-1: 개인화 영양 프로필링 모듈
 *
 * @module lib/nutrition/personalized-profile
 * @description 나이, 성별, 건강 상태에 따른 개인화된 RDA 계산
 *
 * P2 원칙: docs/principles/nutrition-science.md 기반 구현
 * P7 워크플로우: docs/research/claude-ai-research/N-1-R1-영양학기초.md 참조
 *
 * @see 한국인 영양섭취기준 (KDRI 2020/2025)
 */

import { NutrientId, NutrientRDA, RDAGender, KOREAN_RDA } from './rda-database';

// ============================================
// 타입 정의
// ============================================

/** 연령대 구분 */
export type AgeGroup = '19-29' | '30-49' | '50-64' | '65-74' | '75+';

/** 특수 상태 (임신, 수유 등) */
export type SpecialCondition =
  | 'none'
  | 'pregnant-1st'     // 임신 1분기
  | 'pregnant-2nd'     // 임신 2분기
  | 'pregnant-3rd'     // 임신 3분기
  | 'breastfeeding'    // 수유
  | 'menopause'        // 폐경기
  | 'athlete';         // 운동선수

/** 건강 목표 */
export type HealthGoal =
  | 'maintain'         // 현재 유지
  | 'weight-loss'      // 체중 감량
  | 'muscle-gain'      // 근육 증가
  | 'bone-health'      // 뼈 건강
  | 'heart-health'     // 심장 건강
  | 'skin-health';     // 피부 건강

/** 사용자 프로필 */
export interface NutritionProfile {
  /** 성별 */
  gender: RDAGender;
  /** 나이 (세) */
  age: number;
  /** 체중 (kg) */
  weightKg: number;
  /** 신장 (cm) */
  heightCm: number;
  /** 특수 상태 */
  condition?: SpecialCondition;
  /** 건강 목표 */
  goals?: HealthGoal[];
}

/** 개인화된 RDA 결과 */
export interface PersonalizedRDA {
  /** 영양소별 권장량 */
  nutrients: Record<NutrientId, PersonalizedNutrientRDA>;
  /** 적용된 연령대 */
  ageGroup: AgeGroup;
  /** 적용된 조정 사항 */
  appliedAdjustments: string[];
}

/** 개인화된 영양소 RDA */
export interface PersonalizedNutrientRDA extends NutrientRDA {
  /** 조정된 RDA (개인화 후) */
  adjustedRda: number;
  /** 조정 비율 (1.0 = 변경 없음) */
  adjustmentFactor: number;
}

// ============================================
// 연령대별 조정 계수
// ============================================

/**
 * 연령대별 RDA 조정 계수
 *
 * 기준: 19-64세 (KOREAN_RDA 기본값)
 * 출처: 한국인 영양섭취기준 2020
 */
const AGE_ADJUSTMENT_FACTORS: Record<AgeGroup, Partial<Record<NutrientId, number>>> = {
  '19-29': {
    // 기준 연령대 - 대부분 1.0
    vitaminD: 1.0,
    calcium: 1.0,
    iron: 1.0,
  },
  '30-49': {
    // 기준 연령대 - 대부분 1.0
    vitaminD: 1.0,
    calcium: 1.0,
    iron: 1.0,
  },
  '50-64': {
    // 50대: 비타민 D, 칼슘 증가 필요
    vitaminD: 1.5,       // 400 → 600 IU
    vitaminB12: 1.2,     // 흡수율 감소 보상
    calcium: 1.0,
    iron: 0.71,          // 여성: 14 → 10 (폐경 후)
  },
  '65-74': {
    // 노년기: 비타민 D, B12, 칼슘 증가
    // 출처: docs/principles/nutrition-science.md 섹션 9.1
    vitaminD: 2.0,       // 400 → 800 IU
    vitaminB12: 1.5,
    calcium: 1.5,        // 800 → 1,200 mg (대한골대사학회)
    vitaminB6: 1.2,
    folate: 1.0,
    zinc: 1.1,
    // 단백질 증가는 별도 BMR/TDEE 계산에서 처리 (근감소증 예방)
  },
  '75+': {
    // 고령: 전반적 증가
    // 출처: docs/principles/nutrition-science.md 섹션 9.1
    vitaminD: 2.0,
    vitaminB12: 1.5,
    calcium: 1.5,        // 800 → 1,200 mg (대한골대사학회)
    vitaminB6: 1.3,
    zinc: 1.2,
    // 단백질 증가는 별도 BMR/TDEE 계산에서 처리 (근감소증 예방 강화)
  },
};

// ============================================
// 특수 상태별 조정 계수
// ============================================

/**
 * 특수 상태별 RDA 조정 계수
 *
 * 출처: 한국인 영양섭취기준 2020 (임신부/수유부)
 */
const CONDITION_ADJUSTMENT_FACTORS: Record<SpecialCondition, Partial<Record<NutrientId, number>>> = {
  none: {},

  // 임신 1분기: 엽산 강화
  'pregnant-1st': {
    folate: 1.5,         // 400 → 600 μg DFE
    iron: 1.0,           // 아직 증가 불필요
    vitaminA: 1.0,       // 과다 주의
    vitaminD: 1.5,
    calcium: 1.0,
  },

  // 임신 2분기: 철분, 칼슘 증가
  'pregnant-2nd': {
    folate: 1.5,
    iron: 1.71,          // 14 → 24 mg (여성)
    calcium: 1.0,        // 800mg 유지 (흡수율 증가)
    vitaminD: 1.5,
    vitaminB12: 1.1,
    zinc: 1.25,          // 8 → 10 mg
  },

  // 임신 3분기: 철분 최대
  'pregnant-3rd': {
    folate: 1.5,
    iron: 1.71,
    calcium: 1.0,
    vitaminD: 1.5,
    vitaminB12: 1.1,
    zinc: 1.38,          // 8 → 11 mg
    omega3: 1.4,         // 태아 뇌발달
  },

  // 수유: 비타민 A, 오메가-3 증가
  breastfeeding: {
    vitaminA: 1.62,      // 650 → 1050 μg RAE
    vitaminC: 1.35,      // 100 → 135 mg
    vitaminD: 1.5,
    calcium: 1.0,
    iron: 1.0,           // 14mg 유지
    zinc: 1.5,           // 8 → 12 mg
    omega3: 1.4,
    folate: 1.25,        // 400 → 500 μg DFE
  },

  // 폐경기: 칼슘, 비타민 D 강화
  menopause: {
    calcium: 1.25,       // 800 → 1000 mg
    vitaminD: 1.5,
    vitaminK: 1.3,       // 뼈 건강
    magnesium: 1.1,
    iron: 0.71,          // 철분 필요량 감소
  },

  // 운동선수: 단백질, 철분, B군 증가
  athlete: {
    iron: 1.5,           // 운동으로 인한 손실 보상
    vitaminB1: 1.3,      // 에너지 대사
    vitaminB2: 1.3,
    vitaminB6: 1.3,
    vitaminC: 1.2,       // 항산화
    vitaminE: 1.2,
    zinc: 1.2,           // 면역, 회복
    magnesium: 1.2,
  },
};

// ============================================
// 건강 목표별 조정 계수
// ============================================

/**
 * 건강 목표별 RDA 조정 계수
 *
 * 여러 목표 선택 시 가장 높은 계수 적용 (보수적 접근)
 */
const GOAL_ADJUSTMENT_FACTORS: Record<HealthGoal, Partial<Record<NutrientId, number>>> = {
  maintain: {},

  'weight-loss': {
    vitaminB1: 1.1,      // 탄수화물 대사
    vitaminB2: 1.1,
    vitaminB6: 1.1,
  },

  'muscle-gain': {
    vitaminD: 1.2,       // 근육 기능
    zinc: 1.2,           // 단백질 합성
    magnesium: 1.2,      // 근육 기능
  },

  'bone-health': {
    calcium: 1.25,       // 800 → 1000 mg
    vitaminD: 1.5,       // 400 → 600 IU
    vitaminK: 1.3,       // 뼈 대사
    magnesium: 1.1,
  },

  'heart-health': {
    omega3: 1.6,         // 500 → 800 mg EPA+DHA
    vitaminE: 1.2,       // 항산화
    magnesium: 1.1,
    folate: 1.1,         // 호모시스테인 조절
  },

  'skin-health': {
    vitaminA: 1.1,       // 피부 재생
    vitaminC: 1.3,       // 콜라겐 합성
    vitaminE: 1.2,       // 항산화
    zinc: 1.2,           // 피부 치유
    biotin: 1.2,
    omega3: 1.2,         // 피부 장벽
  },
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 나이에서 연령대 추출
 */
export function getAgeGroup(age: number): AgeGroup {
  if (age < 19) {
    // 미성년자는 19-29 기준 사용 (보수적)
    return '19-29';
  } else if (age <= 29) {
    return '19-29';
  } else if (age <= 49) {
    return '30-49';
  } else if (age <= 64) {
    return '50-64';
  } else if (age <= 74) {
    return '65-74';
  } else {
    return '75+';
  }
}

/**
 * 개별 영양소에 대한 최종 조정 계수 계산
 *
 * 여러 조정 요인이 있을 경우 곱셈으로 적용
 */
function calculateAdjustmentFactor(
  nutrientId: NutrientId,
  ageGroup: AgeGroup,
  condition: SpecialCondition,
  goals: HealthGoal[]
): number {
  let factor = 1.0;

  // 1. 연령대 조정
  const ageFactor = AGE_ADJUSTMENT_FACTORS[ageGroup][nutrientId];
  if (ageFactor !== undefined) {
    factor *= ageFactor;
  }

  // 2. 특수 상태 조정
  const conditionFactor = CONDITION_ADJUSTMENT_FACTORS[condition][nutrientId];
  if (conditionFactor !== undefined) {
    factor *= conditionFactor;
  }

  // 3. 건강 목표 조정 (가장 높은 값 적용)
  let maxGoalFactor = 1.0;
  for (const goal of goals) {
    const goalFactor = GOAL_ADJUSTMENT_FACTORS[goal][nutrientId];
    if (goalFactor !== undefined && goalFactor > maxGoalFactor) {
      maxGoalFactor = goalFactor;
    }
  }
  factor *= maxGoalFactor;

  return factor;
}

// ============================================
// 메인 함수
// ============================================

/**
 * 사용자 프로필 기반 개인화된 RDA 계산
 *
 * @param profile - 사용자 영양 프로필
 * @returns 개인화된 RDA
 *
 * @example
 * const profile: NutritionProfile = {
 *   gender: 'female',
 *   age: 32,
 *   weightKg: 55,
 *   heightCm: 162,
 *   condition: 'pregnant-2nd',
 *   goals: ['bone-health'],
 * };
 *
 * const rda = calculatePersonalizedRDA(profile);
 * // rda.nutrients.iron.adjustedRda = 24 (임신 2분기)
 * // rda.nutrients.calcium.adjustedRda = 1000 (뼈 건강 목표)
 */
export function calculatePersonalizedRDA(profile: NutritionProfile): PersonalizedRDA {
  const ageGroup = getAgeGroup(profile.age);
  const condition = profile.condition ?? 'none';
  const goals = profile.goals ?? ['maintain'];

  // 기본 RDA 가져오기
  const baseRDA = KOREAN_RDA[profile.gender];

  // 적용된 조정 사항 추적
  const appliedAdjustments: string[] = [];

  // 연령대 조정 기록
  if (ageGroup !== '19-29' && ageGroup !== '30-49') {
    appliedAdjustments.push(`연령대: ${ageGroup}`);
  }

  // 특수 상태 조정 기록
  if (condition !== 'none') {
    const conditionNames: Record<SpecialCondition, string> = {
      none: '',
      'pregnant-1st': '임신 1분기',
      'pregnant-2nd': '임신 2분기',
      'pregnant-3rd': '임신 3분기',
      breastfeeding: '수유',
      menopause: '폐경기',
      athlete: '운동선수',
    };
    appliedAdjustments.push(`상태: ${conditionNames[condition]}`);
  }

  // 건강 목표 조정 기록
  if (goals.length > 0 && !goals.includes('maintain')) {
    const goalNames: Record<HealthGoal, string> = {
      maintain: '유지',
      'weight-loss': '체중 감량',
      'muscle-gain': '근육 증가',
      'bone-health': '뼈 건강',
      'heart-health': '심장 건강',
      'skin-health': '피부 건강',
    };
    const goalLabels = goals
      .filter(g => g !== 'maintain')
      .map(g => goalNames[g])
      .join(', ');
    if (goalLabels) {
      appliedAdjustments.push(`목표: ${goalLabels}`);
    }
  }

  // 각 영양소에 대해 개인화된 RDA 계산
  const nutrients: Record<NutrientId, PersonalizedNutrientRDA> = {} as Record<
    NutrientId,
    PersonalizedNutrientRDA
  >;

  for (const [key, value] of Object.entries(baseRDA)) {
    const nutrientId = key as NutrientId;
    const factor = calculateAdjustmentFactor(nutrientId, ageGroup, condition, goals);
    const adjustedRda = Math.round(value.rda * factor * 10) / 10;

    nutrients[nutrientId] = {
      ...value,
      adjustedRda,
      adjustmentFactor: factor,
    };
  }

  return {
    nutrients,
    ageGroup,
    appliedAdjustments,
  };
}

/**
 * 특정 영양소의 개인화된 RDA 조회
 *
 * @param profile - 사용자 프로필
 * @param nutrientId - 영양소 ID
 * @returns 개인화된 영양소 RDA
 */
export function getPersonalizedNutrientRDA(
  profile: NutritionProfile,
  nutrientId: NutrientId
): PersonalizedNutrientRDA {
  const fullRDA = calculatePersonalizedRDA(profile);
  return fullRDA.nutrients[nutrientId];
}

/**
 * 섭취량 대비 달성률 계산
 *
 * @param profile - 사용자 프로필
 * @param nutrientId - 영양소 ID
 * @param intake - 섭취량
 * @returns 달성률 (0-100+)
 */
export function calculateIntakePercentage(
  profile: NutritionProfile,
  nutrientId: NutrientId,
  intake: number
): number {
  const personalizedRDA = getPersonalizedNutrientRDA(profile, nutrientId);
  if (personalizedRDA.adjustedRda === 0) return 0;

  return Math.round((intake / personalizedRDA.adjustedRda) * 100);
}

/**
 * 섭취량 상태 평가
 *
 * @param profile - 사용자 프로필
 * @param nutrientId - 영양소 ID
 * @param intake - 섭취량
 * @returns 상태 ('deficient' | 'low' | 'optimal' | 'high' | 'excessive')
 */
export function evaluateIntakeStatus(
  profile: NutritionProfile,
  nutrientId: NutrientId,
  intake: number
): 'deficient' | 'low' | 'optimal' | 'high' | 'excessive' {
  const personalizedRDA = getPersonalizedNutrientRDA(profile, nutrientId);
  const percentage = calculateIntakePercentage(profile, nutrientId, intake);

  // 상한 섭취량 체크
  if (personalizedRDA.ul !== null && intake > personalizedRDA.ul) {
    return 'excessive';
  }

  // 달성률 기반 평가
  if (percentage < 50) {
    return 'deficient';
  } else if (percentage < 80) {
    return 'low';
  } else if (percentage <= 120) {
    return 'optimal';
  } else {
    return 'high';
  }
}

/**
 * 권장 섭취량 범위 계산
 *
 * @param profile - 사용자 프로필
 * @param nutrientId - 영양소 ID
 * @returns { min: 최소, optimal: 권장, max: 최대 }
 */
export function getIntakeRange(
  profile: NutritionProfile,
  nutrientId: NutrientId
): { min: number; optimal: number; max: number } {
  const personalizedRDA = getPersonalizedNutrientRDA(profile, nutrientId);

  return {
    min: Math.round(personalizedRDA.adjustedRda * 0.8),  // 권장량의 80%
    optimal: personalizedRDA.adjustedRda,
    max: personalizedRDA.ul ?? personalizedRDA.adjustedRda * 2,  // UL 또는 권장량의 2배
  };
}
