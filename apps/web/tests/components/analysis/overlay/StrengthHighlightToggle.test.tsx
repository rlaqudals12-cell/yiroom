/**
 * P1-3 테스트: StrengthHighlightToggle 컴포넌트
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrengthHighlightToggle } from '@/components/analysis/overlay/StrengthHighlightToggle';

describe('StrengthHighlightToggle', () => {
  it('should render with data-testid', () => {
    render(<StrengthHighlightToggle mode="strength" onModeChange={vi.fn()} />);
    expect(screen.getByTestId('strength-highlight-toggle')).toBeInTheDocument();
  });

  it('should show two toggle buttons', () => {
    render(<StrengthHighlightToggle mode="strength" onModeChange={vi.fn()} />);
    expect(screen.getByText('강점 중심')).toBeInTheDocument();
    expect(screen.getByText('전체 보기')).toBeInTheDocument();
  });

  it('should mark current mode as checked', () => {
    render(<StrengthHighlightToggle mode="strength" onModeChange={vi.fn()} />);
    expect(screen.getByText('강점 중심')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('전체 보기')).toHaveAttribute('aria-checked', 'false');
  });

  it('should call onModeChange when toggling', () => {
    const onModeChange = vi.fn();
    render(<StrengthHighlightToggle mode="strength" onModeChange={onModeChange} />);
    fireEvent.click(screen.getByText('전체 보기'));
    expect(onModeChange).toHaveBeenCalledWith('full');
  });

  it('should call onModeChange back to strength', () => {
    const onModeChange = vi.fn();
    render(<StrengthHighlightToggle mode="full" onModeChange={onModeChange} />);
    fireEvent.click(screen.getByText('강점 중심'));
    expect(onModeChange).toHaveBeenCalledWith('strength');
  });

  it('should disable buttons when disabled prop is true', () => {
    const onModeChange = vi.fn();
    render(<StrengthHighlightToggle mode="strength" onModeChange={onModeChange} disabled />);
    const buttons = screen.getAllByRole('radio');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('should not call onModeChange when disabled', () => {
    const onModeChange = vi.fn();
    render(<StrengthHighlightToggle mode="strength" onModeChange={onModeChange} disabled />);
    fireEvent.click(screen.getByText('전체 보기'));
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it('should have radiogroup role for accessibility', () => {
    render(<StrengthHighlightToggle mode="strength" onModeChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', '오버레이 표시 모드');
  });
});
