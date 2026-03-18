/**
 * 개인화 푸시 알림 트리거 테스트
 */

import {
  PERSONALIZED_TRIGGERS,
  evaluateTriggers,
  getTriggerById,
  getSeasonName,
  isSeasonChangeMonth,
  getDaysSinceLastAnalysis,
} from '../../lib/notifications/personalized-triggers';
import {
  NOTIFICATION_TEMPLATES,
  createNotification,
  interpolateTemplate,
  getNotificationTypesByCategory,
} from '../../lib/notifications/templates';
import type {
  PersonalizedTrigger,
  UserTriggerData,
  PersonalizedTriggerSettings,
  PersonalizedTriggerType,
} from '../../lib/notifications/types';
import {
  DEFAULT_PERSONALIZED_TRIGGER_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../../lib/notifications/types';

// ============================================================
// 헬퍼 함수 테스트
// ============================================================

describe('getSeasonName', () => {
  it('봄 (3~5월)을 올바르게 반환해야 함', () => {
    expect(getSeasonName(3)).toBe('봄철');
    expect(getSeasonName(4)).toBe('봄철');
    expect(getSeasonName(5)).toBe('봄철');
  });

  it('여름 (6~8월)을 올바르게 반환해야 함', () => {
    expect(getSeasonName(6)).toBe('여름철');
    expect(getSeasonName(7)).toBe('여름철');
    expect(getSeasonName(8)).toBe('여름철');
  });

  it('가을 (9~11월)을 올바르게 반환해야 함', () => {
    expect(getSeasonName(9)).toBe('가을철');
    expect(getSeasonName(10)).toBe('가을철');
    expect(getSeasonName(11)).toBe('가을철');
  });

  it('겨울 (12, 1, 2월)을 올바르게 반환해야 함', () => {
    expect(getSeasonName(12)).toBe('겨울철');
    expect(getSeasonName(1)).toBe('겨울철');
    expect(getSeasonName(2)).toBe('겨울철');
  });
});

describe('isSeasonChangeMonth', () => {
  it('계절 변경 월 (3, 6, 9, 12)은 true를 반환해야 함', () => {
    expect(isSeasonChangeMonth(3)).toBe(true);
    expect(isSeasonChangeMonth(6)).toBe(true);
    expect(isSeasonChangeMonth(9)).toBe(true);
    expect(isSeasonChangeMonth(12)).toBe(true);
  });

  it('비 계절 변경 월은 false를 반환해야 함', () => {
    expect(isSeasonChangeMonth(1)).toBe(false);
    expect(isSeasonChangeMonth(2)).toBe(false);
    expect(isSeasonChangeMonth(4)).toBe(false);
    expect(isSeasonChangeMonth(5)).toBe(false);
    expect(isSeasonChangeMonth(7)).toBe(false);
    expect(isSeasonChangeMonth(8)).toBe(false);
    expect(isSeasonChangeMonth(10)).toBe(false);
    expect(isSeasonChangeMonth(11)).toBe(false);
  });
});

describe('getDaysSinceLastAnalysis', () => {
  it('null이면 Infinity를 반환해야 함', () => {
    expect(getDaysSinceLastAnalysis(null)).toBe(Infinity);
  });

  it('오늘 날짜면 0을 반환해야 함', () => {
    const today = new Date().toISOString();
    expect(getDaysSinceLastAnalysis(today)).toBe(0);
  });

  it('30일 전 날짜면 30을 반환해야 함', () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    expect(getDaysSinceLastAnalysis(thirtyDaysAgo.toISOString())).toBe(30);
  });

  it('1일 전 날짜면 1을 반환해야 함', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getDaysSinceLastAnalysis(yesterday.toISOString())).toBe(1);
  });
});

// ============================================================
// 트리거 정의 테스트
// ============================================================

