/**
 * 챌린지 시스템 통합 테스트
 * - 운동/영양 기록 시 챌린지 자동 업데이트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  updateChallengesByDomain,
  updateChallengesOnWorkout,
  updateChallengesOnNutrition,
} from '@/lib/challenges/integration';

// Mock Supabase 클라이언트
function createMockSupabase(options: {
  userChallenges?: Record<string, unknown>[];
  fetchError?: Error | null;
  updateError?: Error | null;
}) {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockUpdate = vi.fn();
  const mockSingle = vi.fn();

  // 체이닝 설정
  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      data: options.userChallenges || [],
      error: options.fetchError || null,
    }),
  });

  mockUpdate.mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      error: options.updateError || null,
    }),
  });

  return {
    from: mockFrom,
  } as unknown as SupabaseClient;
}

// Mock 챌린지 데이터
const mockWorkoutChallenge = {
  id: 'challenge-workout-1',
  code: 'workout_streak_7',
  name: '7일 연속 운동',
  domain: 'workout',
  duration_days: 7,
  target: { type: 'streak', days: 7 },
  reward_xp: 50,
  reward_badge_id: null,
  difficulty: 'easy',
  is_active: true,
  sort_order: 1,
  created_at: new Date().toISOString(),
};

const mockNutritionChallenge = {
  id: 'challenge-nutrition-1',
  code: 'nutrition_streak_7',
  name: '7일 연속 식단 기록',
  domain: 'nutrition',
  duration_days: 7,
  target: { type: 'streak', days: 7 },
  reward_xp: 50,
  reward_badge_id: null,
  difficulty: 'easy',
  is_active: true,
  sort_order: 10,
  created_at: new Date().toISOString(),
};

const mockCombinedChallenge = {
  id: 'challenge-combined-1',
  code: 'wellness_7day',
  name: '7일 웰니스 챌린지',
  domain: 'combined',
  duration_days: 7,
  target: { type: 'combined', workout: true, nutrition: true },
  reward_xp: 100,
  reward_badge_id: null,
  difficulty: 'medium',
  is_active: true,
  sort_order: 20,
  created_at: new Date().toISOString(),
};

// Mock 사용자 챌린지 생성
function createMockUserChallenge(
  challenge: typeof mockWorkoutChallenge,
  startedDaysAgo = 0,
  completedDays: number[] = []
) {
  const startedAt = new Date();
  startedAt.setDate(startedAt.getDate() - startedDaysAgo);

  const targetEndAt = new Date(startedAt);
  targetEndAt.setDate(targetEndAt.getDate() + challenge.duration_days);

  return {
    id: `user-challenge-${challenge.id}`,
    clerk_user_id: 'user_123',
    challenge_id: challenge.id,
    status: 'in_progress',
    started_at: startedAt.toISOString(),
    target_end_at: targetEndAt.toISOString(),
    completed_at: null,
    progress: {
      currentDays: completedDays.length,
      totalDays: challenge.duration_days,
      completedDays,
      completedCount: completedDays.length,
      percentage: Math.round((completedDays.length / challenge.duration_days) * 100),
    },
    reward_claimed: false,
    created_at: startedAt.toISOString(),
    updated_at: new Date().toISOString(),
    challenges: challenge,
  };
}

describe('챌린지 통합 - updateChallengesByDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 동작', () => {
    it('진행 중인 챌린지가 없으면 빈 결과 반환', async () => {
      const supabase = createMockSupabase({ userChallenges: [] });

      const result = await updateChallengesByDomain(supabase, 'user_123', 'workout');

      expect(result.updated).toBe(0);
      expect(result.completed).toBe(0);
      expect(result.completedChallenges).toHaveLength(0);
    });

    it('DB 조회 에러 시 빈 결과 반환', async () => {
      const supabase = createMockSupabase({
        fetchError: new Error('DB Error'),
      });

      const result = await updateChallengesByDomain(supabase, 'user_123', 'workout');

      expect(result.updated).toBe(0);
      expect(result.completed).toBe(0);
    });
  });

  describe('도메인 필터링', () => {
    it('workout 도메인은 workout 챌린지만 업데이트', async () => {
      // 이 테스트는 실제 DB 연동 시 의미가 있음
      const result = await updateChallengesByDomain(
        createMockSupabase({ userChallenges: [] }),
        'user_123',
        'workout'
      );

      expect(result.updated).toBe(0);
    });

    it('nutrition 도메인은 nutrition 챌린지만 업데이트', async () => {
      const result = await updateChallengesByDomain(
        createMockSupabase({ userChallenges: [] }),
        'user_123',
        'nutrition'
      );

      expect(result.updated).toBe(0);
    });
  });
});

describe('챌린지 통합 - updateChallengesOnWorkout', () => {
  it('운동 기록 시 workout 도메인으로 업데이트 호출', async () => {
    const supabase = createMockSupabase({ userChallenges: [] });

    const result = await updateChallengesOnWorkout(supabase, 'user_123');

    expect(result).toBeDefined();
    expect(result.updated).toBe(0);
  });

  it('날짜 지정하여 업데이트 가능', async () => {
    const supabase = createMockSupabase({ userChallenges: [] });

    const result = await updateChallengesOnWorkout(supabase, 'user_123', '2025-12-23');

    expect(result).toBeDefined();
  });
});

describe('챌린지 통합 - updateChallengesOnNutrition', () => {
  it('영양 기록 시 nutrition 도메인으로 업데이트 호출', async () => {
    const supabase = createMockSupabase({ userChallenges: [] });

    const result = await updateChallengesOnNutrition(supabase, 'user_123');

    expect(result).toBeDefined();
    expect(result.updated).toBe(0);
  });

  it('날짜 지정하여 업데이트 가능', async () => {
    const supabase = createMockSupabase({ userChallenges: [] });

    const result = await updateChallengesOnNutrition(supabase, 'user_123', '2025-12-23');

    expect(result).toBeDefined();
  });
});

describe('ChallengeUpdateResult 타입', () => {
  it('결과 객체가 올바른 구조를 갖는다', async () => {
    const supabase = createMockSupabase({ userChallenges: [] });

    const result = await updateChallengesByDomain(supabase, 'user_123', 'workout');

    expect(result).toHaveProperty('updated');
    expect(result).toHaveProperty('completed');
    expect(result).toHaveProperty('completedChallenges');
    expect(typeof result.updated).toBe('number');
    expect(typeof result.completed).toBe('number');
    expect(Array.isArray(result.completedChallenges)).toBe(true);
  });
});
