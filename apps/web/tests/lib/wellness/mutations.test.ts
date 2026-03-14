import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveWellnessScore,
  updateWellnessInsights,
  deleteWellnessScore,
  cleanupOldWellnessScores,
} from '@/lib/wellness/mutations';
import type { ScoreBreakdown } from '@/types/wellness';

// Supabase thenable chain mock
const { mockChain, terminalResult } = vi.hoisted(() => {
  const terminalResult = { data: null as unknown, error: null as unknown };
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn((cb: (val: typeof terminalResult) => void) => Promise.resolve(cb(terminalResult))),
  };
  return { mockChain, terminalResult };
});

// wellnessLogger mock
vi.mock('@/lib/utils/logger', () => ({
  wellnessLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockSupabase = mockChain as unknown as import('@supabase/supabase-js').SupabaseClient;

const mockBreakdown: ScoreBreakdown = {
  workout: { streak: 8, frequency: 6, goal: 4 },
  nutrition: { calorie: 7, balance: 5, water: 3 },
  skin: { analysis: 9, routine: 7, matching: 4 },
  body: { analysis: 8, progress: 6, workout: 3 },
};

describe('saveWellnessScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('성공 시 { success: true }를 반환한다', async () => {
    const result = await saveWellnessScore(mockSupabase, 'user_123', {
      totalScore: 80,
      workoutScore: 20,
      nutritionScore: 18,
      skinScore: 22,
      bodyScore: 20,
      scoreBreakdown: mockBreakdown,
    });

    expect(result).toEqual({ success: true });
    expect(mockChain.from).toHaveBeenCalledWith('wellness_scores');
    expect(mockChain.upsert).toHaveBeenCalled();
  });

  it('날짜를 지정하지 않으면 오늘 날짜를 사용한다', async () => {
    await saveWellnessScore(mockSupabase, 'user_123', {
      totalScore: 80,
      workoutScore: 20,
      nutritionScore: 18,
      skinScore: 22,
      bodyScore: 20,
      scoreBreakdown: mockBreakdown,
    });

    const upsertArg = mockChain.upsert.mock.calls[0][0];
    // 오늘 날짜 형식 YYYY-MM-DD
    expect(upsertArg.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('날짜를 지정하면 해당 날짜를 사용한다', async () => {
    await saveWellnessScore(
      mockSupabase,
      'user_123',
      {
        totalScore: 80,
        workoutScore: 20,
        nutritionScore: 18,
        skinScore: 22,
        bodyScore: 20,
        scoreBreakdown: mockBreakdown,
      },
      '2026-01-15'
    );

    const upsertArg = mockChain.upsert.mock.calls[0][0];
    expect(upsertArg.date).toBe('2026-01-15');
  });

  it('insights를 포함하여 저장할 수 있다', async () => {
    const insights = [{ type: 'tip' as const, area: 'workout' as const, message: '좋아요!' }];
    await saveWellnessScore(mockSupabase, 'user_123', {
      totalScore: 80,
      workoutScore: 20,
      nutritionScore: 18,
      skinScore: 22,
      bodyScore: 20,
      scoreBreakdown: mockBreakdown,
      insights,
    });

    const upsertArg = mockChain.upsert.mock.calls[0][0];
    expect(upsertArg.insights).toEqual(insights);
  });

  it('insights가 없으면 빈 배열로 저장한다', async () => {
    await saveWellnessScore(mockSupabase, 'user_123', {
      totalScore: 80,
      workoutScore: 20,
      nutritionScore: 18,
      skinScore: 22,
      bodyScore: 20,
      scoreBreakdown: mockBreakdown,
    });

    const upsertArg = mockChain.upsert.mock.calls[0][0];
    expect(upsertArg.insights).toEqual([]);
  });

  it('DB 에러 시 { success: false, error }를 반환한다', async () => {
    terminalResult.error = { message: 'DB connection failed' };

    const result = await saveWellnessScore(mockSupabase, 'user_123', {
      totalScore: 80,
      workoutScore: 20,
      nutritionScore: 18,
      skinScore: 22,
      bodyScore: 20,
      scoreBreakdown: mockBreakdown,
    });

    expect(result).toEqual({ success: false, error: 'DB connection failed' });
  });

  it('onConflict 옵션으로 upsert한다', async () => {
    await saveWellnessScore(mockSupabase, 'user_123', {
      totalScore: 80,
      workoutScore: 20,
      nutritionScore: 18,
      skinScore: 22,
      bodyScore: 20,
      scoreBreakdown: mockBreakdown,
    });

    const upsertOptions = mockChain.upsert.mock.calls[0][1];
    expect(upsertOptions).toEqual({ onConflict: 'clerk_user_id,date' });
  });
});

describe('updateWellnessInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('성공 시 { success: true }를 반환한다', async () => {
    const insights = [
      { type: 'achievement' as const, area: 'overall' as const, message: '대단해요!' },
    ];

    const result = await updateWellnessInsights(mockSupabase, 'user_123', insights);

    expect(result).toEqual({ success: true });
    expect(mockChain.from).toHaveBeenCalledWith('wellness_scores');
    expect(mockChain.update).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('clerk_user_id', 'user_123');
  });

  it('날짜를 지정하면 해당 날짜 조건을 사용한다', async () => {
    await updateWellnessInsights(mockSupabase, 'user_123', [], '2026-02-01');

    // eq가 date와 함께 호출되었는지 확인
    const eqCalls = mockChain.eq.mock.calls;
    const dateCall = eqCalls.find((c: unknown[]) => c[0] === 'date');
    expect(dateCall).toBeDefined();
    expect(dateCall![1]).toBe('2026-02-01');
  });

  it('DB 에러 시 { success: false, error }를 반환한다', async () => {
    terminalResult.error = { message: 'Update failed' };

    const result = await updateWellnessInsights(mockSupabase, 'user_123', []);

    expect(result).toEqual({ success: false, error: 'Update failed' });
  });
});

