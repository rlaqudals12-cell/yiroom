/**
 * ItemDetailSheet 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemDetailSheet } from '@/components/inventory/common/ItemDetailSheet';
import type { InventoryItem } from '@/types/inventory';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockItem: InventoryItem = {
  id: 'item-1',
  clerkUserId: 'user-123',
  category: 'closet',
  subCategory: 'top',
  name: '테스트 티셔츠',
  imageUrl: '/test-image.png',
  originalImageUrl: null,
  brand: 'TestBrand',
  tags: ['캐주얼', '여름'],
  isFavorite: false,
  useCount: 5,
  lastUsedAt: '2025-12-20T10:00:00Z',
  expiryDate: null,
  metadata: {
    color: ['화이트', '블랙'],
    season: ['spring', 'summer'],
    occasion: ['casual', 'date'],
    pattern: 'stripe',
  },
  createdAt: '2025-12-01T10:00:00Z',
  updatedAt: '2025-12-20T10:00:00Z',
};

describe('ItemDetailSheet', () => {
  it('renders nothing when item is null', () => {
    const { container } = render(
      <ItemDetailSheet item={null} open={true} onOpenChange={() => {}} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders item details when open', () => {
    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    // 이름이 SheetTitle과 h2에 중복되므로 getAllByText 사용
    const itemNames = screen.getAllByText('테스트 티셔츠');
    expect(itemNames.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('TestBrand')).toBeInTheDocument();
  });

  it('shows use count', () => {
    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/회 착용/)).toBeInTheDocument();
  });

  it('shows last worn date', () => {
    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    // 날짜만 표시됨 (마지막: 레이블 없음)
    expect(screen.getByText(/12월 20일/)).toBeInTheDocument();
  });

  it('displays colors', () => {
    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    expect(screen.getByText('화이트')).toBeInTheDocument();
    expect(screen.getByText('블랙')).toBeInTheDocument();
  });

  it('displays seasons', () => {
    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    expect(screen.getByText('봄')).toBeInTheDocument();
    expect(screen.getByText('여름')).toBeInTheDocument();
  });

  it('displays occasions', () => {
    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    expect(screen.getByText('캐주얼')).toBeInTheDocument();
    expect(screen.getByText('데이트')).toBeInTheDocument();
  });

  it('displays pattern', () => {
    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    expect(screen.getByText('스트라이프')).toBeInTheDocument();
  });

  it('displays tags', () => {
    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    expect(screen.getByText('#캐주얼')).toBeInTheDocument();
    expect(screen.getByText('#여름')).toBeInTheDocument();
  });

  it('calls onFavoriteToggle when heart is clicked', () => {
    const onFavoriteToggle = vi.fn();
    render(
      <ItemDetailSheet
        item={mockItem}
        open={true}
        onOpenChange={() => {}}
        onFavoriteToggle={onFavoriteToggle}
      />
    );

    const heartButtons = screen.getAllByRole('button');
    const heartButton = heartButtons.find((btn) => btn.querySelector('svg.lucide-heart'));

    if (heartButton) {
      fireEvent.click(heartButton);
      expect(onFavoriteToggle).toHaveBeenCalledWith(mockItem);
    }
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} onEdit={onEdit} />);

    const editButton = screen.getByText('수정');
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockItem);
  });

  it('shows delete confirmation dialog', async () => {
    const onDelete = vi.fn();
    render(
      <ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} onDelete={onDelete} />
    );

    // 삭제 버튼 클릭
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find((btn) => btn.querySelector('svg.lucide-trash-2'));

    if (deleteButton) {
      fireEvent.click(deleteButton);

      // 확인 다이얼로그가 나타나야 함
      await waitFor(() => {
        expect(screen.getByText('아이템 삭제')).toBeInTheDocument();
      });
    }
  });

  it('calls onRecordWear when record button is clicked', () => {
    const onRecordWear = vi.fn();
    render(
      <ItemDetailSheet
        item={mockItem}
        open={true}
        onOpenChange={() => {}}
        onRecordWear={onRecordWear}
      />
    );

    const recordButton = screen.getByText('오늘 착용 기록');
    fireEvent.click(recordButton);

    expect(onRecordWear).toHaveBeenCalledWith(mockItem);
  });

  it('shows creation date', () => {
    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    expect(screen.getByText(/2025년 12월 1일/)).toBeInTheDocument();
  });
});

// 착장 경로 분기 (ADR-115) — 트윈 우선, 없으면 FASHN 회귀
describe('ItemDetailSheet 착장 경로 분기', () => {
  // twin GET/ tryon GET을 URL로 라우팅
  function stubFetch(twinBody: unknown, twinOk: boolean) {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: unknown) => {
        const url = String(input);
        if (url.includes('/api/visual/tryon')) {
          return Promise.resolve({ ok: true, json: async () => ({ available: true }) });
        }
        // /api/visual/twin (compose 아님)
        return Promise.resolve({
          ok: twinOk,
          status: twinOk ? 200 : 404,
          json: async () => twinBody,
        });
      })
    );
  }

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('승인된 트윈이 있으면 트윈 경로 버튼을 노출한다(FASHN 버튼 아님)', async () => {
    stubFetch(
      { id: 'twin-1', imageUrl: 'https://x/twin.jpg', status: 'approved', aiGenerated: true },
      true
    );

    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    await waitFor(() => expect(screen.getByTestId('twin-tryon-button')).toBeInTheDocument());
    expect(screen.queryByTestId('tryon-button')).toBeNull();
  });

  it('트윈이 없으면 기존 FASHN 입어보기 버튼을 유지한다(회귀)', async () => {
    stubFetch({}, false);

    render(<ItemDetailSheet item={mockItem} open={true} onOpenChange={() => {}} />);

    // FASHN available:true → 기존 입어보기 버튼 노출
    await waitFor(() => expect(screen.getByTestId('tryon-button')).toBeInTheDocument());
    // 트윈 경로 버튼은 없어야 함
    expect(screen.queryByTestId('twin-tryon-button')).toBeNull();
  });
});
