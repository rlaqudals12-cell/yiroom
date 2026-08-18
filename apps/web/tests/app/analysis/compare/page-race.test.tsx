import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface PendingFetch {
  url: string;
  signal?: AbortSignal;
  resolve: (response: Response) => void;
}

const { query, requests, pushMock, replaceMock } = vi.hoisted(() => ({
  query: { type: 'skin', from: 'old-from', to: 'old-to' },
  requests: [] as PendingFetch[],
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), replace: replaceMock, push: pushMock }),
  useSearchParams: () => ({
    get: (key: string) => query[key as keyof typeof query] ?? null,
    toString: () => `type=${query.type}&from=${query.from}&to=${query.to}`,
  }),
}));
vi.mock('next-intl', () => ({ useLocale: () => 'ko' }));
vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="dynamic-chart" />,
}));

import AnalysisComparePage from '@/app/(main)/analysis/compare/page';

function compareResult(period: string, beforeId: string, afterId: string) {
  return {
    before: {
      id: beforeId,
      date: '2026-08-01T00:00:00Z',
      overallScore: 70,
      type: 'skin',
      details: {
        hydration: 1,
        oilLevel: 1,
        pores: 1,
        pigmentation: 1,
        wrinkles: 1,
        sensitivity: 1,
      },
    },
    after: {
      id: afterId,
      date: '2026-08-02T00:00:00Z',
      overallScore: 71,
      type: 'skin',
      details: {
        hydration: 2,
        oilLevel: 2,
        pores: 2,
        pigmentation: 2,
        wrinkles: 2,
        sensitivity: 2,
      },
    },
    changes: { overall: 1, period, details: {} },
    insights: [],
  };
}

const historyResult = { analyses: [], trend: 'stable', pagination: { total: 0 } };

describe('AnalysisComparePage 데이터 경합', () => {
  beforeEach(() => {
    requests.length = 0;
    pushMock.mockReset();
    replaceMock.mockReset();
    query.type = 'skin';
    query.from = 'old-from';
    query.to = 'old-to';
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        return new Promise<Response>((resolve) => {
          requests.push({ url, signal: init?.signal ?? undefined, resolve });
        });
      })
    );
  });

  it('비교·이력을 병렬 요청하고 최신 query-key 결과만 반영한다', async () => {
    const { rerender } = render(<AnalysisComparePage />);
    await waitFor(() => expect(requests).toHaveLength(2));
    expect(requests.some((request) => request.url.includes('/api/analysis/compare'))).toBe(true);
    expect(requests.some((request) => request.url.includes('/api/analysis/history'))).toBe(true);

    query.from = 'new-from';
    query.to = 'new-to';
    rerender(<AnalysisComparePage />);
    await waitFor(() => expect(requests).toHaveLength(4));
    expect(requests[0].signal?.aborted).toBe(true);
    expect(requests[1].signal?.aborted).toBe(true);

    await act(async () => {
      requests[2].resolve(
        new Response(JSON.stringify(compareResult('최신 기간', 'new-from', 'new-to')), {
          status: 200,
        })
      );
      requests[3].resolve(new Response(JSON.stringify(historyResult), { status: 200 }));
    });
    expect(await screen.findByText('최신 기간 간의 변화')).toBeInTheDocument();

    await act(async () => {
      requests[0].resolve(
        new Response(JSON.stringify(compareResult('오래된 기간', 'old-from', 'old-to')), {
          status: 200,
        })
      );
      requests[1].resolve(new Response(JSON.stringify(historyResult), { status: 200 }));
    });
    expect(screen.queryByText('오래된 기간 간의 변화')).not.toBeInTheDocument();
    expect(screen.getByText('최신 기간 간의 변화')).toBeInTheDocument();
  });

  it('URL type이 바뀌면 동일 마운트에서 해당 축으로 다시 조회한다', async () => {
    const { rerender } = render(<AnalysisComparePage />);
    await waitFor(() => expect(requests).toHaveLength(2));

    query.type = 'body';
    query.from = 'body-from';
    query.to = 'body-to';
    rerender(<AnalysisComparePage />);

    await waitFor(() => expect(requests).toHaveLength(4));
    expect(requests[0].signal?.aborted).toBe(true);
    expect(requests[1].signal?.aborted).toBe(true);
    expect(requests[2].url).toContain('/api/analysis/compare?type=body');
    expect(requests[2].url).toContain('from=body-from&to=body-to');
    expect(requests[3].url).toContain('/api/analysis/history?type=body');
  });

  it('탭으로 다른 축을 고르면 기존 축 ID를 재사용하지 않고 해당 기록 선택 화면으로 간다', async () => {
    render(<AnalysisComparePage />);
    await waitFor(() => expect(requests).toHaveLength(2));

    await act(async () => {
      requests[0].resolve(
        new Response(JSON.stringify(compareResult('기존 기간', 'old-from', 'old-to')), {
          status: 200,
        })
      );
      requests[1].resolve(new Response(JSON.stringify(historyResult), { status: 200 }));
    });
    expect(await screen.findByText('기존 기간 간의 변화')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('tab', { name: '체형' }));

    expect(pushMock).toHaveBeenCalledWith('/analysis/body/history');
    expect(replaceMock).not.toHaveBeenCalled();
    expect(requests).toHaveLength(2);
  });
});
