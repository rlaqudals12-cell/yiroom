/**
 * 챌린지 조회 함수 테스트
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

vi.mock('@/lib/challenges/constants', () => ({
  challengeRowToChallenge: vi.fn((row: Record<string, unknown>) => ({ ...row, id: row.id })),
  userChallengeRowToUserChallenge: vi.fn((row: Record<string, unknown>) => ({
    ...row,
    status: row.status,
  })),
}));

vi.mock('@/lib/utils/logger', () => ({
  challengeLogger: { error: vi.fn() },
}));

import {
  getActiveChallenges,
  getChallengesByDomain,
  getChallengesByDifficulty,
  getChallengeById,
  getChallengeByCode,
  getUserChallenges,
  getActiveUserChallenges,
  getCompletedUserChallenges,
  getUserChallengeByChallenge,
  isUserParticipating,
  getUserChallengeStats,
} from '@/lib/challenges/queries';
import { challengeLogger } from '@/lib/utils/logger';

const supabase = mockChain as unknown as import('@supabase/supabase-js').SupabaseClient;

// ============================================================
// 테스트 데이터
// ============================================================

const mockChallengeRow = {
  id: 'ch-1',
  code: 'SKIN_7DAY',
  name: '7일 피부 관리',
  domain: 'skin',
  difficulty: 'easy',
  is_active: true,
  sort_order: 1,
};

const mockUserChallengeRow = {
  id: 'uc-1',
  clerk_user_id: 'user_123',
  challenge_id: 'ch-1',
  status: 'in_progress',
  challenges: mockChallengeRow,
};

// ============================================================
// getActiveChallenges
// ============================================================

describe('getActiveChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('활성 챌린지 목록을 반환한다', async () => {
    terminalResult.data = [mockChallengeRow, { ...mockChallengeRow, id: 'ch-2' }];
    terminalResult.error = null;

    const result = await getActiveChallenges(supabase);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('id', 'ch-1');
    expect(mockChain.from).toHaveBeenCalledWith('challenges');
    expect(mockChain.eq).toHaveBeenCalledWith('is_active', true);
  });

  it('에러 발생 시 빈 배열을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'DB error' };

    const result = await getActiveChallenges(supabase);

    expect(result).toEqual([]);
    expect(challengeLogger.error).toHaveBeenCalled();
  });
});

// ============================================================
// getChallengesByDomain
// ============================================================

describe('getChallengesByDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('도메인별 챌린지를 반환한다', async () => {
    terminalResult.data = [mockChallengeRow];
    terminalResult.error = null;

    const result = await getChallengesByDomain(
      supabase,
      'skin' as import('@/types/challenges').ChallengeDomain
    );

    expect(result).toHaveLength(1);
    expect(mockChain.eq).toHaveBeenCalledWith('domain', 'skin');
  });

  it('에러 발생 시 빈 배열을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'domain error' };

    const result = await getChallengesByDomain(
      supabase,
      'skin' as import('@/types/challenges').ChallengeDomain
    );

    expect(result).toEqual([]);
    expect(challengeLogger.error).toHaveBeenCalled();
  });
});

// ============================================================
// getChallengesByDifficulty
// ============================================================

describe('getChallengesByDifficulty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('난이도별 챌린지를 반환한다', async () => {
    terminalResult.data = [mockChallengeRow];
    terminalResult.error = null;

    const result = await getChallengesByDifficulty(
      supabase,
      'easy' as import('@/types/challenges').ChallengeDifficulty
    );

    expect(result).toHaveLength(1);
    expect(mockChain.eq).toHaveBeenCalledWith('difficulty', 'easy');
  });

  it('에러 발생 시 빈 배열을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'difficulty error' };

    const result = await getChallengesByDifficulty(
      supabase,
      'hard' as import('@/types/challenges').ChallengeDifficulty
    );

    expect(result).toEqual([]);
    expect(challengeLogger.error).toHaveBeenCalled();
  });
});

// ============================================================
// getChallengeById
// ============================================================

describe('getChallengeById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('ID로 챌린지를 반환한다', async () => {
    terminalResult.data = mockChallengeRow;
    terminalResult.error = null;

    const result = await getChallengeById(supabase, 'ch-1');

    expect(result).toHaveProperty('id', 'ch-1');
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'ch-1');
    expect(mockChain.single).toHaveBeenCalled();
  });

  it('PGRST116 에러 시 로그 없이 null을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { code: 'PGRST116', message: 'not found' };

    const result = await getChallengeById(supabase, 'nonexistent');

    expect(result).toBeNull();
    expect(challengeLogger.error).not.toHaveBeenCalled();
  });

  it('PGRST116이 아닌 에러 시 로그를 남기고 null을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { code: 'OTHER', message: 'server error' };

    const result = await getChallengeById(supabase, 'ch-1');

    expect(result).toBeNull();
    expect(challengeLogger.error).toHaveBeenCalled();
  });
});

// ============================================================
// getChallengeByCode
// ============================================================

describe('getChallengeByCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('코드로 챌린지를 반환한다', async () => {
    terminalResult.data = mockChallengeRow;
    terminalResult.error = null;

    const result = await getChallengeByCode(supabase, 'SKIN_7DAY');

    expect(result).toHaveProperty('id', 'ch-1');
    expect(mockChain.eq).toHaveBeenCalledWith('code', 'SKIN_7DAY');
  });

  it('PGRST116 에러 시 로그 없이 null을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { code: 'PGRST116', message: 'not found' };

    const result = await getChallengeByCode(supabase, 'NONEXIST');

    expect(result).toBeNull();
    expect(challengeLogger.error).not.toHaveBeenCalled();
  });

  it('기타 에러 시 로그를 남긴다', async () => {
    terminalResult.data = null;
    terminalResult.error = { code: 'DB_ERR', message: 'db crash' };

    const result = await getChallengeByCode(supabase, 'CODE');

    expect(result).toBeNull();
    expect(challengeLogger.error).toHaveBeenCalled();
  });
});

// ============================================================
// getUserChallenges
// ============================================================

describe('getUserChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('사용자의 모든 챌린지를 조회한다', async () => {
    terminalResult.data = [mockUserChallengeRow];
    terminalResult.error = null;

    const result = await getUserChallenges(supabase, 'user_123');

    expect(result).toHaveLength(1);
    expect(mockChain.select).toHaveBeenCalledWith('*, challenges(*)');
    expect(mockChain.eq).toHaveBeenCalledWith('clerk_user_id', 'user_123');
  });

  it('에러 발생 시 빈 배열을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'fetch error' };

    const result = await getUserChallenges(supabase, 'user_123');

    expect(result).toEqual([]);
  });
});

// ============================================================
// getActiveUserChallenges
// ============================================================

describe('getActiveUserChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('진행 중인 챌린지만 조회한다', async () => {
    terminalResult.data = [mockUserChallengeRow];
    terminalResult.error = null;

    const result = await getActiveUserChallenges(supabase, 'user_123');

    expect(result).toHaveLength(1);
    expect(mockChain.eq).toHaveBeenCalledWith('status', 'in_progress');
  });

  it('에러 시 빈 배열을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'err' };

    const result = await getActiveUserChallenges(supabase, 'user_123');

    expect(result).toEqual([]);
  });
});

// ============================================================
// getCompletedUserChallenges
// ============================================================

describe('getCompletedUserChallenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('완료된 챌린지만 조회한다', async () => {
    const completedRow = { ...mockUserChallengeRow, status: 'completed' };
    terminalResult.data = [completedRow];
    terminalResult.error = null;

    const result = await getCompletedUserChallenges(supabase, 'user_123');

    expect(result).toHaveLength(1);
    expect(mockChain.eq).toHaveBeenCalledWith('status', 'completed');
  });

  it('에러 시 빈 배열을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'err' };

    const result = await getCompletedUserChallenges(supabase, 'user_123');

    expect(result).toEqual([]);
  });
});

// ============================================================
// getUserChallengeByChallenge
// ============================================================

describe('getUserChallengeByChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('사용자+챌린지 조합으로 조회한다', async () => {
    terminalResult.data = mockUserChallengeRow;
    terminalResult.error = null;

    const result = await getUserChallengeByChallenge(supabase, 'user_123', 'ch-1');

    expect(result).toHaveProperty('status', 'in_progress');
    expect(mockChain.eq).toHaveBeenCalledWith('clerk_user_id', 'user_123');
    expect(mockChain.eq).toHaveBeenCalledWith('challenge_id', 'ch-1');
  });

  it('PGRST116 에러 시 로그 없이 null을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { code: 'PGRST116', message: 'not found' };

    const result = await getUserChallengeByChallenge(supabase, 'user_123', 'ch-x');

    expect(result).toBeNull();
    expect(challengeLogger.error).not.toHaveBeenCalled();
  });

  it('기타 에러 시 로그를 남기고 null을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { code: 'ERR', message: 'db error' };

    const result = await getUserChallengeByChallenge(supabase, 'user_123', 'ch-1');

    expect(result).toBeNull();
    expect(challengeLogger.error).toHaveBeenCalled();
  });
});

// ============================================================
// isUserParticipating
// ============================================================

describe('isUserParticipating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('참여 중이면 true를 반환한다', async () => {
    terminalResult.data = [{ id: 'uc-1' }];
    terminalResult.error = null;

    const result = await isUserParticipating(supabase, 'user_123', 'ch-1');

    expect(result).toBe(true);
    expect(mockChain.eq).toHaveBeenCalledWith('status', 'in_progress');
    expect(mockChain.limit).toHaveBeenCalledWith(1);
  });

  it('참여 중이 아니면 false를 반환한다', async () => {
    terminalResult.data = [];
    terminalResult.error = null;

    const result = await isUserParticipating(supabase, 'user_123', 'ch-99');

    expect(result).toBe(false);
  });

  it('에러 발생 시 false를 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'check error' };

    const result = await isUserParticipating(supabase, 'user_123', 'ch-1');

    expect(result).toBe(false);
    expect(challengeLogger.error).toHaveBeenCalled();
  });
});

// ============================================================
// getUserChallengeStats
// ============================================================

describe('getUserChallengeStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('상태별 통계를 올바르게 집계한다', async () => {
    terminalResult.data = [
      { status: 'in_progress' },
      { status: 'in_progress' },
      { status: 'completed' },
      { status: 'failed' },
      { status: 'abandoned' },
    ];
    terminalResult.error = null;

    const result = await getUserChallengeStats(supabase, 'user_123');

    expect(result.total).toBe(5);
    expect(result.inProgress).toBe(2);
    expect(result.completed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.abandoned).toBe(1);
  });

  it('데이터가 없으면 모두 0을 반환한다', async () => {
    terminalResult.data = [];
    terminalResult.error = null;

    const result = await getUserChallengeStats(supabase, 'user_123');

    expect(result.total).toBe(0);
    expect(result.inProgress).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.abandoned).toBe(0);
  });

  it('에러 발생 시 모두 0을 반환한다', async () => {
    terminalResult.data = null;
    terminalResult.error = { message: 'stats error' };

    const result = await getUserChallengeStats(supabase, 'user_123');

    expect(result).toEqual({
      total: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      abandoned: 0,
    });
    expect(challengeLogger.error).toHaveBeenCalled();
  });

  it('알 수 없는 상태값은 무시한다', async () => {
    terminalResult.data = [{ status: 'in_progress' }, { status: 'unknown_status' }];
    terminalResult.error = null;

    const result = await getUserChallengeStats(supabase, 'user_123');

    expect(result.total).toBe(2);
    expect(result.inProgress).toBe(1);
    expect(result.completed).toBe(0);
  });
});