describe('PERSONALIZED_TRIGGERS', () => {
  it('5개의 트리거가 정의되어야 함', () => {
    expect(PERSONALIZED_TRIGGERS).toHaveLength(5);
  });

  it('모든 트리거에 필수 필드가 있어야 함', () => {
    PERSONALIZED_TRIGGERS.forEach((trigger) => {
      expect(trigger.id).toBeDefined();
      expect(trigger.condition).toBeInstanceOf(Function);
      expect(trigger.getVariables).toBeInstanceOf(Function);
      expect(trigger.schedule).toBeDefined();
      expect(trigger.schedule.hour).toBeGreaterThanOrEqual(0);
      expect(trigger.schedule.hour).toBeLessThanOrEqual(23);
      expect(trigger.schedule.minute).toBeGreaterThanOrEqual(0);
      expect(trigger.schedule.minute).toBeLessThanOrEqual(59);
      expect(trigger.settingsKey).toBeDefined();
    });
  });

  it('각 트리거 ID가 고유해야 함', () => {
    const ids = PERSONALIZED_TRIGGERS.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('모든 트리거 ID에 대응하는 알림 템플릿이 존재해야 함', () => {
    PERSONALIZED_TRIGGERS.forEach((trigger) => {
      expect(NOTIFICATION_TEMPLATES[trigger.id]).toBeDefined();
    });
  });
});

describe('getTriggerById', () => {
  it('존재하는 트리거를 찾아야 함', () => {
    const trigger = getTriggerById('streak_reminder');
    expect(trigger).toBeDefined();
    expect(trigger?.id).toBe('streak_reminder');
  });

  it('존재하지 않는 트리거는 undefined를 반환해야 함', () => {
    const trigger = getTriggerById('nonexistent');
    expect(trigger).toBeUndefined();
  });
});

// ============================================================
// 트리거 조건 테스트
// ============================================================

describe('streak_reminder 조건', () => {
  const trigger = getTriggerById('streak_reminder')!;

  it('미완료 + streak > 0이면 true', () => {
    const data: UserTriggerData = {
      currentStreak: 5,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    expect(trigger.condition(data)).toBe(true);
  });

  it('완료된 경우 false', () => {
    const data: UserTriggerData = {
      currentStreak: 5,
      todayCompleted: true,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    expect(trigger.condition(data)).toBe(false);
  });

  it('streak 0이면 false', () => {
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    expect(trigger.condition(data)).toBe(false);
  });

  it('변수에 streak 값이 포함되어야 함', () => {
    const data: UserTriggerData = {
      currentStreak: 7,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    const vars = trigger.getVariables(data);
    expect(vars.streak).toBe(7);
  });
});

describe('reanalysis_due 조건', () => {
  const trigger = getTriggerById('reanalysis_due')!;

  it('마지막 분석 30일+ 경과 시 true', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: oldDate.toISOString(),
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    expect(trigger.condition(data)).toBe(true);
  });

  it('마지막 분석 29일 경과 시 false', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 29);
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: recentDate.toISOString(),
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    expect(trigger.condition(data)).toBe(false);
  });

  it('분석 이력이 없으면 true', () => {
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    expect(trigger.condition(data)).toBe(true);
  });

  it('변수에 days 값이 포함되어야 함', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: oldDate.toISOString(),
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    const vars = trigger.getVariables(data);
    expect(vars.days).toBe(45);
  });
});

describe('seasonal_tip 조건', () => {
  const trigger = getTriggerById('seasonal_tip')!;

  it('계절 변경 월이면 true (시스템 날짜 기준)', () => {
    const currentMonth = new Date().getMonth() + 1;
    const expected = isSeasonChangeMonth(currentMonth);
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    expect(trigger.condition(data)).toBe(expected);
  });

  it('변수에 season 값이 포함되어야 함', () => {
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    const vars = trigger.getVariables(data);
    expect(typeof vars.season).toBe('string');
    expect(['봄철', '여름철', '가을철', '겨울철']).toContain(vars.season);
  });
});

describe('morning_routine 조건', () => {
  const trigger = getTriggerById('morning_routine')!;

  it('스킨케어 루틴 설정 시 true', () => {
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: true,
      todayRecordCount: 0,
    };
    expect(trigger.condition(data)).toBe(true);
  });

  it('스킨케어 루틴 미설정 시 false', () => {
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    expect(trigger.condition(data)).toBe(false);
  });
});

describe('evening_recap 조건', () => {
  const trigger = getTriggerById('evening_recap')!;

  it('오늘 기록 1건 이상 시 true', () => {
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 3,
    };
    expect(trigger.condition(data)).toBe(true);
  });

  it('오늘 기록 0건 시 false', () => {
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 0,
    };
    expect(trigger.condition(data)).toBe(false);
  });

  it('변수에 count 값이 포함되어야 함', () => {
    const data: UserTriggerData = {
      currentStreak: 0,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: false,
      todayRecordCount: 5,
    };
    const vars = trigger.getVariables(data);
    expect(vars.count).toBe(5);
  });
});

// ============================================================
// evaluateTriggers 테스트
// ============================================================

