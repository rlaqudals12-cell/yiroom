/**
 * 챌린지 시스템 상수 및 유틸리티 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  challengeRowToChallenge,
  userChallengeRowToUserChallenge,
  getDaysSinceStart,
  calculateProgressPercentage,
  isChallengeCompleted,
  getDaysRemaining,
  isChallengeExpired,
  getTodayString,
  calculateTargetEndAt,
} from '@/lib/challenges/constants';
import type { ChallengeRow, UserChallengeRow, ChallengeProgress } from '@/types/challenges';

// Mock 데이터
const mockChallengeRow: ChallengeRow = {
  id: 'challenge-1',
  code: 'workout_streak_7',
  name: '7일 연속 운동',
  description: '7일 연속으로 운동하세요',
  icon: '🔥',
  domain: 'workout',
  duration_days: 7,
  target: { type: 'streak', days: 7 },
  reward_xp: 50,
  reward_badge_id: null,
  difficulty: 'easy',
  is_active: true,
  sort_order: 1,
  created_at: '2025-01-01T00:00:00Z',
};

const mockUserChallengeRow: UserChallengeRow = {
  id: 'user-challenge-1',
  clerk_user_id: 'user_123',
  challenge_id: 'challenge-1',
  status: 'in_progress',
  started_at: '2025-01-01T00:00:00Z',
  target_end_at: '2025-01-08T00:00:00Z',
  completed_at: null,
  progress: { currentDays: 3, totalDays: 7, completedDays: [1, 2, 3] },
  reward_claimed: false,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-03T00:00:00Z',
};

describe('challengeRowToChallenge', () => {
  it('ChallengeRow를 Challenge로 변환한다', () => {
    const challenge = challengeRowToChallenge(mockChallengeRow);

    expect(challenge.id).toBe('challenge-1');
    expect(challenge.code).toBe('workout_streak_7');
    expect(challenge.name).toBe('7일 연속 운동');
    expect(challenge.domain).toBe('workout');
    expect(challenge.durationDays).toBe(7);
    expect(challenge.target).toEqual({ type: 'streak', days: 7 });
    expect(challenge.rewardXp).toBe(50);
    expect(challenge.difficulty).toBe('easy');
    expect(challenge.isActive).toBe(true);
    expect(challenge.createdAt).toBeInstanceOf(Date);
  });
});

describe('userChallengeRowToUserChallenge', () => {
  it('UserChallengeRow를 UserChallenge로 변환한다', () => {
    const userChallenge = userChallengeRowToUserChallenge(mockUserChallengeRow);

    expect(userChallenge.id).toBe('user-challenge-1');
    expect(userChallenge.clerkUserId).toBe('user_123');
    expect(userChallenge.challengeId).toBe('challenge-1');
    expect(userChallenge.status).toBe('in_progress');
    expect(userChallenge.startedAt).toBeInstanceOf(Date);
    expect(userChallenge.targetEndAt).toBeInstanceOf(Date);
    expect(userChallenge.completedAt).toBeNull();
    expect(userChallenge.progress.currentDays).toBe(3);
    expect(userChallenge.rewardClaimed).toBe(false);
  });

  it('challenge 조인 데이터가 있으면 변환한다', () => {
    const rowWithChallenge: UserChallengeRow = {
      ...mockUserChallengeRow,
      challenges: mockChallengeRow,
    };

    const userChallenge = userChallengeRowToUserChallenge(rowWithChallenge);

    expect(userChallenge.challenge).toBeDefined();
    expect(userChallenge.challenge?.name).toBe('7일 연속 운동');
  });
});

describe('getDaysSinceStart', () => {
  it('시작일로부터 경과 일수를 계산한다', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const days = getDaysSinceStart(yesterday);
    expect(days).toBe(1); // 0-based, 어제 시작이면 1일 경과
  });

  it('오늘 시작이면 0일 경과를 반환한다', () => {
    const today = new Date();
    const days = getDaysSinceStart(today);
    expect(days).toBe(0); // 0-based, 오늘 시작이면 0일 경과
  });

  it('targetDate를 지정하여 특정 날짜 기준으로 계산한다', () => {
    const startDate = new Date('2025-01-01');
    const targetDate = new Date('2025-01-04');

    const days = getDaysSinceStart(startDate, targetDate);
    expect(days).toBe(3); // 3일 경과
  });
});

describe('calculateProgressPercentage', () => {
  it('스트릭 타입: 현재 일수 기반 진행률', () => {
    const progress: ChallengeProgress = { currentDays: 3 };
    const target = { type: 'streak' as const, days: 7 };

    const percentage = calculateProgressPercentage(progress, target);
    expect(percentage).toBe(43); // 3/7 ≈ 42.8 → 43
  });

  it('스트릭 타입: 완료 시 100%', () => {
    const progress: ChallengeProgress = { currentDays: 7 };
    const target = { type: 'streak' as const, days: 7 };

    const percentage = calculateProgressPercentage(progress, target);
    expect(percentage).toBe(100);
  });

  it('카운트 타입: 완료 횟수 기반 진행률', () => {
    const progress: ChallengeProgress = { completedCount: 3 };
    const target = { type: 'count' as const, workouts: 5 };

    const percentage = calculateProgressPercentage(progress, target);
    expect(percentage).toBe(60); // 3/5 = 60%
  });

  it('데일리 타입: 완료 일수 기반 진행률', () => {
    const progress: ChallengeProgress = { completedDays: [1, 2, 3], totalDays: 7 };
    const target = { type: 'daily' as const, waterCups: 8 };

    const percentage = calculateProgressPercentage(progress, target);
    expect(percentage).toBe(43); // 3/7 ≈ 43%
  });

  it('100%를 초과하지 않는다', () => {
    const progress: ChallengeProgress = { currentDays: 10 };
    const target = { type: 'streak' as const, days: 7 };

    const percentage = calculateProgressPercentage(progress, target);
    expect(percentage).toBe(100);
  });
});

describe('isChallengeCompleted', () => {
  it('진행률이 100% 이상이면 true', () => {
    const progress: ChallengeProgress = { currentDays: 7 };
    const target = { type: 'streak' as const, days: 7 };

    expect(isChallengeCompleted(progress, target)).toBe(true);
  });

  it('진행률이 100% 미만이면 false', () => {
    const progress: ChallengeProgress = { currentDays: 5 };
    const target = { type: 'streak' as const, days: 7 };

    expect(isChallengeCompleted(progress, target)).toBe(false);
  });
});

describe('getDaysRemaining', () => {
  it('남은 일수를 계산한다', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);

    const remaining = getDaysRemaining(future);
    expect(remaining).toBe(5);
  });

  it('과거 날짜면 0을 반환한다', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);

    const remaining = getDaysRemaining(past);
    expect(remaining).toBe(0);
  });
});

describe('isChallengeExpired', () => {
  it('종료일이 지나면 true', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);

    expect(isChallengeExpired(past)).toBe(true);
  });

  it('종료일이 남아있으면 false', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);

    expect(isChallengeExpired(future)).toBe(false);
  });
});

describe('getTodayString', () => {
  it('YYYY-MM-DD 형식의 날짜 문자열을 반환한다', () => {
    const today = getTodayString();

    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('calculateTargetEndAt', () => {
  it('시작일로부터 기간 후 종료일을 계산한다', () => {
    const start = new Date('2025-01-01');
    const end = calculateTargetEndAt(start, 7);

    expect(end.toISOString().split('T')[0]).toBe('2025-01-08');
  });
});
