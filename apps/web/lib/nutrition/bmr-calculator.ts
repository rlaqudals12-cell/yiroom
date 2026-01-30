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
    errors.push('체중은 0보다 크고 500kg 이하여야 합니다.');
  }

  if (profile.heightCm <= 0 || profile.heightCm > 300) {
    errors.push('키는 0보다 크고 300cm 이하여야 합니다.');
  }

  if (profile.age <= 0 || profile.age > 150) {
    errors.push('나이는 0보다 크고 150세 이하여야 합니다.');
  }

  if (!['male', 'female'].includes(profile.gender)) {
    errors.push("성별은 'male' 또는 'female'이어야 합니다.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
