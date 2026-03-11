/**
 * ConnectionAwareness Repository 테스트
 *
 * @module tests/lib/connection-awareness/repository
 * @description exposeConnection, confirmConnection, getUserConnections,
 *              getConnectionStatsLive, getExplanationDepth 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import {
  exposeConnection,
  confirmConnection,
  getUserConnections,
  getConnectionStatsLive,
  getExplanationDepth,
} from '@/lib/connection-awareness/repository';
import type { ExposeRequest } from '@/lib/connection-awareness/types';

// =============================================================================
// Mock 설정
// =============================================================================

/**
 * 체이닝 Supabase mock 생성
 *
 * selectResponse: .select().eq().eq().single() 결과
 * mutationResponse: .insert() 또는 .update().eq() 결과
 * queryResponse: .select().eq().order() 결과 (리스트 조회)
 */
function createMockSupabase(options: {
  selectResponse?: { data: unknown; error: unknown };
  mutationResponse?: { error: unknown };
  queryResponse?: { data: unknown[]; error: unknown };
}) {
  const { selectResponse, mutationResponse, queryResponse } = options;

  // 체이닝 상태 추적
  let eqCallCount = 0;

  const chainObj: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockImplementation(() => {
      eqCallCount++;
      return chainObj;
    }),
    order: vi.fn().mockImplementation(() => {
      // getUserConnections의 리스트 조회: select → eq → order → (then)
      // then/await 시 queryResponse 반환
      if (queryResponse) {
        return Promise.resolve(queryResponse);
      }
      return chainObj;
    }),
    single: vi.fn().mockResolvedValue(selectResponse ?? { data: null, error: null }),
    insert: vi.fn().mockResolvedValue(mutationResponse ?? { error: null }),
    update: vi.fn().mockImplementation(() => {
      // update().eq() 체인 반환
      return {
        eq: vi.fn().mockResolvedValue(mutationResponse ?? { error: null }),
      };
    }),
  };

  return {
    from: vi.fn(() => {
      eqCallCount = 0;
      return chainObj;
    }),
    _chain: chainObj,
  };
}

// 기본 ExposeRequest
const baseRequest: ExposeRequest = {
  connectionId: 'color_match::personal_color_skin',
  sourceModule: 'personal-color',
  targetDomain: 'skin',
  connectionRule: '퍼스널컬러 기반 — 피부톤 조화',
};

const userId = 'user_test_123';

// =============================================================================
// getExplanationDepth (순수 함수)
// =============================================================================

describe('getExplanationDepth', () => {
  it('exposed 상태에서 full을 반환한다', () => {
    expect(getExplanationDepth('exposed')).toBe('full');
  });

  it('recognized 상태에서 brief를 반환한다', () => {
    expect(getExplanationDepth('recognized')).toBe('brief');
  });

  it('internalized 상태에서 minimal을 반환한다', () => {
    expect(getExplanationDepth('internalized')).toBe('minimal');
  });

  it('independent 상태에서 none을 반환한다', () => {
    expect(getExplanationDepth('independent')).toBe('none');
  });
});

// =============================================================================
// exposeConnection
// =============================================================================

