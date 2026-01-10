import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConditionSelector from '@/components/skin/diary/ConditionSelector';

describe('ConditionSelector', () => {
  it('renders with test id', () => {
    render(<ConditionSelector value={undefined} onChange={vi.fn()} />);
    expect(screen.getByTestId('condition-selector')).toBeInTheDocument();
  });

  it('displays label', () => {
    render(<ConditionSelector value={undefined} onChange={vi.fn()} />);
    expect(screen.getByText('피부 컨디션')).toBeInTheDocument();
  });

  it('renders all 5 condition buttons', () => {
    render(<ConditionSelector value={undefined} onChange={vi.fn()} />);

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`condition-${i}`)).toBeInTheDocument();
    }
  });

  it('displays condition emojis', () => {
    render(<ConditionSelector value={undefined} onChange={vi.fn()} />);

    const container = screen.getByTestId('condition-selector');
    expect(container.textContent).toContain('😫');
    expect(container.textContent).toContain('😕');
    expect(container.textContent).toContain('😐');
    expect(container.textContent).toContain('🙂');
    expect(container.textContent).toContain('😊');
  });

  it('displays condition labels', () => {
    render(<ConditionSelector value={undefined} onChange={vi.fn()} />);

    expect(screen.getByText('매우 나쁨')).toBeInTheDocument();
    expect(screen.getByText('나쁨')).toBeInTheDocument();
    expect(screen.getByText('보통')).toBeInTheDocument();
    expect(screen.getByText('좋음')).toBeInTheDocument();
    expect(screen.getByText('매우 좋음')).toBeInTheDocument();
  });

  it('calls onChange when button clicked', () => {
    const onChange = vi.fn();
    render(<ConditionSelector value={undefined} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('condition-3'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('marks selected value with aria-pressed', () => {
    render(<ConditionSelector value={4} onChange={vi.fn()} />);

    expect(screen.getByTestId('condition-4')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('condition-1')).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows current selection summary when value is set', () => {
    render(<ConditionSelector value={5} onChange={vi.fn()} />);

    expect(screen.getByText(/오늘 피부 컨디션/)).toBeInTheDocument();
    // 매우 좋음은 버튼과 요약에 모두 표시되므로 getAllByText 사용
    expect(screen.getAllByText(/매우 좋음/).length).toBeGreaterThanOrEqual(2);
  });

  it('does not show summary when value is undefined', () => {
    render(<ConditionSelector value={undefined} onChange={vi.fn()} />);

    expect(screen.queryByText(/오늘 피부 컨디션/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ConditionSelector value={3} onChange={vi.fn()} className="custom-class" />);

    expect(screen.getByTestId('condition-selector')).toHaveClass('custom-class');
  });

  it('has accessible aria-labels on buttons', () => {
    render(<ConditionSelector value={undefined} onChange={vi.fn()} />);

    const button = screen.getByTestId('condition-3');
    expect(button).toHaveAttribute('aria-label', '피부 컨디션 3점: 보통');
  });

  it('updates selection when clicking different button', () => {
    const onChange = vi.fn();
    const { rerender } = render(<ConditionSelector value={2} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('condition-5'));
    expect(onChange).toHaveBeenCalledWith(5);

    rerender(<ConditionSelector value={5} onChange={onChange} />);
    expect(screen.getByTestId('condition-5')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('condition-2')).toHaveAttribute('aria-pressed', 'false');
  });
});
