import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_TEMPLATES,
  interpolateTemplate,
  createNotification,
  getNotificationTypesByCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  type NotificationType,
  type NotificationCategory,
} from '@/lib/notifications/templates';

describe('NOTIFICATION_TEMPLATES', () => {
  it('모든 타입에 템플릿이 정의됨', () => {
    const types: NotificationType[] = [
      'workout_reminder',
      'workout_complete',
      'workout_streak',
      'workout_streak_warning',
      'nutrition_reminder',
      'nutrition_goal',
      'water_reminder',
      'fasting_end',
      'friend_request',
      'friend_accepted',
      'challenge_invite',
      'challenge_complete',
      'level_up',
      'badge_earned',
      'wellness_score',
      'weekly_report',
      'daily_checkin',
      'test',
    ];

    types.forEach((type) => {
      expect(NOTIFICATION_TEMPLATES[type]).toBeDefined();
      expect(NOTIFICATION_TEMPLATES[type].title).toBeTruthy();
      expect(NOTIFICATION_TEMPLATES[type].body).toBeTruthy();
      expect(NOTIFICATION_TEMPLATES[type].icon).toBeTruthy();
      expect(NOTIFICATION_TEMPLATES[type].category).toBeTruthy();
    });
  });

  it('운동 관련 템플릿', () => {
    expect(NOTIFICATION_TEMPLATES.workout_reminder.category).toBe('workout');
    expect(NOTIFICATION_TEMPLATES.workout_complete.category).toBe('workout');
    expect(NOTIFICATION_TEMPLATES.workout_streak.category).toBe('workout');
    expect(NOTIFICATION_TEMPLATES.workout_streak_warning.category).toBe('workout');
  });

  it('영양 관련 템플릿', () => {
    expect(NOTIFICATION_TEMPLATES.nutrition_reminder.category).toBe('nutrition');
    expect(NOTIFICATION_TEMPLATES.nutrition_goal.category).toBe('nutrition');
    expect(NOTIFICATION_TEMPLATES.water_reminder.category).toBe('nutrition');
    expect(NOTIFICATION_TEMPLATES.fasting_end.category).toBe('nutrition');
  });

  it('소셜 관련 템플릿', () => {
    expect(NOTIFICATION_TEMPLATES.friend_request.category).toBe('social');
    expect(NOTIFICATION_TEMPLATES.friend_accepted.category).toBe('social');
    expect(NOTIFICATION_TEMPLATES.challenge_invite.category).toBe('social');
    expect(NOTIFICATION_TEMPLATES.challenge_complete.category).toBe('social');
  });

  it('성취 관련 템플릿', () => {
    expect(NOTIFICATION_TEMPLATES.level_up.category).toBe('achievement');
    expect(NOTIFICATION_TEMPLATES.badge_earned.category).toBe('achievement');
    expect(NOTIFICATION_TEMPLATES.wellness_score.category).toBe('achievement');
    expect(NOTIFICATION_TEMPLATES.weekly_report.category).toBe('achievement');
  });

  it('시스템 템플릿', () => {
    expect(NOTIFICATION_TEMPLATES.daily_checkin.category).toBe('system');
    expect(NOTIFICATION_TEMPLATES.test.category).toBe('system');
  });
});

describe('interpolateTemplate', () => {
  it('단일 변수 치환', () => {
    const result = interpolateTemplate('안녕, {{name}}!', { name: '철수' });
    expect(result).toBe('안녕, 철수!');
  });

  it('여러 변수 치환', () => {
    const result = interpolateTemplate(
      '{{name}}님이 {{action}}을 했습니다.',
      { name: '영희', action: '로그인' }
    );
    expect(result).toBe('영희님이 로그인을 했습니다.');
  });

  it('숫자 변수 치환', () => {
    const result = interpolateTemplate('레벨 {{level}} 달성!', { level: 10 });
    expect(result).toBe('레벨 10 달성!');
  });

  it('없는 변수는 그대로 유지', () => {
    const result = interpolateTemplate('{{name}} 님, {{missing}}', { name: '철수' });
    expect(result).toBe('철수 님, {{missing}}');
  });

  it('빈 객체면 변수 그대로', () => {
    const result = interpolateTemplate('안녕, {{name}}!', {});
    expect(result).toBe('안녕, {{name}}!');
  });
});

