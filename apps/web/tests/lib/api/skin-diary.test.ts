/**
 * 피부 일기 Repository 테스트
 * @description lib/api/skin-diary.ts의 CRUD, 월간 리포트, 유틸리티 함수 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 터미널 결과 제어 변수
let terminalResult: { data?: unknown; error: unknown } = { data: null, error: null };

// Supabase thenable 체이너블 mock
const mockChain = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
  return chain;
});

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockChain,
}));

vi.mock('@/lib/skincare/correlation', () => ({
  analyzeCorrelations: vi.fn(() => [
    { factor: 'sleep', correlation: 0.8, insight: '수면 상관관계' },
  ]),
}));

import {
  createEntry,
  getEntry,
  updateEntry,
  deleteEntry,
  getEntriesByMonth,
  getEntriesByPeriod,
  updateAiInsights,
} from '@/lib/api/skin-diary';

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
  mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
});

// DB 형식 mock 데이터
const mockDbEntry = {
  id: 'entry_1',
  clerk_user_id: 'user_123',
  entry_date: '2026-01-15',
  skin_condition: 4,
  condition_notes: '촉촉함',
  sleep_hours: 7,
  sleep_quality: 4,
  water_intake_ml: 2000,
  stress_level: 2,
  weather: 'sunny',
  outdoor_hours: 1,
  morning_routine_completed: true,
  evening_routine_completed: false,
  special_treatments: ['mask'],
  ai_correlation_score: null,
  ai_insights: null,
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

describe('createEntry', () => {
  it('피부 일기 엔트리를 성공적으로 생성한다', async () => {
    terminalResult = { data: mockDbEntry, error: null };

    const result = await createEntry('user_123', {
      entryDate: new Date('2026-01-15'),
      skinCondition: 4,
      conditionNotes: '촉촉함',
    });

    expect(mockChain.from).toHaveBeenCalledWith('skin_diary_entries');
    expect(mockChain.insert).toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result!.id).toBe('entry_1');
    expect(result!.skinCondition).toBe(4);
  });

  it('생성 실패 시 null을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'Insert failed' } };

    const result = await createEntry('user_123', {
      entryDate: new Date(),
      skinCondition: 3,
    });

    expect(result).toBeNull();
  });

  it('DB 입력 데이터에 clerk_user_id를 포함한다', async () => {
    terminalResult = { data: mockDbEntry, error: null };

    await createEntry('user_456', {
      entryDate: new Date('2026-01-15'),
      skinCondition: 3,
    });

    const insertArg = (mockChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(insertArg.clerk_user_id).toBe('user_456');
    expect(insertArg.skin_condition).toBe(3);
  });
});

describe('getEntry', () => {
  it('특정 날짜의 엔트리를 반환한다', async () => {
    terminalResult = { data: mockDbEntry, error: null };

    const result = await getEntry('user_123', new Date('2026-01-15'));

    expect(mockChain.eq).toHaveBeenCalledWith('clerk_user_id', 'user_123');
    expect(result).not.toBeNull();
    expect(result!.conditionNotes).toBe('촉촉함');
  });

  it('엔트리가 없으면 null을 반환한다 (PGRST116)', async () => {
    terminalResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } };

    const result = await getEntry('user_123', new Date('2026-12-31'));

    expect(result).toBeNull();
  });

  it('DB 에러 시 null을 반환한다', async () => {
    terminalResult = { data: null, error: { code: 'UNKNOWN', message: 'DB error' } };

    const result = await getEntry('user_123', new Date());

    expect(result).toBeNull();
  });
});

describe('updateEntry', () => {
  it('엔트리를 부분 업데이트한다', async () => {
    terminalResult = { data: { ...mockDbEntry, skin_condition: 5 }, error: null };

    const result = await updateEntry('user_123', 'entry_1', {
      skinCondition: 5,
    });

    expect(mockChain.update).toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result!.skinCondition).toBe(5);
  });

  it('업데이트 실패 시 null을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'Update failed' } };

    const result = await updateEntry('user_123', 'entry_1', {
      skinCondition: 5,
    });

    expect(result).toBeNull();
  });

  it('여러 필드를 동시에 업데이트한다', async () => {
    terminalResult = { data: mockDbEntry, error: null };

    await updateEntry('user_123', 'entry_1', {
      skinCondition: 5,
      sleepHours: 8,
      morningRoutineCompleted: true,
    });

    const updateArg = (mockChain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateArg.skin_condition).toBe(5);
    expect(updateArg.sleep_hours).toBe(8);
    expect(updateArg.morning_routine_completed).toBe(true);
  });
});

describe('deleteEntry', () => {
  it('엔트리를 성공적으로 삭제한다', async () => {
    terminalResult = { error: null };

    const result = await deleteEntry('user_123', 'entry_1');

    expect(mockChain.delete).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('삭제 실패 시 false를 반환한다', async () => {
    terminalResult = { error: { message: 'Delete failed' } };

    const result = await deleteEntry('user_123', 'entry_1');

    expect(result).toBe(false);
  });
});

describe('getEntriesByMonth', () => {
  it('월별 엔트리 목록을 반환한다', async () => {
    const entries = [mockDbEntry, { ...mockDbEntry, id: 'entry_2', entry_date: '2026-01-16' }];
    terminalResult = { data: entries, error: null };

    const result = await getEntriesByMonth('user_123', 2026, 1);

    expect(mockChain.gte).toHaveBeenCalled();
    expect(mockChain.lte).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].entryDate).toBeInstanceOf(Date);
  });

  it('에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getEntriesByMonth('user_123', 2026, 1);

    expect(result).toEqual([]);
  });
});

describe('getEntriesByPeriod', () => {
  it('기간별 엔트리를 반환한다', async () => {
    terminalResult = { data: [mockDbEntry], error: null };

    const result = await getEntriesByPeriod(
      'user_123',
      new Date('2026-01-01'),
      new Date('2026-01-31')
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('entry_1');
  });

  it('에러 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'err' } };

    const result = await getEntriesByPeriod(
      'user_123',
      new Date('2026-01-01'),
      new Date('2026-01-31')
    );

    expect(result).toEqual([]);
  });
});

describe('updateAiInsights', () => {
  it('AI 인사이트를 성공적으로 업데이트한다', async () => {
    terminalResult = { error: null };

    const result = await updateAiInsights('user_123', 'entry_1', 85, [
      { factor: 'sleep', correlation: 0.8, insight: '수면 상관' } as never,
    ]);

    expect(result).toBe(true);
    expect(mockChain.update).toHaveBeenCalledWith({
      ai_correlation_score: 85,
      ai_insights: expect.any(Array),
    });
  });

  it('업데이트 실패 시 false를 반환한다', async () => {
    terminalResult = { error: { message: 'Update failed' } };

    const result = await updateAiInsights('user_123', 'entry_1', 85, []);

    expect(result).toBe(false);
  });
});
