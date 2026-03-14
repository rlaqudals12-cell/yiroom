// ============================================================
// 바이오리듬 점수 계산기
// ADR-089: 웰니스 보정 계수로 통합
// 원리: docs/principles/biorhythm-science.md
// ============================================================

import type {
  BiorhythmInput,
  BiorhythmResult,
  BiorhythmScoreBreakdown,
  BiorhythmInsight,
  CyclePhase,
  CyclePhaseInfo,
} from '@/types/wellness';

// 수면 시간 점수 (0-12, 7-9h 최적)
function calculateSleepDurationScore(hours: number): number {
  if (hours >= 7 && hours <= 9) return 12;
  if (hours >= 6 && hours < 7) return 9;
  if (hours > 9 && hours <= 10) return 9;
  if (hours >= 5 && hours < 6) return 6;
  if (hours > 10 && hours <= 11) return 6;
  if (hours >= 4 && hours < 5) return 3;
  return 0;
}

// 수면 질 점수 (0-10, 1-5 스케일)
function calculateSleepQualityScore(quality: number): number {
  const clamped = Math.max(1, Math.min(5, quality));
  return (clamped - 1) * 2.5;
}

// 수면 일관성 점수 (0-8, 편차 시간 기반)
function calculateSleepConsistencyScore(varianceHours: number): number {
  if (varianceHours <= 0.5) return 8;
  if (varianceHours <= 1.0) return 6;
  if (varianceHours <= 1.5) return 4;
  if (varianceHours <= 2.0) return 2;
  return 0;
}

// 수면 총점 (0-30)
function calculateSleepScore(hours: number, quality: number, consistency?: number): number {
  const durationScore = calculateSleepDurationScore(hours);
  const qualityScore = calculateSleepQualityScore(quality);
  const consistencyScore = calculateSleepConsistencyScore(consistency ?? 1.0);

  return Math.min(30, durationScore + qualityScore + consistencyScore);
}

// 스트레스 점수 (0-25, 역방향: 낮은 스트레스 = 높은 점수)
function calculateStressScore(stressLevel: number): number {
  const clamped = Math.max(1, Math.min(10, stressLevel));
  return Math.round(Math.max(0, 25 - (clamped - 1) * (25 / 9)));
}

// 에너지 점수 (0-20, 1-5 스케일)
function calculateEnergyScore(energyLevel: number): number {
  const clamped = Math.max(1, Math.min(5, energyLevel));
  return (clamped - 1) * 5;
}

// 기분 점수 (0-25, 1-5 스케일)
function calculateMoodScore(moodScore: number): number {
  const clamped = Math.max(1, Math.min(5, moodScore));
  return Math.round((clamped - 1) * (25 / 4));
}

// 바이오리듬 → 웰니스 보정 계수 (0.85 ~ 1.15)
function calculateModifier(totalScore: number): number {
  return Math.round((0.85 + (totalScore / 100) * 0.3) * 100) / 100;
}

// 생리주기 단계 판별
export function getCyclePhase(cycleDay: number): CyclePhase {
  if (cycleDay <= 5) return 'menstrual';
  if (cycleDay <= 13) return 'follicular';
  if (cycleDay <= 16) return 'ovulation';
  return 'luteal';
}

// 생리주기 단계별 정보
export function getCyclePhaseInfo(phase: CyclePhase): CyclePhaseInfo {
  const phaseMap: Record<CyclePhase, CyclePhaseInfo> = {
    menstrual: {
      phase: 'menstrual',
      label: '생리기',
      skinTip: '피부가 민감해요. 자극 없는 보습 케어에 집중하세요.',
      workoutTip: '가벼운 요가나 스트레칭을 추천해요.',
      nutritionTip: '철분이 풍부한 음식(시금치, 소고기)을 섭취하세요.',
    },
    follicular: {
      phase: 'follicular',
      label: '여포기',
      skinTip: '피부 컨디션이 좋아지는 시기예요. 새 제품을 시도하기 좋아요.',
      workoutTip: '에너지가 올라가요. 강도를 높여보세요!',
      nutritionTip: '단백질과 채소를 충분히 섭취하세요.',
    },
    ovulation: {
      phase: 'ovulation',
      label: '배란기',
      skinTip: '피부가 가장 빛나는 시기! 윤기 케어를 해보세요.',
      workoutTip: '체력이 최고! 고강도 운동에 도전해보세요.',
      nutritionTip: '항산화 식품(베리류, 녹차)을 섭취하세요.',
    },
    luteal: {
      phase: 'luteal',
      label: '황체기',
      skinTip: '피지 분비가 늘어요. 각질 관리와 진정 케어를 하세요.',
      workoutTip: '중강도 운동이 적합해요. 무리하지 마세요.',
      nutritionTip: '마그네슘(견과류)과 비타민B가 도움이 돼요.',
    },
  };

  return phaseMap[phase];
}

