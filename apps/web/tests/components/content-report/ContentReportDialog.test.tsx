import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ContentReportDialog } from '@/components/content-report';

describe('ContentReportDialog', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('신고 사유와 대상 내용을 API에 보내고 앱 안에서 완료를 확인한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { reportId: 'report-1' } }),
    } satisfies Partial<Response>);
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ContentReportDialog
        targetType="coach_message"
        targetId="message-1"
        contentExcerpt="검토할 AI 응답"
        triggerLabel="신고"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '신고' }));
    fireEvent.click(screen.getByRole('radio', { name: '잘못된 정보' }));
    fireEvent.change(screen.getByLabelText('신고 상세 설명'), {
      target: { value: '근거와 다른 안내예요.' },
    });
    fireEvent.click(screen.getByRole('button', { name: '신고하기' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'coach_message',
          targetId: 'message-1',
          reason: 'misinformation',
          description: '근거와 다른 안내예요.',
          contentExcerpt: '검토할 AI 응답',
        }),
      });
    });
    expect(await screen.findByText('신고가 접수됐어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
  });

  it('API 실패 시 사용자 메시지를 보여주고 다시 제출할 수 있다', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({
        success: false,
        error: { userMessage: '잠시 후 다시 신고해주세요.' },
      }),
    } satisfies Partial<Response>);
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ContentReportDialog
        targetType="analysis_result"
        targetId="/analysis/skin/result/result-1"
        triggerLabel="이 결과 신고"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '이 결과 신고' }));
    fireEvent.click(screen.getByRole('radio', { name: '부적절한 콘텐츠' }));
    fireEvent.click(screen.getByRole('button', { name: '신고하기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('잠시 후 다시 신고해주세요.');
    expect(screen.getByRole('button', { name: '신고하기' })).not.toBeDisabled();
  });
});
