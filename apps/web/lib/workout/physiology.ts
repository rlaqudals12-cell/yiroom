/**
 * W-1 운동생리학 함수 (P2 원리 기반)
 *
 * 원리 문서: docs/principles/exercise-physiology.md
 * ADR: docs/adr/ADR-031-workout-module.md
 *
 * 주요 기능:
 * - 회복 시간 계산 (근육군별, 나이별)
 * - 점진적 과부하 제안
 * - RPE 추정 (심박수 기반)
 * - 운동 볼륨 계산
 * - 5-Type 파라미터 조회
 */

// ============================================
// 타입 정의
// ============================================

/** 근육군 타입 */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'lower_back'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'hip_flexors';

/** 운동 이력 (점진적 과부하용) */
export interface WorkoutHistory {
  exerciseId: string;
  records: Array<{
    date: string;
    sets: number;
    reps: number;
    weight: number;
    rpe?: number;
  }>;
}

/** 점진적 과부하 제안 결과 */
export interface OverloadSuggestion {
  suggestedWeight: number;
  suggestedReps: number;
  suggestedSets: number;
  reason: string;
  weeklyProgressRate: number;
  safetyNotes: string[];
}

/** 회복 시간 결과 */
export interface RecoveryTimeResult {
  minHours: number;
  maxHours: number;
  recommendedHours: number;
  factors: string[];
}

/** RPE 추정 결과 */
export interface RPEEstimate {
  rpe: number;
  zone: number;
  description: string;
  intensity: 'very_light' | 'light' | 'moderate' | 'vigorous' | 'near_maximal';
}

/** 피트니스 레벨 */
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

/** 운동 강도 */
export type IntensityLevel = 'low' | 'moderate' | 'high' | 'very_high';

/** 5-Type 운동 분류 파라미터 */
export interface WorkoutTypeParams {
  type: 'toner' | 'builder' | 'burner' | 'mover' | 'flexer';
  name: string;
  description: string;
  repRange: [number, number];
  sets: [number, number];
  restSeconds: number;
  rpeRange: [number, number];
  metRange: [number, number];
}

// ============================================
// 상수 정의
// ============================================

/**
 * 근육군별 기본 회복 시간 (시간)
 * 원리: 큰 근육군일수록 회복 시간이 길다
 */
const MUSCLE_RECOVERY_HOURS: Record<MuscleGroup, { min: number; max: number }> = {
  chest: { min: 48, max: 72 },
  back: { min: 48, max: 72 },
  quads: { min: 48, max: 72 },
  hamstrings: { min: 48, max: 72 },
  glutes: { min: 48, max: 72 },
  shoulders: { min: 36, max: 48 },
  lower_back: { min: 36, max: 48 },
  biceps: { min: 24, max: 48 },
  triceps: { min: 24, max: 48 },
  forearms: { min: 24, max: 36 },
  abs: { min: 24, max: 48 },
  obliques: { min: 24, max: 48 },
  calves: { min: 24, max: 48 },
  hip_flexors: { min: 24, max: 48 },
};

/**
 * 나이별 회복 계수
 * 원리 문서: exercise-physiology.md 2.5.3
 */
const AGE_RECOVERY_COEFFICIENTS: Record<string, number> = {
  '20-29': 1.0,
  '30-39': 1.05,
  '40-49': 1.10,
  '50-59': 1.15,
  '60+': 1.20,
};

/**
 * 피트니스 레벨별 회복 계수
 */
const FITNESS_RECOVERY_COEFFICIENTS: Record<FitnessLevel, number> = {
  beginner: 1.3,
  intermediate: 1.0,
  advanced: 0.85,
};

/**
 * 운동 강도별 회복 계수
 */
const INTENSITY_RECOVERY_COEFFICIENTS: Record<IntensityLevel, number> = {
  low: 0.8,
  moderate: 1.0,
  high: 1.2,
  very_high: 1.4,
};

/**
 * 5-Type 운동 분류 파라미터 (ADR-031)
 */
