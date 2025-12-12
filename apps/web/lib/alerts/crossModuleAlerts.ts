/**
 * P3-5.3: 통합 알림 시스템 - 알림 생성 및 관리 로직
 */

import {
  type CrossModuleAlertData,
  type CrossModuleAlertType,
  type AlertLevel,
  type AlertPriority,
  ALERT_TYPE_CONFIG,
} from './types';

/**
 * 알림 ID 생성
 */
function generateAlertId(type: CrossModuleAlertType): string {
  return `${type}-${Date.now()}`;
}

/**
 * 칼로리 초과 알림 생성
 */
export function createCalorieSurplusAlert(
  surplusCalories: number,
  recommendedDuration: number,
  estimatedBurn: number
): CrossModuleAlertData {
  const config = ALERT_TYPE_CONFIG.calorie_surplus;
  const level: AlertLevel = surplusCalories >= 400 ? 'danger' : 'warning';

  return {
    id: generateAlertId('calorie_surplus'),
    type: 'calorie_surplus',
    sourceModule: config.sourceModule,
    targetModule: config.targetModule,
    title: level === 'danger' ? '칼로리 초과 주의!' : '칼로리 초과',
    message: `목표 대비 ${surplusCalories}kcal 초과. ${recommendedDuration}분 운동으로 ${estimatedBurn}kcal 소모 가능`,
    priority: config.priority,
    level,
    ctaText: config.ctaText,
    ctaHref: config.ctaHref,
    metadata: {
      surplusCalories,
      recommendedDuration,
      estimatedBurn,
    },
    createdAt: new Date(),
  };
}

/**
 * 운동 후 영양 추천 알림 생성
 */
export function createPostWorkoutNutritionAlert(
  workoutType: string,
  proteinMin: number,
  proteinMax: number,
  nutritionTip: string
): CrossModuleAlertData {
  const config = ALERT_TYPE_CONFIG.post_workout_nutrition;

  return {
    id: generateAlertId('post_workout_nutrition'),
    type: 'post_workout_nutrition',
    sourceModule: config.sourceModule,
    targetModule: config.targetModule,
    title: '운동 후 영양 보충',
    message: `${nutritionTip} 단백질 ${proteinMin}-${proteinMax}g 권장`,
    priority: config.priority,
    level: config.defaultLevel,
    ctaText: config.ctaText,
    ctaHref: config.ctaHref,
    metadata: {
      workoutType,
      proteinMin,
      proteinMax,
    },
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2시간 후 만료
  };
}

/**
 * 운동 후 피부 관리 알림 생성
 */
export function createPostWorkoutSkinAlert(
  sweatedHeavily: boolean = true
): CrossModuleAlertData {
  const config = ALERT_TYPE_CONFIG.post_workout_skin;

  return {
    id: generateAlertId('post_workout_skin'),
    type: 'post_workout_skin',
    sourceModule: config.sourceModule,
    targetModule: config.targetModule,
    title: '피부 관리 알림',
    message: sweatedHeavily
      ? '땀을 많이 흘렸으니 세안 후 수분 보충을 추천해요'
      : '운동 후 가벼운 세안으로 피부를 정돈해주세요',
    priority: config.priority,
    level: config.defaultLevel,
    ctaText: config.ctaText,
    ctaHref: config.ctaHref,
    metadata: {
      sweatedHeavily,
    },
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1시간 후 만료
  };
}

/**
 * 수분 섭취 권장 알림 생성
 */
export function createHydrationReminderAlert(
  currentIntake: number,
  targetIntake: number
): CrossModuleAlertData {
  const config = ALERT_TYPE_CONFIG.hydration_reminder;
  const remaining = targetIntake - currentIntake;

  return {
    id: generateAlertId('hydration_reminder'),
    type: 'hydration_reminder',
    sourceModule: config.sourceModule,
    targetModule: config.targetModule,
    title: '수분 섭취 권장',
    message: `피부 건강을 위해 ${remaining}ml 더 섭취해주세요`,
    priority: config.priority,
    level: config.defaultLevel,
    ctaText: config.ctaText,
    ctaHref: config.ctaHref,
    metadata: {
      currentIntake,
      targetIntake,
      remaining,
    },
    createdAt: new Date(),
  };
}

/**
 * 체중 변화 알림 생성
 */
export function createWeightChangeAlert(
  weightChange: number,
  period: string
): CrossModuleAlertData {
  const config = ALERT_TYPE_CONFIG.weight_change;
  const isGain = weightChange > 0;

  return {
    id: generateAlertId('weight_change'),
    type: 'weight_change',
    sourceModule: config.sourceModule,
    targetModule: config.targetModule,
    title: isGain ? '체중 증가 알림' : '체중 감소 알림',
    message: `${period} 동안 ${Math.abs(weightChange)}kg ${isGain ? '증가' : '감소'}했어요`,
    priority: config.priority,
    level: config.defaultLevel,
    ctaText: config.ctaText,
    ctaHref: config.ctaHref,
    metadata: {
      weightChange,
      period,
    },
    createdAt: new Date(),
  };
}

/**
 * 알림 우선순위 비교 (높은 우선순위가 앞으로)
 */
const PRIORITY_ORDER: Record<AlertPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * 알림 목록을 우선순위로 정렬
 */
export function sortAlertsByPriority(
  alerts: CrossModuleAlertData[]
): CrossModuleAlertData[] {
  return [...alerts].sort((a, b) => {
    // 우선순위 비교
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 같은 우선순위면 최신순
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/**
 * 만료된 알림 필터링
 */
export function filterExpiredAlerts(
  alerts: CrossModuleAlertData[]
): CrossModuleAlertData[] {
  const now = new Date();
  return alerts.filter((alert) => {
    if (!alert.expiresAt) return true;
    return alert.expiresAt > now;
  });
}

/**
 * 알림 표시 여부 결정 (최대 표시 개수 제한)
 */
export function getVisibleAlerts(
  alerts: CrossModuleAlertData[],
  maxCount: number = 3
): CrossModuleAlertData[] {
  const validAlerts = filterExpiredAlerts(alerts);
  const sortedAlerts = sortAlertsByPriority(validAlerts);
  return sortedAlerts.slice(0, maxCount);
}
