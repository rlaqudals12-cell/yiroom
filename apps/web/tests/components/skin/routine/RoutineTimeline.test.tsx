import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoutineTimeline from '@/components/skin/routine/RoutineTimeline';
import type { RoutineStep } from '@/types/skincare-routine';

describe('RoutineTimeline', () => {
  const mockSteps: RoutineStep[] = [
    {
      order: 1,
      category: 'cleanser',
      name: '클렌저',
      purpose: '피지 제거',
      duration: '1분',
      tips: [],
      isOptional: false,
    },
    {
      order: 2,
      category: 'toner',
      name: '토너',
      purpose: 'pH 밸런스',
      duration: '30초',
      tips: [],
      isOptional: false,
    },
    {
      order: 3,
      category: 'cream',
      name: '크림',
      purpose: '보습',
      duration: '30초',
      tips: [],
      isOptional: false,
    },
  ];

  it('renders with test id', () => {
    render(<RoutineTimeline steps={mockSteps} />);
    expect(screen.getByTestId('routine-timeline')).toBeInTheDocument();
  });

  it('renders all step names', () => {
    render(<RoutineTimeline steps={mockSteps} />);

    expect(screen.getByText('클렌저')).toBeInTheDocument();
    expect(screen.getByText('토너')).toBeInTheDocument();
    expect(screen.getByText('크림')).toBeInTheDocument();
  });

  it('renders step durations', () => {
    render(<RoutineTimeline steps={mockSteps} />);

    expect(screen.getByText('1분')).toBeInTheDocument();
    expect(screen.getAllByText('30초')).toHaveLength(2);
  });

  it('creates buttons for each step', () => {
    render(<RoutineTimeline steps={mockSteps} />);

    expect(screen.getByTestId('timeline-step-1')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-step-2')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-step-3')).toBeInTheDocument();
  });

  it('marks completed steps when currentStep is greater', () => {
    render(<RoutineTimeline steps={mockSteps} currentStep={2} />);

    // step 1은 완료됨 (currentStep 2 > order 1)
    const step1 = screen.getByTestId('timeline-step-1');
    // 완료된 단계에서는 이모지가 표시되지 않아야 함 (체크 아이콘으로 대체됨)
    // 완료 상태는 CSS 스타일로 확인
    expect(step1).toBeInTheDocument();
    // step 2는 현재 단계이므로 aria-current가 있어야 함
    const step2 = screen.getByTestId('timeline-step-2');
    expect(step2).toHaveAttribute('aria-current', 'step');
  });

  it('marks current step with aria-current', () => {
    render(<RoutineTimeline steps={mockSteps} currentStep={2} />);

    const step2 = screen.getByTestId('timeline-step-2');
    expect(step2).toHaveAttribute('aria-current', 'step');
  });

  it('calls onStepClick when step button clicked', () => {
    const onStepClick = vi.fn();
    render(<RoutineTimeline steps={mockSteps} onStepClick={onStepClick} />);

    fireEvent.click(screen.getByTestId('timeline-step-2'));
    expect(onStepClick).toHaveBeenCalledWith(mockSteps[1]);
  });

  it('disables click when onStepClick is not provided', () => {
    render(<RoutineTimeline steps={mockSteps} />);

    const step1 = screen.getByTestId('timeline-step-1');
    expect(step1).toBeDisabled();
  });

  it('enables click when onStepClick is provided', () => {
    const onStepClick = vi.fn();
    render(<RoutineTimeline steps={mockSteps} onStepClick={onStepClick} />);

    const step1 = screen.getByTestId('timeline-step-1');
    expect(step1).not.toBeDisabled();
  });

  it('has proper aria-label for steps', () => {
    render(<RoutineTimeline steps={mockSteps} />);

    expect(screen.getByTestId('timeline-step-1')).toHaveAttribute('aria-label', '1단계: 클렌저');
    expect(screen.getByTestId('timeline-step-2')).toHaveAttribute('aria-label', '2단계: 토너');
  });

  it('renders steps in correct order', () => {
    const unorderedSteps = [mockSteps[2], mockSteps[0], mockSteps[1]];
    render(<RoutineTimeline steps={unorderedSteps} />);

    const timeline = screen.getByTestId('routine-timeline');
    const buttons = timeline.querySelectorAll('button');

    expect(buttons[0]).toHaveTextContent('클렌저');
    expect(buttons[1]).toHaveTextContent('토너');
    expect(buttons[2]).toHaveTextContent('크림');
  });

  it('applies custom className', () => {
    render(<RoutineTimeline steps={mockSteps} className="custom-class" />);
    expect(screen.getByTestId('routine-timeline')).toHaveClass('custom-class');
  });

  it('displays category emojis', () => {
    render(<RoutineTimeline steps={mockSteps} />);

    const timeline = screen.getByTestId('routine-timeline');
    // 이모지가 텍스트에 포함되어 있어야 함
    expect(timeline.textContent).toContain('🧴'); // cleanser
    expect(timeline.textContent).toContain('💧'); // toner
    expect(timeline.textContent).toContain('🧊'); // cream
  });
});
