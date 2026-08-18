/**
 * 결과 페이지 데이터 페칭 테스트
 *
 * 2026-08 외부 리뷰 확정 결함 2건의 회귀 방지:
 * - #1 선택 재분석에서 유지하기로 한 축이 session_id FK 조회에 없어 결과에서 통째로 사라짐
 * - #5 축 조회 오류(.error)를 무시해 "미분석"으로 위장 → 사용자가 이미 한 분석을 다시 함
 *
 * @note internal import는 테스트 예외로 허용 (BOUNDARIES.md 참조)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

/** 테이블별 응답 시나리오 — 세션 조회 / session_id 조회 / 최신 1건 조회 */
const scenario = vi.hoisted(() => ({
  session: { data: null as unknown, error: null as { message: string } | null },
  bySession: {} as Record<string, QueryResult>,
  latest: {} as Record<string, QueryResult>,
  lteCalls: [] as Array<{ table: string; column: string; value: unknown }>,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: async () => ({
    from(table: string) {
      // 체인 종단에서 어떤 조회였는지 판별하기 위해 상태를 들고 다닌다
      const state = { table, isLatest: false };
      const chain = {
        select: () => chain,
        eq: (column: string) => {
          if (column === 'id') return chain;
          return chain;
        },
        lte: (column: string, value: unknown) => {
          scenario.lteCalls.push({ table, column, value });
          return chain;
        },
        in: async () => ({ data: [], error: null }),
        order: () => {
          state.isLatest = true;
          return chain;
        },
        limit: () => chain,
        maybeSingle: async (): Promise<QueryResult> => {
          if (table === 'integrated_analysis_sessions') return scenario.session as QueryResult;
          if (state.isLatest) return scenario.latest[table] ?? { data: null, error: null };
          return scenario.bySession[table] ?? { data: null, error: null };
        },
      };
      return chain;
    },
  }),
}));

import { fetchIntegratedResult } from '@/lib/analysis/integrated/internal/result-fetcher';

const SESSION = {
  id: 'sess-1',
  clerk_user_id: 'user_1',
  status: 'partial',
  axes_completed: ['skin'],
  axes_failed: [],
  used_fallback: [],
  questionnaire: {},
  created_at: '2026-08-17T00:00:00.000Z',
};

beforeEach(() => {
  scenario.session = { data: SESSION, error: null };
  scenario.bySession = {};
  scenario.latest = {};
  scenario.lteCalls = [];
});

