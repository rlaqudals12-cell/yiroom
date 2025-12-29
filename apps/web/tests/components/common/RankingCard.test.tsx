import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RankingCard, type RankingItem } from '@/components/common/RankingCard';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Sparkles: () => <span data-testid="icon-sparkles">Sparkles</span>,
    TrendingUp: () => <span data-testid="icon-trending-up">Up</span>,
    TrendingDown: () => <span data-testid="icon-trending-down">Down</span>,
    Minus: () => <span data-testid="icon-minus">-</span>,
    Star: () => <span data-testid="icon-star">★</span>,
  };
});

// next/image 모킹
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="ranking-item-image" />
  ),
}));

describe('RankingCard', () => {
  const mockItems: RankingItem[] = [
    {
      id: '1',
      rank: 1,
      title: '히알루론산 세럼',
      subtitle: '수분 부스팅',
      change: 'same',
      rating: 4.8,
      reviewCount: 1234,
      imageUrl: '/images/product-1.jpg',
    },
    {
      id: '2',
      rank: 2,
      title: '비타민C 앰플',
      subtitle: '브라이트닝',
      change: 'up',
      changeAmount: 3,
      rating: 4.6,
      reviewCount: 987,
    },
    {
      id: '3',
      rank: 3,
      title: '레티놀 크림',
      change: 'down',
      changeAmount: 2,
    },
    {
      id: '4',
      rank: 4,
      title: 'AHA 토너',
      change: 'new',
    },
    {
      id: '5',
      rank: 5,
      title: 'BHA 클렌저',
      change: 'same',
      metadata: [
        { label: '피부타입', value: '지성' },
        { label: '효과', value: '모공' },
      ],
    },
  ];

  it('renders the card with test id', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    expect(screen.getByTestId('ranking-card')).toBeInTheDocument();
  });

  it('displays the title', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    expect(screen.getByText('인기 스킨케어')).toBeInTheDocument();
  });

  it('displays subtitle when provided', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        subtitle="이번 주 랭킹"
        items={mockItems}
        variant="beauty"
      />
    );

    expect(screen.getByText('이번 주 랭킹')).toBeInTheDocument();
  });

  it('displays all item titles', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    expect(screen.getByText('히알루론산 세럼')).toBeInTheDocument();
    expect(screen.getByText('비타민C 앰플')).toBeInTheDocument();
    expect(screen.getByText('레티놀 크림')).toBeInTheDocument();
  });

  it('displays item subtitles', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    expect(screen.getByText('수분 부스팅')).toBeInTheDocument();
    expect(screen.getByText('브라이트닝')).toBeInTheDocument();
  });

  it('shows rank badges', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    // 순위 숫자가 표시됨 (순위 번호와 변동량이 같을 수 있음)
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
  });

  it('shows rating and review count', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    // 평점 표시 (4.8)
    expect(screen.getByText(/4\.8/)).toBeInTheDocument();
    // 리뷰 수 표시
    expect(screen.getByText(/1,234/)).toBeInTheDocument();
  });

  it('shows metadata labels and values', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    expect(screen.getByText('피부타입: 지성')).toBeInTheDocument();
    expect(screen.getByText('효과: 모공')).toBeInTheDocument();
  });

  it('shows rank change indicators', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    // 상승 아이콘
    expect(screen.getByTestId('icon-trending-up')).toBeInTheDocument();
    // 하락 아이콘
    expect(screen.getByTestId('icon-trending-down')).toBeInTheDocument();
    // NEW 표시
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('shows change amount for up/down ranks', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    // 상승 3, 하락 2 (순위 번호와 변동량이 같을 수 있음)
    // changeAmount 3은 screen reader 텍스트에서도 확인 가능
    expect(screen.getByText('3단계 상승')).toBeInTheDocument();
    expect(screen.getByText('2단계 하락')).toBeInTheDocument();
  });

  it('displays images when imageUrl provided', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    const images = screen.getAllByTestId('ranking-item-image');
    expect(images.length).toBeGreaterThan(0);
  });

  it('respects maxItems prop', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
        maxItems={3}
      />
    );

    expect(screen.getByText('히알루론산 세럼')).toBeInTheDocument();
    expect(screen.getByText('비타민C 앰플')).toBeInTheDocument();
    expect(screen.getByText('레티놀 크림')).toBeInTheDocument();
    expect(screen.queryByText('AHA 토너')).not.toBeInTheDocument();
    expect(screen.queryByText('BHA 클렌저')).not.toBeInTheDocument();
  });

  it('shows "전체보기" button when onViewAll provided', () => {
    const handleViewAll = vi.fn();
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
        onViewAll={handleViewAll}
      />
    );

    const viewAllButton = screen.getByText('전체보기');
    expect(viewAllButton).toBeInTheDocument();

    fireEvent.click(viewAllButton);
    expect(handleViewAll).toHaveBeenCalledTimes(1);
  });

  it('handles item click', () => {
    const handleItemClick = vi.fn();
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
        onItemClick={handleItemClick}
      />
    );

    // 첫 번째 아이템 클릭
    const firstItem = screen.getByText('히알루론산 세럼');
    fireEvent.click(firstItem.closest('[role="button"]')!);
    expect(handleItemClick).toHaveBeenCalledWith('1');
  });

  it('handles keyboard navigation for item click', () => {
    const handleItemClick = vi.fn();
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
        onItemClick={handleItemClick}
      />
    );

    const clickableItem = screen.getByText('히알루론산 세럼').closest('[role="button"]')!;

    // Enter 키로 선택
    fireEvent.keyDown(clickableItem, { key: 'Enter' });
    expect(handleItemClick).toHaveBeenCalledWith('1');

    // Space 키로 선택
    fireEvent.keyDown(clickableItem, { key: ' ' });
    expect(handleItemClick).toHaveBeenCalledTimes(2);
  });

  it('applies beauty variant styles', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    const card = screen.getByTestId('ranking-card');
    // 헤더에 pink gradient가 적용됨
    const header = card.querySelector('.bg-gradient-to-r');
    expect(header?.className).toContain('pink');
  });

  it('applies style variant styles', () => {
    render(
      <RankingCard
        title="인기 패션"
        items={mockItems}
        variant="style"
      />
    );

    const card = screen.getByTestId('ranking-card');
    // 헤더에 indigo gradient가 적용됨
    const header = card.querySelector('.bg-gradient-to-r');
    expect(header?.className).toContain('indigo');
  });

  it('has accessible list structure', () => {
    render(
      <RankingCard
        title="인기 스킨케어"
        items={mockItems}
        variant="beauty"
      />
    );

    const list = screen.getByRole('list', { name: '인기 스킨케어 목록' });
    expect(list).toBeInTheDocument();
  });
});
