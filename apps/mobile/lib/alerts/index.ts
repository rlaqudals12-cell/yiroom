/**
 * 교차 모듈 알림 모듈
 *
 * 운동↔영양↔피부 교차 알림 규칙, 우선순위 정렬
 *
 * @module lib/alerts
 */

// ─── 타입 ────────────────────────────────────────────

export type ModuleType = 'workout' | 'nutrition' | 'skin' | 'hair' | 'body';
export type AlertPriority = 'high' | 'medium' | 'low';

export type CrossModuleAlertType =
  | 'calorie_surplus'
  | 'post_workout_nutrition'
  | 'post_workout_skin'
  | 'hydration_reminder'
  | 'weight_change'
  | 'scalp_health_nutrition'
  | 'hair_loss_prevention'
  | 'hair_shine_boost'
  | 'skin_tone_nutrition'
  | 'collagen_boost';

export interface CrossModuleAlert {
  type: CrossModuleAlertType;
  title: string;
  message: string;
  priority: AlertPriority;
  sourceModule: ModuleType;
  targetModule: ModuleType;
  actionLabel?: string;
  actionRoute?: string;
  createdAt: string;
  expiresAt?: string;
}

// ─── 상수 ─────────────────────────────────────────────

export const MODULE_LABELS: Record<ModuleType, string> = {
  workout: '운동',
  nutrition: '영양',
  skin: '피부',
  hair: '헤어',
  body: '체형',
};

export const ALERT_PRIORITY_ORDER: Record<AlertPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const ALERT_TYPE_CONFIG: Record<
  CrossModuleAlertType,
  { priority: AlertPriority; source: ModuleType; target: ModuleType }
> = {
  calorie_surplus: { priority: 'medium', source: 'nutrition', target: 'workout' },
  post_workout_nutrition: { priority: 'high', source: 'workout', target: 'nutrition' },
  post_workout_skin: { priority: 'medium', source: 'workout', target: 'skin' },
  hydration_reminder: { priority: 'low', source: 'nutrition', target: 'skin' },
  weight_change: { priority: 'medium', source: 'body', target: 'nutrition' },
  scalp_health_nutrition: { priority: 'low', source: 'hair', target: 'nutrition' },
  hair_loss_prevention: { priority: 'medium', source: 'hair', target: 'nutrition' },
  hair_shine_boost: { priority: 'low', source: 'hair', target: 'nutrition' },
  skin_tone_nutrition: { priority: 'medium', source: 'skin', target: 'nutrition' },
  collagen_boost: { priority: 'low', source: 'skin', target: 'nutrition' },
};

// ─── 알림 생성 ───────────────────────────────────────

function createAlert(
  type: CrossModuleAlertType,
  title: string,
  message: string,
  actionLabel?: string,
  actionRoute?: string
): CrossModuleAlert {
  const config = ALERT_TYPE_CONFIG[type];
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24시간

  return {
    type,
    title,
    message,
    priority: config.priority,
    sourceModule: config.source,
    targetModule: config.target,
    actionLabel,
    actionRoute,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

/**
 * 칼로리 잉여 알림
 */
export function createCalorieSurplusAlert(surplus: number): CrossModuleAlert {
  return createAlert(
    'calorie_surplus',
    '칼로리 잉여 알림',
    `오늘 ${surplus}kcal 잉여예요. 가벼운 운동을 추천해요`,
    '운동 추천 보기',
    '/(tabs)/workout'
  );
}

/**
 * 운동 후 영양 알림
 */
export function createPostWorkoutNutritionAlert(
  caloriesBurned: number
): CrossModuleAlert {
  return createAlert(
    'post_workout_nutrition',
    '운동 후 영양 보충',
    `${caloriesBurned}kcal 소모! 단백질 보충을 권장해요`,
    '식단 확인',
    '/(tabs)/nutrition'
  );
}

/**
 * 운동 후 피부 관리 알림
 */
export function createPostWorkoutSkinAlert(): CrossModuleAlert {
  return createAlert(
    'post_workout_skin',
    '운동 후 피부 관리',
    '땀을 흘린 후엔 세안과 수분 보충이 중요해요',
    '스킨케어 루틴',
    '/(analysis)/skin'
  );
}

/**
 * 수분 섭취 알림
 */
export function createHydrationReminderAlert(): CrossModuleAlert {
  return createAlert(
    'hydration_reminder',
    '수분 섭취 알림',
    '피부 수분 유지를 위해 물을 마셔주세요',
    '물 기록',
    '/(tabs)/nutrition'
  );
}

/**
 * 체중 변화 알림
 */
export function createWeightChangeAlert(
  changeKg: number,
  direction: 'increase' | 'decrease'
): CrossModuleAlert {
  const msg =
    direction === 'increase'
      ? `최근 ${changeKg}kg 증가했어요. 식단을 확인해보세요`
      : `최근 ${changeKg}kg 감소했어요. 영양 섭취를 확인해보세요`;

  return createAlert(
    'weight_change',
    '체중 변화 알림',
    msg,
    '영양 대시보드',
    '/(tabs)/nutrition'
  );
}

/**
 * 피부톤 영양 알림
 */
export function createSkinToneNutritionAlert(): CrossModuleAlert {
  return createAlert(
    'skin_tone_nutrition',
    '피부톤 개선 영양',
    '비타민 C와 항산화 식품이 피부톤 개선에 도움이 돼요',
    '영양 가이드',
    '/(tabs)/nutrition'
  );
}

/**
 * 콜라겐 부스트 알림
 */
export function createCollagenBoostAlert(): CrossModuleAlert {
  return createAlert(
    'collagen_boost',
    '콜라겐 보충',
    '피부 탄력을 위해 콜라겐이 풍부한 식품을 추천해요',
    '식단 추천',
    '/(tabs)/nutrition'
  );
}

// ─── 유틸리티 ─────────────────────────────────────────

/**
 * 우선순위 정렬
 */
export function sortAlertsByPriority(
  alerts: CrossModuleAlert[]
): CrossModuleAlert[] {
  return [...alerts].sort(
    (a, b) => ALERT_PRIORITY_ORDER[a.priority] - ALERT_PRIORITY_ORDER[b.priority]
  );
}

/**
 * 만료 알림 필터링
 */
export function filterExpiredAlerts(
  alerts: CrossModuleAlert[]
): CrossModuleAlert[] {
  const now = Date.now();
  return alerts.filter((alert) => {
    if (!alert.expiresAt) return true;
    return new Date(alert.expiresAt).getTime() > now;
  });
}

/**
 * 표시할 알림 가져오기 (만료 제외 + 우선순위순)
 */
export function getVisibleAlerts(
  alerts: CrossModuleAlert[],
  maxCount = 5
): CrossModuleAlert[] {
  return sortAlertsByPriority(filterExpiredAlerts(alerts)).slice(0, maxCount);
}
