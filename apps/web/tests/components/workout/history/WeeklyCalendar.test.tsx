import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeeklyCalendar } from '@/components/workout/history';

describe('WeeklyCalendar', () => {
  const mockWeekDays = [
    { date: '2025-11-24', status: 'completed' as const, label: '상체' },
    { date: '2025-11-25', status: 'completed' as const, label: '하체' },
    { date: '2025-11-26', status: 'rest' as const },
    { date: '2025-11-27', status: 'completed' as const, label: '등' },
    { date: '2025-11-28', status: 'today' as const },
    { date: '2025-11-29', status: 'planned' as const },
    { date: '2025-11-30', status: 'rest' as const },
  ];

  describe('렌더링', () => {
    it('주간 캘린더가 올바르게 렌더링된다', () => {
      render(<WeeklyCalendar weekDays={mockWeekDays} />);

      expect(screen.getByTestId('weekly-calendar')).toBeInTheDocument();
    });

    it('요일 헤더가 표시된다', () => {
      render(<WeeklyCalendar weekDays={mockWeekDays} />);

      expect(screen.getByText('월')).toBeInTheDocument();
      expect(screen.getByText('화')).toBeInTheDocument();
      expect(screen.getByText('수')).toBeInTheDocument();
      expect(screen.getByText('목')).toBeInTheDocument();
      expect(screen.getByText('금')).toBeInTheDocument();
      expect(screen.getByText('토')).toBeInTheDocument();
      expect(screen.getByText('일')).toBeInTheDocument();
    });

    it('7개의 날짜 셀이 표시된다', () => {
      render(<WeeklyCalendar weekDays={mockWeekDays} />);

      // 각 날짜별로 버튼이 있어야 함
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(7);
    });

    it('범례가 표시된다', () => {
      render(<WeeklyCalendar weekDays={mockWeekDays} />);

      // 범례는 라벨과 중복될 수 있으므로 getAllByText 사용
      expect(screen.getAllByText('완료').length).toBeGreaterThan(0);
      expect(screen.getAllByText('휴식').length).toBeGreaterThan(0);
      expect(screen.getByText('오늘')).toBeInTheDocument();
      expect(screen.getByText('예정')).toBeInTheDocument();
      expect(screen.getByText('미완료')).toBeInTheDocument();
    });
  });

  describe('Streak 표시', () => {
    it('연속 기록이 있으면 표시된다', () => {
      render(<WeeklyCalendar weekDays={mockWeekDays} currentStreak={5} />);

      expect(screen.getByText('5일 연속!')).toBeInTheDocument();
    });

    it('연속 기록이 0이면 표시되지 않는다', () => {
      render(<WeeklyCalendar weekDays={mockWeekDays} currentStreak={0} />);

      expect(screen.queryByText(/연속/)).not.toBeInTheDocument();
    });
  });

  describe('상호작용', () => {
    it('날짜를 클릭하면 onDayClick이 호출된다', () => {
      const onDayClick = vi.fn();
      render(<WeeklyCalendar weekDays={mockWeekDays} onDayClick={onDayClick} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);

      expect(onDayClick).toHaveBeenCalledWith('2025-11-24');
    });
  });

  describe('상태별 스타일', () => {
    it('완료된 날짜에 체크 아이콘이 표시된다', () => {
      render(<WeeklyCalendar weekDays={mockWeekDays} />);

      // aria-label로 완료 상태 확인
      const completedButton = screen.getByLabelText(/2025-11-24 완료/);
      expect(completedButton).toBeInTheDocument();
    });

    it('오늘 날짜가 강조된다', () => {
      render(<WeeklyCalendar weekDays={mockWeekDays} />);

      const todayButton = screen.getByLabelText(/2025-11-28 오늘/);
      expect(todayButton).toBeInTheDocument();
    });

    it('예정된 날짜가 올바르게 표시된다', () => {
      render(<WeeklyCalendar weekDays={mockWeekDays} />);

      const plannedButton = screen.getByLabelText(/2025-11-29 예정/);
      expect(plannedButton).toBeInTheDocument();
    });

    it('휴식일이 올바르게 표시된다', () => {
      render(<WeeklyCalendar weekDays={mockWeekDays} />);

      const restButton = screen.getByLabelText(/2025-11-30 휴식/);
      expect(restButton).toBeInTheDocument();
    });

    it('미완료 날짜가 올바르게 표시된다', () => {
      const weekDaysWithSkipped = [
        ...mockWeekDays.slice(0, 2),
        { date: '2025-11-26', status: 'skipped' as const },
        ...mockWeekDays.slice(3),
      ];

      render(<WeeklyCalendar weekDays={weekDaysWithSkipped} />);

      const skippedButton = screen.getByLabelText(/2025-11-26 미완료/);
      expect(skippedButton).toBeInTheDocument();
    });
  });

  describe('빈 데이터 처리', () => {
    it('빈 weekDays로 렌더링해도 에러가 발생하지 않는다', () => {
      render(<WeeklyCalendar weekDays={[]} />);

      expect(screen.getByTestId('weekly-calendar')).toBeInTheDocument();
    });
  });
});
