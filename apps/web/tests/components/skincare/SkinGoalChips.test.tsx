/**
 * SkinGoalChips — 피부 목표 칩 (ADR-117 루틴 v2)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkinGoalChips } from '@/components/skincare/SkinGoalChips';
import type { SkinGoal } from '@/components/skincare/routine-v2-contract';

const GOALS: SkinGoal[] = [
  { id: 'hydration', label: '수분' },
  { id: 'brightening', label: '브라이트닝' },
  { id: 'acne', label: '트러블' },
];

describe('SkinGoalChips', () => {
  it('목표 카탈로그가 비면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<SkinGoalChips goals={[]} selected={[]} onToggle={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('목표 칩들을 렌더한다', () => {
    render(<SkinGoalChips goals={GOALS} selected={[]} onToggle={vi.fn()} />);
    expect(screen.getByTestId('skin-goal-chips')).toBeInTheDocument();
    expect(screen.getByText('수분')).toBeInTheDocument();
    expect(screen.getByText('브라이트닝')).toBeInTheDocument();
    expect(screen.getByText('트러블')).toBeInTheDocument();
  });

  it('선택된 칩은 aria-checked=true', () => {
    render(<SkinGoalChips goals={GOALS} selected={['hydration']} onToggle={vi.fn()} />);
    expect(screen.getByTestId('skin-goal-chip-hydration')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('skin-goal-chip-acne')).toHaveAttribute('aria-checked', 'false');
  });

  it('칩 클릭 시 onToggle을 해당 id로 호출한다', () => {
    const onToggle = vi.fn();
    render(<SkinGoalChips goals={GOALS} selected={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('skin-goal-chip-acne'));
    expect(onToggle).toHaveBeenCalledWith('acne');
  });
});
