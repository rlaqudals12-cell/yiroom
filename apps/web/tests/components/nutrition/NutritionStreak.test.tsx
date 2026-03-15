/**
 * N-1 Streak UI 컴포넌트 테스트
 * Task 3.6: Streak UI 컴포넌트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  NutritionStreakProgress,
  NutritionStreakBadge,
  NutritionStreakBadgeList,
  NutritionStreakCard,
} from '@/components/nutrition/NutritionStreak';
import type { StreakSummary } from '@/lib/nutrition/streak';

describe('NutritionStreakProgress', () => {
  describe('렌더링', () => {
    it('기본 컨테이너를 렌더링한다', () => {
      render(<NutritionStreakProgress currentStreak={3} />);

      expect(screen.getByTestId('nutrition-streak-progress')).toBeInTheDocument();
    });

    it('완료된 날과 남은 날을 표시한다', () => {
      render(<NutritionStreakProgress currentStreak={5} targetDays={7} />);

      // 5일 완료, 2일 남음
      const completedDays = screen.getAllByLabelText(/일차 완료$/);
      const remainingDays = screen.getAllByLabelText(/일차 미완료$/);

      expect(completedDays).toHaveLength(5);
      expect(remainingDays).toHaveLength(2);
    });

    it('진행도 라벨을 표시한다', () => {
      render(<NutritionStreakProgress currentStreak={5} targetDays={7} />);

      expect(screen.getByText('5/7일')).toBeInTheDocument();
    });

    it('showLabels가 false면 라벨을 숨긴다', () => {
      render(<NutritionStreakProgress currentStreak={5} targetDays={7} showLabels={false} />);

      expect(screen.queryByText('5/7일')).not.toBeInTheDocument();
    });

    it('목표 달성 시 달성 메시지를 표시한다', () => {
      render(<NutritionStreakProgress currentStreak={7} targetDays={7} />);

      expect(screen.getByText(/목표 달성/)).toBeInTheDocument();
    });

    it('기본 targetDays는 7이다', () => {
      render(<NutritionStreakProgress currentStreak={3} />);

      expect(screen.getByText('3/7일')).toBeInTheDocument();
    });
  });

  describe('경계값', () => {
    it('currentStreak이 0이면 모든 날이 미완료다', () => {
      render(<NutritionStreakProgress currentStreak={0} targetDays={7} />);

      const remainingDays = screen.getAllByLabelText(/미완료/);
      expect(remainingDays).toHaveLength(7);
    });

    it('currentStreak이 targetDays보다 크면 모든 날이 완료다', () => {
      render(<NutritionStreakProgress currentStreak={10} targetDays={7} />);

      const completedDays = screen.getAllByLabelText(/완료/);
      expect(completedDays).toHaveLength(7);
    });

    it('targetDays가 3보다 작으면 최소 3일을 표시한다', () => {
      render(<NutritionStreakProgress currentStreak={1} targetDays={2} />);

      const allDays = screen.getAllByLabelText(/일차/);
      expect(allDays).toHaveLength(3);
    });

    it('targetDays가 14보다 크면 최대 14일을 표시한다', () => {
      render(<NutritionStreakProgress currentStreak={5} targetDays={30} />);

      const allDays = screen.getAllByLabelText(/일차/);
      expect(allDays).toHaveLength(14);
    });
  });
});

describe('NutritionStreakBadge', () => {
  describe('렌더링', () => {
    it('배지를 렌더링한다', () => {
      render(<NutritionStreakBadge badgeId="3day" />);

      expect(screen.getByTestId('nutrition-streak-badge')).toBeInTheDocument();
    });

    it('배지 이모지를 표시한다', () => {
      render(<NutritionStreakBadge badgeId="3day" />);

      expect(screen.getByText('🌱')).toBeInTheDocument();
    });

    it('배지 이름을 표시한다', () => {
      render(<NutritionStreakBadge badgeId="3day" showName />);

      expect(screen.getByText('3일 기록')).toBeInTheDocument();
    });

    it('showName이 false면 이름을 숨긴다', () => {
      render(<NutritionStreakBadge badgeId="3day" showName={false} />);

      expect(screen.queryByText('3일 기록')).not.toBeInTheDocument();
    });

    it('유효하지 않은 badgeId면 null을 반환한다', () => {
      const { container } = render(<NutritionStreakBadge badgeId="invalid" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('사이즈', () => {
    it('sm 사이즈가 적용된다', () => {
      const { container } = render(<NutritionStreakBadge badgeId="3day" size="sm" />);

      const badge = container.querySelector('.w-8');
      expect(badge).toBeInTheDocument();
    });

    it('md 사이즈가 적용된다', () => {
      const { container } = render(<NutritionStreakBadge badgeId="3day" size="md" />);

      const badge = container.querySelector('.w-12');
      expect(badge).toBeInTheDocument();
    });

    it('lg 사이즈가 적용된다', () => {
      const { container } = render(<NutritionStreakBadge badgeId="3day" size="lg" />);

      const badge = container.querySelector('.w-16');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('각 마일스톤 배지', () => {
    const badges = [
      { id: '3day', emoji: '🌱', name: '3일 기록' },
      { id: '7day', emoji: '🌿', name: '7일 기록' },
      { id: '14day', emoji: '🌳', name: '14일 기록' },
      { id: '30day', emoji: '🏆', name: '30일 기록' },
      { id: '60day', emoji: '⭐', name: '60일 기록' },
      { id: '100day', emoji: '👑', name: '100일 기록' },
    ];

    badges.forEach(({ id, emoji, name }) => {
      it(`${id} 배지가 올바르게 표시된다`, () => {
        render(<NutritionStreakBadge badgeId={id} showName />);

        expect(screen.getByText(emoji)).toBeInTheDocument();
        expect(screen.getByText(name)).toBeInTheDocument();
      });
    });
  });
});

describe('NutritionStreakBadgeList', () => {
  it('배지 목록을 렌더링한다', () => {
    render(<NutritionStreakBadgeList badges={['3day', '7day']} />);

    expect(screen.getByTestId('nutrition-streak-badge-list')).toBeInTheDocument();
  });

  it('여러 배지를 표시한다', () => {
    render(<NutritionStreakBadgeList badges={['3day', '7day', '14day']} />);

    expect(screen.getByText('🌱')).toBeInTheDocument();
    expect(screen.getByText('🌿')).toBeInTheDocument();
    expect(screen.getByText('🌳')).toBeInTheDocument();
  });

  it('빈 배열이면 null을 반환한다', () => {
    const { container } = render(<NutritionStreakBadgeList badges={[]} />);

    expect(container.firstChild).toBeNull();
  });
});

describe('NutritionStreakCard', () => {
  const activeSummary: StreakSummary = {
    currentStreak: 5,
    longestStreak: 10,
    isActive: true,
    nextMilestone: 7,
    daysToNextMilestone: 2,
    achievedMilestones: [3],
    badges: ['3day'],
    message: '💪 5일 연속! 좋은 습관이 만들어지고 있어요!',
    warningMessage: '오늘 기록해야 6일 연속 달성!',
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
    it('카드를 렌더링한다', () => {
      render(<NutritionStreakCard summary={activeSummary} />);

      expect(screen.getByTestId('nutrition-streak-card')).toBeInTheDocument();
    });

    it('현재 streak이 표시된다', () => {
      render(<NutritionStreakCard summary={activeSummary} />);

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('연속 기록 헤더가 표시된다', () => {
      render(<NutritionStreakCard summary={activeSummary} />);

      expect(screen.getByText('연속 기록')).toBeInTheDocument();
    });

    it('메시지가 표시된다', () => {
      render(<NutritionStreakCard summary={activeSummary} />);

      expect(screen.getByText(/5일 연속/)).toBeInTheDocument();
    });
  });

  describe('활성 상태', () => {
    it('현재 진행 중이 표시된다', () => {
      render(<NutritionStreakCard summary={activeSummary} />);

      expect(screen.getByText('현재 진행 중')).toBeInTheDocument();
    });

    it('경고 메시지가 표시된다', () => {
      render(<NutritionStreakCard summary={activeSummary} />);

      expect(screen.getByText(/오늘 기록해야/)).toBeInTheDocument();
    });

    it('다음 마일스톤 정보가 표시된다', () => {
      render(<NutritionStreakCard summary={activeSummary} />);

      expect(screen.getByText(/7일 연속까지/)).toBeInTheDocument();
      expect(screen.getByText('2일')).toBeInTheDocument();
    });

    it('진행도가 표시된다', () => {
      render(<NutritionStreakCard summary={activeSummary} />);

      expect(screen.getByTestId('nutrition-streak-progress')).toBeInTheDocument();
    });

    it('마일스톤이 14일 초과면 진행도가 숨겨진다', () => {
      const highMilestoneSummary: StreakSummary = {
        ...activeSummary,
        currentStreak: 20,
        nextMilestone: 30,
        daysToNextMilestone: 10,
      };
      render(<NutritionStreakCard summary={highMilestoneSummary} />);

      expect(screen.queryByTestId('nutrition-streak-progress')).not.toBeInTheDocument();
    });
  });

  describe('비활성 상태', () => {
    it('다시 시작해보세요가 표시된다', () => {
      render(<NutritionStreakCard summary={inactiveSummary} />);

      expect(screen.getByText('다시 시작해보세요')).toBeInTheDocument();
    });

    it('재참여 메시지가 표시된다', () => {
      render(<NutritionStreakCard summary={inactiveSummary} />);

      expect(screen.getByText(/10일 연속 기록이 있어요/)).toBeInTheDocument();
    });

    it('기록 시작 버튼이 표시된다', () => {
      const onStartRecord = vi.fn();
      render(<NutritionStreakCard summary={inactiveSummary} onStartRecord={onStartRecord} />);

      expect(screen.getByText('새로운 기록 시작하기')).toBeInTheDocument();
    });

    it('버튼 클릭 시 onStartRecord가 호출된다', () => {
      const onStartRecord = vi.fn();
      render(<NutritionStreakCard summary={inactiveSummary} onStartRecord={onStartRecord} />);

      fireEvent.click(screen.getByText('새로운 기록 시작하기'));

      expect(onStartRecord).toHaveBeenCalled();
    });
  });

  describe('최장 기록', () => {
    it('최장 기록이 표시된다', () => {
      render(<NutritionStreakCard summary={activeSummary} />);

      expect(screen.getByText('최장 기록: 10일')).toBeInTheDocument();
    });

    it('최장 기록이 0이면 표시되지 않는다', () => {
      const noLongestSummary: StreakSummary = { ...activeSummary, longestStreak: 0 };
      render(<NutritionStreakCard summary={noLongestSummary} />);

      expect(screen.queryByText(/최장 기록/)).not.toBeInTheDocument();
    });
  });

  describe('배지', () => {
    it('배지가 표시된다', () => {
      render(<NutritionStreakCard summary={activeSummary} />);

      expect(screen.getByText('획득한 배지')).toBeInTheDocument();
      expect(screen.getByTestId('nutrition-streak-badge-list')).toBeInTheDocument();
    });

    it('배지가 없으면 배지 섹션이 표시되지 않는다', () => {
      const noBadgesSummary: StreakSummary = { ...activeSummary, badges: [] };
      render(<NutritionStreakCard summary={noBadgesSummary} />);

      expect(screen.queryByText('획득한 배지')).not.toBeInTheDocument();
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중일 때 스켈레톤을 표시한다', () => {
      render(<NutritionStreakCard summary={activeSummary} isLoading />);

      expect(screen.getByTestId('nutrition-streak-card-loading')).toBeInTheDocument();
    });

    it('로딩 중일 때 카드 내용이 표시되지 않는다', () => {
      render(<NutritionStreakCard summary={activeSummary} isLoading />);

      expect(screen.queryByText('연속 기록')).not.toBeInTheDocument();
    });
  });

  describe('커스텀 testId', () => {
    it('커스텀 testId를 사용할 수 있다', () => {
      render(<NutritionStreakCard summary={activeSummary} testId="custom-streak" />);

      expect(screen.getByTestId('custom-streak')).toBeInTheDocument();
    });
  });
});