// 바이오리듬 인사이트 생성
function generateInsights(
  input: BiorhythmInput,
  breakdown: BiorhythmScoreBreakdown,
  cyclePhase?: CyclePhase
): BiorhythmInsight[] {
  const insights: BiorhythmInsight[] = [];

  // 수면 관련
  if (input.sleepHours < 6) {
    insights.push({
      type: 'skin',
      message: '수면이 부족해요. 수면 부족은 피부 재생을 방해하고 다크서클을 유발해요.',
      priority: 1,
    });
  }
  if (input.sleepQuality <= 2) {
    insights.push({
      type: 'general',
      message: '수면의 질이 낮아요. 취침 전 블루라이트를 줄이고, 일정한 시간에 자보세요.',
      priority: 2,
    });
  }
  if (input.sleepHours >= 7 && input.sleepQuality >= 4) {
    insights.push({
      type: 'skin',
      message: '수면 상태가 좋아요! 피부 재생이 잘 이루어지고 있어요.',
      priority: 5,
    });
  }

  // 스트레스 관련
  if (input.stressLevel >= 7) {
    insights.push({
      type: 'skin',
      message: '스트레스가 높아요. 코르티솔이 피지 분비를 늘려 트러블을 유발할 수 있어요.',
      priority: 1,
    });
    insights.push({
      type: 'workout',
      message: '스트레스가 높을 때는 가벼운 산책이나 스트레칭이 도움이 돼요.',
      priority: 2,
    });
  }

  // 에너지 관련
  if (input.energyLevel <= 2) {
    insights.push({
      type: 'workout',
      message: '에너지가 부족해요. 오늘은 가벼운 운동으로 시작해보세요.',
      priority: 3,
    });
    insights.push({
      type: 'nutrition',
      message: '에너지 부족 시 비타민B군과 철분이 풍부한 음식을 섭취하세요.',
      priority: 3,
    });
  }

  // 기분 관련
  if (input.moodScore >= 4 && input.energyLevel >= 4) {
    insights.push({
      type: 'workout',
      message: '컨디션이 좋아요! 오늘 운동 강도를 높여도 좋겠어요.',
      priority: 4,
    });
  }

  // 생리주기 관련
  if (cyclePhase) {
    const phaseInfo = getCyclePhaseInfo(cyclePhase);
    insights.push({
      type: 'skin',
      message: `${phaseInfo.label}: ${phaseInfo.skinTip}`,
      priority: 2,
    });
    insights.push({
      type: 'workout',
      message: `${phaseInfo.label}: ${phaseInfo.workoutTip}`,
      priority: 3,
    });
  }

  // 우선순위 정렬 (낮은 번호 = 높은 우선순위)
  return insights.sort((a, b) => a.priority - b.priority);
}

// 메인 바이오리듬 점수 계산
export function calculateBiorhythm(input: BiorhythmInput): BiorhythmResult {
  const sleepScore = calculateSleepScore(
    input.sleepHours,
    input.sleepQuality,
    input.sleepConsistency
  );
  const stressScore = calculateStressScore(input.stressLevel);
  const energyScore = calculateEnergyScore(input.energyLevel);
  const moodScore = calculateMoodScore(input.moodScore);

  const breakdown: BiorhythmScoreBreakdown = {
    sleep: sleepScore,
    stress: stressScore,
    energy: energyScore,
    mood: moodScore,
  };

  const totalScore = Math.min(100, sleepScore + stressScore + energyScore + moodScore);

  const cyclePhase = input.cycleDay != null ? getCyclePhase(input.cycleDay) : undefined;

  const insights = generateInsights(input, breakdown, cyclePhase);

  return {
    totalScore,
    breakdown,
    modifier: calculateModifier(totalScore),
    insights,
    cyclePhase,
  };
}

// 바이오리듬 보정된 웰니스 점수 계산
export function applyBiorhythmModifier(
  baseWellnessScore: number,
  biorhythmModifier: number
): number {
  return Math.round(Math.min(100, Math.max(0, baseWellnessScore * biorhythmModifier)));
}
