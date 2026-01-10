import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DiaryEntryForm from '@/components/skin/diary/DiaryEntryForm';
import type { SkinDiaryEntry, SkinDiaryEntryInput } from '@/types/skin-diary';

describe('DiaryEntryForm', () => {
  const mockDate = new Date('2026-01-10');

  const mockExistingEntry: SkinDiaryEntry = {
    id: 'entry-1',
    clerkUserId: 'user-1',
    entryDate: mockDate,
    skinCondition: 4,
    conditionNotes: '피부가 좋아요',
    sleepHours: 7.5,
    sleepQuality: 4,
    waterIntakeMl: 2000,
    stressLevel: 2,
    weather: 'sunny',
    outdoorHours: 2,
    morningRoutineCompleted: true,
    eveningRoutineCompleted: true,
    specialTreatments: ['시트마스크'],
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  it('renders with test id', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('diary-entry-form')).toBeInTheDocument();
  });

  it('displays formatted date', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);

    // 한국어 날짜 형식으로 표시
    const formattedDate = mockDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('shows "오늘의 기록" for new entry', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);
    expect(screen.getByText('오늘의 기록')).toBeInTheDocument();
  });

  it('shows "기록 수정" for existing entry', () => {
    render(<DiaryEntryForm date={mockDate} existingEntry={mockExistingEntry} onSubmit={vi.fn()} />);
    expect(screen.getByText('기록 수정')).toBeInTheDocument();
  });

  it('shows validation message when condition not selected', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);
    expect(screen.getByText('피부 컨디션을 선택해주세요')).toBeInTheDocument();
  });

  it('shows save button for new entry', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);
    expect(screen.getByText('저장하기')).toBeInTheDocument();
  });

  it('shows modify button for existing entry', () => {
    render(<DiaryEntryForm date={mockDate} existingEntry={mockExistingEntry} onSubmit={vi.fn()} />);
    expect(screen.getByText('수정하기')).toBeInTheDocument();
  });

  it('disables submit button when no condition selected', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);
    const submitButton = screen.getByRole('button', { name: /저장하기/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when condition is selected', () => {
    render(<DiaryEntryForm date={mockDate} existingEntry={mockExistingEntry} onSubmit={vi.fn()} />);
    const submitButton = screen.getByRole('button', { name: /수정하기/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <DiaryEntryForm
        date={mockDate}
        existingEntry={mockExistingEntry}
        onSubmit={vi.fn()}
        isLoading={true}
      />
    );
    expect(screen.getByText('저장 중...')).toBeInTheDocument();
  });

  it('shows cancel button when onCancel is provided', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('취소'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows close button when onCancel is provided', () => {
    const onCancel = vi.fn();
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} onCancel={onCancel} />);

    const closeButton = screen.getByRole('button', { name: '닫기' });
    expect(closeButton).toBeInTheDocument();
  });

  it('renders notes textarea', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);

    const textarea = screen.getByPlaceholderText('오늘 피부 상태에 대해 메모해보세요...');
    expect(textarea).toBeInTheDocument();
  });

  it('shows character count for notes', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);
    expect(screen.getByText('0/500')).toBeInTheDocument();
  });

  it('updates character count when typing notes', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);

    const textarea = screen.getByPlaceholderText('오늘 피부 상태에 대해 메모해보세요...');
    fireEvent.change(textarea, { target: { value: 'test' } });

    // 4글자 입력 후 카운트가 업데이트되어야 함
    expect(screen.getByText('4/500')).toBeInTheDocument();
  });

  it('renders ConditionSelector component', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('condition-selector')).toBeInTheDocument();
  });

  it('renders LifestyleFactors component', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('lifestyle-factors')).toBeInTheDocument();
  });

  it('renders RoutineCheckbox component', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('routine-checkbox')).toBeInTheDocument();
  });

  it('displays 생활 요인 section header', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} />);
    expect(screen.getByText('생활 요인')).toBeInTheDocument();
  });

  it('populates form with existing entry data', () => {
    render(<DiaryEntryForm date={mockDate} existingEntry={mockExistingEntry} onSubmit={vi.fn()} />);

    // 메모 입력란에 기존 값이 표시되어야 함
    const textarea = screen.getByPlaceholderText('오늘 피부 상태에 대해 메모해보세요...');
    expect(textarea).toHaveValue('피부가 좋아요');
  });

  it('calls onSubmit with form data when submitted', async () => {
    const onSubmit = vi.fn();
    render(
      <DiaryEntryForm date={mockDate} existingEntry={mockExistingEntry} onSubmit={onSubmit} />
    );

    const submitButton = screen.getByRole('button', { name: /수정하기/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          entryDate: mockDate,
          skinCondition: 4,
          conditionNotes: '피부가 좋아요',
        })
      );
    });
  });

  it('applies custom className', () => {
    render(<DiaryEntryForm date={mockDate} onSubmit={vi.fn()} className="custom-class" />);

    expect(screen.getByTestId('diary-entry-form')).toHaveClass('custom-class');
  });

  it('does not submit when condition is not selected', async () => {
    const onSubmit = vi.fn();
    render(<DiaryEntryForm date={mockDate} onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /저장하기/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
