/**
 * W-2 스트레칭 루틴 생성기
 *
 * @module lib/workout/stretching/routine-generator
 * @description ACSM 가이드라인 기반 개인화 스트레칭 루틴 생성
 * @see docs/specs/SDD-W-2-ADVANCED-STRETCHING.md
 *
 * 원리:
 * - ACSM: 주 2-3회, 15-60초, 2-4세트
 * - 점탄성: 정적 스트레칭 최소 30초 유지
 * - NASM CES: 억제 → 스트레칭 → 활성화 순서
 */

import type {
  StretchExercise,
  StretchingUserProfile,
  StretchingPrescription,
  PrescribedStretch,
  PostureAnalysisResult,
  SportType,
  WeeklyStretchingPlan,
  DailyRoutine,
  Equipment,
  SpecialCondition,
  Difficulty,
} from '@/types/stretching';

import {
  STRETCH_DATABASE,
  mapPostureToStretches,
  getStretchesForSport,
  MUSCLE_NAME_KO,
} from './posture-mapping';

// ============================================
// 상수 정의
// ============================================

/**
 * ACSM 스트레칭 가이드라인
 */
export const ACSM_GUIDELINES = {
  minDuration: 15, // 초
  optimalDuration: 30, // 초
  maxDuration: 60, // 초
  minSets: 2,
  optimalSets: 3,
  maxSets: 4,
  weeklyFrequency: 3, // 주 2-3회
  restBetweenSets: 15, // 초
};

/**
 * 난이도별 조정 계수
 */
const DIFFICULTY_MULTIPLIERS: Record<
  Difficulty,
  {
    duration: number;
    sets: number;
  }
> = {
  beginner: { duration: 0.75, sets: 0.75 },
  intermediate: { duration: 1.0, sets: 1.0 },
  advanced: { duration: 1.25, sets: 1.25 },
};

/**
 * 특수 조건별 제외 운동
 */
const CONDITION_CONTRAINDICATIONS: Record<SpecialCondition, string[]> = {
  pregnancy: [
    'str_chest_floor', // 엎드리기 금지
    'str_pigeon_pose', // 깊은 스트레칭 주의
  ],
  senior: [
    'str_pigeon_pose', // 바닥 운동 어려움
    'pnf_hamstring', // PNF 강도 주의
  ],
  osteoporosis: [
    'str_chest_floor', // 척추 압박 주의
  ],
  disc_herniation: [
    'str_hamstring_supine', // 디스크 압박 가능
    'str_pigeon_pose',
  ],
  spinal_stenosis: [
    'str_hip_flexor_kneeling', // 요추 신전 주의
  ],
  rheumatoid: [],
  hypermobility: [
    'pnf_hamstring', // 과도한 스트레칭 주의
  ],
  recent_surgery: [],
};

/**
 * 의료 면책 조항
 */
export const MEDICAL_DISCLAIMER = `
이 스트레칭 프로그램은 일반적인 건강 정보 제공 목적으로 작성되었어요.
개인의 건강 상태에 따라 적합하지 않을 수 있으며, 의학적 조언을 대체하지 않아요.
운동을 시작하기 전에 의료 전문가와 상담하세요. 통증이 발생하면 즉시 중단하세요.
`.trim();

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 운동 시간 계산 (초)
 */
function calculateExerciseDuration(exercise: StretchExercise): number {
  if (exercise.durationUnit === 'seconds') {
    return (
      exercise.defaultDuration * exercise.sets + exercise.restBetweenSets * (exercise.sets - 1)
    );
  }
  // reps 기반: 대략 3초/rep 추정
  return (
    exercise.defaultDuration * 3 * exercise.sets + exercise.restBetweenSets * (exercise.sets - 1)
  );
}

/**
 * 총 루틴 시간 계산 (분)
 */
function calculateTotalDuration(stretches: PrescribedStretch[]): number {
  const totalSeconds = stretches.reduce((sum, ps) => {
    const exerciseTime =
      ps.exercise.durationUnit === 'seconds'
        ? ps.adjustedDuration * ps.adjustedSets
        : ps.adjustedDuration * 3 * ps.adjustedSets;
    const restTime = ps.exercise.restBetweenSets * (ps.adjustedSets - 1);
    return sum + exerciseTime + restTime;
  }, 0);
  return Math.ceil(totalSeconds / 60);
}

/**
 * 특수 조건에 따른 운동 필터링
 */
function filterByConditions(
  exercises: StretchExercise[],
  conditions: SpecialCondition[]
): StretchExercise[] {
  const excludedIds = new Set<string>();

  for (const condition of conditions) {
    const contraindicated = CONDITION_CONTRAINDICATIONS[condition] || [];
    for (const id of contraindicated) {
      excludedIds.add(id);
    }
  }

  return exercises.filter((ex) => !excludedIds.has(ex.id));
}