export const WORKOUT_TYPE_PARAMS: Record<string, WorkoutTypeParams> = {
  toner: {
    type: 'toner',
    name: '토너',
    description: '근력 유지 및 토닝',
    repRange: [12, 20],
    sets: [2, 3],
    restSeconds: 45,
    rpeRange: [6, 7],
    metRange: [3.0, 5.0],
  },
  builder: {
    type: 'builder',
    name: '빌더',
    description: '근비대 및 벌크업',
    repRange: [6, 12],
    sets: [4, 5],
    restSeconds: 90,
    rpeRange: [7, 9],
    metRange: [5.0, 6.0],
  },
  burner: {
    type: 'burner',
    name: '버너',
    description: '유산소 및 지방 연소',
    repRange: [15, 30],
    sets: [3, 4],
    restSeconds: 30,
    rpeRange: [7, 8],
    metRange: [6.0, 10.0],
  },
  mover: {
    type: 'mover',
    name: '무버',
    description: '기능성 움직임',
    repRange: [8, 15],
    sets: [3, 4],
    restSeconds: 60,
    rpeRange: [6, 8],
    metRange: [4.0, 7.0],
  },
  flexer: {
    type: 'flexer',
    name: '플렉서',
    description: '유연성 및 회복',
    repRange: [1, 3],
    sets: [2, 3],
    restSeconds: 30,
    rpeRange: [3, 5],
    metRange: [2.0, 3.0],
  },
};

/**
 * RPE-심박수 존 매핑
 */
const RPE_ZONE_MAP: Array<{
  zone: number;
  rpeRange: [number, number];
  hrPercentRange: [number, number];
  description: string;
  intensity: RPEEstimate['intensity'];
}> = [
  { zone: 1, rpeRange: [1, 2], hrPercentRange: [50, 60], description: '매우 가벼움 - 대화 가능', intensity: 'very_light' },
  { zone: 2, rpeRange: [3, 4], hrPercentRange: [60, 70], description: '가벼움 - 약간 숨참', intensity: 'light' },
  { zone: 3, rpeRange: [5, 6], hrPercentRange: [70, 80], description: '중간 - 대화 어려움', intensity: 'moderate' },
  { zone: 4, rpeRange: [7, 8], hrPercentRange: [80, 90], description: '힘듦 - 단어만 가능', intensity: 'vigorous' },
  { zone: 5, rpeRange: [9, 10], hrPercentRange: [90, 100], description: '매우 힘듦 - 대화 불가', intensity: 'near_maximal' },
];

// ============================================
// 유틸리티 함수
// ============================================

function getAgeGroup(age: number): string {
  if (age < 30) return '20-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  return '60+';
}

function getIntensityFromMET(met: number): IntensityLevel {
  if (met < 3.0) return 'low';
  if (met < 6.0) return 'moderate';
  if (met < 9.0) return 'high';
  return 'very_high';
}

/**
 * 지정된 단위로 반올림
 */
export function roundToNearest(value: number, unit: number): number {
  return Math.round(value / unit) * unit;
}

// ============================================
// �ٽ� �Լ�
// ============================================

/**
 * �ִ� �ɹڼ� ��� (Tanaka ����)
 * ����: HRmax = 208 - (0.7 x age)
 * ���� ����: exercise-physiology.md 2.3.1
 */
export function calculateMaxHR(age: number): number {
  return Math.round(208 - 0.7 * age);
}

/**
 * ��ǥ �ɹڼ� �� ��� (Karvonen ����)
 * ����: THR = ((HRmax - HRrest) x Intensity) + HRrest
 * ���� ����: exercise-physiology.md 2.3.2
 */
export function calculateTargetHRZone(
  age: number,
  restingHR: number,
  intensityPercent: number
): number {
  const maxHR = calculateMaxHR(age);
  const hrReserve = maxHR - restingHR;
  return Math.round(hrReserve * (intensityPercent / 100) + restingHR);
}

/**
 * � ���� ���
 * ����: Volume = sets x reps x weight
 * ���� ����: exercise-physiology.md 3.1.1
 */
export function calculateWorkVolume(
  sets: number,
  reps: number,
  weight: number
): number {
  return sets * reps * weight;
}

/**
 * �ְ� ���� ���
 */
export function calculateWeeklyVolume(
  weeklyRecords: Array<{ sets: number; reps: number; weight: number }>
): number {
  return weeklyRecords.reduce(
    (total, record) => total + calculateWorkVolume(record.sets, record.reps, record.weight),
    0
  );
}

/**
 * ���� ��ȭ�� ��� (percent)
 */
export function calculateVolumeChangeRate(
  currentVolume: number,
  previousVolume: number
): number {
  if (previousVolume === 0) return 0;
  return Math.round(((currentVolume - previousVolume) / previousVolume) * 100 * 10) / 10;
}

/**
 * RPE ���� (�ɹڼ� ���)
 * ���� ����: exercise-physiology.md 2.4
 */
