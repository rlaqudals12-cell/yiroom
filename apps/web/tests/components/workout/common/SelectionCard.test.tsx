/**
 * SelectionCard 컴포넌트 테스트
 * @description 온보딩 선택 카드 컴포넌트 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectionCard from '@/components/workout/common/SelectionCard';

// lucide-react mock은 setup.ts에서 글로벌로 제공됨

describe('SelectionCard', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('기본 렌더링', () => {
    it('타이틀을 표시한다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={false}
          onSelect={mockOnSelect}
          title="운동 목표"
        />
      );

      expect(screen.getByText('운동 목표')).toBeInTheDocument();
    });

    it('설명을 표시한다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={false}
          onSelect={mockOnSelect}
          title="운동 목표"
          description="체중 감량을 목표로 합니다"
        />
      );

      expect(screen.getByText('체중 감량을 목표로 합니다')).toBeInTheDocument();
    });

    it('아이콘을 표시한다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={false}
          onSelect={mockOnSelect}
          title="운동 목표"
          icon={<span data-testid="custom-icon">Icon</span>}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('선택 상태', () => {
    it('선택되면 체크 아이콘을 표시한다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={true}
          onSelect={mockOnSelect}
          title="운동 목표"
        />
      );

      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    it('선택 안 되면 체크 아이콘을 표시하지 않는다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={false}
          onSelect={mockOnSelect}
          title="운동 목표"
        />
      );

      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });
  });

  describe('클릭 이벤트', () => {
    it('클릭 시 onSelect를 호출한다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={false}
          onSelect={mockOnSelect}
          title="운동 목표"
        />
      );

      fireEvent.click(screen.getByRole('radio'));
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('disabled 상태에서는 onSelect를 호출하지 않는다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={false}
          onSelect={mockOnSelect}
          title="운동 목표"
          disabled={true}
        />
      );

      const button = screen.getByRole('radio');
      expect(button).toBeDisabled();
    });
  });

  describe('compact 모드', () => {
    it('compact 모드에서 더 작은 패딩을 적용한다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={false}
          onSelect={mockOnSelect}
          title="운동 목표"
          compact={true}
        />
      );

      const button = screen.getByRole('radio');
      expect(button.className).toContain('p-3');
    });

    it('일반 모드에서 표준 패딩을 적용한다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={false}
          onSelect={mockOnSelect}
          title="운동 목표"
          compact={false}
        />
      );

      const button = screen.getByRole('radio');
      expect(button.className).toContain('p-4');
    });
  });

  describe('스타일링', () => {
    it('선택된 카드는 primary 테두리를 가진다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={true}
          onSelect={mockOnSelect}
          title="운동 목표"
        />
      );

      const button = screen.getByRole('radio');
      expect(button.className).toContain('border-primary');
      expect(button.className).toContain('bg-primary/10');
    });

    it('선택되지 않은 카드는 border 테두리를 가진다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={false}
          onSelect={mockOnSelect}
          title="운동 목표"
        />
      );

      const button = screen.getByRole('radio');
      expect(button.className).toContain('border-border');
      expect(button.className).toContain('bg-card');
    });

    it('disabled 카드는 opacity-50을 가진다', () => {
      render(
        <SelectionCard
          mode="single"
          selected={false}
          onSelect={mockOnSelect}
          title="운동 목표"
          disabled={true}
        />
      );

      const button = screen.getByRole('radio');
      expect(button.className).toContain('opacity-50');
    });
  });
});
