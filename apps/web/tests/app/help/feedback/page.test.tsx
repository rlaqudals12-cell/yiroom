/**
 * 피드백 페이지 테스트
 *
 * 2026-07 감사: 전송 실패를 성공 화면으로 위장하던 버그 수정 —
 * 실패 시 에러 안내 + 재시도가 가능해야 한다 (입력 내용 유지).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackPage from '@/app/(main)/help/feedback/page';

describe('FeedbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function fillAndSubmit() {
    // 유형 선택
    fireEvent.click(screen.getByText('버그 신고'));
    // 내용 입력 (최소 10자)
    fireEvent.change(screen.getByLabelText(/내용/), {
      target: { value: '버그가 발생했어요. 상세 내용입니다.' },
    });
    // 제출
    fireEvent.click(screen.getByRole('button', { name: /피드백 보내기/ }));
  }

  it('전송 성공 시 성공 화면을 표시한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })
    );

    render(<FeedbackPage />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByTestId('feedback-success')).toBeInTheDocument();
    });
  });

  it('HTTP 실패 시 성공으로 위장하지 않고 에러 안내 + 재시도를 표시한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false }),
      })
    );

    render(<FeedbackPage />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByTestId('feedback-error')).toBeInTheDocument();
    });
    // 성공 화면이 아니어야 함
    expect(screen.queryByTestId('feedback-success')).not.toBeInTheDocument();
    // 재시도 버튼 노출
    expect(screen.getByRole('button', { name: /다시 시도/ })).toBeInTheDocument();
    // 입력 내용 유지 (재시도 가능)
    expect(screen.getByLabelText(/내용/)).toHaveValue('버그가 발생했어요. 상세 내용입니다.');
  });

  it('API가 success:false를 반환하면 에러 안내를 표시한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: 'DB 저장 실패' }),
      })
    );

    render(<FeedbackPage />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByTestId('feedback-error')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('feedback-success')).not.toBeInTheDocument();
  });

  it('네트워크 오류 시 에러 안내를 표시한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    render(<FeedbackPage />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByTestId('feedback-error')).toBeInTheDocument();
    });
  });
});
