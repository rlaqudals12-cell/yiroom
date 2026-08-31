import { renderHook, waitFor } from '@testing-library/react-native';

const selectCalls: Record<string, string> = {};
const rowsByTable: Record<string, Record<string, unknown>[]> = {};

function builderFor(table: string): Record<string, unknown> {
  const response = (): { data: Record<string, unknown>[]; error: null } => ({
    data: rowsByTable[table] ?? [],
    error: null,
  });
  const builder: Record<string, unknown> = {
    select: (columns: string) => {
      selectCalls[table] = columns;
      return builder;
    },
    order: () => builder,
    range: () => builder,
    limit: () => builder,
    gte: () => builder,
    then: (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(response()).then(onFulfilled, onRejected),
  };
  return builder;
}

const mockClient = {
  from: (table: string) => builderFor(table),
};

jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({ user: { id: 'clerk-1' }, isLoaded: true }),
}));

jest.mock('@/lib/supabase', () => ({
  useClerkSupabaseClient: () => mockClient,
}));

jest.mock('@/lib/utils/logger', () => ({
  analysisLogger: { warn: jest.fn(), error: jest.fn() },
}));

import { useAnalysisComparison } from '../../hooks/useAnalysisComparison';
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory';

describe('퍼스널컬러 이력·비교 12톤 계약', () => {
  beforeEach(() => {
    for (const key of Object.keys(selectCalls)) delete selectCalls[key];
    for (const key of Object.keys(rowsByTable)) delete rowsByTable[key];
  });

  it('이력 쿼리에 season_subtype을 포함하고 계절·세부 톤을 같이 내린다', async () => {
    rowsByTable.personal_color_assessments = [
      {
        id: 'pc-history-1',
        season: 'Spring',
        season_subtype: 'bright',
        confidence: 0.91,
        created_at: '2026-08-31T09:00:00.000Z',
      },
    ];

    const { result } = renderHook(() => useAnalysisHistory('personal-color'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(selectCalls.personal_color_assessments).toContain('season_subtype');
    expect(result.current.items[0]?.summary).toBe('봄 웜톤 · 브라이트');
  });

  it('비교에서 이전·현재 12톤을 보존하고 정확도 대신 신뢰도로 표기한다', async () => {
    rowsByTable.personal_color_assessments = [
      {
        id: 'pc-current',
        season: 'Summer',
        season_subtype: 'mute',
        confidence: 0.88,
        created_at: '2026-08-31T09:00:00.000Z',
      },
      {
        id: 'pc-previous',
        season: 'Spring',
        season_subtype: 'light',
        confidence: 0.82,
        created_at: '2026-07-31T09:00:00.000Z',
      },
    ];

    const { result } = renderHook(() => useAnalysisComparison('personal-color'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(selectCalls.personal_color_assessments).toContain('season_subtype');
    expect(result.current.data).toMatchObject({
      previousSummary: '봄 웜톤 · 라이트',
      currentSummary: '여름 쿨톤 · 뮤트',
      metrics: [{ label: '신뢰도' }],
    });
    expect(result.current.data?.metrics.map((metric) => metric.label)).not.toContain('정확도');
  });
});
