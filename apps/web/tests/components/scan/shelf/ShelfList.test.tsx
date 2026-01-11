/**
 * ShelfList 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShelfList } from '@/components/scan/shelf/ShelfList';
import type { ShelfItem } from '@/lib/scan/product-shelf';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 테스트용 Mock 데이터
const mockShelfItems: ShelfItem[] = [
  {
    id: 'shelf-1',
    clerkUserId: 'user-1',
    productBarcode: '8809598453234',
    productName: 'AHA BHA PHA 토너',
    productBrand: 'SOME BY MI',
    productImageUrl: 'https://example.com/product1.jpg',
    productIngredients: [],
    status: 'owned',
    scanMethod: 'barcode',
    compatibilityScore: 85,
    scannedAt: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 'shelf-2',
    clerkUserId: 'user-1',
    productBarcode: '8809530069233',
    productName: 'Snail Essence',
    productBrand: 'COSRX',
    productImageUrl: 'https://example.com/product2.jpg',
    productIngredients: [],
    status: 'wishlist',
    scanMethod: 'barcode',
    compatibilityScore: 92,
    scannedAt: new Date('2024-01-14T10:00:00Z'),
    createdAt: new Date('2024-01-14T10:00:00Z'),
    updatedAt: new Date('2024-01-14T10:00:00Z'),
  },
];

const mockCounts = {
  owned: 5,
  used_up: 2,
  wishlist: 3,
  archived: 1,
};

describe('ShelfList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로딩 상태 표시', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<ShelfList />);

    // 로딩 스피너가 표시되어야 함
    expect(screen.getByTestId('shelf-list')).toBeInTheDocument();
  });

  it('제품 목록 렌더링', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockShelfItems, counts: mockCounts }),
    });

    render(<ShelfList />);

    await waitFor(() => {
      expect(screen.getByText('AHA BHA PHA 토너')).toBeInTheDocument();
      expect(screen.getByText('Snail Essence')).toBeInTheDocument();
    });
  });

  it('빈 목록 표시', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], counts: {} }),
    });

    render(<ShelfList />);

    await waitFor(() => {
      expect(screen.getByText('제품함이 비어있어요')).toBeInTheDocument();
      expect(screen.getByText('제품 스캔하기')).toBeInTheDocument();
    });
  });

  it('스캔 페이지로 이동 버튼', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], counts: {} }),
    });

    render(<ShelfList />);

    await waitFor(() => {
      const scanButton = screen.getByText('제품 스캔하기');
      fireEvent.click(scanButton);

      expect(mockPush).toHaveBeenCalledWith('/scan');
    });
  });

  it('필터 탭 표시', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockShelfItems, counts: mockCounts }),
    });

    render(<ShelfList />);

    await waitFor(() => {
      // 필터 버튼들이 표시되어야 함
      expect(screen.getByText('전체')).toBeInTheDocument();
      expect(screen.getByText('보유 중')).toBeInTheDocument();
      expect(screen.getByText('다 씀')).toBeInTheDocument();
      expect(screen.getByText('위시리스트')).toBeInTheDocument();
    });
  });

  it('아이템 클릭 시 상세 페이지 이동', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockShelfItems, counts: mockCounts }),
    });

    render(<ShelfList />);

    await waitFor(() => {
      const firstItem = screen.getByText('AHA BHA PHA 토너');
      fireEvent.click(firstItem);

      expect(mockPush).toHaveBeenCalledWith('/scan/shelf/shelf-1');
    });
  });

  it('API 에러 시 콘솔 에러', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<ShelfList />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('더 보기 버튼 표시 (hasMore)', async () => {
    // PAGE_SIZE(20) 만큼의 아이템이 있으면 더 보기 버튼 표시
    const manyItems = Array.from({ length: 20 }, (_, i) => ({
      ...mockShelfItems[0],
      id: `shelf-${i}`,
      productName: `Product ${i}`,
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: manyItems, counts: mockCounts }),
    });

    render(<ShelfList />);

    await waitFor(() => {
      expect(screen.getByText('더 보기')).toBeInTheDocument();
    });
  });
});
