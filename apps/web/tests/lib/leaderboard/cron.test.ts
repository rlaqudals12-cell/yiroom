import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateAllLeaderboards,
  updateLeaderboardCache,
  cleanupOldCache,
} from '@/lib/leaderboard/cron';

// Mock Supabase Client
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockIn = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockLt = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  upsert: mockUpsert,
  delete: mockDelete,
}));

const createMockSupabase = () => ({
  from: mockFrom,
});

describe('updateLeaderboardCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 mock 체인 설정
    mockSelect.mockReturnValue({
      order: mockOrder,
      in: mockIn,
    });

    mockOrder.mockReturnValue({
      order: mockOrder,
      limit: mockLimit,
    });

    mockLimit.mockResolvedValue({
      data: [
        { clerk_user_id: 'user-1', level: 10, total_xp: 500, tier: 'beginner' },
        { clerk_user_id: 'user-2', level: 8, total_xp: 400, tier: 'beginner' },
      ],
      error: null,
    });

    mockIn.mockResolvedValue({
      data: [
        { clerk_user_id: 'user-1', display_name: '김철수', avatar_url: null },
        { clerk_user_id: 'user-2', display_name: '이영희', avatar_url: null },
      ],
      error: null,
    });

    mockUpsert.mockResolvedValue({ error: null });
  });

  it('주간 리더보드 캐시 업데이트', async () => {
    const supabase = createMockSupabase();
    const result = await updateLeaderboardCache(supabase as any, 'weekly', 'xp');

    expect(result.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('월간 리더보드 캐시 업데이트', async () => {
    const supabase = createMockSupabase();
    const result = await updateLeaderboardCache(supabase as any, 'monthly', 'level');

    expect(result.success).toBe(true);
  });

  it('전체 기간 리더보드 캐시 업데이트', async () => {
    const supabase = createMockSupabase();
    const result = await updateLeaderboardCache(supabase as any, 'all_time', 'xp');

    expect(result.success).toBe(true);
  });

  it('upsert 오류 시 실패 반환', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB Error' } });

    const supabase = createMockSupabase();
    const result = await updateLeaderboardCache(supabase as any, 'weekly', 'xp');

    expect(result.success).toBe(false);
    expect(result.error).toBe('DB Error');
  });

  it('랭킹 데이터 조회 실패 시 빈 배열', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'Query Error' } });

    const supabase = createMockSupabase();
    await updateLeaderboardCache(supabase as any, 'weekly', 'xp');

    // 빈 배열로도 캐시 업데이트는 진행됨
    expect(mockUpsert).toHaveBeenCalled();
  });
});

describe('updateAllLeaderboards', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSelect.mockReturnValue({
      order: mockOrder,
      in: mockIn,
    });

    mockOrder.mockReturnValue({
      order: mockOrder,
      limit: mockLimit,
    });

    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    });

    mockIn.mockResolvedValue({
      data: [],
      error: null,
    });

    mockUpsert.mockResolvedValue({ error: null });
  });

  it('모든 리더보드 업데이트', async () => {
    const supabase = createMockSupabase();
    const result = await updateAllLeaderboards(supabase as any);

    // 3 periods × 2 categories = 6 updates
    expect(result.updated).toBe(6);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('일부 업데이트 실패 시 에러 수집', async () => {
    let callCount = 0;
    mockUpsert.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ error: { message: 'First Error' } });
      }
      return Promise.resolve({ error: null });
    });

    const supabase = createMockSupabase();
    const result = await updateAllLeaderboards(supabase as any);

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('cleanupOldCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockDelete.mockReturnValue({
      lt: mockLt,
    });

    mockLt.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: '1' }, { id: '2' }],
        error: null,
      }),
    });
  });

  it('오래된 캐시 정리', async () => {
    const supabase = createMockSupabase();
    const result = await cleanupOldCache(supabase as any, 90);

    expect(result.success).toBe(true);
    expect(result.deleted).toBe(2);
  });

  it('삭제할 캐시 없음', async () => {
    mockLt.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    });

    const supabase = createMockSupabase();
    const result = await cleanupOldCache(supabase as any);

    expect(result.success).toBe(true);
    expect(result.deleted).toBe(0);
  });

  it('삭제 오류 처리', async () => {
    mockLt.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete Error' },
      }),
    });

    const supabase = createMockSupabase();
    const result = await cleanupOldCache(supabase as any);

    expect(result.success).toBe(false);
    expect(result.deleted).toBe(0);
  });
});
