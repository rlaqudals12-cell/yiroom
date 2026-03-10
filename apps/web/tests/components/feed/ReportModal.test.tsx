/**
 * T2-MOD-5: ReportModal 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportModal } from '@/components/feed/ReportModal';

describe('ReportModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    postId: 'post_123',
    onSubmit: vi.fn().mockResolvedValue(undefined),
  };

  it('should render when open', () => {
    render(<ReportModal {...defaultProps} />);

    expect(screen.getByText('게시물 신고')).toBeInTheDocument();
  });

  it('should display all 5 report reasons', () => {
    render(<ReportModal {...defaultProps} />);

    expect(screen.getByText('스팸/광고')).toBeInTheDocument();
    expect(screen.getByText('괴롭힘/욕설')).toBeInTheDocument();
    expect(screen.getByText('부적절한 콘텐츠')).toBeInTheDocument();
    expect(screen.getByText('잘못된 정보')).toBeInTheDocument();
    expect(screen.getByText('기타')).toBeInTheDocument();
  });

  it('should disable submit button until reason is selected', () => {
    render(<ReportModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /신고/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button after selecting a reason', async () => {
    render(<ReportModal {...defaultProps} />);

    await fireEvent.click(screen.getByText('스팸/광고'));

    const submitButton = screen.getByRole('button', { name: /신고/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onSubmit with correct parameters', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ReportModal {...defaultProps} onSubmit={onSubmit} />);

    await fireEvent.click(screen.getByText('스팸/광고'));

    const submitButton = screen.getByRole('button', { name: /신고/i });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('post_123', 'spam', undefined);
    });
  });

  it('should not render when closed', () => {
    render(<ReportModal {...defaultProps} open={false} />);

    expect(screen.queryByText('게시물 신고')).not.toBeInTheDocument();
  });
});
