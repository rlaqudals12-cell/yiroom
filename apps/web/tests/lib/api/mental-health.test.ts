/**
 * M-1 정신건강 트래킹 Repository 테스트
 * @description lib/api/mental-health.ts의 CRUD, 통계, 유틸리티 함수 테스트
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 터미널 결과 제어 변수
let terminalResult: { data: unknown; error: unknown } = { data: null, error: null };

// Supabase thenable 체이너블 mock
const mockChain = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.from = vi.fn(() => chain);
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.upsert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.single = vi.fn(() => chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
  return chain;
});

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockChain,
}));

import {
  saveMentalHealthCheckin,
  getMentalHealthLog,
  getMentalHealthLogs,
  deleteMentalHealthLog,
  MOOD_EMOJIS,
  MOOD_LABELS,
  ENERGY_EMOJIS,
  SLEEP_QUALITY_LABELS,
} from '@/lib/api/mental-health';

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
  mockChain.then.mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalResult).then(resolve);
  });
});

// 테스트용 mock 데이터
const mockLog = {
  id: 'log_1',
  clerk_user_id: 'user_123',
  log_date: '2026-01-15',
  mood_score: 4,
  stress_level: 3,
  sleep_hours: 7.5,
  sleep_quality: 4,
  energy_level: 4,
  notes: '좋은 하루',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
};

describe('saveMentalHealthCheckin', () => {
  it('체크인 데이터를 성공적으로 저장한다', async () => {
    terminalResult = { data: mockLog, error: null };

    const result = await saveMentalHealthCheckin('user_123', {
      mood_score: 4,
      stress_level: 3,
      sleep_hours: 7.5,
    });

    expect(mockChain.from).toHaveBeenCalledWith('mental_health_logs');
    expect(mockChain.upsert).toHaveBeenCalled();
    expect(result).toHaveProperty('id', 'log_1');
    expect(result).toHaveProperty('mood_score', 4);
  });

  it('log_date를 지정하지 않으면 오늘 날짜를 사용한다', async () => {
    terminalResult = { data: mockLog, error: null };

    await saveMentalHealthCheckin('user_123', { mood_score: 3 });

    const upsertArg = (mockChain.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(upsertArg.log_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('에러 발생 시 null을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'DB error' } };

    const result = await saveMentalHealthCheckin('user_123', { mood_score: 3 });

    expect(result).toBeNull();
  });

  it('onConflict로 같은 날짜 데이터를 upsert한다', async () => {
    terminalResult = { data: mockLog, error: null };

    await saveMentalHealthCheckin('user_123', {
      log_date: '2026-01-15',
      mood_score: 5,
    });

    const upsertArgs = (mockChain.upsert as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(upsertArgs[1]).toEqual({ onConflict: 'clerk_user_id,log_date' });
  });
});

describe('getMentalHealthLog', () => {
  it('특정 날짜의 로그를 반환한다', async () => {
    terminalResult = { data: mockLog, error: null };

    const result = await getMentalHealthLog('user_123', '2026-01-15');

    expect(mockChain.from).toHaveBeenCalledWith('mental_health_logs');
    expect(mockChain.eq).toHaveBeenCalledWith('clerk_user_id', 'user_123');
    expect(mockChain.eq).toHaveBeenCalledWith('log_date', '2026-01-15');
    expect(result).toHaveProperty('mood_score', 4);
  });

  it('데이터가 없으면 null을 반환한다 (PGRST116)', async () => {
    terminalResult = { data: null, error: { code: 'PGRST116', message: 'Not found' } };

    const result = await getMentalHealthLog('user_123', '2026-01-01');

    expect(result).toBeNull();
  });

  it('알 수 없는 에러도 null을 반환한다', async () => {
    terminalResult = { data: null, error: { code: 'UNEXPECTED', message: 'DB down' } };

    const result = await getMentalHealthLog('user_123', '2026-01-01');

    expect(result).toBeNull();
  });
});

describe('getMentalHealthLogs', () => {
  it('기간별 로그 목록을 반환한다', async () => {
    const mockLogs = [mockLog, { ...mockLog, id: 'log_2', log_date: '2026-01-14' }];
    terminalResult = { data: mockLogs, error: null };

    const result = await getMentalHealthLogs('user_123', '2026-01-10', '2026-01-15');

    expect(mockChain.gte).toHaveBeenCalledWith('log_date', '2026-01-10');
    expect(mockChain.lte).toHaveBeenCalledWith('log_date', '2026-01-15');
    expect(result).toHaveLength(2);
  });

  it('기본 limit은 100이다', async () => {
    terminalResult = { data: [], error: null };

    await getMentalHealthLogs('user_123', '2026-01-01', '2026-01-31');

    expect(mockChain.limit).toHaveBeenCalledWith(100);
  });

  it('에러 발생 시 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'error' } };

    const result = await getMentalHealthLogs('user_123', '2026-01-01', '2026-01-31');

    expect(result).toEqual([]);
  });

  it('data가 null이면 빈 배열을 반환한다', async () => {
    terminalResult = { data: null, error: null };

    const result = await getMentalHealthLogs('user_123', '2026-01-01', '2026-01-31');

    expect(result).toEqual([]);
  });
});

describe('deleteMentalHealthLog', () => {
  it('로그를 성공적으로 삭제한다', async () => {
    terminalResult = { data: null, error: null };

    const result = await deleteMentalHealthLog('user_123', 'log_1');

    expect(mockChain.from).toHaveBeenCalledWith('mental_health_logs');
    expect(mockChain.delete).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('삭제 실패 시 false를 반환한다', async () => {
    terminalResult = { data: null, error: { message: 'delete failed' } };

    const result = await deleteMentalHealthLog('user_123', 'log_1');

    expect(result).toBe(false);
  });
});

describe('유틸리티 상수', () => {
  it('MOOD_EMOJIS는 1-5 점수에 대한 이모지를 포함한다', () => {
    expect(MOOD_EMOJIS[1]).toBeDefined();
    expect(MOOD_EMOJIS[5]).toBeDefined();
    expect(Object.keys(MOOD_EMOJIS)).toHaveLength(5);
  });

  it('MOOD_LABELS는 한국어 라벨을 포함한다', () => {
    expect(MOOD_LABELS[1]).toBe('매우 안좋음');
    expect(MOOD_LABELS[3]).toBe('보통');
    expect(MOOD_LABELS[5]).toBe('매우 좋음');
  });

  it('ENERGY_EMOJIS는 1-5 점수에 대한 이모지를 포함한다', () => {
    expect(Object.keys(ENERGY_EMOJIS)).toHaveLength(5);
  });

  it('SLEEP_QUALITY_LABELS는 한국어 라벨을 포함한다', () => {
    expect(SLEEP_QUALITY_LABELS[1]).toBe('매우 나쁨');
    expect(SLEEP_QUALITY_LABELS[5]).toBe('매우 좋음');
  });
});
