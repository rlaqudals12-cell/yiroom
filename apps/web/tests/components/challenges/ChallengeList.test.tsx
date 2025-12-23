/**
 * ChallengeList 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChallengeList } from '@/components/challenges';
import type { Challenge, UserChallenge } from '@/types/challenges';

// Mock 챌린지 데이터
const mockChallenges: Challenge[] = [
  {
    id: 'challenge-1',
    code: 'workout_streak_7',
    name: '7일 연속 운동',
    description: '7일 연속으로 운동하세요',
    icon: '🔥',
    domain: 'workout',
    durationDays: 7,
    target: { type: 'streak', days: 7 },
    rewardXp: 50,
    rewardBadgeId: null,
    difficulty: 'easy',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
  },
  {
    id: 'challenge-2',
    code: 'nutrition_streak_7',
    name: '7일 연속 식단 기록',
    description: '7일 연속으로 식단을 기록하세요',
    icon: '📝',
    domain: 'nutrition',
    durationDays: 7,
    target: { type: 'streak', days: 7 },
    rewardXp: 50,
    rewardBadgeId: null,
    difficulty: 'easy',
    isActive: true,
    sortOrder: 10,
    createdAt: new Date(),
  },
  {
    id: 'challenge-3',
    code: 'workout_streak_14',
    name: '14일 연속 운동',
    description: '2주 연속으로 운동하세요',
    icon: '💪',
    domain: 'workout',
    durationDays: 14,
    target: { type: 'streak', days: 14 },
    rewardXp: 100,
    rewardBadgeId: null,
    difficulty: 'medium',
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
  },
  {
    id: 'challenge-4',
    code: 'wellness_7day',
    name: '7일 웰니스 챌린지',
    description: '운동과 식단 모두 기록하세요',
    icon: '✨',
    domain: 'combined',
    durationDays: 7,
    target: { type: 'combined', workout: true, nutrition: true },
    rewardXp: 100,
    rewardBadgeId: null,
    difficulty: 'medium',
    isActive: true,
    sortOrder: 20,
    createdAt: new Date(),
  },
];

// Mock 사용자 챌린지
const mockUserChallenges: UserChallenge[] = [
  {
    id: 'user-challenge-1',
    clerkUserId: 'user_123',
    challengeId: 'challenge-1',
    status: 'in_progress',
    startedAt: new Date(),
    targetEndAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    completedAt: null,
    progress: { currentDays: 3, totalDays: 7 },
    rewardClaimed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('ChallengeList', () => {
  describe('기본 렌더링', () => {
    it('챌린지 카드들을 렌더링한다', () => {
      render(<ChallengeList challenges={mockChallenges} />);

      expect(screen.getByText('7일 연속 운동')).toBeInTheDocument();
      expect(screen.getByText('7일 연속 식단 기록')).toBeInTheDocument();
      expect(screen.getByText('14일 연속 운동')).toBeInTheDocument();
      expect(screen.getByText('7일 웰니스 챌린지')).toBeInTheDocument();
    });

    it('data-testid가 올바르다', () => {
      render(<ChallengeList challenges={mockChallenges} />);

      expect(screen.getByTestId('challenge-list')).toBeInTheDocument();
    });

    it('빈 목록일 때 메시지를 표시한다', () => {
      render(<ChallengeList challenges={[]} />);

      expect(screen.getByText(/챌린지가 없습니다/i)).toBeInTheDocument();
    });
  });

  describe('필터 기능', () => {
    it('showFilters=true일 때 필터 UI를 표시한다', () => {
      render(<ChallengeList challenges={mockChallenges} showFilters />);

      expect(screen.getByTestId('challenge-filters')).toBeInTheDocument();
    });

    it('showFilters=false일 때 필터 UI를 숨긴다', () => {
      render(<ChallengeList challenges={mockChallenges} showFilters={false} />);

      expect(screen.queryByTestId('challenge-filters')).not.toBeInTheDocument();
    });

    it('도메인 필터 버튼이 표시된다', () => {
      render(<ChallengeList challenges={mockChallenges} showFilters />);

      // 도메인 필터와 난이도 필터 모두 "전체" 버튼이 있음
      const allButtons = screen.getAllByRole('button', { name: /전체/i });
      expect(allButtons.length).toBe(2);
      expect(screen.getByRole('button', { name: /운동/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /영양/i })).toBeInTheDocument();
    });
  });

  describe('도메인 필터링', () => {
    it('운동 필터 선택 시 운동 챌린지만 표시', async () => {
      render(<ChallengeList challenges={mockChallenges} showFilters />);

      fireEvent.click(screen.getByRole('button', { name: /운동/i }));

      await waitFor(() => {
        expect(screen.getByText('7일 연속 운동')).toBeInTheDocument();
        expect(screen.getByText('14일 연속 운동')).toBeInTheDocument();
        expect(screen.queryByText('7일 연속 식단 기록')).not.toBeInTheDocument();
      });
    });

    it('영양 필터 선택 시 영양 챌린지만 표시', async () => {
      render(<ChallengeList challenges={mockChallenges} showFilters />);

      fireEvent.click(screen.getByRole('button', { name: /영양/i }));

      await waitFor(() => {
        expect(screen.getByText('7일 연속 식단 기록')).toBeInTheDocument();
        expect(screen.queryByText('7일 연속 운동')).not.toBeInTheDocument();
      });
    });

    it('전체 필터 선택 시 모든 챌린지 표시', async () => {
      render(<ChallengeList challenges={mockChallenges} showFilters />);

      // 먼저 운동 필터
      fireEvent.click(screen.getByRole('button', { name: /운동/i }));

      await waitFor(() => {
        expect(screen.queryByText('7일 연속 식단 기록')).not.toBeInTheDocument();
      });

      // 다시 전체 (첫 번째 "전체" 버튼 = 도메인 필터)
      const allButtons = screen.getAllByRole('button', { name: /전체/i });
      fireEvent.click(allButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('7일 연속 운동')).toBeInTheDocument();
        expect(screen.getByText('7일 연속 식단 기록')).toBeInTheDocument();
      });
    });
  });

  describe('난이도 필터링', () => {
    it('난이도 필터 버튼이 표시된다', () => {
      render(<ChallengeList challenges={mockChallenges} showFilters />);

      expect(screen.getByRole('button', { name: /쉬움/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /보통/i })).toBeInTheDocument();
    });

    it('쉬움 필터 선택 시 해당 난이도만 표시', async () => {
      render(<ChallengeList challenges={mockChallenges} showFilters />);

      fireEvent.click(screen.getByRole('button', { name: /쉬움/i }));

      await waitFor(() => {
        expect(screen.getByText('7일 연속 운동')).toBeInTheDocument();
        expect(screen.getByText('7일 연속 식단 기록')).toBeInTheDocument();
        expect(screen.queryByText('14일 연속 운동')).not.toBeInTheDocument();
      });
    });
  });

  describe('사용자 챌린지 통합', () => {
    it('참여 중인 챌린지에 진행 상황을 표시한다', () => {
      render(
        <ChallengeList
          challenges={mockChallenges}
          userChallenges={mockUserChallenges}
        />
      );

      // challenge-1에 대한 진행 상황이 표시됨
      expect(screen.getByText('진행 중')).toBeInTheDocument();
    });

    it('참여하지 않은 챌린지에 참여 버튼을 표시한다', () => {
      render(
        <ChallengeList
          challenges={mockChallenges}
          userChallenges={mockUserChallenges}
          onJoin={vi.fn()}
        />
      );

      // 참여 버튼이 여러 개 표시됨 (참여하지 않은 챌린지들)
      const joinButtons = screen.getAllByRole('button', { name: /참여/i });
      expect(joinButtons.length).toBeGreaterThan(0);
    });
  });

  describe('콜백 함수', () => {
    it('참여 버튼 클릭 시 onJoin 호출', async () => {
      const onJoin = vi.fn().mockResolvedValue(undefined);
      render(
        <ChallengeList
          challenges={mockChallenges}
          userChallenges={mockUserChallenges}
          onJoin={onJoin}
        />
      );

      // 참여하지 않은 챌린지의 버튼 클릭
      const joinButtons = screen.getAllByRole('button', { name: /참여/i });
      fireEvent.click(joinButtons[0]);

      await waitFor(() => {
        expect(onJoin).toHaveBeenCalled();
      });
    });

    it('상세보기 버튼 클릭 시 onView 호출', () => {
      const onView = vi.fn();
      render(
        <ChallengeList
          challenges={mockChallenges}
          userChallenges={mockUserChallenges}
          onView={onView}
        />
      );

      const viewButtons = screen.getAllByRole('button', { name: /상세/i });
      if (viewButtons.length > 0) {
        fireEvent.click(viewButtons[0]);
        expect(onView).toHaveBeenCalled();
      }
    });
  });

  describe('그리드 레이아웃', () => {
    it('카드들이 그리드로 배치된다', () => {
      render(<ChallengeList challenges={mockChallenges} />);

      // 그리드 컨테이너는 challenge-list 내부에 있음
      const list = screen.getByTestId('challenge-list');
      const gridContainer = list.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('정렬', () => {
    it('sortOrder에 따라 정렬된다', () => {
      render(<ChallengeList challenges={mockChallenges} />);

      const cards = screen.getAllByTestId('challenge-card');
      // sortOrder: 1, 2, 10, 20 순서
      expect(cards[0]).toHaveTextContent('7일 연속 운동');
      expect(cards[1]).toHaveTextContent('14일 연속 운동');
    });
  });
});
