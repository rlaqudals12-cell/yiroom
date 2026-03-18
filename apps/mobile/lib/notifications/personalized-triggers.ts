/**
 * 개인화 푸시 알림 트리거 정의
 *
 * 5가지 개인화 트리거:
 * - streak_reminder: 스트릭 유지 리마인더 (저녁 8시)
 * - reanalysis_due: 재분석 안내 (오전 10시)
 * - seasonal_tip: 계절 변화 팁 (아침 7시)
 * - morning_routine: 아침 스킨케어 루틴 (아침 8시)
 * - evening_recap: 하루 기록 요약 (저녁 9시)
 */

import type { PersonalizedTrigger, UserTriggerData } from './types';

// ============================================================
// 계절 헬퍼 (월 기반)
// ============================================================

/** 현재 월에 따른 계절 이름 반환 */
export function getSeasonName(month: number): string {
  if (month >= 3 && month <= 5) return '봄철';
  if (month >= 6 && month <= 8) return '여름철';
  if (month >= 9 && month <= 11) return '가을철';
  return '겨울철';
}

/** 계절 변경 월인지 확인 (3, 6, 9, 12월) */
export function isSeasonChangeMonth(month: number): boolean {
  return [3, 6, 9, 12].includes(month);
}

/** 마지막 분석으로부터 경과 일수 계산 */
export function getDaysSinceLastAnalysis(lastAnalysisDate: string | null): number {
  if (!lastAnalysisDate) return Infinity;

  const lastDate = new Date(lastAnalysisDate);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ============================================================
// 개인화 트리거 정의
// ============================================================

export const PERSONALIZED_TRIGGERS: PersonalizedTrigger[] = [
  {
    id: 'streak_reminder',
    condition: (userData: UserTriggerData): boolean => {
      // 조건: 오늘 할 일 미완료 + streak > 0
      return !userData.todayCompleted && userData.currentStreak > 0;
    },
    getVariables: (userData: UserTriggerData): Record<string, string | number> => ({
      streak: userData.currentStreak,
    }),
    schedule: {
      hour: 20,
      minute: 0,
    },
    settingsKey: 'streakReminder',
  },

  {
    id: 'reanalysis_due',
    condition: (userData: UserTriggerData): boolean => {
      // 조건: 마지막 분석 30일+ 경과
      const days = getDaysSinceLastAnalysis(userData.lastAnalysisDate);
      return days >= 30;
    },
    getVariables: (userData: UserTriggerData): Record<string, string | number> => ({
      days: getDaysSinceLastAnalysis(userData.lastAnalysisDate),
    }),
    schedule: {
      hour: 10,
      minute: 0,
    },
    settingsKey: 'reanalysisDue',
  },

  {
    id: 'seasonal_tip',
    condition: (): boolean => {
      // 조건: 계절 변경 월 (3, 6, 9, 12월)
      const currentMonth = new Date().getMonth() + 1;
      return isSeasonChangeMonth(currentMonth);
    },
    getVariables: (): Record<string, string | number> => {
      const currentMonth = new Date().getMonth() + 1;
      return { season: getSeasonName(currentMonth) };
    },
    schedule: {
      hour: 7,
      minute: 0,
    },
    settingsKey: 'seasonalTip',
  },

  {
    id: 'morning_routine',
    condition: (userData: UserTriggerData): boolean => {
      // 조건: 스킨케어 루틴 설정된 사용자
      return userData.hasSkincareRoutine;
    },
    getVariables: (): Record<string, string | number> => ({}),
    schedule: {
      hour: 8,
      minute: 0,
    },
    settingsKey: 'morningRoutine',
  },

  {
    id: 'evening_recap',
    condition: (userData: UserTriggerData): boolean => {
      // 조건: 오늘 기록이 1건 이상
      return userData.todayRecordCount >= 1;
    },
    getVariables: (userData: UserTriggerData): Record<string, string | number> => ({
      count: userData.todayRecordCount,
    }),
    schedule: {
      hour: 21,
      minute: 0,
    },
    settingsKey: 'eveningRecap',
  },
];

// ============================================================
// 트리거 평가 함수
// ============================================================

/** 활성화된 트리거 중 조건을 만족하는 것만 필터링 */
export function evaluateTriggers(
  triggers: PersonalizedTrigger[],
  userData: UserTriggerData,
  enabledTriggers: Record<string, boolean>
): PersonalizedTrigger[] {
  return triggers.filter((trigger) => {
    // 설정에서 비활성화된 트리거는 제외
    if (!enabledTriggers[trigger.settingsKey]) {
      return false;
    }
    // 조건 평가
    return trigger.condition(userData);
  });
}

/** 트리거 ID로 트리거 찾기 */
export function getTriggerById(triggerId: string): PersonalizedTrigger | undefined {
  return PERSONALIZED_TRIGGERS.find((t) => t.id === triggerId);
}
