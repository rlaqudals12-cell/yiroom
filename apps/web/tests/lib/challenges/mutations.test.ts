/**
 * 챌린지 변경 함수 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Supabase thenable mock
const terminalResult = vi.hoisted(() => ({ data: null as unknown, error: null as unknown }));

const mockChain = vi.hoisted(() => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  then: vi.fn((cb: (v: typeof terminalResult) => void) => Promise.resolve(cb(terminalResult))),
}));

vi.mock('@supabase/supabase-js', () => ({ createClient: () => mockChain }));

vi.mock('@/lib/challenges/queries', () => ({
  getChallengeById: vi.fn(),
  isUserParticipating: vi.fn(),
}));

vi.mock('@/lib/challenges/constants', () => ({
  userChallengeRowToUserChallenge: vi.fn((row: Record<string, unknown>) => {
    const challenges = row.challenges as Record<string, unknown> | null;
    return {
      ...row,
      status: row.status || 'in_progress',
      progress: row.progress || {},
      rewardClaimed: row.reward_claimed || false,
      challenge: challenges
        ? {
            ...challenges,
            rewardXp: challenges.reward_xp ?? 0,
            rewardBadgeId: challenges.reward_badge_id ?? null,
          }
        : null,
    };
  }),
  calculateTargetEndAt: vi.fn(() => new Date('2026-04-15')),
  isChallengeCompleted: vi.fn(() => false),
}));

vi.mock('@/lib/gamification', () => ({
  addXp: vi.fn(),
  awardBadgeById: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  challengeLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import {
  joinChallenge,
  updateChallengeProgress,
  completeChallenge,
  abandonChallenge,
  failChallenge,
  processExpiredChallenges,
} from '@/lib/challenges/mutations';
import { getChallengeById, isUserParticipating } from '@/lib/challenges/queries';
import { isChallengeCompleted } from '@/lib/challenges/constants';
import { addXp, awardBadgeById } from '@/lib/gamification';
import { challengeLogger } from '@/lib/utils/logger';

const supabase = mockChain as unknown as import('@supabase/supabase-js').SupabaseClient;

// ============================================================
// joinChallenge
// ============================================================

describe('joinChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('챌린지가 존재하지 않으면 실패를 반환한다', async () => {
    vi.mocked(getChallengeById).mockResolvedValue(null);

    const result = await joinChallenge(supabase, 'user_123', 'ch-nonexist');

    expect(result.success).toBe(false);
    expect(result.message).toContain('찾을 수 없습니다');
  });

  it('이미 참여 중이면 실패를 반환한다', async () => {
    vi.mocked(getChallengeById).mockResolvedValue({
      id: 'ch-1',
      durationDays: 7,
    } as import('@/types/challenges').Challenge);
    vi.mocked(isUserParticipating).mockResolvedValue(true);

    const result = await joinChallenge(supabase, 'user_123', 'ch-1');

    expect(result.success).toBe(false);
    expect(result.message).toContain('이미 참여 중');
  });

  it('정상적으로 챌린지에 참여한다', async () => {
    vi.mocked(getChallengeById).mockResolvedValue({
      id: 'ch-1',
      durationDays: 7,
    } as import('@/types/challenges').Challenge);
    vi.mocked(isUserParticipating).mockResolvedValue(false);

    terminalResult.data = {
      id: 'uc-new',
      clerk_user_id: 'user_123',
      challenge_id: 'ch-1',
      status: 'in_progress',
      progress: { currentDays: 0, totalDays: 7 },
      reward_claimed: false,
      challenges: { id: 'ch-1' },
    };
    terminalResult.error = null;

    const result = await joinChallenge(supabase, 'user_123', 'ch-1');

    expect(result.success).toBe(true);
    expect(result.message).toContain('참여했습니다');
    expect(mockChain.from).toHaveBeenCalledWith('user_challenges');
    expect(mockChain.insert).toHaveBeenCalled();
  });

  it('DB 저장 실패 시 에러를 반환한다', async () => {
    vi.mocked(getChallengeById).mockResolvedValue({
      id: 'ch-1',
      durationDays: 7,
    } as import('@/types/challenges').Challenge);
    vi.mocked(isUserParticipating).mockResolvedValue(false);

    terminalResult.data = null;
    terminalResult.error = { message: 'insert failed' };

    const result = await joinChallenge(supabase, 'user_123', 'ch-1');

    expect(result.success).toBe(false);
    expect(result.message).toContain('실패했습니다');
    expect(challengeLogger.error).toHaveBeenCalled();
  });
});

// ============================================================
// updateChallengeProgress
// ============================================================

describe('updateChallengeProgress', () => {
  const mockProgress = {
    currentDays: 3,
    totalDays: 7,
    completedDays: [1, 2, 3],
    missedDays: [],
    completedCount: 3,
    percentage: 43,
  } as import('@/types/challenges').ChallengeProgress;

  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('현재 상태 조회 실패 시 실패를 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'fetch error' };

    const result = await updateChallengeProgress(supabase, 'uc-1', mockProgress);

    expect(result.success).toBe(false);
    expect(result.isCompleted).toBe(false);
  });

  it('진행 중이 아닌 챌린지는 업데이트를 거부한다', async () => {
    terminalResult.data = {
      id: 'uc-1',
      status: 'completed',
      progress: {},
      reward_claimed: false,
      challenges: null,
    };
    terminalResult.error = null;

    const result = await updateChallengeProgress(supabase, 'uc-1', mockProgress);

    expect(result.success).toBe(false);
    expect(result.isCompleted).toBe(true);
  });

  it('진행 상황을 성공적으로 업데이트한다', async () => {
    // 첫 번째 호출: 현재 상태 조회 (single)
    // 두 번째 호출: update
    // thenable mock은 항상 terminalResult를 반환하므로 순서를 제어해야 함
    let callCount = 0;
    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) => {
      callCount++;
      if (callCount === 1) {
        // 첫 번째: fetch current
        return Promise.resolve(
          cb({
            data: {
              id: 'uc-1',
              status: 'in_progress',
              progress: { currentDays: 2 },
              reward_claimed: false,
              challenges: { id: 'ch-1', target: { type: 'streak', days: 7 } },
            },
            error: null,
          } as unknown as typeof terminalResult)
        );
      }
      // 두 번째: update
      return Promise.resolve(cb({ data: null, error: null } as unknown as typeof terminalResult));
    });

    vi.mocked(isChallengeCompleted).mockReturnValue(false);

    const result = await updateChallengeProgress(supabase, 'uc-1', mockProgress);

    expect(result.success).toBe(true);
    expect(result.isCompleted).toBe(false);
    expect(result.progress).toEqual(mockProgress);

    // then mock 복원
    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) =>
      Promise.resolve(cb(terminalResult))
    );
  });

  it('업데이트 에러 시 실패를 반환한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          cb({
            data: {
              id: 'uc-1',
              status: 'in_progress',
              progress: {},
              reward_claimed: false,
              challenges: null,
            },
            error: null,
          } as unknown as typeof terminalResult)
        );
      }
      return Promise.resolve(
        cb({ data: null, error: { message: 'update fail' } } as unknown as typeof terminalResult)
      );
    });

    const result = await updateChallengeProgress(supabase, 'uc-1', mockProgress);

    expect(result.success).toBe(false);
    expect(challengeLogger.error).toHaveBeenCalled();

    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) =>
      Promise.resolve(cb(terminalResult))
    );
  });

  it('완료 조건 달성 시 isCompleted를 true로 반환한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          cb({
            data: {
              id: 'uc-1',
              status: 'in_progress',
              progress: {},
              reward_claimed: false,
              challenges: { id: 'ch-1', target: { type: 'streak', days: 7 } },
            },
            error: null,
          } as unknown as typeof terminalResult)
        );
      }
      return Promise.resolve(cb({ data: null, error: null } as unknown as typeof terminalResult));
    });

    vi.mocked(isChallengeCompleted).mockReturnValue(true);

    const result = await updateChallengeProgress(supabase, 'uc-1', mockProgress);

    expect(result.success).toBe(true);
    expect(result.isCompleted).toBe(true);

    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) =>
      Promise.resolve(cb(terminalResult))
    );
  });
});

// ============================================================
// completeChallenge
// ============================================================

describe('completeChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('현재 상태 조회 실패 시 실패를 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'fetch error' };

    const result = await completeChallenge(supabase, 'uc-1', 'user_123');

    expect(result.success).toBe(false);
    expect(result.xpAwarded).toBe(0);
  });

  it('이미 보상을 받은 챌린지는 거부한다', async () => {
    terminalResult.data = {
      id: 'uc-1',
      status: 'completed',
      progress: {},
      reward_claimed: true,
      challenges: null,
    };
    terminalResult.error = null;

    const result = await completeChallenge(supabase, 'uc-1', 'user_123');

    expect(result.success).toBe(false);
    expect(result.xpAwarded).toBe(0);
  });

  it('성공적으로 완료하고 XP를 지급한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          cb({
            data: {
              id: 'uc-1',
              status: 'in_progress',
              progress: {},
              reward_claimed: false,
              challenges: {
                id: 'ch-1',
                reward_xp: 100,
                reward_badge_id: null,
              },
            },
            error: null,
          } as unknown as typeof terminalResult)
        );
      }
      return Promise.resolve(cb({ data: null, error: null } as unknown as typeof terminalResult));
    });

    const result = await completeChallenge(supabase, 'uc-1', 'user_123');

    expect(result.success).toBe(true);
    expect(result.xpAwarded).toBe(100);
    expect(addXp).toHaveBeenCalledWith(supabase, 'user_123', 100);

    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) =>
      Promise.resolve(cb(terminalResult))
    );
  });

  it('배지 보상도 함께 지급한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          cb({
            data: {
              id: 'uc-1',
              status: 'in_progress',
              progress: {},
              reward_claimed: false,
              challenges: {
                id: 'ch-1',
                reward_xp: 50,
                reward_badge_id: 'badge-1',
              },
            },
            error: null,
          } as unknown as typeof terminalResult)
        );
      }
      return Promise.resolve(cb({ data: null, error: null } as unknown as typeof terminalResult));
    });

    vi.mocked(awardBadgeById).mockResolvedValue({
      badge: { id: 'badge-1', name: '7일 도전', icon: 'trophy' },
    } as ReturnType<typeof awardBadgeById> extends Promise<infer U> ? U : never);

    const result = await completeChallenge(supabase, 'uc-1', 'user_123');

    expect(result.success).toBe(true);
    expect(result.xpAwarded).toBe(50);
    expect(result.badgeAwarded).toEqual({
      id: 'badge-1',
      name: '7일 도전',
      icon: 'trophy',
    });
    expect(awardBadgeById).toHaveBeenCalledWith(supabase, 'user_123', 'badge-1');

    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) =>
      Promise.resolve(cb(terminalResult))
    );
  });

  it('업데이트 에러 시 실패를 반환한다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          cb({
            data: {
              id: 'uc-1',
              status: 'in_progress',
              progress: {},
              reward_claimed: false,
              challenges: { id: 'ch-1', reward_xp: 100, reward_badge_id: null },
            },
            error: null,
          } as unknown as typeof terminalResult)
        );
      }
      return Promise.resolve(
        cb({
          data: null,
          error: { message: 'update fail' },
        } as unknown as typeof terminalResult)
      );
    });

    const result = await completeChallenge(supabase, 'uc-1', 'user_123');

    expect(result.success).toBe(false);
    expect(result.xpAwarded).toBe(0);

    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) =>
      Promise.resolve(cb(terminalResult))
    );
  });

  it('rewardXp가 0이면 addXp를 호출하지 않는다', async () => {
    let callCount = 0;
    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(
          cb({
            data: {
              id: 'uc-1',
              status: 'in_progress',
              progress: {},
              reward_claimed: false,
              challenges: { id: 'ch-1', reward_xp: 0, reward_badge_id: null },
            },
            error: null,
          } as unknown as typeof terminalResult)
        );
      }
      return Promise.resolve(cb({ data: null, error: null } as unknown as typeof terminalResult));
    });

    const result = await completeChallenge(supabase, 'uc-1', 'user_123');

    expect(result.success).toBe(true);
    expect(result.xpAwarded).toBe(0);
    expect(addXp).not.toHaveBeenCalled();

    mockChain.then.mockImplementation((cb: (v: typeof terminalResult) => void) =>
      Promise.resolve(cb(terminalResult))
    );
  });
});

// ============================================================
// abandonChallenge
// ============================================================

describe('abandonChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('챌린지를 성공적으로 포기한다', async () => {
    terminalResult.data = null;
    terminalResult.error = null;

    const result = await abandonChallenge(supabase, 'uc-1');

    expect(result).toBe(true);
    expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'abandoned' }));
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'uc-1');
  });

  it('에러 발생 시 false를 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'abandon error' };

    const result = await abandonChallenge(supabase, 'uc-1');

    expect(result).toBe(false);
    expect(challengeLogger.error).toHaveBeenCalled();
  });
});

// ============================================================
// failChallenge
// ============================================================

describe('failChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('챌린지를 실패 처리한다', async () => {
    terminalResult.data = null;
    terminalResult.error = null;

    const result = await failChallenge(supabase, 'uc-1');

    expect(result).toBe(true);
    expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });

  it('에러 발생 시 false를 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'fail error' };

    const result = await failChallenge(supabase, 'uc-1');

    expect(result).toBe(false);
    expect(challengeLogger.error).toHaveBeenCalled();
  });
});

// ============================================================
// processExpiredChallenges
// ============================================================

describe('processExpiredChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('만료된 챌린지를 일괄 실패 처리하고 개수를 반환한다', async () => {
    terminalResult.data = [{ id: 'uc-1' }, { id: 'uc-2' }, { id: 'uc-3' }];
    terminalResult.error = null;

    const result = await processExpiredChallenges(supabase);

    expect(result).toBe(3);
    expect(mockChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
    expect(mockChain.eq).toHaveBeenCalledWith('status', 'in_progress');
    expect(mockChain.select).toHaveBeenCalledWith('id');
  });

  it('만료된 챌린지가 없으면 0을 반환한다', async () => {
    terminalResult.data = [];
    terminalResult.error = null;

    const result = await processExpiredChallenges(supabase);

    expect(result).toBe(0);
  });

  it('에러 발생 시 0을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'batch error' };

    const result = await processExpiredChallenges(supabase);

    expect(result).toBe(0);
    expect(challengeLogger.error).toHaveBeenCalled();
  });

  it('data가 null이면 0을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = null;

    const result = await processExpiredChallenges(supabase);

    expect(result).toBe(0);
  });
});