export function estimateRPE(heartRate: number, maxHR: number): RPEEstimate {
  const hrPercent = (heartRate / maxHR) * 100;
  
  for (const zoneInfo of RPE_ZONE_MAP) {
    const [minHR, maxHRPercent] = zoneInfo.hrPercentRange;
    if (hrPercent >= minHR && hrPercent < maxHRPercent) {
      const [minRPE, maxRPE] = zoneInfo.rpeRange;
      const rpeInZone = minRPE + ((hrPercent - minHR) / (maxHRPercent - minHR)) * (maxRPE - minRPE);
      return {
        rpe: Math.round(rpeInZone * 10) / 10,
        zone: zoneInfo.zone,
        description: zoneInfo.description,
        intensity: zoneInfo.intensity,
      };
    }
  }
  
  return {
    rpe: 10,
    zone: 5,
    description: '�ִ� ����',
    intensity: 'near_maximal',
  };
}

/**
 * ȸ�� �ð� ���
 * ���� ����: exercise-physiology.md 2.5
 */
export function calculateRecoveryTime(
  muscleGroup: MuscleGroup,
  options: {
    age?: number;
    fitnessLevel?: FitnessLevel;
    intensity?: IntensityLevel;
    met?: number;
  } = {}
): RecoveryTimeResult {
  const { age = 30, fitnessLevel = 'intermediate', met } = options;
  const intensity = options.intensity ?? (met ? getIntensityFromMET(met) : 'moderate');
  
  const baseRecovery = MUSCLE_RECOVERY_HOURS[muscleGroup];
  const ageCoef = AGE_RECOVERY_COEFFICIENTS[getAgeGroup(age)];
  const fitnessCoef = FITNESS_RECOVERY_COEFFICIENTS[fitnessLevel];
  const intensityCoef = INTENSITY_RECOVERY_COEFFICIENTS[intensity];
  
  const minHours = Math.round(baseRecovery.min * ageCoef * fitnessCoef * intensityCoef);
  const maxHours = Math.round(baseRecovery.max * ageCoef * fitnessCoef * intensityCoef);
  const recommendedHours = Math.round((minHours + maxHours) / 2);
  
  const factors: string[] = [];
  if (ageCoef > 1.0) {
    factors.push('���� (' + age + '��): ȸ�� +' + Math.round((ageCoef - 1) * 100) + '%');
  }
  if (fitnessCoef !== 1.0) {
    const sign = fitnessCoef > 1 ? '+' : '';
    factors.push('��Ʈ�Ͻ� ���� (' + fitnessLevel + '): ȸ�� ' + sign + Math.round((fitnessCoef - 1) * 100) + '%');
  }
  if (intensityCoef !== 1.0) {
    const sign = intensityCoef > 1 ? '+' : '';
    factors.push('� ���� (' + intensity + '): ȸ�� ' + sign + Math.round((intensityCoef - 1) * 100) + '%');
  }
  
  return {
    minHours,
    maxHours,
    recommendedHours,
    factors,
  };
}

/**
 * ������ ������ ����
 * ���� ����: exercise-physiology.md 3.2
 */
