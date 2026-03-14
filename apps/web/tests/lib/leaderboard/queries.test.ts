/**
 * 리더보드 쿼리 테스트
 * @description lib/leaderboard/queries.ts의 리더보드 조회 함수 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils/logger', () => ({
  leaderboardLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import {
  getLeaderboard,
  getTopRankings,
  getMyRanking,
  calculateXpLeaderboard,
  calculateLevelLeaderboard,
  calculateWellnessLeaderboard,
  calculateWorkoutLeaderboard,
  calculateNutritionLeaderboard,
  getFriendsLeaderboard,
} from '@/lib/leaderboard/queries';
import type { LeaderboardCacheRow, RankingEntry } from '@/types/leaderboard';

// ============================================================================
// Supabase mock 팩토리
// ============================================================================

// 각 테스트에서 호출 순서별 결과를 지정할 수 있는 mock 생성
function createMockSupabase(results: Array<{ data: unknown; error: unknown }>) {
  let callIndex = 0;

  const chain: Record<string, unknown> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.or = vi.fn(() => chain);
  chain.not = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    const result = results[callIndex] ?? { data: null, error: null };
    callIndex++;
    return Promise.resolve(result).then(resolve);
  });

  return chain;
}

// ============================================================================
// 테스트 데이터
// ============================================================================

const mockRankings: RankingEntry[] = [
  {
    rank: 1,
    userId: 'user_001',
    displayName: '김철수',
    avatarUrl: null,
    score: 5000,
    level: 10,
    tier: 'gold',
  },
  {
    rank: 2,
    userId: 'user_002',
    displayName: '이영희',
    avatarUrl: null,
    score: 4500,
    level: 9,
    tier: 'gold',
  },
  {
    rank: 3,
    userId: 'user_003',
    displayName: '박지민',
    avatarUrl: null,
    score: 4000,
    level: 8,
    tier: 'silver',
  },
];

const mockLeaderboardCacheRow: LeaderboardCacheRow = {
  id: 'lb_001',
  period: 'weekly',
  category: 'xp',
  start_date: '2026-01-13',
  end_date: '2026-01-19',
  rankings: mockRankings,
  total_participants: 50,
  created_at: '2026-01-13T00:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

// ============================================================================
// 테스트
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getLeaderboard', () => {
  it('주간 리더보드를 반환한다', async () => {
    const supabase = createMockSupabase([{ data: mockLeaderboardCacheRow, error: null }]);

    const result = await getLeaderboard(supabase as never, 'weekly', 'xp');

    expect(result).not.toBeNull();
    expect(result!.period).toBe('weekly');
    expect(result!.category).toBe('xp');
    expect(result!.rankings).toHaveLength(3);
    expect(result!.totalParticipants).toBe(50);
  });

  it('월간 리더보드를 조회한다', async () => {
    const supabase = createMockSupabase([
      { data: { ...mockLeaderboardCacheRow, period: 'monthly' }, error: null },
    ]);

    const result = await getLeaderboard(supabase as never, 'monthly', 'xp');

    expect(result).not.toBeNull();
  });

  it('all_time 리더보드를 조회한다', async () => {
    const supabase = createMockSupabase([
      { data: { ...mockLeaderboardCacheRow, period: 'all_time' }, error: null },
    ]);

    const result = await getLeaderboard(supabase as never, 'all_time', 'xp');

    expect(result).not.toBeNull();
  });

  it('DB 에러 시 null을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: null, error: { message: 'DB error' } }]);

    const result = await getLeaderboard(supabase as never, 'weekly', 'xp');

    expect(result).toBeNull();
  });

  it('데이터가 없으면 null을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: null, error: null }]);

    const result = await getLeaderboard(supabase as never, 'weekly', 'xp');

    expect(result).toBeNull();
  });

  it('특정 날짜 기준으로 조회한다', async () => {
    const supabase = createMockSupabase([{ data: mockLeaderboardCacheRow, error: null }]);

    const result = await getLeaderboard(supabase as never, 'weekly', 'xp', new Date('2026-01-15'));

    expect(result).not.toBeNull();
    expect(supabase.eq).toHaveBeenCalledWith('period', 'weekly');
    expect(supabase.eq).toHaveBeenCalledWith('category', 'xp');
  });
});

describe('getTopRankings', () => {
  it('상위 N명의 랭킹을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: mockLeaderboardCacheRow, error: null }]);

    const result = await getTopRankings(supabase as never, 'weekly', 'xp', 2);

    expect(result).toHaveLength(2);
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
  });

  it('리더보드가 없으면 빈 배열을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: null, error: null }]);

    const result = await getTopRankings(supabase as never, 'weekly', 'xp');

    expect(result).toEqual([]);
  });

  it('기본 limit은 TOP_RANKINGS_COUNT (10)이다', async () => {
    const supabase = createMockSupabase([{ data: mockLeaderboardCacheRow, error: null }]);

    const result = await getTopRankings(supabase as never, 'weekly', 'xp');

    // 데이터가 3개뿐이므로 3개 반환
    expect(result).toHaveLength(3);
  });
});

describe('getMyRanking', () => {
  it('내 순위 정보를 반환한다', async () => {
    const supabase = createMockSupabase([{ data: mockLeaderboardCacheRow, error: null }]);

    const result = await getMyRanking(supabase as never, 'user_001', 'weekly', 'xp');

    expect(result).not.toBeNull();
    expect(result!.rank).toBe(1);
    expect(result!.score).toBe(5000);
    expect(result!.category).toBe('xp');
    expect(result!.period).toBe('weekly');
    expect(result!.percentile).toBeGreaterThan(0);
  });

  it('랭킹에 없는 사용자는 마지막 순위를 반환한다', async () => {
    const supabase = createMockSupabase([{ data: mockLeaderboardCacheRow, error: null }]);

    const result = await getMyRanking(supabase as never, 'nonexistent_user', 'weekly', 'xp');

    expect(result).not.toBeNull();
    expect(result!.rank).toBe(51); // totalParticipants + 1
    expect(result!.score).toBe(0);
    expect(result!.percentile).toBe(0);
  });

  it('리더보드가 없으면 null을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: null, error: null }]);

    const result = await getMyRanking(supabase as never, 'user_001', 'weekly', 'xp');

    expect(result).toBeNull();
  });
});

describe('calculateXpLeaderboard', () => {
  it('XP 기준 리더보드를 계산한다', async () => {
    const supabase = createMockSupabase([
      // user_levels 조회
      {
        data: [
          { clerk_user_id: 'user_001', level: 10, total_xp: 5000, tier: 'gold' },
          { clerk_user_id: 'user_002', level: 8, total_xp: 3000, tier: 'silver' },
        ],
        error: null,
      },
      // users 조회
      {
        data: [
          { clerk_user_id: 'user_001', display_name: '김철수', avatar_url: null },
          { clerk_user_id: 'user_002', display_name: '이영희', avatar_url: null },
        ],
        error: null,
      },
    ]);

    const result = await calculateXpLeaderboard(supabase as never);

    expect(result).toHaveLength(2);
    expect(result[0].rank).toBe(1);
    expect(result[0].userId).toBe('user_001');
    expect(result[0].score).toBe(5000);
    expect(result[0].displayName).toBe('김철수');
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: null, error: { message: 'error' } }]);

    const result = await calculateXpLeaderboard(supabase as never);

    expect(result).toEqual([]);
  });

  it('사용자 정보가 없으면 기본값을 사용한다', async () => {
    const supabase = createMockSupabase([
      {
        data: [{ clerk_user_id: 'user_001', level: 5, total_xp: 1000, tier: 'bronze' }],
        error: null,
      },
      { data: [], error: null },
    ]);

    const result = await calculateXpLeaderboard(supabase as never);

    expect(result[0].displayName).toBe('사용자');
  });
});

describe('calculateLevelLeaderboard', () => {
  it('레벨 기준 리더보드를 계산한다', async () => {
    const supabase = createMockSupabase([
      {
        data: [{ clerk_user_id: 'user_001', level: 10, total_xp: 5000, tier: 'gold' }],
        error: null,
      },
      {
        data: [{ clerk_user_id: 'user_001', display_name: '김철수', avatar_url: null }],
        error: null,
      },
    ]);

    const result = await calculateLevelLeaderboard(supabase as never);

    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(10); // 레벨이 점수
    expect(result[0].level).toBe(10);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: null, error: { message: 'error' } }]);

    const result = await calculateLevelLeaderboard(supabase as never);

    expect(result).toEqual([]);
  });
});

describe('calculateWellnessLeaderboard', () => {
  it('웰니스 스코어 기준 리더보드를 계산한다', async () => {
    const supabase = createMockSupabase([
      // wellness_scores 조회 (사용자별 여러 행, 최신만 사용)
      {
        data: [
          {
            clerk_user_id: 'user_001',
            total_score: 90,
            workout_score: 45,
            nutrition_score: 45,
            wellness_date: '2026-01-15',
          },
          {
            clerk_user_id: 'user_001',
            total_score: 80,
            workout_score: 40,
            nutrition_score: 40,
            wellness_date: '2026-01-14',
          },
          {
            clerk_user_id: 'user_002',
            total_score: 85,
            workout_score: 42,
            nutrition_score: 43,
            wellness_date: '2026-01-15',
          },
        ],
        error: null,
      },
      // users 조회
      {
        data: [
          { clerk_user_id: 'user_001', display_name: '김철수', avatar_url: null },
          { clerk_user_id: 'user_002', display_name: '이영희', avatar_url: null },
        ],
        error: null,
      },
      // user_levels 조회
      {
        data: [
          { clerk_user_id: 'user_001', level: 10, tier: 'gold' },
          { clerk_user_id: 'user_002', level: 8, tier: 'silver' },
        ],
        error: null,
      },
    ]);

    const result = await calculateWellnessLeaderboard(supabase as never);

    expect(result).toHaveLength(2);
    // user_001의 최신 점수가 90이므로 1위
    expect(result[0].userId).toBe('user_001');
    expect(result[0].score).toBe(90);
    expect(result[1].userId).toBe('user_002');
    expect(result[1].score).toBe(85);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: null, error: { message: 'error' } }]);

    const result = await calculateWellnessLeaderboard(supabase as never);

    expect(result).toEqual([]);
  });

  it('레벨 정보가 없으면 기본값을 사용한다', async () => {
    const supabase = createMockSupabase([
      {
        data: [
          {
            clerk_user_id: 'user_001',
            total_score: 90,
            workout_score: 45,
            nutrition_score: 45,
            wellness_date: '2026-01-15',
          },
        ],
        error: null,
      },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await calculateWellnessLeaderboard(supabase as never);

    expect(result[0].level).toBe(1);
    expect(result[0].tier).toBe('bronze');
  });
});

describe('calculateWorkoutLeaderboard', () => {
  it('운동 시간 기준 리더보드를 계산한다', async () => {
    const supabase = createMockSupabase([
      // workout_logs 조회
      {
        data: [
          {
            user_id: 'uuid_001',
            actual_duration: 60,
            actual_calories: 300,
            completed_at: '2026-01-15T10:00:00Z',
          },
          {
            user_id: 'uuid_001',
            actual_duration: 45,
            actual_calories: 200,
            completed_at: '2026-01-16T10:00:00Z',
          },
          {
            user_id: 'uuid_002',
            actual_duration: 30,
            actual_calories: 150,
            completed_at: '2026-01-15T10:00:00Z',
          },
        ],
        error: null,
      },
      // users 매핑 조회
      {
        data: [
          { id: 'uuid_001', clerk_user_id: 'user_001' },
          { id: 'uuid_002', clerk_user_id: 'user_002' },
        ],
        error: null,
      },
      // users 정보 조회
      {
        data: [
          { clerk_user_id: 'user_001', display_name: '김철수', avatar_url: null },
          { clerk_user_id: 'user_002', display_name: '이영희', avatar_url: null },
        ],
        error: null,
      },
      // user_levels 조회
      {
        data: [
          { clerk_user_id: 'user_001', level: 5, tier: 'silver' },
          { clerk_user_id: 'user_002', level: 3, tier: 'bronze' },
        ],
        error: null,
      },
    ]);

    const result = await calculateWorkoutLeaderboard(supabase as never);

    expect(result).toHaveLength(2);
    // user_001: 60 + 45 = 105분
    expect(result[0].userId).toBe('user_001');
    expect(result[0].score).toBe(105);
    // user_002: 30분
    expect(result[1].userId).toBe('user_002');
    expect(result[1].score).toBe(30);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: null, error: { message: 'error' } }]);

    const result = await calculateWorkoutLeaderboard(supabase as never);

    expect(result).toEqual([]);
  });

  it('duration이 null이면 0으로 처리한다', async () => {
    const supabase = createMockSupabase([
      {
        data: [
          {
            user_id: 'uuid_001',
            actual_duration: null,
            actual_calories: null,
            completed_at: '2026-01-15T10:00:00Z',
          },
        ],
        error: null,
      },
      { data: [{ id: 'uuid_001', clerk_user_id: 'user_001' }], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await calculateWorkoutLeaderboard(supabase as never);

    expect(result).toHaveLength(1);
    expect(result[0].score).toBe(0);
  });
});

describe('calculateNutritionLeaderboard', () => {
  it('영양 기록 기준 리더보드를 계산한다', async () => {
    const supabase = createMockSupabase([
      // daily_nutrition_summary 조회
      {
        data: [
          {
            clerk_user_id: 'user_001',
            record_date: '2026-01-13',
            total_calories: 2000,
            goal_met: true,
          },
          {
            clerk_user_id: 'user_001',
            record_date: '2026-01-14',
            total_calories: 1800,
            goal_met: true,
          },
          {
            clerk_user_id: 'user_001',
            record_date: '2026-01-15',
            total_calories: 2200,
            goal_met: false,
          },
          {
            clerk_user_id: 'user_002',
            record_date: '2026-01-13',
            total_calories: 1900,
            goal_met: true,
          },
        ],
        error: null,
      },
      // users 조회
      {
        data: [
          { clerk_user_id: 'user_001', display_name: '김철수', avatar_url: null },
          { clerk_user_id: 'user_002', display_name: '이영희', avatar_url: null },
        ],
        error: null,
      },
      // user_levels 조회
      {
        data: [
          { clerk_user_id: 'user_001', level: 5, tier: 'silver' },
          { clerk_user_id: 'user_002', level: 3, tier: 'bronze' },
        ],
        error: null,
      },
    ]);

    const result = await calculateNutritionLeaderboard(supabase as never);

    expect(result).toHaveLength(2);
    // user_001: goalMetDays=2, recordDays=3
    // user_002: goalMetDays=1, recordDays=1
    // 목표 달성일 순 → user_001 먼저
    expect(result[0].userId).toBe('user_001');
    expect(result[0].score).toBe(2); // goalMetDays
    expect(result[1].userId).toBe('user_002');
    expect(result[1].score).toBe(1);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: null, error: { message: 'error' } }]);

    const result = await calculateNutritionLeaderboard(supabase as never);

    expect(result).toEqual([]);
  });

  it('목표 달성일이 같으면 기록일 수로 정렬한다', async () => {
    const supabase = createMockSupabase([
      {
        data: [
          {
            clerk_user_id: 'user_001',
            record_date: '2026-01-13',
            total_calories: 2000,
            goal_met: true,
          },
          {
            clerk_user_id: 'user_002',
            record_date: '2026-01-13',
            total_calories: 1900,
            goal_met: true,
          },
          {
            clerk_user_id: 'user_002',
            record_date: '2026-01-14',
            total_calories: 1800,
            goal_met: false,
          },
        ],
        error: null,
      },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await calculateNutritionLeaderboard(supabase as never);

    // 둘 다 goalMetDays=1, user_002가 recordDays=2로 더 많음
    expect(result[0].userId).toBe('user_002');
    expect(result[1].userId).toBe('user_001');
  });
});

describe('getFriendsLeaderboard', () => {
  it('친구 리더보드를 반환한다', async () => {
    const supabase = createMockSupabase([
      // friendships 조회
      {
        data: [
          { requester_id: 'user_001', addressee_id: 'user_002' },
          { requester_id: 'user_003', addressee_id: 'user_001' },
        ],
        error: null,
      },
      // user_levels 조회
      {
        data: [
          { clerk_user_id: 'user_001', level: 10, total_xp: 5000, tier: 'gold' },
          { clerk_user_id: 'user_002', level: 8, total_xp: 3000, tier: 'silver' },
          { clerk_user_id: 'user_003', level: 6, total_xp: 2000, tier: 'bronze' },
        ],
        error: null,
      },
      // users 조회
      {
        data: [
          { clerk_user_id: 'user_001', display_name: '김철수', avatar_url: null },
          { clerk_user_id: 'user_002', display_name: '이영희', avatar_url: null },
          { clerk_user_id: 'user_003', display_name: '박지민', avatar_url: null },
        ],
        error: null,
      },
    ]);

    const result = await getFriendsLeaderboard(supabase as never, 'user_001');

    expect(result).toHaveLength(3);
    // 본인 + 친구 2명
    expect(result[0].rank).toBe(1);
  });

  it('친구가 없으면 빈 배열을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: [], error: null }]);

    const result = await getFriendsLeaderboard(supabase as never, 'user_001');

    expect(result).toEqual([]);
  });

  it('friendships가 null이면 빈 배열을 반환한다', async () => {
    const supabase = createMockSupabase([{ data: null, error: null }]);

    const result = await getFriendsLeaderboard(supabase as never, 'user_001');

    expect(result).toEqual([]);
  });

  it('level 카테고리로 조회한다', async () => {
    const supabase = createMockSupabase([
      {
        data: [{ requester_id: 'user_001', addressee_id: 'user_002' }],
        error: null,
      },
      {
        data: [
          { clerk_user_id: 'user_001', level: 10, total_xp: 5000, tier: 'gold' },
          { clerk_user_id: 'user_002', level: 8, total_xp: 3000, tier: 'silver' },
        ],
        error: null,
      },
      {
        data: [
          { clerk_user_id: 'user_001', display_name: '김철수', avatar_url: null },
          { clerk_user_id: 'user_002', display_name: '이영희', avatar_url: null },
        ],
        error: null,
      },
    ]);

    const result = await getFriendsLeaderboard(supabase as never, 'user_001', 'level');

    expect(result).toHaveLength(2);
    // level 카테고리이므로 score = entry.level
    expect(result[0].score).toBe(10);
  });

  it('DB 에러 시 빈 배열을 반환한다', async () => {
    const supabase = createMockSupabase([
      {
        data: [{ requester_id: 'user_001', addressee_id: 'user_002' }],
        error: null,
      },
      { data: null, error: { message: 'error' } },
    ]);

    const result = await getFriendsLeaderboard(supabase as never, 'user_001');

    expect(result).toEqual([]);
  });

  it('addressee가 본인인 경우 requester를 친구로 추출한다', async () => {
    const supabase = createMockSupabase([
      {
        data: [{ requester_id: 'user_002', addressee_id: 'user_001' }],
        error: null,
      },
      {
        data: [
          { clerk_user_id: 'user_001', level: 5, total_xp: 2000, tier: 'silver' },
          { clerk_user_id: 'user_002', level: 3, total_xp: 1000, tier: 'bronze' },
        ],
        error: null,
      },
      {
        data: [
          { clerk_user_id: 'user_001', display_name: '나', avatar_url: null },
          { clerk_user_id: 'user_002', display_name: '친구', avatar_url: null },
        ],
        error: null,
      },
    ]);

    const result = await getFriendsLeaderboard(supabase as never, 'user_001');

    // user_002가 친구로 포함되어야 함
    const userIds = result.map((r) => r.userId);
    expect(userIds).toContain('user_002');
    expect(userIds).toContain('user_001');
  });
});
