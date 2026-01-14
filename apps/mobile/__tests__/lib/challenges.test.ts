/**
 * 챌린지 모듈 테스트
 */

import {
  Challenge,
  UserChallenge,
  ChallengeStats,
  DOMAIN_NAMES,
  DOMAIN_COLORS,
  DIFFICULTY_NAMES,
  DIFFICULTY_COLORS,
  STATUS_NAMES,
  calculateProgress,
  getDaysRemaining,
} from '../../lib/challenges';

describe('Challenge 타입', () => {
  it('챌린지 구조가 올바라야 함', () => {
    const challenge: Challenge = {
      id: 'ch-123',
      code: 'workout-7days',
      name: '7일 운동 챌린지',
      description: '7일 연속 운동하기',
      icon: '🏃',
      domain: 'workout',
      durationDays: 7,
      target: { type: 'streak', days: 7 },
      rewardXp: 100,
      difficulty: 'easy',
      isActive: true,
    };

    expect(challenge.id).toBeDefined();
    expect(challenge.domain).toBe('workout');
    expect(challenge.durationDays).toBe(7);
    expect(challenge.target.type).toBe('streak');
  });
});

describe('UserChallenge 타입', () => {
  it('사용자 챌린지 구조가 올바라야 함', () => {
    const userChallenge: UserChallenge = {
      id: 'uc-123',
      clerkUserId: 'user-456',
      challengeId: 'ch-123',
      status: 'in_progress',
      startedAt: new Date(),
      targetEndAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      completedAt: null,
      progress: { currentDays: 3, totalDays: 7, percentage: 43 },
    };

    expect(userChallenge.status).toBe('in_progress');
    expect(userChallenge.progress.currentDays).toBe(3);
  });
});

describe('상수', () => {
  it('도메인 이름이 정의되어야 함', () => {
    expect(DOMAIN_NAMES.workout).toBe('운동');
    expect(DOMAIN_NAMES.nutrition).toBe('영양');
    expect(DOMAIN_NAMES.skin).toBe('피부');
    expect(DOMAIN_NAMES.combined).toBe('복합');
  });

  it('도메인 색상이 정의되어야 함', () => {
    expect(DOMAIN_COLORS.workout).toBeDefined();
    expect(DOMAIN_COLORS.nutrition).toBeDefined();
    expect(DOMAIN_COLORS.skin).toBeDefined();
    expect(DOMAIN_COLORS.combined).toBeDefined();
  });

  it('난이도 이름이 정의되어야 함', () => {
    expect(DIFFICULTY_NAMES.easy).toBe('쉬움');
    expect(DIFFICULTY_NAMES.medium).toBe('보통');
    expect(DIFFICULTY_NAMES.hard).toBe('어려움');
  });

  it('난이도 색상이 정의되어야 함', () => {
    expect(DIFFICULTY_COLORS.easy).toBeDefined();
    expect(DIFFICULTY_COLORS.medium).toBeDefined();
    expect(DIFFICULTY_COLORS.hard).toBeDefined();
  });

  it('상태 이름이 정의되어야 함', () => {
    expect(STATUS_NAMES.in_progress).toBe('진행 중');
    expect(STATUS_NAMES.completed).toBe('완료');
    expect(STATUS_NAMES.failed).toBe('실패');
    expect(STATUS_NAMES.abandoned).toBe('포기');
  });
});

describe('calculateProgress', () => {
  it('percentage가 있으면 그 값을 반환해야 함', () => {
    const userChallenge: UserChallenge = {
      id: 'uc-1',
      clerkUserId: 'user-1',
      challengeId: 'ch-1',
      status: 'in_progress',
      startedAt: new Date(),
      targetEndAt: new Date(),
      completedAt: null,
      progress: { percentage: 75 },
    };

    expect(calculateProgress(userChallenge)).toBe(75);
  });

  it('currentDays와 totalDays로 진행률을 계산해야 함', () => {
    const userChallenge: UserChallenge = {
      id: 'uc-2',
      clerkUserId: 'user-1',
      challengeId: 'ch-1',
      status: 'in_progress',
      startedAt: new Date(),
      targetEndAt: new Date(),
      completedAt: null,
      progress: { currentDays: 3, totalDays: 10 },
    };

    expect(calculateProgress(userChallenge)).toBe(30);
  });

  it('데이터가 없으면 0을 반환해야 함', () => {
    const userChallenge: UserChallenge = {
      id: 'uc-3',
      clerkUserId: 'user-1',
      challengeId: 'ch-1',
      status: 'in_progress',
      startedAt: new Date(),
      targetEndAt: new Date(),
      completedAt: null,
      progress: {},
    };

    expect(calculateProgress(userChallenge)).toBe(0);
  });
});

describe('getDaysRemaining', () => {
  it('남은 일수를 올바르게 계산해야 함', () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const remaining = getDaysRemaining(futureDate);

    expect(remaining).toBeGreaterThanOrEqual(4);
    expect(remaining).toBeLessThanOrEqual(6);
  });

  it('과거 날짜는 0을 반환해야 함', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(getDaysRemaining(pastDate)).toBe(0);
  });

  it('오늘이면 0 또는 1을 반환해야 함', () => {
    const today = new Date();
    const remaining = getDaysRemaining(today);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(1);
  });
});

describe('ChallengeStats', () => {
  it('통계 구조가 올바라야 함', () => {
    const stats: ChallengeStats = {
      total: 10,
      inProgress: 3,
      completed: 5,
      failed: 2,
    };

    expect(stats.total).toBe(10);
    expect(
      stats.inProgress + stats.completed + stats.failed
    ).toBeLessThanOrEqual(stats.total);
  });
});
