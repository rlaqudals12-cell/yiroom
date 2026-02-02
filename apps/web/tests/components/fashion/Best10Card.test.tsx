import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Best10Card, Best10List } from '@/components/fashion/Best10Card';
import type { OutfitRecommendation, StyleCategory } from '@/lib/fashion';

// 테스트용 코디 추천 생성 헬퍼
function createMockRecommendation(
  overrides: Partial<OutfitRecommendation> = {}
): OutfitRecommendation {
  return {
    id: `outfit-${Math.random().toString(36).slice(2)}`,
    name: '테스트 코디',
    description: '테스트용 코디 설명입니다.',
    items: [
      {
        name: '화이트 셔츠',
        category: 'top',
        color: '#FFFFFF',
        tags: ['기본'],
      },
      {
        name: '블랙 팬츠',
        category: 'bottom',
        color: '#000000',
        tags: ['정장'],
      },
    ],
    occasions: ['casual', 'date'],
    seasons: ['spring', 'autumn'],
    personalColors: ['Spring', 'Autumn'],
    ...overrides,
  };
}

describe('Best10Card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('코디 이름과 설명을 렌더링해야 한다', () => {
    const recommendation = createMockRecommendation({
      name: '스프링 데일리 룩',
      description: '봄에 어울리는 캐주얼 스타일',
    });

    render(<Best10Card recommendation={recommendation} rank={1} />);

    expect(screen.getByText('스프링 데일리 룩')).toBeInTheDocument();
    expect(screen.getByText('봄에 어울리는 캐주얼 스타일')).toBeInTheDocument();
  });

  it('순위 배지를 표시해야 한다', () => {
    const recommendation = createMockRecommendation();

    render(<Best10Card recommendation={recommendation} rank={3} />);

    expect(screen.getByTestId('rank-badge')).toHaveTextContent('3');
  });

  it('1위는 골드 스타일 배지를 표시해야 한다', () => {
    const recommendation = createMockRecommendation();

    render(<Best10Card recommendation={recommendation} rank={1} />);

    const badge = screen.getByTestId('rank-badge');
    expect(badge).toHaveClass('bg-yellow-500');
  });

  it('2위는 실버 스타일 배지를 표시해야 한다', () => {
    const recommendation = createMockRecommendation();

    render(<Best10Card recommendation={recommendation} rank={2} />);

    const badge = screen.getByTestId('rank-badge');
    expect(badge).toHaveClass('bg-gray-400');
  });

  it('3위는 브론즈 스타일 배지를 표시해야 한다', () => {
    const recommendation = createMockRecommendation();

    render(<Best10Card recommendation={recommendation} rank={3} />);

    const badge = screen.getByTestId('rank-badge');
    expect(badge).toHaveClass('bg-amber-600');
  });

  it('아이템 색상 미리보기를 표시해야 한다', () => {
    const recommendation = createMockRecommendation({
      items: [
        { name: '아이템1', category: 'top', color: '#FF0000' },
        { name: '아이템2', category: 'bottom', color: '#00FF00' },
      ],
    });

    render(<Best10Card recommendation={recommendation} rank={1} />);

    const card = screen.getByTestId('best10-card-1');
    const colorPreviews = card.querySelectorAll('[style*="background-color"]');
    expect(colorPreviews.length).toBeGreaterThanOrEqual(2);
  });

  it('아이템 개수를 표시해야 한다', () => {
    const recommendation = createMockRecommendation({
      items: [
        { name: '아이템1', category: 'top', color: '#FF0000' },
        { name: '아이템2', category: 'bottom', color: '#00FF00' },
        { name: '아이템3', category: 'shoes', color: '#0000FF' },
      ],
    });

    render(<Best10Card recommendation={recommendation} rank={1} />);

    expect(screen.getByText('3개 아이템')).toBeInTheDocument();
  });

  it('트렌드 아이템이 있으면 트렌드 배지를 표시해야 한다', () => {
    // isTrendItem2026 함수가 인식하는 2026 트렌드 아이템 사용
    const recommendation = createMockRecommendation({
      items: [
        { name: '그래픽 티', category: 'top', color: '#000000' },
      ],
    });

    render(<Best10Card recommendation={recommendation} rank={1} />);

    expect(screen.getByText('트렌드')).toBeInTheDocument();
  });

  it('클릭하면 다이얼로그가 열려야 한다', async () => {
    const user = userEvent.setup();
    const recommendation = createMockRecommendation();

    render(<Best10Card recommendation={recommendation} rank={1} />);

    const card = screen.getByTestId('best10-card-1');
    await user.click(card);

    expect(screen.getByTestId('best10-dialog')).toBeInTheDocument();
  });

  it('onItemClick 콜백이 호출되어야 한다', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    const recommendation = createMockRecommendation();

    render(
      <Best10Card
        recommendation={recommendation}
        rank={1}
        onItemClick={onItemClick}
      />
    );

    const card = screen.getByTestId('best10-card-1');
    await user.click(card);

    expect(onItemClick).toHaveBeenCalledWith(recommendation);
  });

  it('다이얼로그에서 구성 아이템 목록을 표시해야 한다', async () => {
    const user = userEvent.setup();
    const recommendation = createMockRecommendation({
      items: [
        { name: '화이트 셔츠', category: 'top', color: '#FFFFFF' },
        { name: '블랙 팬츠', category: 'bottom', color: '#000000' },
      ],
    });

    render(<Best10Card recommendation={recommendation} rank={1} />);

    await user.click(screen.getByTestId('best10-card-1'));

    const dialog = screen.getByTestId('best10-dialog');
    expect(within(dialog).getByText('화이트 셔츠')).toBeInTheDocument();
    expect(within(dialog).getByText('블랙 팬츠')).toBeInTheDocument();
  });

  it('다이얼로그에서 추천 상황을 표시해야 한다', async () => {
    const user = userEvent.setup();
    const recommendation = createMockRecommendation({
      occasions: ['casual', 'date'],
    });

    render(<Best10Card recommendation={recommendation} rank={1} />);

    await user.click(screen.getByTestId('best10-card-1'));

    const dialog = screen.getByTestId('best10-dialog');
    expect(within(dialog).getByText('추천 상황')).toBeInTheDocument();
    expect(within(dialog).getByText('casual')).toBeInTheDocument();
    expect(within(dialog).getByText('date')).toBeInTheDocument();
  });

  it('다이얼로그에서 추천 시즌을 표시해야 한다', async () => {
    const user = userEvent.setup();
    const recommendation = createMockRecommendation({
      seasons: ['spring', 'autumn'],
    });

    render(<Best10Card recommendation={recommendation} rank={1} />);

    await user.click(screen.getByTestId('best10-card-1'));

    const dialog = screen.getByTestId('best10-dialog');
    expect(within(dialog).getByText('추천 시즌')).toBeInTheDocument();
    expect(within(dialog).getByText('spring')).toBeInTheDocument();
    expect(within(dialog).getByText('autumn')).toBeInTheDocument();
  });

  it('다이얼로그에서 어울리는 퍼스널 컬러를 표시해야 한다', async () => {
    const user = userEvent.setup();
    const recommendation = createMockRecommendation({
      personalColors: ['Spring', 'Autumn'],
    });

    render(<Best10Card recommendation={recommendation} rank={1} />);

    await user.click(screen.getByTestId('best10-card-1'));

    const dialog = screen.getByTestId('best10-dialog');
    expect(within(dialog).getByText('어울리는 퍼스널 컬러')).toBeInTheDocument();
    expect(within(dialog).getByText('Spring')).toBeInTheDocument();
    expect(within(dialog).getByText('Autumn')).toBeInTheDocument();
  });

  it('다이얼로그에서 닫기 버튼이 작동해야 한다', async () => {
    const user = userEvent.setup();
    const recommendation = createMockRecommendation();

    render(<Best10Card recommendation={recommendation} rank={1} />);

    await user.click(screen.getByTestId('best10-card-1'));
    expect(screen.getByTestId('best10-dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByTestId('best10-dialog')).not.toBeInTheDocument();
  });

  it('className prop이 적용되어야 한다', () => {
    const recommendation = createMockRecommendation();

    render(
      <Best10Card
        recommendation={recommendation}
        rank={1}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('best10-card-1')).toHaveClass('custom-class');
  });

  it('스타일 카테고리가 다이얼로그에 표시되어야 한다', async () => {
    const user = userEvent.setup();
    const recommendation = createMockRecommendation();

    render(
      <Best10Card
        recommendation={recommendation}
        rank={1}
        styleCategory="casual"
      />
    );

    await user.click(screen.getByTestId('best10-card-1'));

    const dialog = screen.getByTestId('best10-dialog');
    expect(within(dialog).getByText(/캐주얼 스타일 코디/)).toBeInTheDocument();
  });
});

