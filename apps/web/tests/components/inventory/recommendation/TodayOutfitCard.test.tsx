import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodayOutfitCard } from '@/components/inventory/recommendation/TodayOutfitCard';
import type { InventoryItem } from '@/types/inventory';

// next/navigation mock
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
}));

// 테스트용 아이템 생성 헬퍼
function createMockItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: `item-${Math.random().toString(36).slice(2)}`,
    clerkUserId: 'user-1',
    category: 'closet',
    subCategory: 'top',
    name: '테스트 아이템',
    imageUrl: 'https://example.com/image.jpg',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: {
      color: [],
      season: [],
      occasion: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('TodayOutfitCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('빈 아이템일 때 빈 상태를 표시해야 한다', () => {
    render(<TodayOutfitCard items={[]} />);

    expect(screen.getByTestId('today-outfit-card-empty')).toBeInTheDocument();
    expect(screen.getByText('오늘의 코디')).toBeInTheDocument();
    expect(screen.getByText(/옷장에 아이템을 추가하면/)).toBeInTheDocument();
  });

  it('빈 상태에서 옷 추가 버튼이 작동해야 한다', async () => {
    const user = userEvent.setup();
    render(<TodayOutfitCard items={[]} />);

    await user.click(screen.getByRole('button', { name: '옷 추가하기' }));

    expect(mockPush).toHaveBeenCalledWith('/closet/add');
  });

  it('아이템이 있을 때 코디 카드를 표시해야 한다', () => {
    const items: InventoryItem[] = [
      createMockItem({ subCategory: 'top', name: '화이트 셔츠' }),
      createMockItem({ subCategory: 'bottom', name: '네이비 팬츠' }),
      createMockItem({ subCategory: 'shoes', name: '로퍼' }),
    ];

    render(<TodayOutfitCard items={items} />);

    expect(screen.getByTestId('today-outfit-card')).toBeInTheDocument();
    expect(screen.getByText('오늘의 코디')).toBeInTheDocument();
  });

  it('날씨 정보가 있을 때 기온을 표시해야 한다', () => {
    const items: InventoryItem[] = [
      createMockItem({ subCategory: 'top' }),
      createMockItem({ subCategory: 'bottom' }),
    ];

    render(
      <TodayOutfitCard
        items={items}
        weather={{ temp: 18, precipitation: 10 }}
      />
    );

    expect(screen.getByText('18°C')).toBeInTheDocument();
  });

  it('퍼스널컬러가 있을 때 배지를 표시해야 한다', () => {
    const items: InventoryItem[] = [
      createMockItem({ subCategory: 'top' }),
      createMockItem({ subCategory: 'bottom' }),
    ];

    render(<TodayOutfitCard items={items} personalColor="Spring" />);

    expect(screen.getByText('Spring 컬러')).toBeInTheDocument();
  });

  it('매칭 점수가 표시되어야 한다', () => {
    const items: InventoryItem[] = [
      createMockItem({ subCategory: 'top' }),
      createMockItem({ subCategory: 'bottom' }),
    ];

    render(<TodayOutfitCard items={items} />);

    expect(screen.getByText(/매칭 점수/)).toBeInTheDocument();
  });

  it('코디 저장 버튼이 작동해야 한다', async () => {
    const user = userEvent.setup();
    const items: InventoryItem[] = [
      createMockItem({ subCategory: 'top' }),
      createMockItem({ subCategory: 'bottom' }),
    ];

    render(<TodayOutfitCard items={items} />);

    await user.click(screen.getByRole('button', { name: '코디 저장' }));

    expect(mockPush).toHaveBeenCalledWith('/closet/outfits/new');
  });

  it('옷장 보기 버튼이 작동해야 한다', async () => {
    const user = userEvent.setup();
    const items: InventoryItem[] = [
      createMockItem({ subCategory: 'top' }),
      createMockItem({ subCategory: 'bottom' }),
    ];

    render(<TodayOutfitCard items={items} />);

    await user.click(screen.getByRole('button', { name: /옷장 보기/ }));

    expect(mockPush).toHaveBeenCalledWith('/closet');
  });

  it('className prop이 적용되어야 한다', () => {
    const items: InventoryItem[] = [
      createMockItem({ subCategory: 'top' }),
      createMockItem({ subCategory: 'bottom' }),
    ];

    render(<TodayOutfitCard items={items} className="custom-class" />);

    expect(screen.getByTestId('today-outfit-card')).toHaveClass('custom-class');
  });
});
