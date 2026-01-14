/**
 * 알림 모듈 테스트
 */

import {
  type NotificationCategory,
  type NotificationType,
  type NotificationTemplate,
  type TemplateVariables,
  NOTIFICATION_TEMPLATES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  interpolateTemplate,
  createNotification,
  getNotificationTypesByCategory,
} from '../../lib/notifications/templates';

import {
  type NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../../lib/notifications/types';

// ============================================================
// 타입 테스트
// ============================================================

describe('NotificationCategory 타입', () => {
  it('모든 카테고리 값이 유효해야 함', () => {
    const categories: NotificationCategory[] = [
      'workout',
      'nutrition',
      'social',
      'achievement',
      'system',
    ];

    expect(categories).toHaveLength(5);
    categories.forEach((cat) => {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
      expect(CATEGORY_ICONS[cat]).toBeDefined();
    });
  });
});

describe('NotificationType 타입', () => {
  it('운동 관련 알림 타입이 정의되어야 함', () => {
    const workoutTypes: NotificationType[] = [
      'workout_reminder',
      'workout_complete',
      'workout_streak',
      'workout_streak_warning',
    ];

    workoutTypes.forEach((type) => {
      expect(NOTIFICATION_TEMPLATES[type]).toBeDefined();
      expect(NOTIFICATION_TEMPLATES[type].category).toBe('workout');
    });
  });

  it('영양 관련 알림 타입이 정의되어야 함', () => {
    const nutritionTypes: NotificationType[] = [
      'nutrition_reminder',
      'nutrition_goal',
      'water_reminder',
      'fasting_end',
    ];

    nutritionTypes.forEach((type) => {
      expect(NOTIFICATION_TEMPLATES[type]).toBeDefined();
      expect(NOTIFICATION_TEMPLATES[type].category).toBe('nutrition');
    });
  });

  it('소셜 관련 알림 타입이 정의되어야 함', () => {
    const socialTypes: NotificationType[] = [
      'friend_request',
      'friend_accepted',
      'challenge_invite',
      'challenge_complete',
    ];

    socialTypes.forEach((type) => {
      expect(NOTIFICATION_TEMPLATES[type]).toBeDefined();
      expect(NOTIFICATION_TEMPLATES[type].category).toBe('social');
    });
  });

  it('성취 관련 알림 타입이 정의되어야 함', () => {
    const achievementTypes: NotificationType[] = [
      'level_up',
      'badge_earned',
      'wellness_score',
      'weekly_report',
    ];

    achievementTypes.forEach((type) => {
      expect(NOTIFICATION_TEMPLATES[type]).toBeDefined();
      expect(NOTIFICATION_TEMPLATES[type].category).toBe('achievement');
    });
  });

  it('시스템 관련 알림 타입이 정의되어야 함', () => {
    const systemTypes: NotificationType[] = ['daily_checkin', 'test'];

    systemTypes.forEach((type) => {
      expect(NOTIFICATION_TEMPLATES[type]).toBeDefined();
      expect(NOTIFICATION_TEMPLATES[type].category).toBe('system');
    });
  });
});

// ============================================================
// 상수 테스트
// ============================================================

describe('CATEGORY_LABELS', () => {
  it('모든 카테고리에 한글 라벨이 있어야 함', () => {
    expect(CATEGORY_LABELS.workout).toBe('운동');
    expect(CATEGORY_LABELS.nutrition).toBe('영양');
    expect(CATEGORY_LABELS.social).toBe('소셜');
    expect(CATEGORY_LABELS.achievement).toBe('성취');
    expect(CATEGORY_LABELS.system).toBe('시스템');
  });
});

describe('CATEGORY_ICONS', () => {
  it('모든 카테고리에 아이콘이 있어야 함', () => {
    expect(CATEGORY_ICONS.workout).toBeDefined();
    expect(CATEGORY_ICONS.nutrition).toBeDefined();
    expect(CATEGORY_ICONS.social).toBeDefined();
    expect(CATEGORY_ICONS.achievement).toBeDefined();
    expect(CATEGORY_ICONS.system).toBeDefined();
  });
});

describe('NOTIFICATION_TEMPLATES', () => {
  it('모든 템플릿에 필수 필드가 있어야 함', () => {
    Object.entries(NOTIFICATION_TEMPLATES).forEach(([type, template]) => {
      expect(template.category).toBeDefined();
      expect(template.title).toBeDefined();
      expect(template.body).toBeDefined();
    });
  });

  it('액션이 있는 템플릿은 route가 정의되어야 함', () => {
    Object.entries(NOTIFICATION_TEMPLATES).forEach(([type, template]) => {
      if (template.action) {
        expect(template.action.label).toBeDefined();
        expect(template.action.route).toBeDefined();
      }
    });
  });
});

// ============================================================
// 유틸리티 함수 테스트
// ============================================================

describe('interpolateTemplate', () => {
  it('변수를 올바르게 치환해야 함', () => {
    const template = '{{name}}님이 친구 요청을 보냈어요.';
    const variables: TemplateVariables = { name: '홍길동' };

    const result = interpolateTemplate(template, variables);

    expect(result).toBe('홍길동님이 친구 요청을 보냈어요.');
  });

  it('여러 변수를 치환해야 함', () => {
    const template = '{{duration}}분간 {{workout_type}} 운동을 완료했어요!';
    const variables: TemplateVariables = {
      duration: 30,
      workout_type: '웨이트',
    };

    const result = interpolateTemplate(template, variables);

    expect(result).toBe('30분간 웨이트 운동을 완료했어요!');
  });

  it('없는 변수는 그대로 유지해야 함', () => {
    const template = '{{name}}님, {{missing}} 변수는 없어요.';
    const variables: TemplateVariables = { name: '테스트' };

    const result = interpolateTemplate(template, variables);

    expect(result).toBe('테스트님, {{missing}} 변수는 없어요.');
  });

  it('숫자 변수를 문자열로 변환해야 함', () => {
    const template = '{{streak}}일 연속 달성!';
    const variables: TemplateVariables = { streak: 7 };

    const result = interpolateTemplate(template, variables);

    expect(result).toBe('7일 연속 달성!');
  });
});

describe('createNotification', () => {
  it('기본 알림을 생성해야 함', () => {
    const notification = createNotification('workout_reminder');

    expect(notification.type).toBe('workout_reminder');
    expect(notification.category).toBe('workout');
    expect(notification.title).toContain('운동');
    expect(notification.body).toBeDefined();
  });

  it('변수가 있는 알림을 생성해야 함', () => {
    const notification = createNotification('workout_streak', { streak: 10 });

    expect(notification.title).toContain('10');
    expect(notification.body).toContain('10');
  });

  it('친구 요청 알림을 생성해야 함', () => {
    const notification = createNotification('friend_request', {
      name: '테스트유저',
    });

    expect(notification.title).toBeDefined();
    expect(notification.body).toContain('테스트유저');
    expect(notification.action?.route).toContain('friends');
  });

  it('레벨업 알림을 생성해야 함', () => {
    const notification = createNotification('level_up', { level: 15 });

    expect(notification.title).toContain('레벨');
    expect(notification.body).toContain('15');
    expect(notification.action?.route).toContain('profile');
  });

  it('알 수 없는 타입에 에러를 발생해야 함', () => {
    expect(() => {
      createNotification('unknown_type' as NotificationType);
    }).toThrow();
  });
});

describe('getNotificationTypesByCategory', () => {
  it('운동 카테고리의 알림 타입을 반환해야 함', () => {
    const types = getNotificationTypesByCategory('workout');

    expect(types).toContain('workout_reminder');
    expect(types).toContain('workout_complete');
    expect(types).toContain('workout_streak');
    expect(types).toContain('workout_streak_warning');
    expect(types.length).toBe(4);
  });

  it('영양 카테고리의 알림 타입을 반환해야 함', () => {
    const types = getNotificationTypesByCategory('nutrition');

    expect(types).toContain('nutrition_reminder');
    expect(types).toContain('water_reminder');
    expect(types.length).toBe(4);
  });

  it('소셜 카테고리의 알림 타입을 반환해야 함', () => {
    const types = getNotificationTypesByCategory('social');

    expect(types).toContain('friend_request');
    expect(types).toContain('challenge_invite');
    expect(types.length).toBe(4);
  });

  it('성취 카테고리의 알림 타입을 반환해야 함', () => {
    const types = getNotificationTypesByCategory('achievement');

    expect(types).toContain('level_up');
    expect(types).toContain('badge_earned');
    expect(types.length).toBe(4);
  });

  it('시스템 카테고리의 알림 타입을 반환해야 함', () => {
    const types = getNotificationTypesByCategory('system');

    expect(types).toContain('daily_checkin');
    expect(types).toContain('test');
    expect(types.length).toBe(2);
  });
});

// ============================================================
// 알림 설정 테스트
// ============================================================

describe('NotificationSettings 타입', () => {
  it('기본 설정 구조가 올바라야 함', () => {
    const settings: NotificationSettings = {
      enabled: true,
      workoutReminder: true,
      workoutReminderTime: '09:00',
      nutritionReminder: true,
      mealReminderTimes: {
        breakfast: '08:30',
        lunch: '12:30',
        dinner: '18:30',
      },
      waterReminder: true,
      waterReminderInterval: 2,
      streakWarning: true,
      socialNotifications: true,
      achievementNotifications: true,
    };

    expect(settings.enabled).toBe(true);
    expect(settings.workoutReminderTime).toMatch(/^\d{2}:\d{2}$/);
    expect(settings.mealReminderTimes.breakfast).toBeDefined();
    expect(settings.waterReminderInterval).toBeGreaterThan(0);
  });
});

describe('DEFAULT_NOTIFICATION_SETTINGS', () => {
  it('기본값이 정의되어야 함', () => {
    expect(DEFAULT_NOTIFICATION_SETTINGS.enabled).toBe(false);
    expect(DEFAULT_NOTIFICATION_SETTINGS.workoutReminder).toBe(true);
    expect(DEFAULT_NOTIFICATION_SETTINGS.nutritionReminder).toBe(true);
    expect(DEFAULT_NOTIFICATION_SETTINGS.waterReminder).toBe(true);
    expect(DEFAULT_NOTIFICATION_SETTINGS.streakWarning).toBe(true);
  });

  it('기본 시간 설정이 유효해야 함', () => {
    expect(DEFAULT_NOTIFICATION_SETTINGS.workoutReminderTime).toBe('09:00');
    expect(DEFAULT_NOTIFICATION_SETTINGS.mealReminderTimes.breakfast).toBe(
      '08:30'
    );
    expect(DEFAULT_NOTIFICATION_SETTINGS.mealReminderTimes.lunch).toBe('12:30');
    expect(DEFAULT_NOTIFICATION_SETTINGS.mealReminderTimes.dinner).toBe(
      '18:30'
    );
  });

  it('기본 물 알림 간격이 유효해야 함', () => {
    expect(DEFAULT_NOTIFICATION_SETTINGS.waterReminderInterval).toBe(2);
    expect(DEFAULT_NOTIFICATION_SETTINGS.waterReminderInterval).toBeGreaterThan(
      0
    );
    expect(
      DEFAULT_NOTIFICATION_SETTINGS.waterReminderInterval
    ).toBeLessThanOrEqual(4);
  });
});

// ============================================================
// 템플릿 내용 테스트
// ============================================================

describe('알림 템플릿 내용', () => {
  it('운동 리마인더 템플릿이 올바라야 함', () => {
    const template = NOTIFICATION_TEMPLATES['workout_reminder'];

    expect(template.title).toContain('운동');
    expect(template.action?.route).toContain('workout');
  });

  it('물 리마인더 템플릿이 올바라야 함', () => {
    const template = NOTIFICATION_TEMPLATES['water_reminder'];

    expect(template.title).toContain('수분');
    expect(template.category).toBe('nutrition');
  });

  it('친구 요청 템플릿이 변수를 사용해야 함', () => {
    const template = NOTIFICATION_TEMPLATES['friend_request'];

    expect(template.body).toContain('{{name}}');
  });

  it('스트릭 템플릿이 변수를 사용해야 함', () => {
    const template = NOTIFICATION_TEMPLATES['workout_streak'];

    expect(template.title).toContain('{{streak}}');
    expect(template.body).toContain('{{streak}}');
  });

  it('테스트 알림은 액션이 없어야 함', () => {
    const template = NOTIFICATION_TEMPLATES['test'];

    expect(template.action).toBeUndefined();
  });
});

// ============================================================
// 라우트 테스트
// ============================================================

describe('알림 액션 라우트', () => {
  it('운동 관련 알림은 workout 탭으로 이동해야 함', () => {
    const workoutTypes: NotificationType[] = [
      'workout_reminder',
      'workout_complete',
      'workout_streak',
    ];

    workoutTypes.forEach((type) => {
      const route = NOTIFICATION_TEMPLATES[type].action?.route;
      expect(route).toContain('workout');
    });
  });

  it('영양 관련 알림은 nutrition 탭으로 이동해야 함', () => {
    const nutritionTypes: NotificationType[] = [
      'nutrition_reminder',
      'water_reminder',
    ];

    nutritionTypes.forEach((type) => {
      const route = NOTIFICATION_TEMPLATES[type].action?.route;
      expect(route).toContain('nutrition');
    });
  });

  it('소셜 관련 알림은 social 라우트로 이동해야 함', () => {
    const socialTypes: NotificationType[] = [
      'friend_request',
      'friend_accepted',
    ];

    socialTypes.forEach((type) => {
      const route = NOTIFICATION_TEMPLATES[type].action?.route;
      expect(route).toContain('friends');
    });
  });

  it('성취 관련 알림은 profile 탭으로 이동해야 함', () => {
    const achievementTypes: NotificationType[] = [
      'level_up',
      'badge_earned',
      'wellness_score',
    ];

    achievementTypes.forEach((type) => {
      const route = NOTIFICATION_TEMPLATES[type].action?.route;
      expect(route).toContain('profile');
    });
  });
});
