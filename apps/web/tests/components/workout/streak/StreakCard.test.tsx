import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StreakCard } from '@/components/workout/streak';
import type { StreakSummary } from '@/lib/workout/streak';

describe('StreakCard', () => {
  const activeSummary: StreakSummary = {
    currentStreak: 5,
    longestStreak: 10,
    isActive: true,
    nextMilestone: 7,
    daysToNextMilestone: 2,
    achievedMilestones: [3],
    badges: ['3day'],
    message: '💪 5일 연속! 좋은 습관이 만들어지고 있어요!',
    warningMessage: '오늘 운동해야 6일 연속 달성!',
  };

  const inactiveSummary: StreakSummary = {
    currentStreak: 0,
    longestStreak: 10,
    isActive: false,
    nextMilestone: 3,
    daysToNextMilestone: 3,
    achievedMilestones: [],
    badges: ['3day', '7day'],
    message: '이전에 10일 연속 기록이 있어요! 다시 도전해볼까요?',
    warningMessage: null,
  };

  describe('렌더링', () => {
    it('올바르게 렌더링된다', () => {
      render(<StreakCard summary={activeSummary} />);

      expect(screen.getByTestId('streak-card')).toBeInTheDocument();
    });

    it('현재 streak이 표시된다', () => {
      render(<StreakCard summary={activeSummary} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('연속 기록 헤더가 표시된다', () => {
      render(<StreakCard summary={activeSummary} />);

      expect(screen.getByText('연속 기록')).toBeInTheDocument();
    });

    it('메시지가 표시된다', () => {
      render(<StreakCard summary={activeSummary} />);

      expect(screen.getByText(/5일 연속/)).toBeInTheDocument();
    });
  });

  describe('활성 상태', () => {
    it('현재 진행 중이 표시된다', () => {
      render(<StreakCard summary={activeSummary} />);

      expect(screen.getByText('현재 진행 중')).toBeInTheDocument();
    });

    it('경고 메시지가 표시된다', () => {
      render(<StreakCard summary={activeSummary} />);

      expect(screen.getByText(/오늘 운동해야/)).toBeInTheDocument();
    });

    it('다음 마일스톤 정보가 표시된다', () => {
      render(<StreakCard summary={activeSummary} />);

      expect(screen.getByText(/7일 연속까지/)).toBeInTheDocument();
      expect(screen.getByText('2일')).toBeInTheDocument();
    });

    it('진행도가 표시된다', () => {
      render(<StreakCard summary={activeSummary} />);

      expect(screen.getByTestId('streak-progress')).toBeInTheDocument();
    });

    it('마일스톤이 14일 초과면 진행도가 숨겨진다', () => {
      const highMilestoneSummary = {
        ...activeSummary,
        currentStreak: 20,
        nextMilestone: 30,
        daysToNextMilestone: 10,
      };
      render(<StreakCard summary={highMilestoneSummary} />);

      expect(screen.queryByTestId('streak-progress')).not.toBeInTheDocument();
    });
  });

  describe('비활성 상태', () => {
    it('다시 시작해보세요가 표시된다', () => {
      render(<StreakCard summary={inactiveSummary} />);

      expect(screen.getByText('다시 시작해보세요')).toBeInTheDocument();
    });

    it('재참여 메시지가 표시된다', () => {
      render(<StreakCard summary={inactiveSummary} />);

      expect(screen.getByText(/10일 연속 기록이 있어요/)).toBeInTheDocument();
    });

    it('운동 시작 버튼이 표시된다', () => {
      const onStartWorkout = vi.fn();
      render(<StreakCard summary={inactiveSummary} onStartWorkout={onStartWorkout} />);

      expect(screen.getByText('새로운 기록 시작하기')).toBeInTheDocument();
    });

    it('버튼 클릭 시 onStartWorkout이 호출된다', () => {
      const onStartWorkout = vi.fn();
      render(<StreakCard summary={inactiveSummary} onStartWorkout={onStartWorkout} />);

      fireEvent.click(screen.getByText('새로운 기록 시작하기'));

      expect(onStartWorkout).toHaveBeenCalled();
    });
  });

  describe('최장 기록', () => {
    it('최장 기록이 표시된다', () => {
      render(<StreakCard summary={activeSummary} />);

      expect(screen.getByText('최장 기록: 10일')).toBeInTheDocument();
    });

    it('최장 기록이 0이면 표시되지 않는다', () => {
      const noLongestSummary = { ...activeSummary, longestStreak: 0 };
      render(<StreakCard summary={noLongestSummary} />);

      expect(screen.queryByText(/최장 기록/)).not.toBeInTheDocument();
    });
  });

  describe('배지', () => {
    it('배지가 표시된다', () => {
      render(<StreakCard summary={activeSummary} />);

      expect(screen.getByText('획득한 배지')).toBeInTheDocument();
      expect(screen.getByTestId('streak-badge-list')).toBeInTheDocument();
    });

    it('배지가 없으면 배지 섹션이 표시되지 않는다', () => {
      const noBadgesSummary = { ...activeSummary, badges: [] };
      render(<StreakCard summary={noBadgesSummary} />);

      expect(screen.queryByText('획득한 배지')).not.toBeInTheDocument();
    });
  });
});
