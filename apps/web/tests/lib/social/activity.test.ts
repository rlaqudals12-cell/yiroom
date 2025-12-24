import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeTime,
  getActivityConfig,
  transformToActivity,
  ACTIVITY_TYPE_CONFIG,
  type ActivityType,
  type RawActivityData,
} from '@/lib/social/activity';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-24T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('방금 전 (1분 미만)', () => {
    const date = new Date('2025-12-24T11:59:30Z'); // 30초 전
    expect(formatRelativeTime(date)).toBe('방금 전');
  });

  it('N분 전 (1-59분)', () => {
    const date5min = new Date('2025-12-24T11:55:00Z'); // 5분 전
    expect(formatRelativeTime(date5min)).toBe('5분 전');

    const date30min = new Date('2025-12-24T11:30:00Z'); // 30분 전
    expect(formatRelativeTime(date30min)).toBe('30분 전');
  });

  it('N시간 전 (1-23시간)', () => {
    const date2h = new Date('2025-12-24T10:00:00Z'); // 2시간 전
    expect(formatRelativeTime(date2h)).toBe('2시간 전');

    const date12h = new Date('2025-12-24T00:00:00Z'); // 12시간 전
    expect(formatRelativeTime(date12h)).toBe('12시간 전');
  });

  it('N일 전 (1-6일)', () => {
    const date1d = new Date('2025-12-23T12:00:00Z'); // 1일 전
    expect(formatRelativeTime(date1d)).toBe('1일 전');

    const date5d = new Date('2025-12-19T12:00:00Z'); // 5일 전
    expect(formatRelativeTime(date5d)).toBe('5일 전');
  });

  it('N주 전 (1-3주)', () => {
    const date1w = new Date('2025-12-17T12:00:00Z'); // 7일 전
    expect(formatRelativeTime(date1w)).toBe('1주 전');

    const date2w = new Date('2025-12-10T12:00:00Z'); // 14일 전
    expect(formatRelativeTime(date2w)).toBe('2주 전');
  });

  it('N개월 전 (30일+)', () => {
    const date1m = new Date('2025-11-24T12:00:00Z'); // 30일 전
    expect(formatRelativeTime(date1m)).toBe('1개월 전');

    const date3m = new Date('2025-09-24T12:00:00Z'); // 91일 전
    expect(formatRelativeTime(date3m)).toBe('3개월 전');
  });
});

describe('getActivityConfig', () => {
  it('모든 활동 타입에 설정이 존재', () => {
    const types: ActivityType[] = [
      'workout_complete',
      'challenge_join',
      'challenge_complete',
      'streak_achieved',
      'level_up',
      'badge_earned',
    ];

    types.forEach((type) => {
      const config = getActivityConfig(type);
      expect(config).toBeDefined();
      expect(config.icon).toBeTruthy();
      expect(config.label).toBeTruthy();
      expect(config.color).toBeTruthy();
      expect(config.bgColor).toBeTruthy();
    });
  });

  it('workout_complete 설정', () => {
    const config = getActivityConfig('workout_complete');
    expect(config.icon).toBe('💪');
    expect(config.label).toBe('운동 완료');
  });

  it('challenge_join 설정', () => {
    const config = getActivityConfig('challenge_join');
    expect(config.icon).toBe('🎯');
    expect(config.label).toBe('챌린지 참여');
  });

  it('challenge_complete 설정', () => {
    const config = getActivityConfig('challenge_complete');
    expect(config.icon).toBe('🏆');
    expect(config.label).toBe('챌린지 완료');
  });

  it('streak_achieved 설정', () => {
    const config = getActivityConfig('streak_achieved');
    expect(config.icon).toBe('🔥');
    expect(config.label).toBe('연속 달성');
  });

  it('level_up 설정', () => {
    const config = getActivityConfig('level_up');
    expect(config.icon).toBe('⬆️');
    expect(config.label).toBe('레벨 업');
  });

  it('badge_earned 설정', () => {
    const config = getActivityConfig('badge_earned');
    expect(config.icon).toBe('🏅');
    expect(config.label).toBe('뱃지 획득');
  });
});

describe('ACTIVITY_TYPE_CONFIG', () => {
  it('6개의 활동 타입 존재', () => {
    expect(Object.keys(ACTIVITY_TYPE_CONFIG)).toHaveLength(6);
  });

  it('각 설정에 필수 필드 존재', () => {
    Object.values(ACTIVITY_TYPE_CONFIG).forEach((config) => {
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('color');
      expect(config).toHaveProperty('bgColor');
    });
  });
});

describe('transformToActivity', () => {
  const baseRawData: RawActivityData = {
    id: 'activity-1',
    user_id: 'user-1',
    type: 'workout_complete',
    title: '운동 완료',
    description: '상체 운동을 완료했어요',
    metadata: null,
    likes_count: 5,
    comments_count: 2,
    created_at: '2025-12-24T10:00:00Z',
    users: {
      full_name: '김철수',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    activity_likes: [],
  };

  it('기본 데이터 변환', () => {
    const result = transformToActivity(baseRawData, 'current-user');

    expect(result.id).toBe('activity-1');
    expect(result.userId).toBe('user-1');
    expect(result.userName).toBe('김철수');
    expect(result.userAvatar).toBe('https://example.com/avatar.jpg');
    expect(result.type).toBe('workout_complete');
    expect(result.title).toBe('운동 완료');
    expect(result.description).toBe('상체 운동을 완료했어요');
    expect(result.likesCount).toBe(5);
    expect(result.commentsCount).toBe(2);
    expect(result.isLiked).toBe(false);
  });

  it('메타데이터 변환', () => {
    const rawWithMeta: RawActivityData = {
      ...baseRawData,
      metadata: { duration: 45, caloriesBurned: 300 },
    };

    const result = transformToActivity(rawWithMeta, 'current-user');
    expect(result.metadata?.duration).toBe(45);
    expect(result.metadata?.caloriesBurned).toBe(300);
  });

  it('좋아요 여부 확인 - 좋아요 안 함', () => {
    const result = transformToActivity(baseRawData, 'current-user');
    expect(result.isLiked).toBe(false);
  });

  it('좋아요 여부 확인 - 좋아요 함', () => {
    const rawWithLike: RawActivityData = {
      ...baseRawData,
      activity_likes: [{ user_id: 'current-user' }],
    };

    const result = transformToActivity(rawWithLike, 'current-user');
    expect(result.isLiked).toBe(true);
  });

  it('아바타 없는 사용자', () => {
    const rawNoAvatar: RawActivityData = {
      ...baseRawData,
      users: {
        full_name: '김철수',
        avatar_url: null,
      },
    };

    const result = transformToActivity(rawNoAvatar, 'current-user');
    expect(result.userAvatar).toBeNull();
  });

  it('날짜 변환', () => {
    const result = transformToActivity(baseRawData, 'current-user');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.toISOString()).toBe('2025-12-24T10:00:00.000Z');
  });
});
