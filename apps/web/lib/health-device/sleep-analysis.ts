/**
 * 수면-피부/운동 상관 분석
 * @description 수면 데이터를 기반으로 피부 영향 예측 및 운동 강도 조정 권장
 */

import type { SleepRecord, SleepSkinCorrelation, SleepSkinImpact } from './types';

// ============================================
// 상수
// ============================================

/** 수면 품질 임계값 */
const SLEEP_QUALITY = {
  GOOD: 70,
  POOR: 40,
} as const;

/** 수면 시간 권장 (분) */
const SLEEP_DURATION = {
  MIN_RECOMMENDED: 420, // 7시간
  MAX_RECOMMENDED: 540, // 9시간
  MIN_ACCEPTABLE: 360, // 6시간
} as const;

/** 딥슬립 비율 권장 (%) */
const DEEP_SLEEP_RATIO = {
  GOOD: 20,
  MIN: 13,
} as const;

// ============================================
// 수면 품질 점수 계산
// ============================================

// 수면 시간 점수 (40점 만점)
function scoreDuration(totalMinutes: number): number {
  if (
    totalMinutes >= SLEEP_DURATION.MIN_RECOMMENDED &&
    totalMinutes <= SLEEP_DURATION.MAX_RECOMMENDED
  )
    return 40;
  if (totalMinutes >= SLEEP_DURATION.MIN_ACCEPTABLE) return 30;
  if (totalMinutes >= 300) return 20;
  return Math.max(0, Math.round((totalMinutes / 300) * 15));
}

// 딥슬립 비율 점수 (30점 만점)
function scoreDeepSleep(deepRatio: number): number {
  if (deepRatio >= DEEP_SLEEP_RATIO.GOOD) return 30;
  if (deepRatio >= DEEP_SLEEP_RATIO.MIN) return 20;
  return Math.round((deepRatio / DEEP_SLEEP_RATIO.MIN) * 15);
}

// REM 비율 점수 (20점 만점)
function scoreRem(remRatio: number): number {
  if (remRatio >= 20 && remRatio <= 30) return 20;
  if (remRatio >= 15) return 15;
  return Math.round((remRatio / 15) * 10);
}

// 깨어있는 시간 점수 (10점 만점, 적을수록 높음)
function scoreAwake(awakeRatio: number): number {
  if (awakeRatio <= 5) return 10;
  if (awakeRatio <= 10) return 7;
  return Math.max(0, 10 - Math.round(awakeRatio));
}

/**
 * 수면 기록에서 품질 점수 계산 (0-100)
 * - 수면 시간 40점
 * - 딥슬립 비율 30점
 * - REM 비율 20점
 * - 깨어있는 시간 10점
 */
export function calculateSleepQuality(record: SleepRecord): number {
  const { totalMinutes, stages } = record;
  if (totalMinutes === 0) return 0;

  const deepRatio = (stages.deep / totalMinutes) * 100;
  const remRatio = (stages.rem / totalMinutes) * 100;
  const awakeRatio = (stages.awake / totalMinutes) * 100;

  return Math.min(
    100,
    scoreDuration(totalMinutes) +
      scoreDeepSleep(deepRatio) +
      scoreRem(remRatio) +
      scoreAwake(awakeRatio)
  );
}

// ============================================
// 수면 트렌드 분석
// ============================================

/**
 * 수면 품질 트렌드 판별
 * 최근 3일과 이전 기간 비교
 */
export function analyzeSleepTrend(records: SleepRecord[]): 'improving' | 'declining' | 'stable' {
  if (records.length < 4) return 'stable';

  // 날짜순 정렬
  const sorted = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const recent = sorted.slice(-3);
  const earlier = sorted.slice(0, -3);

  const recentAvg = recent.reduce((sum, r) => sum + r.qualityScore, 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, r) => sum + r.qualityScore, 0) / earlier.length;

  const diff = recentAvg - earlierAvg;

  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

// ============================================
// 수면 → 피부 영향 분석
// ============================================

/**
 * 수면 품질이 피부에 미치는 영향 예측
 */
export function predictSkinImpact(avgQuality: number): SleepSkinImpact {
  if (avgQuality >= SLEEP_QUALITY.GOOD) return 'positive';
  if (avgQuality <= SLEEP_QUALITY.POOR) return 'negative';
  return 'neutral';
}

