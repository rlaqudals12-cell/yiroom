import type { SupabaseClient } from '@supabase/supabase-js';

import {
  loadStoredAnalysisRecord,
  readStoredFallbackFlag,
  resolveStoredFallback,
} from '../../../lib/analysis/stored-result-loader';

interface QueryTrace {
  table: string;
  columns?: string;
  eq?: [string, unknown];
  order?: string;
  limit?: number;
}

function createClient(
  responses: Record<string, { data: unknown; error: unknown }>
): { client: SupabaseClient; traces: QueryTrace[] } {
  const traces: QueryTrace[] = [];
  const client = {
    from: (table: string) => {
      const trace: QueryTrace = { table };
      traces.push(trace);
      const builder = {
        select: (columns: string) => {
          trace.columns = columns;
          return builder;
        },
        eq: (column: string, value: unknown) => {
          trace.eq = [column, value];
          return builder;
        },
        order: (column: string) => {
          trace.order = column;
          return builder;
        },
        limit: (limit: number) => {
          trace.limit = limit;
          return builder;
        },
        maybeSingle: () => Promise.resolve(responses[table] ?? { data: null, error: null }),
      };
      return builder;
    },
  };
  return { client: client as unknown as SupabaseClient, traces };
}

describe('stored-result-loader', () => {
  it.each([
    ['personal-color', 'personal_color_assessments', 'image_analysis'],
    ['skin', 'skin_analyses', 'recommendations'],
    ['body', 'body_analyses', 'style_recommendations'],
    ['hair', 'hair_analyses', 'recommendations'],
    ['makeup', 'makeup_analyses', 'recommendations'],
  ] as const)(
    '%s축은 historyId 지정 조회와 무파라미터 최신 조회를 모두 지원한다',
    async (axis, table, evidenceColumn) => {
      const row = {
        id: `${axis}-row`,
        [evidenceColumn]: { usedFallback: false },
        session_id: null,
      };
      const exact = createClient({ [table]: { data: row, error: null } });
      const latest = createClient({ [table]: { data: row, error: null } });

      await loadStoredAnalysisRecord(exact.client, axis, `${axis}-row`);
      await loadStoredAnalysisRecord(latest.client, axis);

      expect(exact.traces[0]).toMatchObject({
        table,
        eq: ['id', `${axis}-row`],
      });
      expect(exact.traces[0].order).toBeUndefined();
      expect(latest.traces[0]).toMatchObject({ table, order: 'created_at', limit: 1 });
      expect(latest.traces[0].eq).toBeUndefined();
    }
  );

  it('historyId가 있으면 최신값으로 바꾸지 않고 해당 id를 정확히 조회한다', async () => {
    const { client, traces } = createClient({
      body_analyses: {
        data: {
          id: 'body-old-2',
          style_recommendations: { usedMock: true },
          session_id: null,
        },
        error: null,
      },
    });

    const result = await loadStoredAnalysisRecord(client, 'body', 'body-old-2');

    expect(traces[0]).toMatchObject({
      table: 'body_analyses',
      eq: ['id', 'body-old-2'],
    });
    expect(traces[0].order).toBeUndefined();
    expect(result.row.id).toBe('body-old-2');
    expect(result.usedFallback).toBe(true);
  });

  it('historyId가 없으면 created_at 내림차순 최신 한 건을 조회한다', async () => {
    const { client, traces } = createClient({
      personal_color_assessments: {
        data: {
          id: 'pc-latest',
          image_analysis: { usedFallback: false },
          session_id: null,
        },
        error: null,
      },
    });

    const result = await loadStoredAnalysisRecord(client, 'personal-color');

    expect(traces[0]).toMatchObject({
      table: 'personal_color_assessments',
      order: 'created_at',
      limit: 1,
    });
    expect(traces[0].eq).toBeUndefined();
    expect(result.usedFallback).toBe(false);
  });

  it('행 JSONB에 출처가 없으면 통합 세션의 축별 used_fallback을 보존한다', async () => {
    const { client, traces } = createClient({
      integrated_analysis_sessions: {
        data: { used_fallback: ['hair'] },
        error: null,
      },
    });

    const usedFallback = await resolveStoredFallback(client, 'hair', {
      recommendations: {},
      session_id: 'session-1',
    });

    expect(usedFallback).toBe(true);
    expect(traces[0]).toMatchObject({
      table: 'integrated_analysis_sessions',
      eq: ['id', 'session-1'],
    });
  });

  it('구 데이터의 출처 불명은 false로 덮지 않고 undefined로 유지한다', () => {
    expect(readStoredFallbackFlag({})).toBeUndefined();
    expect(readStoredFallbackFlag({ usedMock: false })).toBe(false);
    expect(readStoredFallbackFlag({ usedFallback: true, usedMock: false })).toBe(true);
  });

  it('저장 행이 없으면 새 분석을 안내하는 오류를 낸다', async () => {
    const { client } = createClient({
      skin_analyses: { data: null, error: null },
    });

    await expect(loadStoredAnalysisRecord(client, 'skin', 'missing')).rejects.toMatchObject({
      name: 'StoredResultError',
      message: '저장된 분석 결과가 없어요. 새 분석을 시작해주세요.',
    });
  });
});
