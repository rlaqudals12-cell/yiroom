import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoutineCard from '@/components/skin/routine/RoutineCard';
import type { RoutineStep } from '@/types/skincare-routine';

describe('RoutineCard', () => {
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
      category: 'essence',
      name: '에센스',
      purpose: '영양 공급',
      duration: '30초',
      tips: [],
      isOptional: true,
    },
    {
      order: 4,
      category: 'cream',
      name: '크림',
      purpose: '보습',
      duration: '30초',
      tips: [],
      isOptional: false,
    },
  ];

  it('renders with test id', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} />);
    expect(screen.getByTestId('routine-card')).toBeInTheDocument();
  });

  it('displays morning title for morning routine', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} />);
    // i18n 마이그레이션: 아침 루틴 제목은 skinUI.routineCard0 키로 렌더링 (테스트 목은 키 반환)
    expect(screen.getByText('routineCard0')).toBeInTheDocument();
  });

  it('displays evening title for evening routine', () => {
    render(<RoutineCard timeOfDay="evening" steps={mockSteps} estimatedTime={3} />);
    // i18n 마이그레이션: 저녁 루틴 제목은 skinUI.routineCard1 키로 렌더링
    expect(screen.getByText('routineCard1')).toBeInTheDocument();
  });

  it('displays step count', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} />);
    expect(screen.getByText('4단계')).toBeInTheDocument();
  });

  it('displays estimated time', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} />);
    expect(screen.getByText('3분')).toBeInTheDocument();
  });

  it('separates required and optional steps', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} />);

    // i18n 마이그레이션: 필수 단계 라벨은 skinUI.routineCard2 키로 렌더링 (선택 단계는 하드코딩 유지)
    expect(screen.getByText('routineCard2')).toBeInTheDocument();
    expect(screen.getByText(/선택 단계/)).toBeInTheDocument();
  });

  it('displays required step names', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} />);

    expect(screen.getByText('클렌저')).toBeInTheDocument();
    expect(screen.getByText('토너')).toBeInTheDocument();
    expect(screen.getByText('크림')).toBeInTheDocument();
  });

  it('displays optional step names', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} />);

    expect(screen.getByText('에센스')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(
      <RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} onSelect={onSelect} />
    );

    fireEvent.click(screen.getByTestId('routine-card'));
    expect(onSelect).toHaveBeenCalled();
  });

  it('calls onSelect on Enter key', () => {
    const onSelect = vi.fn();
    render(
      <RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} onSelect={onSelect} />
    );

    fireEvent.keyDown(screen.getByTestId('routine-card'), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalled();
  });

  it('calls onSelect on Space key', () => {
    const onSelect = vi.fn();
    render(
      <RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} onSelect={onSelect} />
    );

    fireEvent.keyDown(screen.getByTestId('routine-card'), { key: ' ' });
    expect(onSelect).toHaveBeenCalled();
  });

  it('applies active style when isActive is true', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} isActive />);

    const card = screen.getByTestId('routine-card');
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('has aria-pressed false when not active', () => {
    render(
      <RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} isActive={false} />
    );

    const card = screen.getByTestId('routine-card');
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  it('applies custom className', () => {
    render(
      <RoutineCard
        timeOfDay="morning"
        steps={mockSteps}
        estimatedTime={3}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('routine-card')).toHaveClass('custom-class');
  });

  it('displays category emojis for steps', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} />);

    const card = screen.getByTestId('routine-card');
    expect(card.textContent).toContain('🧴'); // cleanser
    expect(card.textContent).toContain('💧'); // toner
    expect(card.textContent).toContain('🧊'); // cream
  });

  it('has button role for accessibility', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} />);

    const card = screen.getByTestId('routine-card');
    expect(card).toHaveAttribute('role', 'button');
  });

  it('is keyboard focusable', () => {
    render(<RoutineCard timeOfDay="morning" steps={mockSteps} estimatedTime={3} />);

    const card = screen.getByTestId('routine-card');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('shows +N more when many optional steps exist', () => {
    const manyOptionalSteps: RoutineStep[] = [
      ...mockSteps,
      {
        order: 5,
        category: 'serum',
        name: '세럼',
        purpose: '',
        duration: '',
        tips: [],
        isOptional: true,
      },
      {
        order: 6,
        category: 'ampoule',
        name: '앰플',
        purpose: '',
        duration: '',
        tips: [],
        isOptional: true,
      },
      {
        order: 7,
        category: 'mask',
        name: '마스크',
        purpose: '',
        duration: '',
        tips: [],
        isOptional: true,
      },
      {
        order: 8,
        category: 'eye_cream',
        name: '아이크림',
        purpose: '',
        duration: '',
        tips: [],
        isOptional: true,
      },
      {
        order: 9,
        category: 'oil',
        name: '오일',
        purpose: '',
        duration: '',
        tips: [],
        isOptional: true,
      },
    ];

    render(<RoutineCard timeOfDay="evening" steps={manyOptionalSteps} estimatedTime={5} />);

    // 선택적 단계가 4개 초과하면 +N개 표시
    expect(screen.getByText('+2개')).toBeInTheDocument();
  });
});