describe('exposeConnection', () => {
  it('기존 레코드가 없으면 새 레코드를 생성하고 exposed 상태를 반환한다', async () => {
    const mockSupabase = createMockSupabase({
      selectResponse: { data: null, error: null },
      mutationResponse: { error: null },
    });

    const result = await exposeConnection(mockSupabase as any, userId, baseRequest);

    expect(result.status).toBe('exposed');
    expect(result.exposureCount).toBe(1);
    expect(result.statusChanged).toBe(false);
  });

  it('기존 레코드가 있으면 exposure_count를 증가시킨다', async () => {
    const mockSupabase = createMockSupabase({
      selectResponse: {
        data: {
          id: 'ca_1',
          exposure_count: 2,
          confirmed_count: 0,
          status: 'exposed',
        },
        error: null,
      },
      mutationResponse: { error: null },
    });

    const result = await exposeConnection(mockSupabase as any, userId, baseRequest);

    expect(result.exposureCount).toBe(3);
    expect(result.status).toBe('exposed');
    // exposure 3회 + confirmed 0회 → 아직 exposed
    expect(result.statusChanged).toBe(false);
  });

  it('exposure_count가 충분하고 confirmed_count가 있으면 상태가 전이된다', async () => {
    // exposure: 2 → 3 (minExposure=3), confirmed: 1 (minConfirmed=1) → recognized
    const mockSupabase = createMockSupabase({
      selectResponse: {
        data: {
          id: 'ca_2',
          exposure_count: 2,
          confirmed_count: 1,
          status: 'exposed',
        },
        error: null,
      },
      mutationResponse: { error: null },
    });

    const result = await exposeConnection(mockSupabase as any, userId, baseRequest);

    expect(result.status).toBe('recognized');
    expect(result.exposureCount).toBe(3);
    expect(result.statusChanged).toBe(true);
  });

  it('exposure 7회 + confirmed 5회 이상이면 independent로 전이된다', async () => {
    const mockSupabase = createMockSupabase({
      selectResponse: {
        data: {
          id: 'ca_3',
          exposure_count: 6,
          confirmed_count: 5,
          status: 'internalized',
        },
        error: null,
      },
      mutationResponse: { error: null },
    });

    const result = await exposeConnection(mockSupabase as any, userId, baseRequest);

    expect(result.status).toBe('independent');
    expect(result.exposureCount).toBe(7);
    expect(result.statusChanged).toBe(true);
  });

  it('insert 에러 시 예외를 던진다', async () => {
    const mockSupabase = createMockSupabase({
      selectResponse: { data: null, error: null },
      mutationResponse: { error: { code: '23505' } },
    });

    await expect(exposeConnection(mockSupabase as any, userId, baseRequest)).rejects.toThrow(
      '연결 생성 실패'
    );
  });

  it('update 에러 시 예외를 던진다', async () => {
    const mockSupabase = createMockSupabase({
      selectResponse: {
        data: {
          id: 'ca_err',
          exposure_count: 1,
          confirmed_count: 0,
          status: 'exposed',
        },
        error: null,
      },
      mutationResponse: { error: { code: 'PGRST' } },
    });

    await expect(exposeConnection(mockSupabase as any, userId, baseRequest)).rejects.toThrow(
      '노출 업데이트 실패'
    );
  });
});

// =============================================================================
// confirmConnection
// =============================================================================

describe('confirmConnection', () => {
  it('confirmed_count를 증가시키고 상태를 반환한다', async () => {
    const mockSupabase = createMockSupabase({
      selectResponse: {
        data: {
          id: 'ca_c1',
          exposure_count: 3,
          confirmed_count: 0,
          status: 'exposed',
        },
        error: null,
      },
      mutationResponse: { error: null },
    });

    const result = await confirmConnection(mockSupabase as any, userId, 'test_connection');

    expect(result.confirmedCount).toBe(1);
    expect(result.status).toBe('recognized');
    expect(result.statusChanged).toBe(true);
  });

  it('존재하지 않는 connection에 대해 예외를 던진다', async () => {
    const mockSupabase = createMockSupabase({
      selectResponse: { data: null, error: null },
    });

    await expect(confirmConnection(mockSupabase as any, userId, 'nonexistent')).rejects.toThrow(
      '연결을 찾을 수 없습니다'
    );
  });

  it('confirmed가 충분하면 internalized로 전이된다', async () => {
    // exposure: 5, confirmed: 2→3 → internalized (minExposure=5, minConfirmed=3)
    const mockSupabase = createMockSupabase({
      selectResponse: {
        data: {
          id: 'ca_c2',
          exposure_count: 5,
          confirmed_count: 2,
          status: 'recognized',
        },
        error: null,
      },
      mutationResponse: { error: null },
    });

    const result = await confirmConnection(mockSupabase as any, userId, 'test_connection');

    expect(result.confirmedCount).toBe(3);
    expect(result.status).toBe('internalized');
    expect(result.statusChanged).toBe(true);
  });

  it('상태가 변하지 않으면 statusChanged가 false이다', async () => {
    // exposure: 1, confirmed: 0→1 → exposed 유지 (exposure 1 < minExposure 3)
    const mockSupabase = createMockSupabase({
      selectResponse: {
        data: {
          id: 'ca_c3',
          exposure_count: 1,
          confirmed_count: 0,
          status: 'exposed',
        },
        error: null,
      },
      mutationResponse: { error: null },
    });

    const result = await confirmConnection(mockSupabase as any, userId, 'test_connection');

    expect(result.confirmedCount).toBe(1);
    expect(result.status).toBe('exposed');
    expect(result.statusChanged).toBe(false);
  });

  it('update 에러 시 예외를 던진다', async () => {
    const mockSupabase = createMockSupabase({
      selectResponse: {
        data: {
          id: 'ca_err2',
          exposure_count: 3,
          confirmed_count: 1,
          status: 'recognized',
        },
        error: null,
      },
      mutationResponse: { error: { code: 'DB_ERR' } },
    });

    await expect(confirmConnection(mockSupabase as any, userId, 'test_connection')).rejects.toThrow(
      '확인 업데이트 실패'
    );
  });
});

