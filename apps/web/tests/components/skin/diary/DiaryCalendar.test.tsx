import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DiaryCalendar from '@/components/skin/diary/DiaryCalendar';
import type { SkinDiaryEntry } from '@/types/skin-diary';

describe('DiaryCalendar', () => {
  const mockEntries: SkinDiaryEntry[] = [
    {
      id: '1',
      clerkUserId: 'user1',
      entryDate: new Date(2026, 0, 5),
      skinCondition: 4,
      morningRoutineCompleted: true,
      eveningRoutineCompleted: true,
      specialTreatments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      clerkUserId: 'user1',
      entryDate: new Date(2026, 0, 10),
      skinCondition: 2,
      morningRoutineCompleted: false,
      eveningRoutineCompleted: true,
      specialTreatments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it('renders with test id', () => {
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
      />
    );
    expect(screen.getByTestId('diary-calendar')).toBeInTheDocument();
  });

  it('displays current month and year', () => {
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
      />
    );
    expect(screen.getByText('2026년 1월')).toBeInTheDocument();
  });

  it('displays weekday headers', () => {
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
      />
    );

    expect(screen.getByText('월')).toBeInTheDocument();
    expect(screen.getByText('화')).toBeInTheDocument();
    expect(screen.getByText('수')).toBeInTheDocument();
    expect(screen.getByText('목')).toBeInTheDocument();
    expect(screen.getByText('금')).toBeInTheDocument();
    expect(screen.getByText('토')).toBeInTheDocument();
    expect(screen.getByText('일')).toBeInTheDocument();
  });

  it('displays condition emoji for days with entries', () => {
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
      />
    );

    const calendar = screen.getByTestId('diary-calendar');
    expect(calendar.textContent).toContain('🙂'); // score 4
    expect(calendar.textContent).toContain('😕'); // score 2
  });

  it('calls onDateSelect when date is clicked', () => {
    const onDateSelect = vi.fn();
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={onDateSelect}
      />
    );

    fireEvent.click(screen.getByTestId('calendar-day-5'));
    expect(onDateSelect).toHaveBeenCalled();
    expect(onDateSelect.mock.calls[0][0].getDate()).toBe(5);
  });

  it('navigates to previous month', () => {
    const onMonthChange = vi.fn();
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
        onMonthChange={onMonthChange}
      />
    );

    fireEvent.click(screen.getByLabelText('이전 달'));
    expect(onMonthChange).toHaveBeenCalledWith(2025, 12);
  });

  it('navigates to next month', () => {
    const onMonthChange = vi.fn();
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
        onMonthChange={onMonthChange}
      />
    );

    fireEvent.click(screen.getByLabelText('다음 달'));
    expect(onMonthChange).toHaveBeenCalledWith(2026, 2);
  });

  it('shows today button', () => {
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
      />
    );

    expect(screen.getByText('오늘')).toBeInTheDocument();
  });

  it('displays legend with all condition scores', () => {
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
      />
    );

    expect(screen.getByText('1점')).toBeInTheDocument();
    expect(screen.getByText('2점')).toBeInTheDocument();
    expect(screen.getByText('3점')).toBeInTheDocument();
    expect(screen.getByText('4점')).toBeInTheDocument();
    expect(screen.getByText('5점')).toBeInTheDocument();
  });

  it('disables future dates', () => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 5);

    render(<DiaryCalendar entries={[]} selectedDate={today} onDateSelect={vi.fn()} />);

    // Future dates should be disabled
    const futureDateButton = screen.queryByTestId(`calendar-day-${futureDate.getDate()}`);
    if (futureDateButton && futureDate.getMonth() === today.getMonth()) {
      expect(futureDateButton).toBeDisabled();
    }
  });

  it('applies custom className', () => {
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('diary-calendar')).toHaveClass('custom-class');
  });

  it('marks selected date visually', () => {
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
      />
    );

    const selectedDay = screen.getByTestId('calendar-day-10');
    expect(selectedDay).toHaveAttribute('aria-pressed', 'true');
  });

  it('has accessible aria-label on date buttons', () => {
    render(
      <DiaryCalendar
        entries={mockEntries}
        selectedDate={new Date(2026, 0, 10)}
        onDateSelect={vi.fn()}
      />
    );

    const dayWithEntry = screen.getByTestId('calendar-day-5');
    expect(dayWithEntry.getAttribute('aria-label')).toContain('1월 5일');
    expect(dayWithEntry.getAttribute('aria-label')).toContain('피부 컨디션');
  });
});
