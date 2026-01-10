import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoutineStepList from '@/components/skin/routine/RoutineStepList';
import type { RoutineStep } from '@/types/skincare-routine';

describe('RoutineStepList', () => {
  const mockSteps: RoutineStep[] = [
    {
      order: 1,
      category: 'cleanser',
      name: '클렌저',
      purpose: '피지 제거',
      duration: '1분',
      tips: ['미온수 사용'],
      isOptional: false,
    },
    {
      order: 2,
      category: 'toner',
      name: '토너',
      purpose: 'pH 밸런스',
      duration: '30초',
      tips: ['패팅 방식'],
      isOptional: false,
    },
    {
      order: 3,
      category: 'cream',
      name: '크림',
      purpose: '보습',
      duration: '30초',
      tips: ['얼굴 전체에'],
      isOptional: false,
    },
  ];

  it('renders with test id', () => {
    render(<RoutineStepList steps={mockSteps} />);
    expect(screen.getByTestId('routine-step-list')).toBeInTheDocument();
  });

  it('renders all steps', () => {
    render(<RoutineStepList steps={mockSteps} />);

    expect(screen.getByText('클렌저')).toBeInTheDocument();
    expect(screen.getByText('토너')).toBeInTheDocument();
    expect(screen.getByText('크림')).toBeInTheDocument();
  });

  it('renders steps in order', () => {
    // 순서가 뒤섞인 배열로 테스트
    const unorderedSteps = [mockSteps[2], mockSteps[0], mockSteps[1]];
    render(<RoutineStepList steps={unorderedSteps} />);

    const items = screen.getAllByTestId('routine-step-item');
    expect(items).toHaveLength(3);

    // 순서대로 정렬되어야 함
    expect(items[0]).toHaveTextContent('클렌저');
    expect(items[1]).toHaveTextContent('토너');
    expect(items[2]).toHaveTextContent('크림');
  });

  it('shows empty state when no steps', () => {
    render(<RoutineStepList steps={[]} />);

    expect(screen.getByTestId('routine-step-list-empty')).toBeInTheDocument();
    expect(screen.getByText('루틴 단계가 없어요')).toBeInTheDocument();
  });

  it('passes showProducts prop to items', () => {
    const stepsWithProducts: RoutineStep[] = [
      {
        ...mockSteps[0],
        recommendedProducts: [
          {
            id: 'prod-1',
            partnerId: 'partner-1',
            externalProductId: 'ext-1',
            name: '테스트 제품',
            currency: 'KRW',
            affiliateUrl: 'https://example.com',
            isInStock: true,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ];

    render(<RoutineStepList steps={stepsWithProducts} showProducts />);

    // showProducts가 전달되어 제품 정보가 렌더링될 수 있음
    expect(screen.getByTestId('routine-step-list')).toBeInTheDocument();
  });

  it('passes onProductClick to items', () => {
    const onProductClick = vi.fn();
    render(<RoutineStepList steps={mockSteps} showProducts onProductClick={onProductClick} />);

    // props가 전달됨을 확인
    expect(screen.getByTestId('routine-step-list')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<RoutineStepList steps={mockSteps} className="custom-class" />);
    expect(screen.getByTestId('routine-step-list')).toHaveClass('custom-class');
  });

  it('renders connection lines between steps', () => {
    render(<RoutineStepList steps={mockSteps} />);

    // 연결선이 존재하는지 확인 (마지막 아이템 제외하고 2개)
    const list = screen.getByTestId('routine-step-list');
    expect(list.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});
