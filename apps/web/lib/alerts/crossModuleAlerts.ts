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
export function createPostWorkoutSkinAlert(sweatedHeavily: boolean = true): CrossModuleAlertData {
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
 * 두피 건강 기반 영양 추천 알림 생성 (H-1 → N-1)
 */
export function createScalpHealthNutritionAlert(
  scalpHealthScore: number,
  recommendations: string[] = []
): CrossModuleAlertData {
  const config = ALERT_TYPE_CONFIG.scalp_health_nutrition;
  const level: AlertLevel = scalpHealthScore < 40 ? 'warning' : 'info';

  return {
    id: generateAlertId('scalp_health_nutrition'),
    type: 'scalp_health_nutrition',
    sourceModule: config.sourceModule,
    targetModule: config.targetModule,
    title: '두피 건강을 위한 영양 추천',
    message:
      scalpHealthScore < 40
        ? '두피 건강 개선을 위해 비오틴, 아연 섭취를 권장해요'
        : '건강한 두피 유지를 위해 영양 균형을 맞춰보세요',
    priority: config.priority,
    level,
    ctaText: config.ctaText,
    ctaHref: config.ctaHref,
    metadata: {
      scalpHealthScore,
      recommendations,
    },
    createdAt: new Date(),
  };
}

/**
 * 탈모 예방 식단 추천 알림 생성 (H-1 → N-1)
 */
export function createHairLossPreventionAlert(
  hairDensityScore: number,
  riskLevel: 'low' | 'medium' | 'high'
): CrossModuleAlertData {
  const config = ALERT_TYPE_CONFIG.hair_loss_prevention;
  const level: AlertLevel =
    riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'info';

  const messages: Record<string, string> = {
    high: '모발 밀도가 낮아요. 단백질, 철분 섭취를 강화해보세요',
    medium: '모발 건강 관리가 필요해요. 영양 섭취에 신경 써주세요',
    low: '모발 건강을 유지하려면 균형 잡힌 식단을 권장해요',
  };

  return {
    id: generateAlertId('hair_loss_prevention'),
    type: 'hair_loss_prevention',
    sourceModule: config.sourceModule,
    targetModule: config.targetModule,
    title: '모발 건강 영양 관리',
    message: messages[riskLevel],
    priority: riskLevel === 'high' ? 'high' : config.priority,
    level,
    ctaText: config.ctaText,
    ctaHref: config.ctaHref,
    metadata: {
      hairDensityScore,
      riskLevel,
    },
    createdAt: new Date(),
  };
}

/**
 * 모발 윤기 영양 추천 알림 생성 (H-1 → N-1)
 */
export function createHairShineBoostAlert(damageLevel: number): CrossModuleAlertData {
  const config = ALERT_TYPE_CONFIG.hair_shine_boost;

  return {
    id: generateAlertId('hair_shine_boost'),
    type: 'hair_shine_boost',
    sourceModule: config.sourceModule,
    targetModule: config.targetModule,
    title: '모발 윤기 영양 추천',
    message:
      damageLevel > 50
        ? '손상된 모발 회복을 위해 오메가-3, 비타민E를 추천해요'
        : '건강한 모발 윤기를 위해 영양 보충을 추천해요',
    priority: config.priority,
    level: config.defaultLevel,
    ctaText: config.ctaText,
    ctaHref: config.ctaHref,
    metadata: {
      damageLevel,
    },
    createdAt: new Date(),
  };
}

/**
 * 피부톤 개선 영양 추천 알림 생성 (M-1 → N-1)
 */
export function createSkinToneNutritionAlert(
  undertone: 'warm' | 'cool' | 'neutral',
  skinConcerns: string[] = []
): CrossModuleAlertData {
  const config = ALERT_TYPE_CONFIG.skin_tone_nutrition;

  const recommendations: Record<string, string> = {
    dull: '비타민C와 항산화 식품으로 피부 광채를 높여보세요',
    uneven: '비타민E가 풍부한 식품으로 피부톤 균일화를 도와요',
    yellowish: '녹황색 채소와 베리류로 피부 투명도를 높여보세요',
  };

  const primaryConcern = skinConcerns[0] || 'dull';
  const message = recommendations[primaryConcern] || recommendations.dull;

  return {
    id: generateAlertId('skin_tone_nutrition'),
    type: 'skin_tone_nutrition',
    sourceModule: config.sourceModule,
    targetModule: config.targetModule,
    title: '피부톤 개선 영양 추천',
    message,
    priority: config.priority,
    level: config.defaultLevel,
    ctaText: config.ctaText,
    ctaHref: config.ctaHref,
    metadata: {
      undertone,
      skinConcerns,
    },
    createdAt: new Date(),
  };
}

/**
 * 콜라겐 섭취 추천 알림 생성 (M-1 → N-1)
 */
export function createCollagenBoostAlert(elasticityScore: number): CrossModuleAlertData {
  const config = ALERT_TYPE_CONFIG.collagen_boost;

  return {
    id: generateAlertId('collagen_boost'),
    type: 'collagen_boost',
    sourceModule: config.sourceModule,
    targetModule: config.targetModule,
    title: '콜라겐 섭취 추천',
    message:
      elasticityScore < 50
        ? '피부 탄력 개선을 위해 콜라겐 섭취를 권장해요'
        : '피부 탄력 유지를 위해 콜라겐 보충을 추천해요',
    priority: config.priority,
    level: config.defaultLevel,
    ctaText: config.ctaText,
    ctaHref: config.ctaHref,
    metadata: {
      elasticityScore,
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
export function sortAlertsByPriority(alerts: CrossModuleAlertData[]): CrossModuleAlertData[] {
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
export function filterExpiredAlerts(alerts: CrossModuleAlertData[]): CrossModuleAlertData[] {
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