// =============================================================================
// getUserConnections
// =============================================================================

describe('getUserConnections', () => {
  it('사용자의 연결 목록을 반환한다', async () => {
    const mockRow = {
      id: 'ca_1',
      clerk_user_id: userId,
      connection_id: 'conn_1',
      source_module: 'personal-color',
      target_domain: 'skin',
      connection_rule: '퍼스널컬러 기반',
      exposure_count: 3,
      confirmed_count: 1,
      status: 'recognized',
      last_exposed_at: '2026-03-01T00:00:00Z',
      created_at: '2026-02-15T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    };

    const mockSupabase = createMockSupabase({
      queryResponse: { data: [mockRow], error: null },
    });

    const result = await getUserConnections(mockSupabase as any, userId);

    expect(result).toHaveLength(1);
    expect(result[0].connectionId).toBe('conn_1');
    expect(result[0].sourceModule).toBe('personal-color');
    expect(result[0].status).toBe('recognized');
  });

  it('데이터가 없으면 빈 배열을 반환한다', async () => {
    const mockSupabase = createMockSupabase({
      queryResponse: { data: [], error: null },
    });

    const result = await getUserConnections(mockSupabase as any, userId);

    expect(result).toHaveLength(0);
  });

  it('에러 발생 시 예외를 던진다', async () => {
    const mockSupabase = createMockSupabase({
      queryResponse: { data: [], error: { code: 'TIMEOUT' } },
    });

    await expect(getUserConnections(mockSupabase as any, userId)).rejects.toThrow('연결 조회 실패');
  });
});

// =============================================================================
// getConnectionStatsLive (캐시 우선 getConnectionStats는 connection-stats-batch.test.ts에서 테스트)
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

    // getConnectionStats는 select('status').eq('clerk_user_id', ...) 체인
    // 이 함수는 order를 호출하지 않으므로 별도 mock 필요
    const chainObj = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
    };

    const mockSupabase = {
      from: vi.fn(() => chainObj),
    };

    const stats = await getConnectionStatsLive(mockSupabase as any, userId);

    expect(stats.totalConnections).toBe(5);
    expect(stats.byStatus.exposed).toBe(2);
    expect(stats.byStatus.recognized).toBe(1);
    expect(stats.byStatus.internalized).toBe(1);
    expect(stats.byStatus.independent).toBe(1);
    expect(stats.independentCount).toBe(1);
    // internalizationRate = (1 + 1) / 5 = 0.4
    expect(stats.internalizationRate).toBeCloseTo(0.4);
  });

  it('데이터가 없으면 모든 값이 0이다', async () => {
    const chainObj = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const mockSupabase = {
      from: vi.fn(() => chainObj),
    };

    const stats = await getConnectionStatsLive(mockSupabase as any, userId);

    expect(stats.totalConnections).toBe(0);
    expect(stats.internalizationRate).toBe(0);
    expect(stats.independentCount).toBe(0);
    expect(stats.byStatus.exposed).toBe(0);
  });

  it('에러 발생 시 예외를 던진다', async () => {
    const chainObj = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: { code: 'ERR' } }),
    };

    const mockSupabase = {
      from: vi.fn(() => chainObj),
    };

    await expect(getConnectionStatsLive(mockSupabase as any, userId)).rejects.toThrow(
      '통계 조회 실패'
    );
  });

  it('모두 independent면 internalizationRate가 1이다', async () => {
    const rows = [{ status: 'independent' }, { status: 'independent' }];

    const chainObj = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
    };

    const mockSupabase = {
      from: vi.fn(() => chainObj),
    };

    const stats = await getConnectionStatsLive(mockSupabase as any, userId);

    expect(stats.internalizationRate).toBe(1);
    expect(stats.independentCount).toBe(2);
  });
});
