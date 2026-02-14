import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// lucide-react mock
vi.mock('lucide-react', () => ({
  Calendar: (props: Record<string, unknown>) => <div data-testid="icon-Calendar" {...props} />,
}));

// WORKOUT_TYPE_INFO mock
vi.mock('@/lib/workout/classifyWorkoutType', () => ({
  WORKOUT_TYPE_INFO: {
    toner: {
      label: '토너',
      icon: '...',
      description: '근육 탄력',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
    },
    builder: {
      label: '빌더',
      icon: '...',
      description: '근력 강화',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    burner: {
      label: '버너',
      icon: '...',
      description: '체지방 연소',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
    },
    mover: {
      label: '무버',
      icon: '...',
      description: '체력 향상',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
    },
    flexer: {
      label: '플렉서',
      icon: '...',
      description: '유연성',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
    },
  },
}));

import { WeeklyPlanCard } from '@/components/workout/plan/WeeklyPlanCard';
import type { DayPlan, WorkoutType } from '@/types/workout';

function createMockDays(): DayPlan[] {
  return [
    {
      day: 'mon',
      dayLabel: '월요일',
      isRestDay: false,
      exercises: [],
      estimatedMinutes: 40,
      estimatedCalories: 300,
      categories: ['upper'],
    },
    {
      day: 'tue',
      dayLabel: '화요일',
      isRestDay: false,
      exercises: [],
      estimatedMinutes: 35,
      estimatedCalories: 250,
      categories: ['lower'],
    },
    {
      day: 'wed',
      dayLabel: '수요일',
      isRestDay: true,
      exercises: [],
      estimatedMinutes: 0,
      estimatedCalories: 0,
    },
    {
      day: 'thu',
      dayLabel: '목요일',
      isRestDay: false,
      exercises: [],
      estimatedMinutes: 45,
      estimatedCalories: 350,
      categories: ['core'],
    },
    {
      day: 'fri',
      dayLabel: '금요일',
      isRestDay: false,
      exercises: [],
      estimatedMinutes: 40,
      estimatedCalories: 300,
      categories: ['cardio'],
    },
    {
      day: 'sat',
      dayLabel: '토요일',
      isRestDay: true,
      exercises: [],
      estimatedMinutes: 0,
      estimatedCalories: 0,
    },
    {
      day: 'sun',
      dayLabel: '일요일',
      isRestDay: true,
      exercises: [],
      estimatedMinutes: 0,
      estimatedCalories: 0,
    },
  ];
}

describe('WeeklyPlanCard', () => {
  // 날짜 고정 (2026-02-09 월요일)
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-09T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    days: createMockDays(),
    workoutType: 'toner' as WorkoutType,
    weekStartDate: '2026-02-09',
  };

  it('data-testid가 존재한다', () => {
    render(<WeeklyPlanCard {...defaultProps} />);
    expect(screen.getByTestId('weekly-plan-card')).toBeInTheDocument();
  });

  it('월/주차 정보를 표시한다', () => {
    render(<WeeklyPlanCard {...defaultProps} />);
    // 2월, 2주차 (9일 / 7 = 2)
    expect(screen.getByText(/2월/)).toBeInTheDocument();
    expect(screen.getByText(/2주차/)).toBeInTheDocument();
  });

  it('운동 타입 라벨을 표시한다', () => {
    render(<WeeklyPlanCard {...defaultProps} />);
    expect(screen.getByText(/토너 타입 주간 플랜/)).toBeInTheDocument();
  });

  describe('요일 캘린더', () => {
    it('7일 모두 표시된다', () => {
      render(<WeeklyPlanCard {...defaultProps} />);
      expect(screen.getByText('월')).toBeInTheDocument();
      expect(screen.getByText('화')).toBeInTheDocument();
      expect(screen.getByText('수')).toBeInTheDocument();
      expect(screen.getByText('목')).toBeInTheDocument();
      expect(screen.getByText('금')).toBeInTheDocument();
      expect(screen.getByText('토')).toBeInTheDocument();
      expect(screen.getByText('일')).toBeInTheDocument();
    });

    it('휴식일에는 휴식이 표시된다', () => {
      render(<WeeklyPlanCard {...defaultProps} />);
      const restLabels = screen.getAllByText('휴식');
      // 3개 휴식일 (수, 토, 일) + 1개 범례 = 4개
      expect(restLabels.length).toBe(4);
    });

    it('운동일에는 카테고리 라벨이 표시된다', () => {
      render(<WeeklyPlanCard {...defaultProps} />);
      expect(screen.getByText('상체')).toBeInTheDocument();
      expect(screen.getByText('하체')).toBeInTheDocument();
      expect(screen.getByText('코어')).toBeInTheDocument();
      expect(screen.getByText('유산소')).toBeInTheDocument();
    });

    it('categories가 없으면 전신으로 표시한다', () => {
      const days = createMockDays();
      days[0].categories = undefined;
      render(<WeeklyPlanCard {...defaultProps} days={days} />);
      expect(screen.getByText('전신')).toBeInTheDocument();
    });
  });

  describe('클릭 이벤트', () => {
    it('요일 클릭 시 onDayClick이 호출된다', () => {
      const onDayClick = vi.fn();
      render(<WeeklyPlanCard {...defaultProps} onDayClick={onDayClick} />);

      // 월 요일 클릭
      fireEvent.click(screen.getByText('월'));
      expect(onDayClick).toHaveBeenCalledTimes(1);
      expect(onDayClick).toHaveBeenCalledWith(defaultProps.days[0]);
    });

    it('선택된 요일에 하이라이트가 적용된다', () => {
      render(<WeeklyPlanCard {...defaultProps} selectedDay="mon" />);
      // 선택된 요일 버튼이 ring-2 ring-indigo-500 스타일을 가짐
      const buttons = screen.getAllByRole('button');
      const monButton = buttons[0]; // 월요일
      expect(monButton.className).toContain('ring-indigo-500');
    });
  });

  describe('범례', () => {
    it('범례가 표시된다', () => {
      render(<WeeklyPlanCard {...defaultProps} />);
      expect(screen.getByText('예정')).toBeInTheDocument();
      expect(screen.getByText('오늘')).toBeInTheDocument();
      // 범례에서의 휴식
      const restItems = screen.getAllByText('휴식');
      expect(restItems.length).toBeGreaterThan(0);
      expect(screen.getByText('완료')).toBeInTheDocument();
    });
  });
});
