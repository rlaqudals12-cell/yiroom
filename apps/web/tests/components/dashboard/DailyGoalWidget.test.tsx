import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  DailyGoalWidget,
  createDefaultDailyGoals,
  type DailyGoal,
} from '@/components/dashboard/DailyGoalWidget';

// Next.js Link 모킹
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid={`link-${href.replace(/\//g, '-')}`}>
      {children}
    </a>
  ),
}));

const mockGoals: DailyGoal[] = [
  {
    id: 'workout',
    type: 'workout',
    label: '운동',
    current: 15,
    target: 30,
    unit: '분',
    href: '/workout',
  },
  {
    id: 'nutrition',
    type: 'nutrition',
    label: '칼로리',
    current: 1500,
    target: 2000,
    unit: 'kcal',
    href: '/nutrition',
  },
  {
    id: 'water',
    type: 'water',
    label: '수분',
    current: 2000,
    target: 2000,
    unit: 'ml',
    href: '/nutrition',
  },
];

describe('DailyGoalWidget', () => {
  describe('렌더링', () => {
    it('위젯이 렌더링됨', () => {
      render(<DailyGoalWidget goals={mockGoals} />);

      expect(screen.getByTestId('daily-goal-widget')).toBeInTheDocument();
    });

    it('헤더가 표시됨', () => {
      render(<DailyGoalWidget goals={mockGoals} />);

      expect(screen.getByText('오늘의 목표')).toBeInTheDocument();
    });

    it('showHeader=false일 때 헤더 숨김', () => {
      render(<DailyGoalWidget goals={mockGoals} showHeader={false} />);

      expect(screen.queryByText('오늘의 목표')).not.toBeInTheDocument();
    });

    it('data-testid 적용', () => {
      render(<DailyGoalWidget goals={mockGoals} data-testid="custom-widget" />);

      expect(screen.getByTestId('custom-widget')).toBeInTheDocument();
    });

    it('className 적용', () => {
      render(<DailyGoalWidget goals={mockGoals} className="mt-4" />);

      const widget = screen.getByTestId('daily-goal-widget');
      expect(widget).toHaveClass('mt-4');
    });
  });

  describe('목표 아이템', () => {
    it('모든 목표 아이템이 표시됨', () => {
      render(<DailyGoalWidget goals={mockGoals} />);

      expect(screen.getByText('운동')).toBeInTheDocument();
      expect(screen.getByText('칼로리')).toBeInTheDocument();
      expect(screen.getByText('수분')).toBeInTheDocument();
    });

    it('각 목표의 현재값/목표값 표시', () => {
      render(<DailyGoalWidget goals={mockGoals} />);

      expect(screen.getByText('15/30분')).toBeInTheDocument();
      expect(screen.getByText('1500/2000kcal')).toBeInTheDocument();
      expect(screen.getByText('2000/2000ml')).toBeInTheDocument();
    });

    it('Progress 바가 각 목표에 표시됨', () => {
      render(<DailyGoalWidget goals={mockGoals} />);

      expect(screen.getByTestId('daily-goal-progress-workout')).toBeInTheDocument();
      expect(screen.getByTestId('daily-goal-progress-nutrition')).toBeInTheDocument();
      expect(screen.getByTestId('daily-goal-progress-water')).toBeInTheDocument();
    });

    it('목표별 testId 적용', () => {
      render(<DailyGoalWidget goals={mockGoals} />);

      expect(screen.getByTestId('daily-goal-item-workout')).toBeInTheDocument();
      expect(screen.getByTestId('daily-goal-item-nutrition')).toBeInTheDocument();
      expect(screen.getByTestId('daily-goal-item-water')).toBeInTheDocument();
    });
  });

  describe('달성률 계산', () => {
    it('50% 달성 표시', () => {
      const halfGoals: DailyGoal[] = [
        { id: 'test', type: 'workout', label: '테스트', current: 15, target: 30, unit: '분' },
      ];

      render(<DailyGoalWidget goals={halfGoals} />);

      expect(screen.getByText('50% 달성')).toBeInTheDocument();
    });

    it('100% 달성 시 완료 표시', () => {
      const completeGoals: DailyGoal[] = [
        { id: 'test', type: 'workout', label: '테스트', current: 30, target: 30, unit: '분' },
      ];

      render(<DailyGoalWidget goals={completeGoals} />);

      expect(screen.getByText('완료!')).toBeInTheDocument();
    });

    it('100% 초과해도 100%로 표시', () => {
      const overGoals: DailyGoal[] = [
        { id: 'test', type: 'workout', label: '테스트', current: 50, target: 30, unit: '분' },
      ];

      render(<DailyGoalWidget goals={overGoals} />);

      expect(screen.getByText('완료!')).toBeInTheDocument();
    });

    it('완료 카운트 표시', () => {
      render(<DailyGoalWidget goals={mockGoals} />);

      // 3개 중 1개(수분) 완료
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('/3 완료')).toBeInTheDocument();
    });

    it('전체 달성률 표시', () => {
      render(<DailyGoalWidget goals={mockGoals} />);

      // (50 + 75 + 100) / 3 = 75%
      expect(screen.getByText('전체 75% 달성')).toBeInTheDocument();
    });

    it('전체 Progress 바 표시', () => {
      render(<DailyGoalWidget goals={mockGoals} />);

      expect(screen.getByTestId('daily-goal-total-progress')).toBeInTheDocument();
    });
  });

  describe('링크', () => {
    it('href가 있으면 링크로 래핑', () => {
      render(<DailyGoalWidget goals={mockGoals} />);

      // /workout 링크 1개, /nutrition 링크 2개 (nutrition, water)
      expect(screen.getByTestId('link--workout')).toBeInTheDocument();
      expect(screen.getAllByTestId('link--nutrition')).toHaveLength(2);
    });

    it('href가 없으면 링크 없음', () => {
      const noHrefGoals: DailyGoal[] = [
        { id: 'test', type: 'workout', label: '테스트', current: 15, target: 30, unit: '분' },
      ];

      render(<DailyGoalWidget goals={noHrefGoals} />);

      expect(screen.queryByTestId('link--workout')).not.toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('목표가 없으면 빈 상태 메시지 표시', () => {
      render(<DailyGoalWidget goals={[]} />);

      expect(screen.getByText('설정된 목표가 없습니다')).toBeInTheDocument();
    });

    it('빈 목표에서는 전체 Progress 숨김', () => {
      render(<DailyGoalWidget goals={[]} />);

      expect(screen.queryByTestId('daily-goal-total-progress')).not.toBeInTheDocument();
    });
  });
});

describe('createDefaultDailyGoals', () => {
  it('기본 목표 생성', () => {
    const goals = createDefaultDailyGoals();

    expect(goals).toHaveLength(3);
    expect(goals[0].type).toBe('workout');
    expect(goals[1].type).toBe('nutrition');
    expect(goals[2].type).toBe('water');
  });

  it('현재 값 설정', () => {
    const goals = createDefaultDailyGoals(20, 1500, 1000);

    expect(goals[0].current).toBe(20);
    expect(goals[1].current).toBe(1500);
    expect(goals[2].current).toBe(1000);
  });

  it('기본 목표 값', () => {
    const goals = createDefaultDailyGoals();

    expect(goals[0].target).toBe(30); // 운동 30분
    expect(goals[1].target).toBe(2000); // 칼로리 2000kcal
    expect(goals[2].target).toBe(2000); // 수분 2000ml
  });

  it('커스텀 목표 값', () => {
    const goals = createDefaultDailyGoals(0, 0, 0, {
      workout: 60,
      calories: 2500,
      water: 3000,
    });

    expect(goals[0].target).toBe(60);
    expect(goals[1].target).toBe(2500);
    expect(goals[2].target).toBe(3000);
  });

  it('href 설정', () => {
    const goals = createDefaultDailyGoals();

    expect(goals[0].href).toBe('/workout');
    expect(goals[1].href).toBe('/nutrition');
    expect(goals[2].href).toBe('/nutrition');
  });
});