describe('deleteWellnessScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('성공 시 { success: true }를 반환한다', async () => {
    const result = await deleteWellnessScore(mockSupabase, 'user_123', '2026-01-15');

    expect(result).toEqual({ success: true });
    expect(mockChain.from).toHaveBeenCalledWith('wellness_scores');
    expect(mockChain.delete).toHaveBeenCalled();
  });

  it('clerk_user_id와 date 조건으로 삭제한다', async () => {
    await deleteWellnessScore(mockSupabase, 'user_456', '2026-03-01');

    const eqCalls = mockChain.eq.mock.calls;
    expect(eqCalls).toContainEqual(['clerk_user_id', 'user_456']);
    expect(eqCalls).toContainEqual(['date', '2026-03-01']);
  });

  it('DB 에러 시 { success: false, error }를 반환한다', async () => {
    terminalResult.error = { message: 'Delete failed' };

    const result = await deleteWellnessScore(mockSupabase, 'user_123', '2026-01-15');

    expect(result).toEqual({ success: false, error: 'Delete failed' });
  });
});

describe('cleanupOldWellnessScores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    terminalResult.data = null;
    terminalResult.error = null;
  });

  it('성공 시 삭제된 개수를 반환한다', async () => {
    terminalResult.data = [{ id: '1' }, { id: '2' }, { id: '3' }];

    const result = await cleanupOldWellnessScores(mockSupabase, 'user_123');

    expect(result).toEqual({ success: true, deletedCount: 3 });
    expect(mockChain.from).toHaveBeenCalledWith('wellness_scores');
    expect(mockChain.delete).toHaveBeenCalled();
  });

  it('삭제할 데이터가 없으면 deletedCount 0을 반환한다', async () => {
    terminalResult.data = [];

    const result = await cleanupOldWellnessScores(mockSupabase, 'user_123');

    expect(result).toEqual({ success: true, deletedCount: 0 });
  });

  it('data가 null이면 deletedCount 0을 반환한다', async () => {
    terminalResult.data = null;

    const result = await cleanupOldWellnessScores(mockSupabase, 'user_123');

    expect(result).toEqual({ success: true, deletedCount: 0 });
  });

  it('기본 보존 기간은 90일이다', async () => {
    terminalResult.data = [];

    await cleanupOldWellnessScores(mockSupabase, 'user_123');

    expect(mockChain.lt).toHaveBeenCalled();
    const ltCall = mockChain.lt.mock.calls[0];
    expect(ltCall[0]).toBe('date');
    // 90일 전 날짜가 전달되었는지 확인
    expect(ltCall[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('커스텀 보존 기간을 지정할 수 있다', async () => {
    terminalResult.data = [];

    await cleanupOldWellnessScores(mockSupabase, 'user_123', 30);

    expect(mockChain.lt).toHaveBeenCalled();
  });

  it('DB 에러 시 { success: false, deletedCount: 0, error }를 반환한다', async () => {
    terminalResult.error = { message: 'Cleanup failed' };

    const result = await cleanupOldWellnessScores(mockSupabase, 'user_123');

    expect(result).toEqual({ success: false, deletedCount: 0, error: 'Cleanup failed' });
  });
});