export function suggestProgressiveOverload(
  history: WorkoutHistory,
  options: {
    workoutType?: keyof typeof WORKOUT_TYPE_PARAMS;
    isLowerBody?: boolean;
  } = {}
): OverloadSuggestion {
  const { workoutType = 'builder', isLowerBody = false } = options;
  const typeParams = WORKOUT_TYPE_PARAMS[workoutType];
  
  const records = history.records;
  
  if (records.length < 2) {
    const lastRecord = records[0] ?? { sets: typeParams.sets[0], reps: typeParams.repRange[0], weight: 0 };
    return {
      suggestedWeight: lastRecord.weight,
      suggestedReps: lastRecord.reps,
      suggestedSets: lastRecord.sets,
      reason: '�̷��� �����Ͽ� ���� ���� ������ �����մϴ�.',
      weeklyProgressRate: 0,
      safetyNotes: ['2�� �̻� ��� �� ������ ������ Ȱ��ȭ�˴ϴ�.'],
    };
  }
  
  const recent = records.slice(0, Math.min(7, records.length));
  const avgWeight = recent.reduce((sum, r) => sum + r.weight, 0) / recent.length;
  const avgReps = recent.reduce((sum, r) => sum + r.reps, 0) / recent.length;
  const avgSets = recent.reduce((sum, r) => sum + r.sets, 0) / recent.length;
  const rpeRecords = recent.filter(r => r.rpe !== undefined);
  const avgRPE = rpeRecords.length > 0
    ? rpeRecords.reduce((sum, r) => sum + (r.rpe ?? 0), 0) / rpeRecords.length
    : 7;
  
  const currentVolume = calculateWorkVolume(avgSets, avgReps, avgWeight);
  
  const older = records.slice(Math.min(7, records.length));
  const prevAvgWeight = older.length > 0 
    ? older.reduce((sum, r) => sum + r.weight, 0) / older.length 
    : avgWeight;
  const prevVolume = older.length > 0
    ? calculateWorkVolume(
        older.reduce((sum, r) => sum + r.sets, 0) / older.length,
        older.reduce((sum, r) => sum + r.reps, 0) / older.length,
        prevAvgWeight
      )
    : currentVolume;
  
  const progressRate = calculateVolumeChangeRate(currentVolume, prevVolume);
  
  const safetyNotes: string[] = [];
  let suggestedWeight = avgWeight;
  let suggestedReps = Math.round(avgReps);
  let suggestedSets = Math.round(avgSets);
  let reason = '';
  
  const weightIncrement = isLowerBody ? 5 : 2.5;
  const [minReps, maxReps] = typeParams.repRange;
  const [, maxSets] = typeParams.sets;
  const [minRPE, maxRPE] = typeParams.rpeRange;
  
  if (avgRPE < minRPE) {
    if (avgReps >= maxReps) {
      suggestedWeight = roundToNearest(avgWeight + weightIncrement, weightIncrement);
      suggestedReps = minReps;
      reason = 'RPE(' + avgRPE.toFixed(1) + ')�� ��ǥ(' + minRPE + '-' + maxRPE + ') �̸��Դϴ�. ���Ը� ' + weightIncrement + 'kg �ø��� �ݺ����� ����ϴ�.';
    } else {
      suggestedReps = Math.min(Math.round(avgReps) + 2, maxReps);
      reason = 'RPE(' + avgRPE.toFixed(1) + ')�� ��ǥ �̸��Դϴ�. �ݺ����� ' + suggestedReps + 'ȸ�� �ø��ϴ�.';
    }
  } else if (avgRPE > maxRPE) {
    safetyNotes.push('���� RPE�� �����ϴ�. �������� ������.');
    reason = 'RPE(' + avgRPE.toFixed(1) + ')�� ��ǥ(' + minRPE + '-' + maxRPE + ') �ʰ��Դϴ�. ���� ������ �����ϰų� ȸ���� �����ϼ���.';
  } else {
    if (progressRate < 10) {
      if (avgReps < maxReps - 1) {
        suggestedReps = Math.round(avgReps) + 1;
        reason = '�������� �����Դϴ�. �ݺ����� 1ȸ �÷�������.';
      } else if (avgSets < maxSets) {
        suggestedSets = Math.round(avgSets) + 1;
        reason = '�ݺ����� ����մϴ�. ��Ʈ ���� 1��Ʈ �÷�������.';
      } else {
        suggestedWeight = roundToNearest(avgWeight + weightIncrement, weightIncrement);
        suggestedReps = minReps;
        reason = '��Ʈ�� �ݺ����� ����մϴ�. ���Ը� ' + weightIncrement + 'kg �ø��� �ݺ����� ���߼���.';
      }
    } else {
      reason = '�ְ� ���� ������(' + progressRate + '%)�� ����մϴ�. ���� ������ �����ϼ���.';
    }
  }
  
  if (progressRate > 10) {
    safetyNotes.push('�ְ� ���� ������(' + progressRate + '%)�� ����ġ(10%)�� �ʰ��մϴ�. �λ� ���迡 �����ϼ���.');
  }
  
  return {
    suggestedWeight,
    suggestedReps,
    suggestedSets,
    reason,
    weeklyProgressRate: progressRate,
    safetyNotes,
  };
}

/**
 * 5-Type � �Ķ���� ��ȸ
 */
export function getWorkoutTypeParams(
  workoutType: keyof typeof WORKOUT_TYPE_PARAMS
): WorkoutTypeParams {
  return WORKOUT_TYPE_PARAMS[workoutType];
}

/**
 * MET ������ ���� ���� ��ȸ
 */
export function getIntensityLevel(met: number): IntensityLevel {
  return getIntensityFromMET(met);
}
