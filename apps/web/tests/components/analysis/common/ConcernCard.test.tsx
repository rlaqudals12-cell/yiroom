import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';

// lucide-react 아이콘 mock
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    ...actual,
    CheckCircle: createMockIcon('CheckCircle'),
    Minus: createMockIcon('Minus'),
    AlertCircle: createMockIcon('AlertCircle'),
    Droplets: createMockIcon('Droplets'),
  };
});

import ConcernCard from '@/components/analysis/common/ConcernCard';
import ConcernGrid, { sortByStrengthsFirst } from '@/components/analysis/common/ConcernGrid';
import type { ConcernCardItem } from '@/types/analysis-concern';

// 테스트용 아이콘
const TestIcon = () => <svg data-testid="test-icon" />;

describe('ConcernCard', () => {
  const defaultProps = {
    id: 'hydration',
    icon: createElement(TestIcon),
    label: '수분도',
    score: 75,
    severity: 'good' as const,
    severityLabel: '좋음',
    tip: '수분 밸런스가 잘 유지되고 있어요',
  };

  it('should render label and score', () => {
    render(<ConcernCard {...defaultProps} />);
    expect(screen.getByText('수분도')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should render severity badge with triple encoding', () => {
    render(<ConcernCard {...defaultProps} />);
    const badge = screen.getByTestId('concern-severity-badge');
    expect(badge).toHaveTextContent('좋음');
    // 아이콘도 배지 내부에 있어야 함 (triple encoding)
    expect(badge.querySelector('svg')).toBeInTheDocument();
  });

  it('should render tip text', () => {
    render(<ConcernCard {...defaultProps} />);
    expect(screen.getByText('수분 밸런스가 잘 유지되고 있어요')).toBeInTheDocument();
  });

  it('should have correct data-testid', () => {
    render(<ConcernCard {...defaultProps} />);
    expect(screen.getByTestId('concern-card-hydration')).toBeInTheDocument();
  });

  it('should call onExpand when clicked', () => {
    const handleExpand = vi.fn();
    render(<ConcernCard {...defaultProps} onExpand={handleExpand} />);
    fireEvent.click(screen.getByTestId('concern-card-hydration'));
    expect(handleExpand).toHaveBeenCalledTimes(1);
  });

  it('should render warning severity with correct styling', () => {
    render(
      <ConcernCard {...defaultProps} severity="warning" severityLabel="관리 필요" score={30} />
    );
    const badge = screen.getByTestId('concern-severity-badge');
    expect(badge).toHaveTextContent('관리 필요');
  });

  it('should have accessible aria-label', () => {
    render(<ConcernCard {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '수분도 75점 좋음');
  });
});

describe('ConcernGrid', () => {
  const mockItems: ConcernCardItem[] = [
    {
      id: 'trouble',
      icon: createElement(TestIcon),
      label: '트러블',
      score: 30,
      severity: 'warning',
      severityLabel: '관리 필요',
      tip: '스팟 케어 추천',
    },
    {
      id: 'hydration',
      icon: createElement(TestIcon),
      label: '수분도',
      score: 85,
      severity: 'good',
      severityLabel: '좋음',
      tip: '수분 밸런스 좋음',
    },
    {
      id: 'oil',
      icon: createElement(TestIcon),
      label: '유분도',
      score: 55,
      severity: 'normal',
      severityLabel: '보통',
      tip: '밸런스 맞추기',
    },
  ];

  it('should render all items', () => {
    render(<ConcernGrid items={mockItems} />);
    expect(screen.getByTestId('concern-grid')).toBeInTheDocument();
    expect(screen.getByText('수분도')).toBeInTheDocument();
    expect(screen.getByText('유분도')).toBeInTheDocument();
    expect(screen.getByText('트러블')).toBeInTheDocument();
  });

  it('should sort items by Strengths-First (score descending)', () => {
    render(<ConcernGrid items={mockItems} />);
    const grid = screen.getByTestId('concern-grid');
    const cards = grid.querySelectorAll('[data-testid^="concern-card-"]');

    // 첫 번째: 수분도 (85), 두 번째: 유분도 (55), 세 번째: 트러블 (30)
    expect(cards[0]).toHaveAttribute('data-testid', 'concern-card-hydration');
    expect(cards[1]).toHaveAttribute('data-testid', 'concern-card-oil');
    expect(cards[2]).toHaveAttribute('data-testid', 'concern-card-trouble');
  });

  it('should return null for empty items', () => {
    const { container } = render(<ConcernGrid items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should call onCardExpand with card id', () => {
    const handleExpand = vi.fn();
    render(<ConcernGrid items={mockItems} onCardExpand={handleExpand} />);
    fireEvent.click(screen.getByTestId('concern-card-hydration'));
    expect(handleExpand).toHaveBeenCalledWith('hydration');
  });
});

describe('sortByStrengthsFirst', () => {
  it('should sort by score descending', () => {
    const items = [
      { score: 30, id: 'a' },
      { score: 85, id: 'b' },
      { score: 55, id: 'c' },
    ];
    const sorted = sortByStrengthsFirst(items);
    expect(sorted.map((i) => i.id)).toEqual(['b', 'c', 'a']);
  });

  it('should not mutate the original array', () => {
    const items = [{ score: 30 }, { score: 85 }];
    const original = [...items];
    sortByStrengthsFirst(items);
    expect(items).toEqual(original);
  });
});
