/**
 * T2-MOD-5: BlockConfirmDialog 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// lucide-react 아이콘 mock
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    ShieldAlert: (props: Record<string, unknown>) => (
      <svg data-testid="shield-alert-icon" {...props} />
    ),
  };
});

import { BlockConfirmDialog } from '@/components/feed/BlockConfirmDialog';

describe('BlockConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    authorName: '테스트유저',
    blockedUserId: 'user_2',
    onConfirm: vi.fn().mockResolvedValue(undefined),
  };

  it('should render with author name', () => {
    render(<BlockConfirmDialog {...defaultProps} />);

    expect(screen.getByText(/테스트유저/)).toBeInTheDocument();
  });

  it('should display block consequences', () => {
    render(<BlockConfirmDialog {...defaultProps} />);

    // 차단 결과 안내 텍스트 존재 확인
    expect(screen.getByText(/피드/i)).toBeInTheDocument();
  });

  it('should call onConfirm when confirmed', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<BlockConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    // "차단" 또는 "차단하기" 버튼 클릭
    const confirmButton = screen.getByRole('button', { name: /차단/i });
    await fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('user_2');
    });
  });

  it('should call onOpenChange when cancelled', async () => {
    const onOpenChange = vi.fn();
    render(<BlockConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

    const cancelButton = screen.getByRole('button', { name: /취소/i });
    await fireEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should not render when closed', () => {
    render(<BlockConfirmDialog {...defaultProps} open={false} />);

    expect(screen.queryByText(/테스트유저/)).not.toBeInTheDocument();
  });
});
