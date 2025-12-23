import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BadgeCard, BadgeMini } from '@/components/gamification/BadgeCard';
import type { Badge } from '@/types/gamification';

const mockBadge: Badge = {
  id: 'badge-123',
  code: 'workout_streak_7day',
  name: '일주일 스트릭',
  description: '7일 연속 운동을 달성했어요!',
  icon: '💪',
  category: 'streak',
  rarity: 'common',
  requirement: { type: 'streak', domain: 'workout', days: 7 },
  xpReward: 25,
  sortOrder: 2,
  createdAt: new Date('2024-01-01'),
};

const epicBadge: Badge = {
  ...mockBadge,
  id: 'badge-epic',
  code: 'workout_streak_60day',
  name: '철인의 의지',
  rarity: 'epic',
};

describe('BadgeCard', () => {
  it('배지 아이콘과 이름 렌더링', () => {
    render(<BadgeCard badge={mockBadge} isEarned={true} />);

    expect(screen.getByText('💪')).toBeInTheDocument();
    expect(screen.getByText('일주일 스트릭')).toBeInTheDocument();
  });

  it('획득한 배지는 밝은 스타일', () => {
    render(<BadgeCard badge={mockBadge} isEarned={true} />);

    const card = screen.getByTestId('badge-card');
    expect(card).toHaveClass('bg-white');
  });

  it('미획득 배지는 흐린 스타일', () => {
    render(<BadgeCard badge={mockBadge} isEarned={false} />);

    const card = screen.getByTestId('badge-card');
    expect(card).toHaveClass('bg-gray-50');
  });

  it('획득일 표시', () => {
    const earnedAt = new Date('2024-01-15');
    render(<BadgeCard badge={mockBadge} isEarned={true} earnedAt={earnedAt} />);

    // 1월 15일 형식으로 표시
    expect(screen.getByText(/1월.*15일/)).toBeInTheDocument();
  });

  it('일반 배지는 희귀도 태그 없음', () => {
    render(<BadgeCard badge={mockBadge} isEarned={true} />);

    expect(screen.queryByText('일반')).not.toBeInTheDocument();
  });

  it('에픽 배지는 희귀도 태그 표시', () => {
    render(<BadgeCard badge={epicBadge} isEarned={true} />);

    expect(screen.getByText('에픽')).toBeInTheDocument();
  });

  it('클릭 핸들러 호출', () => {
    const onClick = vi.fn();
    render(<BadgeCard badge={mockBadge} isEarned={true} onClick={onClick} />);

    const card = screen.getByTestId('badge-card');
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('키보드 Enter로 클릭', () => {
    const onClick = vi.fn();
    render(<BadgeCard badge={mockBadge} isEarned={true} onClick={onClick} />);

    const card = screen.getByTestId('badge-card');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('showDetails=false일 때 상세 숨김', () => {
    render(<BadgeCard badge={mockBadge} isEarned={true} showDetails={false} />);

    // 아이콘은 보이지만 이름은 안 보임
    expect(screen.getByText('💪')).toBeInTheDocument();
    expect(screen.queryByText('일주일 스트릭')).not.toBeInTheDocument();
  });

  describe('사이즈 변경', () => {
    it('size=sm일 때 작은 아이콘', () => {
      render(<BadgeCard badge={mockBadge} isEarned={true} size="sm" />);

      const card = screen.getByTestId('badge-card');
      const iconContainer = card.querySelector('.w-16.h-16');
      expect(iconContainer).toBeInTheDocument();
    });

    it('size=lg일 때 큰 아이콘', () => {
      render(<BadgeCard badge={mockBadge} isEarned={true} size="lg" />);

      const card = screen.getByTestId('badge-card');
      const iconContainer = card.querySelector('.w-24.h-24');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});

describe('BadgeMini', () => {
  it('미니 배지 렌더링', () => {
    render(<BadgeMini badge={mockBadge} isEarned={true} />);

    const mini = screen.getByTestId('badge-mini');
    expect(mini).toBeInTheDocument();
    expect(screen.getByText('💪')).toBeInTheDocument();
  });

  it('획득 배지는 컬러', () => {
    render(<BadgeMini badge={mockBadge} isEarned={true} />);

    const mini = screen.getByTestId('badge-mini');
    expect(mini).not.toHaveClass('grayscale');
  });

  it('미획득 배지는 그레이스케일', () => {
    render(<BadgeMini badge={mockBadge} isEarned={false} />);

    const mini = screen.getByTestId('badge-mini');
    expect(mini).toHaveClass('grayscale');
  });

  it('title 속성에 배지명', () => {
    render(<BadgeMini badge={mockBadge} isEarned={true} />);

    const mini = screen.getByTestId('badge-mini');
    expect(mini).toHaveAttribute('title', '일주일 스트릭');
  });
});