describe('fetchIntegratedResult — 유지 축 프로필 폴백 (외부 리뷰 #1)', () => {
  it('이번 세션에 없는 축을 사용자의 최신 진단으로 채우고 목록으로 알린다', async () => {
    scenario.bySession = {
      skin_analyses: { data: { id: 'skin-1', skin_type: 'dry' }, error: null },
    };
    scenario.latest = {
      personal_color_assessments: { data: { id: 'pc-old', season: 'Autumn' }, error: null },
      body_analyses: { data: { id: 'body-old', body_type: 'rectangle' }, error: null },
    };

    const result = await fetchIntegratedResult('sess-1');

    expect(result).not.toBeNull();
    expect(result!.axes.skin).toEqual({ id: 'skin-1', skin_type: 'dry' });
    // 유지 약속대로 이전 진단이 살아 있어야 한다
    expect(result!.axes.personalColor).toEqual({ id: 'pc-old', season: 'Autumn' });
    expect(result!.axes.body).toEqual({ id: 'body-old', body_type: 'rectangle' });
    expect(result!.axesFromProfile).toEqual(expect.arrayContaining(['personal_color', 'body']));
    // 이번 세션에서 실제로 분석된 축은 폴백 목록에 없다
    expect(result!.axesFromProfile).not.toContain('skin');
    expect(scenario.lteCalls).toContainEqual({
      table: 'personal_color_assessments',
      column: 'created_at',
      value: SESSION.created_at,
    });
  });

  it('승계한 legacy Mock과 무표식 행을 실측으로 위장하지 않는다', async () => {
    scenario.latest = {
      personal_color_assessments: {
        data: { id: 'pc-v2', season: 'Winter', image_analysis: { version: 2 } },
        error: null,
      },
      hair_analyses: {
        data: { id: 'hair-mock', face_shape: 'oval', recommendations: { usedMock: true } },
        error: null,
      },
    };

    const result = await fetchIntegratedResult('sess-1');

    expect(result!.unknownAxes).toContain('personal_color');
    expect(result!.fallbackAxes).toContain('hair');
    expect(result!.axisProvenance.personal_color?.confidence).toBe('low');
  });

  it('저장된 fallbackState=unknown을 usedFallback=false 때문에 실측으로 낮추지 않는다', async () => {
    scenario.bySession = {
      makeup_analyses: {
        data: {
          id: 'makeup-unknown',
          session_id: 'sess-1',
          recommendations: { usedFallback: false, fallbackState: 'unknown' },
        },
        error: null,
      },
    };

    const result = await fetchIntegratedResult('sess-1');

    expect(result!.unknownAxes).toContain('makeup');
    expect(result!.fallbackAxes).not.toContain('makeup');
    expect(result!.axisProvenance.makeup).toMatchObject({
      fallbackState: 'unknown',
      confidence: 'low',
    });
  });

  it('저장 상태가 unknown이어도 세션의 true 폴백 증거가 있으면 used를 우선한다', async () => {
    scenario.session = {
      data: { ...SESSION, used_fallback: ['makeup'] },
      error: null,
    };
    scenario.bySession = {
      makeup_analyses: {
        data: {
          id: 'makeup-confirmed-fallback',
          session_id: 'sess-1',
          recommendations: { usedFallback: false, fallbackState: 'unknown' },
        },
        error: null,
      },
    };

    const result = await fetchIntegratedResult('sess-1');

    expect(result!.fallbackAxes).toContain('makeup');
    expect(result!.unknownAxes).not.toContain('makeup');
    expect(result!.axisProvenance.makeup).toMatchObject({
      fallbackState: 'used',
      confidence: 'low',
    });
  });

  it('과거 진단조차 없으면 채우지 않는다 (지어내지 않음)', async () => {
    const result = await fetchIntegratedResult('sess-1');

    expect(result!.axes.personalColor).toBeNull();
    expect(result!.axesFromProfile).toEqual([]);
  });
});

describe('fetchIntegratedResult — 조회 오류와 미분석 구분 (외부 리뷰 #5)', () => {
  it('축 조회 실패를 "미분석"으로 위장하지 않는다', async () => {
    scenario.bySession = {
      hair_analyses: { data: null, error: { message: 'connection reset' } },
    };

    const result = await fetchIntegratedResult('sess-1');

    expect(result!.axesFetchFailed).toContain('hair');
    expect(result!.axes.hair).toBeNull();
  });

  it('조회 실패한 축은 옛 데이터로 덮지 않는다 (이번 회차 결과로 오인 방지)', async () => {
    scenario.bySession = {
      hair_analyses: { data: null, error: { message: 'connection reset' } },
    };
    scenario.latest = {
      hair_analyses: { data: { id: 'hair-old', face_shape: 'oval' }, error: null },
    };

    const result = await fetchIntegratedResult('sess-1');

    expect(result!.axes.hair).toBeNull();
    expect(result!.axesFromProfile).not.toContain('hair');
  });

  it('세션 조회 실패는 "없음"(404)으로 위장하지 않고 오류로 전파한다', async () => {
    scenario.session = { data: null, error: { message: 'db unavailable' } };

    await expect(fetchIntegratedResult('sess-1')).rejects.toThrow(/db unavailable/);
  });

  it('세션이 정말 없으면 null을 반환한다 (권한 없음·존재하지 않음)', async () => {
    scenario.session = { data: null, error: null };

    await expect(fetchIntegratedResult('sess-1')).resolves.toBeNull();
  });
});