describe('evaluateTriggers', () => {
  const allEnabled: Record<string, boolean> = {
    streakReminder: true,
    reanalysisDue: true,
    seasonalTip: true,
    morningRoutine: true,
    eveningRecap: true,
  };

  it('모든 조건 만족 + 활성화 시 해당 트리거 반환', () => {
    const data: UserTriggerData = {
      currentStreak: 5,
      todayCompleted: false,
      lastAnalysisDate: null, // 분석 이력 없음 → reanalysis_due true
      hasSkincareRoutine: true,
      todayRecordCount: 3,
    };

    const result = evaluateTriggers(PERSONALIZED_TRIGGERS, data, allEnabled);

    // streak_reminder, reanalysis_due, morning_routine, evening_recap 최소 포함
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.find((t) => t.id === 'streak_reminder')).toBeDefined();
    expect(result.find((t) => t.id === 'reanalysis_due')).toBeDefined();
    expect(result.find((t) => t.id === 'morning_routine')).toBeDefined();
    expect(result.find((t) => t.id === 'evening_recap')).toBeDefined();
  });

  it('비활성화된 트리거는 제외', () => {
    const data: UserTriggerData = {
      currentStreak: 5,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: true,
      todayRecordCount: 3,
    };

    const disabledStreak: Record<string, boolean> = {
      ...allEnabled,
      streakReminder: false,
    };

    const result = evaluateTriggers(PERSONALIZED_TRIGGERS, data, disabledStreak);
    expect(result.find((t) => t.id === 'streak_reminder')).toBeUndefined();
  });

  it('조건 미충족 트리거는 제외', () => {
    const data: UserTriggerData = {
      currentStreak: 0, // streak 없음
      todayCompleted: true, // 완료됨
      lastAnalysisDate: new Date().toISOString(), // 최근 분석
      hasSkincareRoutine: false, // 루틴 없음
      todayRecordCount: 0, // 기록 없음
    };

    const result = evaluateTriggers(PERSONALIZED_TRIGGERS, data, allEnabled);

    // streak_reminder: streak 0 → false
    // reanalysis_due: 최근 분석 → false
    // morning_routine: 루틴 없음 → false
    // evening_recap: 기록 0 → false
    expect(result.find((t) => t.id === 'streak_reminder')).toBeUndefined();
    expect(result.find((t) => t.id === 'reanalysis_due')).toBeUndefined();
    expect(result.find((t) => t.id === 'morning_routine')).toBeUndefined();
    expect(result.find((t) => t.id === 'evening_recap')).toBeUndefined();
  });

  it('모든 트리거 비활성화 시 빈 배열 반환', () => {
    const allDisabled: Record<string, boolean> = {
      streakReminder: false,
      reanalysisDue: false,
      seasonalTip: false,
      morningRoutine: false,
      eveningRecap: false,
    };

    const data: UserTriggerData = {
      currentStreak: 10,
      todayCompleted: false,
      lastAnalysisDate: null,
      hasSkincareRoutine: true,
      todayRecordCount: 5,
    };

    const result = evaluateTriggers(PERSONALIZED_TRIGGERS, data, allDisabled);
    expect(result).toHaveLength(0);
  });
});

// ============================================================
// 알림 템플릿 통합 테스트
// ============================================================

describe('개인화 알림 템플릿', () => {
  it('streak_reminder 템플릿이 올바르게 렌더링되어야 함', () => {
    const notification = createNotification('streak_reminder', { streak: 7 });
    expect(notification.title).toContain('7');
    expect(notification.title).toContain('연속');
    expect(notification.action?.route).toBeDefined();
  });

  it('reanalysis_due 템플릿이 올바르게 렌더링되어야 함', () => {
    const notification = createNotification('reanalysis_due', { days: 35 });
    expect(notification.title).toContain('35');
    expect(notification.body).toContain('분석');
    expect(notification.action?.route).toContain('analysis');
  });

  it('seasonal_tip 템플릿이 올바르게 렌더링되어야 함', () => {
    const notification = createNotification('seasonal_tip', { season: '봄철' });
    expect(notification.title).toContain('봄철');
    expect(notification.body).toContain('계절');
  });

  it('morning_routine 템플릿이 올바르게 렌더링되어야 함', () => {
    const notification = createNotification('morning_routine');
    expect(notification.title).toContain('스킨케어');
    expect(notification.body).toContain('루틴');
  });

  it('evening_recap 템플릿이 올바르게 렌더링되어야 함', () => {
    const notification = createNotification('evening_recap', { count: 5 });
    expect(notification.title).toContain('5');
    expect(notification.title).toContain('기록');
  });

  it('개인화 알림 타입이 해당 카테고리에 속해야 함', () => {
    expect(NOTIFICATION_TEMPLATES['streak_reminder'].category).toBe('achievement');
    expect(NOTIFICATION_TEMPLATES['reanalysis_due'].category).toBe('system');
    expect(NOTIFICATION_TEMPLATES['seasonal_tip'].category).toBe('system');
    expect(NOTIFICATION_TEMPLATES['morning_routine'].category).toBe('nutrition');
    expect(NOTIFICATION_TEMPLATES['evening_recap'].category).toBe('achievement');
  });
});

