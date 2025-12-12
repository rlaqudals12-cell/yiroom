import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakBadge, StreakBadgeList } from '@/components/workout/streak';

describe('StreakBadge', () => {
  describe('렌더링', () => {
    it('올바르게 렌더링된다', () => {
      render(<StreakBadge badgeId="7day" />);

      expect(screen.getByTestId('streak-badge')).toBeInTheDocument();
    });

    it('배지 이름이 표시된다', () => {
      render(<StreakBadge badgeId="7day" />);

      expect(screen.getByText('7일 연속')).toBeInTheDocument();
    });

    it('배지 이모지가 표시된다', () => {
      render(<StreakBadge badgeId="7day" />);

      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('showName=false면 이름이 숨겨진다', () => {
      render(<StreakBadge badgeId="7day" showName={false} />);

      expect(screen.queryByText('7일 연속')).not.toBeInTheDocument();
    });
  });

  describe('다양한 배지', () => {
    it('3day 배지가 올바르게 표시된다', () => {
      render(<StreakBadge badgeId="3day" />);

      expect(screen.getByText('🌱')).toBeInTheDocument();
      expect(screen.getByText('3일 연속')).toBeInTheDocument();
    });

    it('30day 배지가 올바르게 표시된다', () => {
      render(<StreakBadge badgeId="30day" />);

      expect(screen.getByText('🏆')).toBeInTheDocument();
      expect(screen.getByText('30일 연속')).toBeInTheDocument();
    });

    it('100day 배지가 올바르게 표시된다', () => {
      render(<StreakBadge badgeId="100day" />);

      expect(screen.getByText('👑')).toBeInTheDocument();
      expect(screen.getByText('100일 연속')).toBeInTheDocument();
    });
  });

  describe('잘못된 배지', () => {
    it('잘못된 배지 ID면 렌더링하지 않는다', () => {
      const { container } = render(<StreakBadge badgeId="invalid" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('크기', () => {
    it('sm 크기가 적용된다', () => {
      render(<StreakBadge badgeId="7day" size="sm" />);

      expect(screen.getByTestId('streak-badge')).toBeInTheDocument();
    });

    it('lg 크기가 적용된다', () => {
      render(<StreakBadge badgeId="7day" size="lg" />);

      expect(screen.getByTestId('streak-badge')).toBeInTheDocument();
    });
  });
});

describe('StreakBadgeList', () => {
  describe('렌더링', () => {
    it('배지 목록이 올바르게 렌더링된다', () => {
      render(<StreakBadgeList badges={['3day', '7day']} />);

      expect(screen.getByTestId('streak-badge-list')).toBeInTheDocument();
    });

    it('여러 배지가 표시된다', () => {
      render(<StreakBadgeList badges={['3day', '7day', '14day']} />);

      expect(screen.getByText('🌱')).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
      expect(screen.getByText('💪')).toBeInTheDocument();
    });
  });

  describe('빈 목록', () => {
    it('빈 배지 목록이면 렌더링하지 않는다', () => {
      const { container } = render(<StreakBadgeList badges={[]} />);

      expect(container.firstChild).toBeNull();
    });
  });
});