describe('createNotification', () => {
  it('기본 알림 생성', () => {
    const notification = createNotification('workout_reminder');

    expect(notification.type).toBe('workout_reminder');
    expect(notification.category).toBe('workout');
    expect(notification.title).toBe('💪 운동할 시간이에요!');
    expect(notification.body).toBe('오늘의 운동 루틴을 확인해보세요.');
    expect(notification.icon).toBe('/icons/workout.png');
    expect(notification.action?.url).toBe('/workout');
  });

  it('변수가 있는 알림 생성', () => {
    const notification = createNotification('workout_streak', { streak: 7 });

    expect(notification.title).toBe('🔥 7일 연속 달성!');
    expect(notification.body).toBe('대단해요! 7일 연속으로 운동을 기록했어요.');
  });

  it('여러 변수가 있는 알림', () => {
    const notification = createNotification('workout_complete', {
      duration: 30,
      workout_type: '상체',
    });

    expect(notification.body).toBe('30분간 상체 운동을 완료했어요!');
  });

  it('친구 요청 알림', () => {
    const notification = createNotification('friend_request', { name: '김철수' });

    expect(notification.title).toBe('👋 새 친구 요청!');
    expect(notification.body).toBe('김철수님이 친구 요청을 보냈어요.');
    expect(notification.action?.url).toBe('/friends/requests');
  });

  it('레벨업 알림', () => {
    const notification = createNotification('level_up', { level: 15 });

    expect(notification.title).toBe('⬆️ 레벨 업!');
    expect(notification.body).toBe('축하해요! 레벨 15이 되었습니다!');
  });

  it('웰니스 점수 알림', () => {
    const notification = createNotification('wellness_score', {
      score: 85,
      grade: 'A',
    });

    expect(notification.body).toBe('이번 주 웰니스 점수는 85점이에요! A등급입니다.');
  });

  it('존재하지 않는 타입은 에러', () => {
    expect(() => {
      createNotification('invalid_type' as NotificationType);
    }).toThrow('Unknown notification type: invalid_type');
  });
});

describe('getNotificationTypesByCategory', () => {
  it('운동 카테고리 타입들', () => {
    const types = getNotificationTypesByCategory('workout');

    expect(types).toContain('workout_reminder');
    expect(types).toContain('workout_complete');
    expect(types).toContain('workout_streak');
    expect(types).toContain('workout_streak_warning');
  });

  it('영양 카테고리 타입들', () => {
    const types = getNotificationTypesByCategory('nutrition');

    expect(types).toContain('nutrition_reminder');
    expect(types).toContain('nutrition_goal');
    expect(types).toContain('water_reminder');
    expect(types).toContain('fasting_end');
  });

  it('소셜 카테고리 타입들', () => {
    const types = getNotificationTypesByCategory('social');

    expect(types).toContain('friend_request');
    expect(types).toContain('friend_accepted');
    expect(types).toContain('challenge_invite');
    expect(types).toContain('challenge_complete');
  });

  it('성취 카테고리 타입들', () => {
    const types = getNotificationTypesByCategory('achievement');

    expect(types).toContain('level_up');
    expect(types).toContain('badge_earned');
    expect(types).toContain('wellness_score');
    expect(types).toContain('weekly_report');
  });

  it('시스템 카테고리 타입들', () => {
    const types = getNotificationTypesByCategory('system');

    expect(types).toContain('daily_checkin');
    expect(types).toContain('test');
  });
});

describe('CATEGORY_LABELS', () => {
  it('모든 카테고리에 라벨 정의', () => {
    const categories: NotificationCategory[] = [
      'workout',
      'nutrition',
      'social',
      'achievement',
      'system',
    ];

    categories.forEach((category) => {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
    });
  });

  it('한글 라벨', () => {
    expect(CATEGORY_LABELS.workout).toBe('운동');
    expect(CATEGORY_LABELS.nutrition).toBe('영양');
    expect(CATEGORY_LABELS.social).toBe('소셜');
    expect(CATEGORY_LABELS.achievement).toBe('성취');
    expect(CATEGORY_LABELS.system).toBe('시스템');
  });
});

describe('CATEGORY_ICONS', () => {
  it('모든 카테고리에 아이콘 정의', () => {
    const categories: NotificationCategory[] = [
      'workout',
      'nutrition',
      'social',
      'achievement',
      'system',
    ];

    categories.forEach((category) => {
      expect(CATEGORY_ICONS[category]).toBeTruthy();
    });
  });

  it('이모지 아이콘', () => {
    expect(CATEGORY_ICONS.workout).toBe('💪');
    expect(CATEGORY_ICONS.nutrition).toBe('🍽️');
    expect(CATEGORY_ICONS.social).toBe('👥');
    expect(CATEGORY_ICONS.achievement).toBe('🏆');
    expect(CATEGORY_ICONS.system).toBe('⚙️');
  });
});