/**
 * 피부 영향 상세 설명 생성
 */
export function getSkinImpactDetails(
  impact: SleepSkinImpact,
  avgQuality: number,
  avgDuration: number
): string[] {
  const details: string[] = [];

  if (impact === 'positive') {
    details.push('충분한 수면으로 피부 재생이 활발해요');
    if (avgDuration >= SLEEP_DURATION.MIN_RECOMMENDED) {
      details.push('수면 시간이 적절하여 콜라겐 합성이 잘 이루어져요');
    }
  } else if (impact === 'negative') {
    details.push('수면 부족으로 피부 장벽이 약해질 수 있어요');
    if (avgDuration < SLEEP_DURATION.MIN_ACCEPTABLE) {
      details.push('수면 시간이 부족하여 다크서클이 심해질 수 있어요');
    }
    if (avgQuality < 30) {
      details.push('수면의 질이 낮아 피부 트러블이 발생할 수 있어요');
    }
  } else {
    details.push('수면 상태가 보통이에요. 조금 더 개선하면 피부에 도움이 돼요');
  }

  return details;
}

// ============================================
// 운동 강도 조정 권장
// ============================================

/**
 * 수면 데이터 기반 운동 강도 조정 권장
 */
export function recommendWorkoutAdjustment(
  avgQuality: number,
  avgDuration: number
): 'increase' | 'maintain' | 'decrease' {
  // 수면 부족 시 운동 강도 감소 권장
  if (avgQuality < SLEEP_QUALITY.POOR || avgDuration < SLEEP_DURATION.MIN_ACCEPTABLE) {
    return 'decrease';
  }

  // 수면 양호 시 운동 강도 증가 가능
  if (avgQuality >= SLEEP_QUALITY.GOOD && avgDuration >= SLEEP_DURATION.MIN_RECOMMENDED) {
    return 'increase';
  }

  return 'maintain';
}

// ============================================
// 통합 상관 분석
// ============================================

/**
 * 수면 데이터 종합 분석 → 피부/운동 상관 결과
 */
export function analyzeSleepCorrelation(records: SleepRecord[]): SleepSkinCorrelation {
  if (records.length === 0) {
    return {
      periodDays: 0,
      avgSleepScore: 0,
      sleepTrend: 'stable',
      skinImpact: 'neutral',
      skinImpactDetails: ['수면 데이터가 없어요. 디바이스를 연결해주세요.'],
      workoutAdjustment: 'maintain',
      recommendations: ['수면 데이터를 기록하면 맞춤 분석을 받을 수 있어요.'],
    };
  }

  const avgScore = records.reduce((sum, r) => sum + r.qualityScore, 0) / records.length;
  const avgDuration = records.reduce((sum, r) => sum + r.totalMinutes, 0) / records.length;
  const sleepTrend = analyzeSleepTrend(records);
  const skinImpact = predictSkinImpact(avgScore);
  const skinImpactDetails = getSkinImpactDetails(skinImpact, avgScore, avgDuration);
  const workoutAdjustment = recommendWorkoutAdjustment(avgScore, avgDuration);

  // 권장 사항 생성
  const recommendations: string[] = [];

  if (avgDuration < SLEEP_DURATION.MIN_RECOMMENDED) {
    recommendations.push(
      `하루 ${Math.ceil(SLEEP_DURATION.MIN_RECOMMENDED / 60)}시간 이상 수면을 목표로 해보세요.`
    );
  }

  if (sleepTrend === 'declining') {
    recommendations.push('최근 수면 품질이 낮아지고 있어요. 취침 시간을 일정하게 유지해보세요.');
  }

  if (workoutAdjustment === 'decrease') {
    recommendations.push('수면이 부족할 때는 가벼운 운동을 추천해요.');
  } else if (workoutAdjustment === 'increase') {
    recommendations.push('수면이 충분해요! 운동 강도를 조금 높여도 좋아요.');
  }

  if (skinImpact === 'negative') {
    recommendations.push('수분 크림과 아이크림을 충분히 발라주세요.');
  }

  if (recommendations.length === 0) {
    recommendations.push('현재 수면 패턴이 좋아요! 유지해주세요.');
  }

  return {
    periodDays: records.length,
    avgSleepScore: Math.round(avgScore),
    sleepTrend,
    skinImpact,
    skinImpactDetails,
    workoutAdjustment,
    recommendations,
  };
}