/**
 * 장비에 따른 운동 필터링
 */
function filterByEquipment(
  exercises: StretchExercise[],
  availableEquipment: Equipment[]
): StretchExercise[] {
  const equipmentSet = new Set(availableEquipment);
  // bodyweight는 항상 가능
  equipmentSet.add('bodyweight');

  return exercises.filter((ex) => ex.equipment.every((eq) => equipmentSet.has(eq)));
}

/**
 * 난이도에 따른 운동 조정
 */
function adjustForDifficulty(exercise: StretchExercise, userLevel: Difficulty): PrescribedStretch {
  const multiplier = DIFFICULTY_MULTIPLIERS[userLevel];

  let adjustedDuration = Math.round(exercise.defaultDuration * multiplier.duration);
  let adjustedSets = Math.round(exercise.sets * multiplier.sets);

  // ACSM 가이드라인 범위 내로 조정
  if (exercise.durationUnit === 'seconds') {
    adjustedDuration = Math.max(
      ACSM_GUIDELINES.minDuration,
      Math.min(ACSM_GUIDELINES.maxDuration, adjustedDuration)
    );
  }
  adjustedSets = Math.max(ACSM_GUIDELINES.minSets, Math.min(ACSM_GUIDELINES.maxSets, adjustedSets));

  return {
    exercise,
    order: 0,
    adjustedDuration,
    adjustedSets,
  };
}

/**
 * 시간 제한에 맞게 루틴 조정
 */
function fitToTimeLimit(stretches: PrescribedStretch[], maxMinutes: number): PrescribedStretch[] {
  const result: PrescribedStretch[] = [];
  let currentMinutes = 0;

  for (const stretch of stretches) {
    const exerciseDuration = calculateExerciseDuration(stretch.exercise);
    const exerciseMinutes = exerciseDuration / 60;

    if (currentMinutes + exerciseMinutes <= maxMinutes) {
      result.push(stretch);
      currentMinutes += exerciseMinutes;
    } else {
      // 시간이 부족하면 세트 수 줄이기
      const reducedStretch = { ...stretch, adjustedSets: ACSM_GUIDELINES.minSets };
      const reducedDuration = calculateExerciseDuration(reducedStretch.exercise) / 60;

      if (currentMinutes + reducedDuration <= maxMinutes) {
        result.push(reducedStretch);
        currentMinutes += reducedDuration;
      }
    }
  }

  return result;
}

// ============================================
// 처방 생성 함수
// ============================================

/**
 * 자세교정 스트레칭 처방 생성
 */
export function generatePostureCorrectionPrescription(
  postureAnalysis: PostureAnalysisResult,
  profile: StretchingUserProfile,
  availableMinutes: number = 15
): StretchingPrescription {
  // 1. 자세 분석에서 스트레칭 매핑
  const { imbalances, stretches, activations } = mapPostureToStretches(postureAnalysis);

  // 2. 특수 조건/장비로 필터링
  let filteredStretches = filterByConditions(stretches, profile.specialConditions);
  filteredStretches = filterByEquipment(filteredStretches, profile.availableEquipment);

  let filteredActivations = filterByConditions(activations, profile.specialConditions);
  filteredActivations = filterByEquipment(filteredActivations, profile.availableEquipment);

  // 3. 난이도 조정
  let prescribedStretches = filteredStretches.map((ex, idx) => ({
    ...adjustForDifficulty(ex, profile.fitnessLevel),
    order: idx + 1,
  }));

  const prescribedActivations = filteredActivations.map((ex, idx) => ({
    ...adjustForDifficulty(ex, profile.fitnessLevel),
    order: idx + 1,
  }));

  // 4. 시간 제한 적용
  prescribedStretches = fitToTimeLimit(prescribedStretches, availableMinutes * 0.7);
  const limitedActivations = fitToTimeLimit(prescribedActivations, availableMinutes * 0.3);

  // 5. 순서 재배정
  prescribedStretches.forEach((s, idx) => {
    s.order = idx + 1;
  });
  limitedActivations.forEach((a, idx) => {
    a.order = idx + 1;
  });

  // 6. 경고 메시지 생성
  const warnings: string[] = [];
  if (imbalances.some((im) => im.severity === 'severe')) {
    warnings.push('심한 자세 불균형이 감지되었어요. 전문가 상담을 권장해요.');
  }
  if (profile.specialConditions.length > 0) {
    warnings.push('특수 건강 상태를 고려하여 일부 운동이 제외되었어요.');
  }

  // 7. 처방 객체 생성
  const prescription: StretchingPrescription = {
    prescriptionId: `pres_${Date.now()}`,
    createdAt: new Date().toISOString(),
    basedOn: {
      postureAnalysis: postureAnalysis.assessmentId,
      purpose: 'posture_correction',
    },
    stretches: prescribedStretches,
    activations: limitedActivations,
    totalDuration: calculateTotalDuration([...prescribedStretches, ...limitedActivations]),
    frequency: '주 5-6회 (매일 권장)',
    warnings,
    medicalDisclaimer: MEDICAL_DISCLAIMER,
  };

  return prescription;
}

