import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AnalysisResultReportAction } from '@/components/analysis/report';

describe('AnalysisResultReportAction 결과 식별', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['analysis-result-a', 'analysis-result-b'])(
    '서로 다른 저장 결과 ID %s를 신고 요청에 보존한다',
    async (targetId) => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: { reportId: 'report-1' } }),
      } satisfies Partial<Response>);
      vi.stubGlobal('fetch', fetchMock);

      render(<AnalysisResultReportAction targetId={targetId} />);
      fireEvent.click(screen.getByRole('button', { name: '이 결과 신고' }));
      fireEvent.click(screen.getByRole('radio', { name: '잘못된 정보' }));
      fireEvent.click(screen.getByRole('button', { name: '신고하기' }));

      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
      const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
      expect(JSON.parse(String(request.body))).toMatchObject({
        targetType: 'analysis_result',
        targetId,
      });
    }
  );
});
