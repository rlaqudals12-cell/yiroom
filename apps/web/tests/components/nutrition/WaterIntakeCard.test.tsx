/**
 * N-1 WaterIntakeCard 컴포넌트 테스트
 * Task 2.9: 수분 섭취 입력 UI
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WaterIntakeCard, {
  HYDRATION_FACTORS,
  type DrinkType,
} from '@/components/nutrition/WaterIntakeCard';

describe('WaterIntakeCard', () => {
  describe('렌더링', () => {
    it('기본 카드를 렌더링한다', () => {
      render(<WaterIntakeCard currentAmount={0} />);

      expect(screen.getByTestId('water-intake-card')).toBeInTheDocument();
      expect(screen.getByText('수분 섭취')).toBeInTheDocument();
    });

    it('현재 수분량과 목표량을 표시한다', () => {
      render(<WaterIntakeCard currentAmount={1000} goalAmount={2000} />);

      expect(screen.getByText('1,000mL')).toBeInTheDocument();
      expect(screen.getByText('2,000mL')).toBeInTheDocument();
      expect(screen.getByText('(50%)')).toBeInTheDocument();
    });

    it('10개의 물방울 아이콘을 렌더링한다', () => {
      render(<WaterIntakeCard currentAmount={500} goalAmount={2000} />);

      // 10개의 물방울 아이콘이 있어야 함
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`droplet-${i}`)).toBeInTheDocument();
      }
    });

    it('진행률에 따라 물방울이 채워진다 (50% = 5개)', () => {
      render(<WaterIntakeCard currentAmount={1000} goalAmount={2000} />);

      // 50%일 때 10개 중 5개가 채워져야 함
      // data-testid로 직접 확인
      const progressbar = screen.getByRole('progressbar');
      const droplets = progressbar.querySelectorAll('[data-testid^="droplet-"]');

      // 처음 5개가 채워져 있고 (text-cyan-500), 나머지 5개는 비어있어야 함 (text-gray-200)
      expect(droplets.length).toBe(10);

      // 첫 5개는 채워진 상태
      for (let i = 0; i < 5; i++) {
        expect(droplets[i]).toHaveClass('text-cyan-500');
      }
      // 나머지 5개는 비어있는 상태 (text-muted로 마이그레이션됨)
      for (let i = 5; i < 10; i++) {
        expect(droplets[i]).toHaveClass('text-muted');
      }
    });

    it('목표 달성 시 축하 메시지를 표시한다', () => {
      render(<WaterIntakeCard currentAmount={2000} goalAmount={2000} />);

      expect(screen.getByText('오늘 목표 달성! 잘하고 있어요')).toBeInTheDocument();
    });

    it('목표 미달성 시 축하 메시지를 표시하지 않는다', () => {
      render(<WaterIntakeCard currentAmount={1000} goalAmount={2000} />);

      expect(
        screen.queryByText('오늘 목표 달성! 잘하고 있어요')
      ).not.toBeInTheDocument();
    });
  });

  describe('빠른 추가 버튼', () => {
    it('3개의 빠른 추가 버튼과 직접 입력 버튼을 렌더링한다', () => {
      render(<WaterIntakeCard currentAmount={0} />);

      expect(screen.getByTestId('quick-add-cup')).toBeInTheDocument();
      expect(screen.getByTestId('quick-add-bottle')).toBeInTheDocument();
      expect(screen.getByTestId('quick-add-coffee')).toBeInTheDocument();
      expect(screen.getByTestId('custom-add-button')).toBeInTheDocument();
    });

    it('물 1컵 클릭 시 onQuickAdd를 250ml, water로 호출한다', async () => {
      const onQuickAdd = vi.fn();
      render(<WaterIntakeCard currentAmount={0} onQuickAdd={onQuickAdd} />);

      fireEvent.click(screen.getByTestId('quick-add-cup'));

      await waitFor(() => {
        expect(onQuickAdd).toHaveBeenCalledWith(250, 'water');
      });
    });

    it('물 1병 클릭 시 onQuickAdd를 500ml, water로 호출한다', async () => {
      const onQuickAdd = vi.fn();
      render(<WaterIntakeCard currentAmount={0} onQuickAdd={onQuickAdd} />);

      fireEvent.click(screen.getByTestId('quick-add-bottle'));

      await waitFor(() => {
        expect(onQuickAdd).toHaveBeenCalledWith(500, 'water');
      });
    });

    it('커피 클릭 시 onQuickAdd를 300ml, coffee로 호출한다', async () => {
      const onQuickAdd = vi.fn();
      render(<WaterIntakeCard currentAmount={0} onQuickAdd={onQuickAdd} />);

      fireEvent.click(screen.getByTestId('quick-add-coffee'));

      await waitFor(() => {
        expect(onQuickAdd).toHaveBeenCalledWith(300, 'coffee');
      });
    });

    it('직접 입력 클릭 시 onCustomAdd를 호출한다', () => {
      const onCustomAdd = vi.fn();
      render(<WaterIntakeCard currentAmount={0} onCustomAdd={onCustomAdd} />);

      fireEvent.click(screen.getByTestId('custom-add-button'));

      expect(onCustomAdd).toHaveBeenCalled();
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤을 표시한다', () => {
      render(<WaterIntakeCard currentAmount={0} isLoading={true} />);

      expect(screen.getByTestId('water-intake-card-loading')).toBeInTheDocument();
    });

    it('로딩 중일 때 빠른 추가 버튼을 표시하지 않는다', () => {
      render(<WaterIntakeCard currentAmount={0} isLoading={true} />);

      expect(screen.queryByTestId('quick-add-cup')).not.toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('progressbar role이 있다', () => {
      render(<WaterIntakeCard currentAmount={500} goalAmount={2000} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('aria-valuenow', '25');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('각 버튼에 aria-label이 있다', () => {
      render(<WaterIntakeCard currentAmount={0} />);

      expect(screen.getByLabelText('물 1컵 추가 (250ml)')).toBeInTheDocument();
      expect(screen.getByLabelText('물 1병 추가 (500ml)')).toBeInTheDocument();
      expect(screen.getByLabelText('커피 추가 (300ml)')).toBeInTheDocument();
      expect(screen.getByLabelText('직접 입력')).toBeInTheDocument();
    });
  });
});

describe('HYDRATION_FACTORS', () => {
  it('음료별 수분 흡수율이 정의되어 있다', () => {
    expect(HYDRATION_FACTORS.water).toBe(1.0);
    expect(HYDRATION_FACTORS.tea).toBe(0.9);
    expect(HYDRATION_FACTORS.coffee).toBe(0.8);
    expect(HYDRATION_FACTORS.juice).toBe(0.7);
    expect(HYDRATION_FACTORS.soda).toBe(0.6);
    expect(HYDRATION_FACTORS.other).toBe(0.8);
  });

  it('모든 DrinkType에 대한 factor가 있다', () => {
    const drinkTypes: DrinkType[] = [
      'water',
      'tea',
      'coffee',
      'juice',
      'soda',
      'other',
    ];
    drinkTypes.forEach((type) => {
      expect(HYDRATION_FACTORS[type]).toBeDefined();
      expect(HYDRATION_FACTORS[type]).toBeGreaterThan(0);
      expect(HYDRATION_FACTORS[type]).toBeLessThanOrEqual(1);
    });
  });
});