/**
 * 스포츠 워밍업/쿨다운 처방 생성
 */
export function generateSportStretchingPrescription(
  sport: SportType,
  phase: 'warmup' | 'cooldown',
  profile: StretchingUserProfile,
  availableMinutes: number = 10
): StretchingPrescription {
  // 1. 스포츠별 스트레칭 조회
  let exercises = getStretchesForSport(sport, phase);

  // 2. 필터링
  exercises = filterByConditions(exercises, profile.specialConditions);
  exercises = filterByEquipment(exercises, profile.availableEquipment);

  // 3. 난이도 조정 및 시간 제한
  let prescribed = exercises.map((ex, idx) => ({
    ...adjustForDifficulty(ex, profile.fitnessLevel),
    order: idx + 1,
  }));
  prescribed = fitToTimeLimit(prescribed, availableMinutes);

  // 4. 처방 생성
  const sportNameKo: Record<SportType, string> = {
    hiking: '등산',
    running: '러닝',
    golf: '골프',
    cycling: '자전거',
    swimming: '수영',
    tennis: '테니스',
  };

  const prescription: StretchingPrescription = {
    prescriptionId: `pres_${Date.now()}`,
    createdAt: new Date().toISOString(),
    basedOn: {
      sport,
      purpose: phase === 'warmup' ? 'warmup' : 'cooldown',
    },
    stretches: prescribed,
    totalDuration: calculateTotalDuration(prescribed),
    frequency: `${sportNameKo[sport]} 전후 매회`,
    warnings: [],
    medicalDisclaimer: MEDICAL_DISCLAIMER,
  };

  return prescription;
}

/**
 * 일반 유연성 처방 생성
 */
export function generateGeneralFlexibilityPrescription(
  profile: StretchingUserProfile,
  availableMinutes: number = 15
): StretchingPrescription {
  // 1. 일반 유연성 및 회복 카테고리 운동 선택
  let exercises = STRETCH_DATABASE.filter(
    (ex) => ex.category === 'general_flexibility' || ex.category === 'recovery'
  );

  // 2. 필터링
  exercises = filterByConditions(exercises, profile.specialConditions);
  exercises = filterByEquipment(exercises, profile.availableEquipment);

  // 3. 난이도에 맞는 운동 선택
  exercises = exercises.filter((ex) => {
    if (profile.fitnessLevel === 'beginner') {
      return ex.difficulty === 'beginner';
    }
    if (profile.fitnessLevel === 'intermediate') {
      return ex.difficulty !== 'advanced';
    }
    return true;
  });

  // 4. 최대 8개 운동 선택 (전신 균형)
  const selectedExercises = exercises.slice(0, 8);

  // 5. 조정 및 시간 제한
  let prescribed = selectedExercises.map((ex, idx) => ({
    ...adjustForDifficulty(ex, profile.fitnessLevel),
    order: idx + 1,
  }));
  prescribed = fitToTimeLimit(prescribed, availableMinutes);

  const prescription: StretchingPrescription = {
    prescriptionId: `pres_${Date.now()}`,
    createdAt: new Date().toISOString(),
    basedOn: {
      purpose: 'general',
    },
    stretches: prescribed,
    totalDuration: calculateTotalDuration(prescribed),
    frequency: '주 2-3회',
    warnings: [],
    medicalDisclaimer: MEDICAL_DISCLAIMER,
  };

  return prescription;
}

// ============================================
// 주간 플랜 생성
// ============================================

/**
 * 주간 스트레칭 플랜 생성
 */
