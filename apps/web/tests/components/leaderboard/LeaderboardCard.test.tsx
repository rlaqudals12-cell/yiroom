import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardCard, LeaderboardPodium } from '@/components/leaderboard/LeaderboardCard';
import type { RankingEntry } from '@/types/leaderboard';

const mockEntry: RankingEntry = {
  rank: 1,
  userId: 'user-1',
  displayName: '김철수',
  avatarUrl: 'https://example.com/avatar.jpg',
  score: 1500,
  change: 2,
  tier: '브론즈',
  level: 15,
};

const mockRankings: RankingEntry[] = [
  { ...mockEntry, rank: 1, userId: 'user-1', displayName: '김철수', score: 1500 },
  { ...mockEntry, rank: 2, userId: 'user-2', displayName: '이영희', score: 1400 },
  { ...mockEntry, rank: 3, userId: 'user-3', displayName: '박지민', score: 1300 },
];

describe('LeaderboardCard', () => {
  it('카드 렌더링', () => {
    render(<LeaderboardCard entry={mockEntry} category="xp" />);
    expect(screen.getByTestId('leaderboard-card-1')).toBeInTheDocument();
  });

  it('사용자 이름 표시', () => {
    render(<LeaderboardCard entry={mockEntry} category="xp" />);
    expect(screen.getByText('김철수')).toBeInTheDocument();
  });

  it('1위 메달 표시', () => {
    render(<LeaderboardCard entry={mockEntry} category="xp" />);
    expect(screen.getByText('🥇')).toBeInTheDocument();
  });

  it('2위 메달 표시', () => {
    const secondPlace = { ...mockEntry, rank: 2 };
    render(<LeaderboardCard entry={secondPlace} category="xp" />);
    expect(screen.getByText('🥈')).toBeInTheDocument();
  });

  it('3위 메달 표시', () => {
    const thirdPlace = { ...mockEntry, rank: 3 };
    render(<LeaderboardCard entry={thirdPlace} category="xp" />);
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('4위 이상은 숫자 표시', () => {
    const fourthPlace = { ...mockEntry, rank: 4 };
    render(<LeaderboardCard entry={fourthPlace} category="xp" />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('점수 표시', () => {
    render(<LeaderboardCard entry={mockEntry} category="xp" />);
    expect(screen.getByText(/1,500/)).toBeInTheDocument();
  });

  it('티어/레벨 표시', () => {
    render(<LeaderboardCard entry={mockEntry} category="xp" />);
    expect(screen.getByText(/Lv\.15/)).toBeInTheDocument();
    expect(screen.getByText(/브론즈/)).toBeInTheDocument();
  });

  it('순위 상승 표시', () => {
    render(<LeaderboardCard entry={mockEntry} category="xp" />);
    expect(screen.getByText(/↑.*2위/)).toBeInTheDocument();
  });

  it('순위 하락 표시', () => {
    const droppedEntry = { ...mockEntry, change: -3 };
    render(<LeaderboardCard entry={droppedEntry} category="xp" />);
    expect(screen.getByText(/↓.*3위/)).toBeInTheDocument();
  });

  it('변화 없으면 변화량 표시 안함', () => {
    const noChangeEntry = { ...mockEntry, change: 0 };
    render(<LeaderboardCard entry={noChangeEntry} category="xp" />);
    expect(screen.queryByText('↑')).not.toBeInTheDocument();
    expect(screen.queryByText('↓')).not.toBeInTheDocument();
  });

  it('현재 사용자 표시', () => {
    render(<LeaderboardCard entry={mockEntry} category="xp" isCurrentUser />);
    expect(screen.getByText('(나)')).toBeInTheDocument();
  });

  it('large variant 스타일', () => {
    render(<LeaderboardCard entry={mockEntry} category="xp" variant="large" />);
    const card = screen.getByTestId('leaderboard-card-1');
    expect(card).toHaveClass('border-2');
  });
});

describe('LeaderboardPodium', () => {
  it('포디움 렌더링', () => {
    render(<LeaderboardPodium rankings={mockRankings} category="xp" />);
    expect(screen.getByTestId('leaderboard-podium')).toBeInTheDocument();
  });

  it('상위 3명 표시', () => {
    render(<LeaderboardPodium rankings={mockRankings} category="xp" />);
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('이영희')).toBeInTheDocument();
    expect(screen.getByText('박지민')).toBeInTheDocument();
  });

  it('현재 사용자 하이라이트', () => {
    render(<LeaderboardPodium rankings={mockRankings} category="xp" currentUserId="user-2" />);
    expect(screen.getByText('(나)')).toBeInTheDocument();
  });

  it('빈 랭킹은 null 반환', () => {
    const { container } = render(<LeaderboardPodium rankings={[]} category="xp" />);
    expect(container.firstChild).toBeNull();
  });

  it('2명일 때도 표시', () => {
    const twoRankings = mockRankings.slice(0, 2);
    render(<LeaderboardPodium rankings={twoRankings} category="xp" />);
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('이영희')).toBeInTheDocument();
  });

  it('1명일 때도 표시', () => {
    const oneRanking = [mockRankings[0]];
    render(<LeaderboardPodium rankings={oneRanking} category="xp" />);
    expect(screen.getByText('김철수')).toBeInTheDocument();
  });
});