// ============================================================
// 기본 설정 테스트
// ============================================================

describe('DEFAULT_PERSONALIZED_TRIGGER_SETTINGS', () => {
  it('모든 트리거가 기본 활성화되어야 함', () => {
    expect(DEFAULT_PERSONALIZED_TRIGGER_SETTINGS.streakReminder).toBe(true);
    expect(DEFAULT_PERSONALIZED_TRIGGER_SETTINGS.reanalysisDue).toBe(true);
    expect(DEFAULT_PERSONALIZED_TRIGGER_SETTINGS.seasonalTip).toBe(true);
    expect(DEFAULT_PERSONALIZED_TRIGGER_SETTINGS.morningRoutine).toBe(true);
    expect(DEFAULT_PERSONALIZED_TRIGGER_SETTINGS.eveningRecap).toBe(true);
  });
});

describe('DEFAULT_NOTIFICATION_SETTINGS', () => {
  it('personalizedTriggers 필드가 포함되어야 함', () => {
    expect(DEFAULT_NOTIFICATION_SETTINGS.personalizedTriggers).toBeDefined();
    expect(DEFAULT_NOTIFICATION_SETTINGS.personalizedTriggers.streakReminder).toBe(true);
    expect(DEFAULT_NOTIFICATION_SETTINGS.personalizedTriggers.reanalysisDue).toBe(true);
  });
});

// ============================================================
// 스케줄 시간 테스트
// ============================================================

describe('트리거 스케줄 시간', () => {
  it('streak_reminder는 저녁 8시에 스케줄되어야 함', () => {
    const trigger = getTriggerById('streak_reminder')!;
    expect(trigger.schedule.hour).toBe(20);
    expect(trigger.schedule.minute).toBe(0);
  });

  it('reanalysis_due는 오전 10시에 스케줄되어야 함', () => {
    const trigger = getTriggerById('reanalysis_due')!;
    expect(trigger.schedule.hour).toBe(10);
    expect(trigger.schedule.minute).toBe(0);
  });

  it('seasonal_tip은 아침 7시에 스케줄되어야 함', () => {
    const trigger = getTriggerById('seasonal_tip')!;
    expect(trigger.schedule.hour).toBe(7);
    expect(trigger.schedule.minute).toBe(0);
  });

  it('morning_routine은 아침 8시에 스케줄되어야 함', () => {
    const trigger = getTriggerById('morning_routine')!;
    expect(trigger.schedule.hour).toBe(8);
    expect(trigger.schedule.minute).toBe(0);
  });

  it('evening_recap은 저녁 9시에 스케줄되어야 함', () => {
    const trigger = getTriggerById('evening_recap')!;
    expect(trigger.schedule.hour).toBe(21);
    expect(trigger.schedule.minute).toBe(0);
  });
});

// ============================================================
// getNotificationTypesByCategory 업데이트 검증
// ============================================================

describe('카테고리별 개인화 알림 타입 분류', () => {
  it('achievement 카테고리에 streak_reminder, evening_recap이 포함되어야 함', () => {
    const types = getNotificationTypesByCategory('achievement');
    expect(types).toContain('streak_reminder');
    expect(types).toContain('evening_recap');
  });

  it('system 카테고리에 reanalysis_due, seasonal_tip이 포함되어야 함', () => {
    const types = getNotificationTypesByCategory('system');
    expect(types).toContain('reanalysis_due');
    expect(types).toContain('seasonal_tip');
  });

  it('nutrition 카테고리에 morning_routine이 포함되어야 함', () => {
    const types = getNotificationTypesByCategory('nutrition');
    expect(types).toContain('morning_routine');
  });
});
