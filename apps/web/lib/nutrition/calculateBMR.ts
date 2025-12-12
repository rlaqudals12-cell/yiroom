/**
 * N-1 Task 1.11: BMR/TDEE 계산 함수
 *
 * Harris-Benedict 공식:
 * - 남성: BMR = 88.362 + (13.397 × 체중kg) + (4.799 × 키cm) - (5.677 × 나이)
 * - 여성: BMR = 447.593 + (9.247 × 체중kg) + (3.098 × 키cm) - (4.330 × 나이)
 *
 * 활동 계수:
 * - sedentary (비활동적): 1.2
 * - light (가벼운): 1.375
 * - moderate (보통): 1.55
 * - active (활동적): 1.725
 * - very_active (매우 활동적): 1.9
 */

import type { Gender, ActivityLevel, NutritionGoal, BMRResult } from '@/types/nutrition';

// 활동 계수 매핑
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// 목표별 칼로리 조정 (TDEE 대비)
const GOAL_CALORIE_ADJUSTMENT: Record<NutritionGoal, number> = {
  weight_loss: -500,  // 500kcal 적자 (주당 ~0.5kg 감량)
  maintain: 0,
  muscle: 300,        // 300kcal 잉여 (근육 성장용)
  skin: 0,            // 유지 + 영양소 중심
  health: 0,          // 유지
};

/**
 * 생년월일로 나이 계산
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * 기초대사량(BMR) 계산 - Harris-Benedict 공식
 *
 * @param gender - 성별 ('male' | 'female')
 * @param weight - 체중 (kg)
 * @param height - 키 (cm)
 * @param age - 나이 (years)
 * @returns BMR (kcal/day)
 */
export function calculateBMR(
  gender: Gender,
  weight: number,
  height: number,
  age: number
): number {
  // 유효성 검사
  if (weight <= 0 || height <= 0 || age <= 0) {
    return 0;
  }

  let bmr: number;

  if (gender === 'male') {
    // 남성: 88.362 + (13.397 × 체중) + (4.799 × 키) - (5.677 × 나이)
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    // 여성: 447.593 + (9.247 × 체중) + (3.098 × 키) - (4.330 × 나이)
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  // 반올림하여 정수 반환
  return Math.round(bmr);
}

/**
 * 총 에너지 소비량(TDEE) 계산
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
 * 목표별 일일 칼로리 계산
 *
 * @param tdee - TDEE (kcal/day)
 * @param goal - 영양 목표
 * @returns 일일 칼로리 목표 (kcal/day)
 */
export function calculateDailyCalorieTarget(
  tdee: number,
  goal: NutritionGoal
): number {
  if (tdee <= 0) {
    return 0;
  }

  const adjustment = GOAL_CALORIE_ADJUSTMENT[goal];
  const target = tdee + adjustment;

  // 최소 1200kcal 보장 (안전 기준)
  return Math.max(1200, Math.round(target));
}

/**
 * 영양소 목표 계산 (단백질, 탄수화물, 지방)
 *
 * 기본 비율:
 * - 단백질: 체중 kg당 1.6g (근육 증가 시 2.0g)
 * - 탄수화물: 총 칼로리의 45-50%
 * - 지방: 총 칼로리의 25-30%
 */
export function calculateMacroTargets(
  dailyCalories: number,
  weight: number,
  goal: NutritionGoal
): { protein: number; carbs: number; fat: number } {
  if (dailyCalories <= 0 || weight <= 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  // 단백질: 체중당 g
  const proteinPerKg = goal === 'muscle' ? 2.0 : 1.6;
  const protein = Math.round(weight * proteinPerKg);

  // 단백질 칼로리 (1g = 4kcal)
  const proteinCalories = protein * 4;

  // 지방: 총 칼로리의 25%
  const fatCalories = dailyCalories * 0.25;
  const fat = Math.round(fatCalories / 9); // 1g = 9kcal

  // 탄수화물: 나머지 칼로리
  const carbsCalories = dailyCalories - proteinCalories - fatCalories;
  const carbs = Math.round(carbsCalories / 4); // 1g = 4kcal

  return { protein, carbs, fat };
}

/**
 * 전체 BMR/TDEE 계산 (통합 함수)
 *
 * @param gender - 성별
 * @param weight - 체중 (kg)
 * @param height - 키 (cm)
 * @param birthDate - 생년월일 (YYYY-MM-DD)
 * @param activityLevel - 활동 수준
 * @param goal - 영양 목표
 * @returns BMR, TDEE, 일일 칼로리, 영양소 목표
 */
export function calculateAll(
  gender: Gender,
  weight: number,
  height: number,
  birthDate: string,
  activityLevel: ActivityLevel,
  goal: NutritionGoal
): BMRResult {
  const age = calculateAge(birthDate);
  const bmr = calculateBMR(gender, weight, height, age);
  const tdee = calculateTDEE(bmr, activityLevel);
  const dailyCalorieTarget = calculateDailyCalorieTarget(tdee, goal);
  const macros = calculateMacroTargets(dailyCalorieTarget, weight, goal);

  return {
    bmr,
    tdee,
    dailyCalorieTarget,
    proteinTarget: macros.protein,
    carbsTarget: macros.carbs,
    fatTarget: macros.fat,
  };
}

// 활동 수준 레이블
export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, { label: string; description: string }> = {
  sedentary: {
    label: '비활동적',
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
};