export function generateWeeklyStretchingPlan(
  profile: StretchingUserProfile,
  postureAnalysis?: PostureAnalysisResult,
  primarySport?: SportType
): WeeklyStretchingPlan {
  const weekStartDate = getNextMonday();

  // 기본 루틴 생성 함수
  const createDailyRoutine = (
    type: 'stretch' | 'strengthen' | 'rest' | 'active_recovery',
    prescription?: StretchingPrescription
  ): DailyRoutine => ({
    type,
    stretches: prescription?.stretches || [],
    duration: prescription?.totalDuration || 0,
    notes: type === 'rest' ? '휴식일 - 가벼운 걷기 권장' : undefined,
  });

  // 자세교정 처방
  const posturePrescription = postureAnalysis
    ? generatePostureCorrectionPrescription(postureAnalysis, profile, 15)
    : undefined;

  // 스포츠 워밍업/쿨다운
  const sport = primarySport || profile.primarySports[0];
  const warmupPrescription = sport
    ? generateSportStretchingPrescription(sport, 'warmup', profile, 10)
    : undefined;
  const cooldownPrescription = sport
    ? generateSportStretchingPrescription(sport, 'cooldown', profile, 10)
    : undefined;

  // 일반 유연성
  const generalPrescription = generateGeneralFlexibilityPrescription(profile, 15);

  // 주간 플랜 구성 (ACSM 권장: 주 2-3회 + 일상 루틴)
  const plan: WeeklyStretchingPlan = {
    planId: `plan_${Date.now()}`,
    userId: profile.userId,
    weekStartDate,
    days: {
      monday: createDailyRoutine('stretch', posturePrescription || generalPrescription),
      tuesday: createDailyRoutine('active_recovery', warmupPrescription),
      wednesday: createDailyRoutine('stretch', posturePrescription || generalPrescription),
      thursday: createDailyRoutine('rest'),
      friday: createDailyRoutine('stretch', posturePrescription || generalPrescription),
      saturday: createDailyRoutine('active_recovery', cooldownPrescription),
      sunday: createDailyRoutine('rest'),
    },
    progressionWeek: 1,
  };

  return plan;
}

/**
 * 다음 월요일 날짜 반환
 */
function getNextMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split('T')[0];
}

// ============================================
// 요약 생성 함수
// ============================================

/**
 * 스트레칭 처방 요약 생성
 */
export function generatePrescriptionSummary(prescription: StretchingPrescription): string {
  const lines: string[] = [];

  lines.push(`📋 스트레칭 처방 요약`);
  lines.push(`---`);
  lines.push(`총 ${prescription.stretches.length}개 운동, 약 ${prescription.totalDuration}분`);
  lines.push(`권장 빈도: ${prescription.frequency}`);
  lines.push(``);

  lines.push(`🧘 스트레칭 목록:`);
  for (const stretch of prescription.stretches) {
    const muscles = stretch.exercise.targetMuscles.map((m) => MUSCLE_NAME_KO[m]).join(', ');
    lines.push(`  ${stretch.order}. ${stretch.exercise.nameKo}`);
    lines.push(
      `     - ${stretch.adjustedSets}세트 x ${stretch.adjustedDuration}${stretch.exercise.durationUnit === 'seconds' ? '초' : '회'}`
    );
    lines.push(`     - 타겟: ${muscles}`);
  }

  if (prescription.activations && prescription.activations.length > 0) {
    lines.push(``);
    lines.push(`💪 활성화 운동:`);
    for (const activation of prescription.activations) {
      lines.push(`  ${activation.order}. ${activation.exercise.nameKo}`);
    }
  }

  if (prescription.warnings.length > 0) {
    lines.push(``);
    lines.push(`⚠️ 주의사항:`);
    for (const warning of prescription.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join('\n');
}

/**
 * 주간 플랜 요약 생성
 */
export function generateWeeklyPlanSummary(plan: WeeklyStretchingPlan): string {
  const dayNames: Record<keyof WeeklyStretchingPlan['days'], string> = {
    monday: '월요일',
    tuesday: '화요일',
    wednesday: '수요일',
    thursday: '목요일',
    friday: '금요일',
    saturday: '토요일',
    sunday: '일요일',
  };

  const typeEmoji: Record<DailyRoutine['type'], string> = {
    stretch: '🧘',
    strengthen: '💪',
    rest: '😴',
    active_recovery: '🚶',
  };

  const lines: string[] = [];
  lines.push(`📅 주간 스트레칭 플랜 (${plan.progressionWeek}주차)`);
  lines.push(`시작일: ${plan.weekStartDate}`);
  lines.push(`---`);

  for (const [day, routine] of Object.entries(plan.days) as [
    keyof WeeklyStretchingPlan['days'],
    DailyRoutine,
  ][]) {
    const emoji = typeEmoji[routine.type];
    const dayName = dayNames[day];

    if (routine.type === 'rest') {
      lines.push(`${emoji} ${dayName}: 휴식`);
    } else {
      lines.push(`${emoji} ${dayName}: ${routine.stretches.length}개 운동 (${routine.duration}분)`);
    }
  }

  return lines.join('\n');
}
