import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OutfitRoutineCard, type OutfitItem } from '@/components/style/OutfitRoutineCard';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Briefcase: () => <span data-testid="icon-briefcase">Briefcase</span>,
    Coffee: () => <span data-testid="icon-coffee">Coffee</span>,
    Heart: () => <span data-testid="icon-heart">Heart</span>,
    Plane: () => <span data-testid="icon-plane">Plane</span>,
    Plus: () => <span data-testid="icon-plus">Plus</span>,
    Edit2: () => <span data-testid="icon-edit">Edit</span>,
  };
});

describe('OutfitRoutineCard', () => {
  const dailyItems: OutfitItem[] = [
    { order: 1, category: 'top', productName: '크롭 니트', color: '아이보리', colorHex: '#FFF8E7' },
    { order: 2, category: 'bottom', productName: '슬랙스', color: '베이지', colorHex: '#D4A574' },
    { order: 3, category: 'shoes', productName: '로퍼', color: '브라운', colorHex: '#8B4513' },
  ];

  it('renders the card with test id', () => {
    render(<OutfitRoutineCard occasion="daily" items={dailyItems} />);

    expect(screen.getByTestId('outfit-routine-card')).toBeInTheDocument();
  });

  it('displays occasion label for daily', () => {
    render(<OutfitRoutineCard occasion="daily" items={dailyItems} />);

    expect(screen.getByText('데일리 코디')).toBeInTheDocument();
  });

  it('displays all outfit items', () => {
    render(<OutfitRoutineCard occasion="daily" items={dailyItems} />);

    expect(screen.getByText('크롭 니트')).toBeInTheDocument();
    expect(screen.getByText('슬랙스')).toBeInTheDocument();
    expect(screen.getByText('로퍼')).toBeInTheDocument();
  });

  it('shows category labels', () => {
    render(<OutfitRoutineCard occasion="daily" items={dailyItems} />);

    expect(screen.getByText('상의')).toBeInTheDocument();
    expect(screen.getByText('하의')).toBeInTheDocument();
    expect(screen.getByText('신발')).toBeInTheDocument();
  });

  it('displays match rate when provided', () => {
    render(<OutfitRoutineCard occasion="daily" items={dailyItems} matchRate={92} />);

    expect(screen.getByText('매칭 92%')).toBeInTheDocument();
  });

  it('displays color names', () => {
    render(<OutfitRoutineCard occasion="daily" items={dailyItems} />);

    expect(screen.getByText('아이보리')).toBeInTheDocument();
    expect(screen.getByText('베이지')).toBeInTheDocument();
    expect(screen.getByText('브라운')).toBeInTheDocument();
  });

  it('shows style tips when provided', () => {
    render(
      <OutfitRoutineCard
        occasion="daily"
        items={dailyItems}
        styleTips={['하이웨스트로 다리 길어 보이기', '컬러 조합이 조화로움']}
      />
    );

    expect(screen.getByText('스타일 팁')).toBeInTheDocument();
    expect(screen.getByText('하이웨스트로 다리 길어 보이기')).toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    render(<OutfitRoutineCard occasion="daily" items={[]} />);

    expect(screen.getByText(/코디가 없습니다/)).toBeInTheDocument();
  });

  it('원피스 슬롯을 한국어 라벨과 기능 아이콘으로 표시한다', () => {
    const dressOutfit: OutfitItem[] = [
      { order: 1, category: 'dress', productName: '플로럴 원피스', color: '아이보리' },
      { order: 2, category: 'shoes', productName: '로퍼', color: '브라운' },
    ];

    render(<OutfitRoutineCard occasion="daily" items={dressOutfit} />);

    expect(screen.getByText('원피스')).toBeInTheDocument();
    expect(screen.getByText('플로럴 원피스')).toBeInTheDocument();
    expect(screen.getByLabelText('원피스 이미지 없음')).toBeInTheDocument();
    expect(screen.queryByText('dress')).not.toBeInTheDocument();
    expect(screen.queryByText('👗')).not.toBeInTheDocument();
  });

  it('그라데이션·이모지·인디고 하드코딩 대신 헤어라인과 시맨틱 토큰을 쓴다', () => {
    render(<OutfitRoutineCard occasion="daily" items={dailyItems} matchRate={92} />);

    const card = screen.getByTestId('outfit-routine-card');
    expect(card.innerHTML).not.toContain('bg-gradient');
    expect(card.innerHTML).not.toContain('indigo');
    expect(card.textContent).not.toMatch(/[👕👖👗🧥👟👜📦]/u);
    expect(card.querySelector('.border-b')).not.toBeNull();
  });

  it('shows add button in edit mode', () => {
    const handleAdd = vi.fn();
    render(
      <OutfitRoutineCard
        occasion="daily"
        items={dailyItems}
        editable={true}
        onAddItem={handleAdd}
      />
    );

    const addButton = screen.getByText('아이템 추가');
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(handleAdd).toHaveBeenCalled();
  });
});
