import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClosetInsightCard } from '@/components/inventory/recommendation/ClosetInsightCard';
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

describe('ClosetInsightCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('빈 아이템일 때 빈 상태를 표시해야 한다', () => {
    render(<ClosetInsightCard items={[]} />);

    expect(screen.getByTestId('closet-insight-card-empty')).toBeInTheDocument();
    expect(screen.getByText('내 옷장 분석')).toBeInTheDocument();
    expect(screen.getByText(/옷장에 아이템을 추가하면/)).toBeInTheDocument();
  });

  it('빈 상태에서 옷 추가 버튼이 작동해야 한다', async () => {
    const user = userEvent.setup();
    render(<ClosetInsightCard items={[]} />);

    await user.click(screen.getByRole('button', { name: '옷 추가하기' }));

    expect(mockPush).toHaveBeenCalledWith('/closet/add');
  });

  it('아이템이 있을 때 분석 카드를 표시해야 한다', () => {
    const items: InventoryItem[] = [
      createMockItem({ subCategory: 'top' }),
      createMockItem({ subCategory: 'bottom' }),
    ];

    render(<ClosetInsightCard items={items} />);

    expect(screen.getByTestId('closet-insight-card')).toBeInTheDocument();
    expect(screen.getByText('내 옷장 분석')).toBeInTheDocument();
  });

  it('전체 아이템 수를 표시해야 한다', () => {
    const items: InventoryItem[] = [
      createMockItem({ subCategory: 'top' }),
      createMockItem({ subCategory: 'bottom' }),
      createMockItem({ subCategory: 'outer' }),
    ];

    render(<ClosetInsightCard items={items} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('전체 아이템')).toBeInTheDocument();
  });

  it('퍼스널 매칭률이 표시되어야 한다', () => {
    const items: InventoryItem[] = [
      createMockItem({
        metadata: { color: ['코랄'], season: ['spring'], occasion: [] },
      }),
    ];

    render(<ClosetInsightCard items={items} personalColor="Spring" />);

    expect(screen.getByText('퍼스널 매칭률')).toBeInTheDocument();
    expect(screen.getByText(/%$/)).toBeInTheDocument();
  });

  it('잘 어울리는 아이템 수를 표시해야 한다', () => {
    const items: InventoryItem[] = [
      createMockItem({
        metadata: { color: ['코랄'], season: ['spring'], occasion: [] },
      }),
      createMockItem({
        metadata: { color: ['피치'], season: ['spring'], occasion: [] },
      }),
    ];

    render(<ClosetInsightCard items={items} personalColor="Spring" />);

    expect(screen.getByText('잘 어울리는')).toBeInTheDocument();
  });

  it('개선 필요 아이템 수를 표시해야 한다', () => {
    const items: InventoryItem[] = [
      createMockItem({
        metadata: { color: ['블랙'], season: ['winter'], occasion: [] },
      }),
    ];

    render(<ClosetInsightCard items={items} personalColor="Spring" />);

    expect(screen.getByText('개선 필요')).toBeInTheDocument();
  });

  it('보기 버튼이 작동해야 한다', async () => {
    const user = userEvent.setup();
    const items: InventoryItem[] = [createMockItem()];

    render(<ClosetInsightCard items={items} />);

    await user.click(screen.getByRole('button', { name: /보기/ }));

    expect(mockPush).toHaveBeenCalledWith('/closet');
  });

  it('분석 기준 정보가 표시되어야 한다', () => {
    const items: InventoryItem[] = [createMockItem()];

    render(
      <ClosetInsightCard items={items} personalColor="Spring" bodyType="S" />
    );

    expect(screen.getByText(/Spring 컬러/)).toBeInTheDocument();
    expect(screen.getByText(/스트레이트 체형/)).toBeInTheDocument();
    expect(screen.getByText(/기준/)).toBeInTheDocument();
  });

  it('className prop이 적용되어야 한다', () => {
    const items: InventoryItem[] = [createMockItem()];

    render(<ClosetInsightCard items={items} className="custom-class" />);

    expect(screen.getByTestId('closet-insight-card')).toHaveClass('custom-class');
  });

  it('체형만 있을 때도 분석 기준을 표시해야 한다', () => {
    const items: InventoryItem[] = [createMockItem()];

    render(<ClosetInsightCard items={items} bodyType="W" />);

    expect(screen.getByText(/웨이브 체형/)).toBeInTheDocument();
  });

  it('옵션이 없을 때 기본 분석을 표시해야 한다', () => {
    const items: InventoryItem[] = [createMockItem()];

    render(<ClosetInsightCard items={items} />);

    expect(screen.getByText(/기본 분석/)).toBeInTheDocument();
  });
});
