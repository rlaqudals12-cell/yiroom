/**
 * BMR/TDEE 계산기 (Mifflin-St Jeor 공식)
 *
 * P2 원칙: 요구사항에 명시된 Mifflin-St Jeor 공식 구현
 *
 * Mifflin-St Jeor 공식 (1990):
 * - 남성: BMR = 10 × 체중(kg) + 6.25 × 키(cm) - 5 × 나이 + 5
 * - 여성: BMR = 10 × 체중(kg) + 6.25 × 키(cm) - 5 × 나이 - 161
 *
 * 활동 계수:
 * - 좌식: 1.2
 * - 가벼운 활동: 1.375
 * - 보통 활동: 1.55
 * - 활동적: 1.725
 * - 매우 활동적: 1.9
 *
 * 참고: docs/principles/nutrition-science.md (ADR-030 연동)
 */

// ============================================
// 타입 정의
// ============================================

/** 성별 */
export type Gender = 'male' | 'female';

/** 활동 수준 */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/** 사용자 프로필 (BMR 계산용) */
export interface UserProfile {
  /** 성별 */
  gender: Gender;
  /** 체중 (kg) */
  weightKg: number;
  /** 키 (cm) */
  heightCm: number;
  /** 나이 (years) */
  age: number;
}

/** BMR/TDEE 계산 결과 */
export interface EnergyExpenditureResult {
  /** 기초대사량 (kcal/day) */
  bmr: number;
  /** 총 에너지 소비량 (kcal/day) */
  tdee: number;
  /** 사용된 공식 */
  formula: 'mifflin-st-jeor';
  /** 활동 수준 */
  activityLevel: ActivityLevel;
  /** 활동 계수 */
  activityMultiplier: number;
}

// ============================================
// 상수 정의
// ============================================

/**
 * 활동 계수 (Activity Multipliers)
 *
 * 요구사항에서 명시된 값:
 * - 좌식: 1.2
 * - 가벼운 활동: 1.375
 * - 보통 활동: 1.55
 * - 활동적: 1.725
 * - 매우 활동적: 1.9
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const;

/**
 * 활동 수준 한글 레이블
 */
export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, { label: string; description: string }> =
  {
    sedentary: {
      label: '좌식 생활',
      description: '주로 앉아서 생활, 운동 거의 안 함',
    },
    light: {
      label: '가벼운 활동',
      description: '가벼운 운동/산책 주 1-3회',
    },
    moderate: {
      label: '보통 활동',
      description: '적당한 운동 주 3-5회',
    },
    active: {
      label: '활동적',
      description: '강도 높은 운동 주 6-7회',
    },
    very_active: {
      label: '매우 활동적',
      description: '매우 힘든 운동 또는 육체 노동',
    },
  } as const;

// ============================================
// 체형별 BMR 보정 계수
// ============================================

/**
 * 체형별 BMR 보정 계수
 *
 * 체형에 따라 근육량 분포가 달라지며, 이는 기초대사량에 영향을 미침
 * - 상체 근육이 발달한 체형(V, Y)은 근육량이 많아 BMR이 높음
 * - 체지방 비율이 높은 체형(O)은 BMR이 낮음
 * - 균형 잡힌 체형(X)은 소폭 상승
 *
 * 8-Type 체형 분류 기반 (lib/body 참조, 의존성 없이 문자열로 처리)
 */
export const BODY_TYPE_BMR_CORRECTION: Record<string, number> = {
  V: 1.03, // 역삼각형 - 상체 근육 발달로 BMR 증가
  Y: 1.02, // 넓은어깨 - 어깨 근육 발달
  X: 1.01, // 모래시계 - 균형 잡힌 근육 분포
  H: 1.0, // 직사각형 - 기준선
  A: 1.0, // 삼각형 - 하체 중심, 평균 수준
  '8': 1.0, // 곡선형 - 평균 수준
  I: 0.99, // 직선형 - 근육량 적음
  O: 0.98, // 원형 - 체지방 비율 높음
} as const;

// ============================================
// BMR 계산 함수 (Mifflin-St Jeor)
// ============================================

/**
 * 기초대사량(BMR) 계산 - Mifflin-St Jeor 공식
 *
 * 공식:
 * - 남성: BMR = 10 × 체중(kg) + 6.25 × 키(cm) - 5 × 나이 + 5
 * - 여성: BMR = 10 × 체중(kg) + 6.25 × 키(cm) - 5 × 나이 - 161
 *
 * @param profile - 사용자 프로필
 * @returns BMR (kcal/day), 유효하지 않은 입력 시 0
 */