describe('Best10List', () => {
  const mockRecommendations: OutfitRecommendation[] = [
    createMockRecommendation({ id: '1', name: '코디 1' }),
    createMockRecommendation({ id: '2', name: '코디 2' }),
    createMockRecommendation({ id: '3', name: '코디 3' }),
  ];

  it('목록 컨테이너를 렌더링해야 한다', () => {
    render(<Best10List recommendations={mockRecommendations} />);

    expect(screen.getByTestId('best10-list')).toBeInTheDocument();
  });

  it('모든 추천 코디를 렌더링해야 한다', () => {
    render(<Best10List recommendations={mockRecommendations} />);

    expect(screen.getByText('코디 1')).toBeInTheDocument();
    expect(screen.getByText('코디 2')).toBeInTheDocument();
    expect(screen.getByText('코디 3')).toBeInTheDocument();
  });

  it('제목을 표시해야 한다', () => {
    render(<Best10List recommendations={mockRecommendations} />);

    expect(screen.getByText(/Best 10/)).toBeInTheDocument();
  });

  it('커스텀 제목을 사용할 수 있어야 한다', () => {
    render(
      <Best10List recommendations={mockRecommendations} title="인기 코디 TOP 10" />
    );

    expect(screen.getByText('인기 코디 TOP 10')).toBeInTheDocument();
  });

  it('스타일 카테고리에 따른 제목을 표시해야 한다', () => {
    render(
      <Best10List
        recommendations={mockRecommendations}
        styleCategory="formal"
      />
    );

    expect(screen.getByText(/포멀 Best 10/)).toBeInTheDocument();
  });

  it('최대 10개까지만 표시해야 한다', () => {
    const manyRecommendations = Array.from({ length: 15 }, (_, i) =>
      createMockRecommendation({ id: `${i}`, name: `코디 ${i + 1}` })
    );

    render(<Best10List recommendations={manyRecommendations} />);

    // 10번째까지만 표시
    expect(screen.getByText('코디 1')).toBeInTheDocument();
    expect(screen.getByText('코디 10')).toBeInTheDocument();
    expect(screen.queryByText('코디 11')).not.toBeInTheDocument();
  });

  it('onItemClick 콜백이 전달되어야 한다', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();

    render(
      <Best10List
        recommendations={mockRecommendations}
        onItemClick={onItemClick}
      />
    );

    await user.click(screen.getByTestId('best10-card-1'));

    expect(onItemClick).toHaveBeenCalled();
  });

  it('className prop이 적용되어야 한다', () => {
    render(
      <Best10List
        recommendations={mockRecommendations}
        className="custom-list-class"
      />
    );

    expect(screen.getByTestId('best10-list')).toHaveClass('custom-list-class');
  });
});
