import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyRankCard } from '@/components/leaderboard/MyRankCard';
import type { MyRanking } from '@/types/leaderboard';

const mockRanking: MyRanking = {
  rank: 5,
  score: 1200,
  percentile: 15.5,
  change: 3,
  category: 'xp',
  period: 'weekly',
};

describe('MyRankCard', () => {
  it('카드 렌더링', () => {
    render(<MyRankCard ranking={mockRanking} />);
    expect(screen.getByTestId('my-rank-card')).toBeInTheDocument();
  });

  it('로딩 상태 표시', () => {
    render(<MyRankCard ranking={null} isLoading />);
    expect(screen.getByTestId('my-rank-card-loading')).toBeInTheDocument();
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('빈 상태 표시', () => {
    render(<MyRankCard ranking={null} />);
    expect(screen.getByTestId('my-rank-card-empty')).toBeInTheDocument();
    expect(screen.getByText(/활동을 기록하면 순위가 표시됩니다/)).toBeInTheDocument();
  });

  it('순위 표시', () => {
    render(<MyRankCard ranking={mockRanking} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('위')).toBeInTheDocument();
  });

  it('점수 표시', () => {
    render(<MyRankCard ranking={mockRanking} />);
    expect(screen.getByText('1,200 XP')).toBeInTheDocument();
  });

  it('퍼센타일 표시', () => {
    render(<MyRankCard ranking={mockRanking} />);
    expect(screen.getAllByText('15.5%').length).toBeGreaterThan(0);
  });

  it('상위 % 라벨 표시', () => {
    render(<MyRankCard ranking={mockRanking} />);
    expect(screen.getByText('상위')).toBeInTheDocument();
  });

  it('카테고리 라벨 표시', () => {
    render(<MyRankCard ranking={mockRanking} />);
    expect(screen.getAllByText('경험치').length).toBeGreaterThan(0);
  });

  it('기간 라벨 표시', () => {
    render(<MyRankCard ranking={mockRanking} />);
    expect(screen.getByText(/주간/)).toBeInTheDocument();
  });

  it('순위 상승 표시', () => {
    render(<MyRankCard ranking={mockRanking} />);
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('순위 하락 표시', () => {
    const droppedRanking = { ...mockRanking, change: -2 };
    render(<MyRankCard ranking={droppedRanking} />);
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('변화 없으면 변화량 표시 안함', () => {
    const noChangeRanking = { ...mockRanking, change: 0 };
    render(<MyRankCard ranking={noChangeRanking} />);
    expect(screen.queryByText('+0')).not.toBeInTheDocument();
  });

  it('프로그레스 바 표시', () => {
    const { container } = render(<MyRankCard ranking={mockRanking} />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('월간 기간 표시', () => {
    const monthlyRanking = { ...mockRanking, period: 'monthly' as const };
    render(<MyRankCard ranking={monthlyRanking} />);
    expect(screen.getByText(/월간/)).toBeInTheDocument();
  });

  it('운동 카테고리 표시', () => {
    const workoutRanking = { ...mockRanking, category: 'workout' as const };
    render(<MyRankCard ranking={workoutRanking} />);
    expect(screen.getAllByText('운동').length).toBeGreaterThan(0);
  });
});