export function calculateBMR(profile: UserProfile): number {
  const { gender, weightKg, heightCm, age } = profile;

  // 유효성 검사
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    return 0;
  }

  // Mifflin-St Jeor 공식
  // 공통 부분: 10 × 체중(kg) + 6.25 × 키(cm) - 5 × 나이
  const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;

  // 성별 보정: 남성 +5, 여성 -161
  const genderOffset = gender === 'male' ? 5 : -161;

  const bmr = baseBMR + genderOffset;

  // 음수 방지 및 반올림
  return Math.max(0, Math.round(bmr));
}

/** 8-Type 체형 리터럴 (타입 힌트용, lib/body 의존 없이 문자열 호환) */
export type BMRBodyType = 'X' | 'A' | 'V' | 'H' | 'O' | 'I' | 'Y' | '8';

/**
 * 체형 보정 BMR 계산 - Mifflin-St Jeor + 체형별 근육량 보정
 *
 * 체형에 따른 근육량 분포 차이를 반영하여 BMR을 보정함
 * 체형이 없으면 표준 BMR을 그대로 반환
 *
 * @param profile - 사용자 프로필
 * @param bodyType - 체형 (X/A/V/H/O/I/Y/8), 선택
 * @returns 보정된 BMR (kcal/day), 유효하지 않은 입력 시 0
 */
export function calculateBMRWithBodyType(
  profile: UserProfile,
  bodyType?: BMRBodyType | string
): number {
  const baseBmr = calculateBMR(profile);

  // 체형이 없거나 알 수 없는 체형이면 표준 BMR 반환
  if (!bodyType || !(bodyType in BODY_TYPE_BMR_CORRECTION)) {
    return baseBmr;
  }

  const correctionFactor = BODY_TYPE_BMR_CORRECTION[bodyType];
  return Math.round(baseBmr * correctionFactor);
}

/**
 * 총 에너지 소비량(TDEE) 계산
 *
 * TDEE = BMR × 활동 계수
 *
 * @param bmr - 기초대사량 (kcal/day)
 * @param activityLevel - 활동 수준
 * @returns TDEE (kcal/day)
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  if (bmr <= 0) {
    return 0;
  }

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * multiplier);
}

/**
 * BMR과 TDEE를 함께 계산 (통합 함수)
 *
 * @param profile - 사용자 프로필
 * @param activityLevel - 활동 수준
 * @returns BMR/TDEE 계산 결과
 */
export function calculateEnergyExpenditure(
  profile: UserProfile,
  activityLevel: ActivityLevel
): EnergyExpenditureResult {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, activityLevel);

  return {
    bmr,
    tdee,
    formula: 'mifflin-st-jeor',
    activityLevel,
    activityMultiplier: ACTIVITY_MULTIPLIERS[activityLevel],
  };
}

// ============================================
// 검증 유틸리티
// ============================================

/**
 * Mifflin-St Jeor 공식 검증용 테스트 케이스
 *
 * 예시: 30세 남성, 70kg, 175cm
 * BMR = 10 × 70 + 6.25 × 175 - 5 × 30 + 5
 *     = 700 + 1093.75 - 150 + 5
 *     = 1648.75 ≈ 1649 kcal/day
 */
export function verifyMifflinStJeorFormula(): boolean {
  const testProfile: UserProfile = {
    gender: 'male',
    weightKg: 70,
    heightCm: 175,
    age: 30,
  };

  const bmr = calculateBMR(testProfile);
  // 예상값: 1649 (반올림)
  const expected = 1649;

  return bmr === expected;
}

/**
 * 프로필 유효성 검사
 *
 * @param profile - 사용자 프로필
 * @returns 유효성 검사 결과
 */
export function validateProfile(profile: UserProfile): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (profile.weightKg <= 0 || profile.weightKg > 500) {
    errors.push('체중은 0보다 크고 500kg 이하여야 해요.');
  }

  if (profile.heightCm <= 0 || profile.heightCm > 300) {
    errors.push('키는 0보다 크고 300cm 이하여야 해요.');
  }

  if (profile.age <= 0 || profile.age > 150) {
    errors.push('나이는 0보다 크고 150세 이하여야 해요.');
  }

  if (!['male', 'female'].includes(profile.gender)) {
    errors.push("성별은 'male' 또는 'female'이어야 해요.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
