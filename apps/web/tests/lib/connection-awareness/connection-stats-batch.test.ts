/**
 * ConnectionAwareness 배치 통계 테스트
 *
 * - getConnectionStats: 캐시 우선, 실시간 폴백
 * - getConnectionStatsLive: 직접 실시간 집계
 * - cron route: connection-stats 집계 API
 */

import { describe, it, expect, vi } from 'vitest';
import { getConnectionStats, getConnectionStatsLive } from '@/lib/connection-awareness/repository';

const userId = 'user_batch_test';

// =============================================================================
// 캐시 우선 getConnectionStats
// =============================================================================

describe('getConnectionStats (캐시 우선)', () => {
  it('캐시 테이블에 데이터가 있으면 캐시에서 반환한다', async () => {
    const cachedRow = {
      total_connections: 10,
      exposed_count: 3,
      recognized_count: 3,
      internalized_count: 2,
      independent_count: 2,
      internalization_rate: 0.4,
    };

    let fromCallCount = 0;
    const mockSupabase = {
      from: vi.fn((table: string) => {
        fromCallCount++;
        if (table === 'connection_awareness_stats') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: cachedRow, error: null }),
              }),
            }),
          };
        }
        // connection_awareness 테이블은 호출되면 안 됨
        throw new Error('캐시 hit 시 실시간 테이블 접근 불필요');
      }),
    };

    const stats = await getConnectionStats(mockSupabase as any, userId);

    expect(stats.totalConnections).toBe(10);
    expect(stats.internalizationRate).toBe(0.4);
    expect(stats.independentCount).toBe(2);
    expect(stats.byStatus.exposed).toBe(3);
    expect(stats.byStatus.recognized).toBe(3);
    expect(stats.byStatus.internalized).toBe(2);
    expect(stats.byStatus.independent).toBe(2);
    // from은 connection_awareness_stats만 호출됨
    expect(mockSupabase.from).toHaveBeenCalledWith('connection_awareness_stats');
  });

  it('캐시 miss 시 실시간 집계로 폴백한다', async () => {
    const liveRows = [{ status: 'exposed' }, { status: 'recognized' }, { status: 'internalized' }];

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'connection_awareness_stats') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        // 실시간 테이블 폴백
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: liveRows, error: null }),
          }),
        };
      }),
    };

    const stats = await getConnectionStats(mockSupabase as any, userId);

    expect(stats.totalConnections).toBe(3);
    expect(stats.byStatus.exposed).toBe(1);
    expect(stats.byStatus.recognized).toBe(1);
    expect(stats.byStatus.internalized).toBe(1);
    expect(stats.independentCount).toBe(0);
    // internalizationRate = 1/3
    expect(stats.internalizationRate).toBeCloseTo(0.333, 2);
  });

  it('캐시 테이블 에러 시 실시간 집계로 폴백한다', async () => {
    const liveRows = [{ status: 'exposed' }];

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'connection_awareness_stats') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { code: 'TABLE_ERR' } }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: liveRows, error: null }),
          }),
        };
      }),
    };

    const stats = await getConnectionStats(mockSupabase as any, userId);

    // 에러 시 data=null이므로 폴백으로 동작
    expect(stats.totalConnections).toBe(1);
    expect(stats.byStatus.exposed).toBe(1);
  });
});

// =============================================================================
// getConnectionStatsLive (실시간 집계)
// =============================================================================

describe('getConnectionStatsLive', () => {
  it('상태별 통계를 정확히 계산한다', async () => {
    const rows = [
      { status: 'exposed' },
      { status: 'exposed' },
      { status: 'recognized' },
      { status: 'internalized' },
      { status: 'independent' },
    ];

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
        }),
      })),
    };

    const stats = await getConnectionStatsLive(mockSupabase as any, userId);

    expect(stats.totalConnections).toBe(5);
    expect(stats.byStatus.exposed).toBe(2);
    expect(stats.byStatus.recognized).toBe(1);
    expect(stats.byStatus.internalized).toBe(1);
    expect(stats.byStatus.independent).toBe(1);
    expect(stats.internalizationRate).toBeCloseTo(0.4);
  });

  it('데이터가 없으면 모든 값이 0이다', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      })),
    };

    const stats = await getConnectionStatsLive(mockSupabase as any, userId);

    expect(stats.totalConnections).toBe(0);
    expect(stats.internalizationRate).toBe(0);
  });

  it('에러 발생 시 예외를 던진다', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { code: 'ERR' } }),
        }),
      })),
    };

    await expect(getConnectionStatsLive(mockSupabase as any, userId)).rejects.toThrow(
      '통계 조회 실패'
    );
  });
});
