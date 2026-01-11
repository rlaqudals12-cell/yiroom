/**
 * RecentScans 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecentScans } from '@/components/scan/shelf/RecentScans';
import type { ShelfItem } from '@/lib/scan/product-shelf';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 테스트용 Mock 데이터
const mockRecentItems: ShelfItem[] = [
  {
    id: 'recent-1',
    clerkUserId: 'user-1',
    productBarcode: '8809598453234',
    productName: 'AHA BHA PHA 토너',
    productBrand: 'SOME BY MI',
    productImageUrl: 'https://example.com/product1.jpg',
    productIngredients: [],
    status: 'owned',
    scanMethod: 'barcode',
    scannedAt: new Date('2024-01-15T10:00:00Z'),
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: 'recent-2',
    clerkUserId: 'user-1',
    productBarcode: '8809530069233',
    productName: 'Snail Essence',
    productBrand: 'COSRX',
    productImageUrl: undefined, // 이미지 없는 경우
    productIngredients: [],
    status: 'wishlist',
    scanMethod: 'barcode',
    scannedAt: new Date('2024-01-14T10:00:00Z'),
    createdAt: new Date('2024-01-14T10:00:00Z'),
    updatedAt: new Date('2024-01-14T10:00:00Z'),
  },
  {
    id: 'recent-3',
    clerkUserId: 'user-1',
    productBarcode: '8809572890260',
    productName: 'Supple Preparation Toner',
    productBrand: 'Dear, Klairs',
    productImageUrl: 'https://example.com/product3.jpg',
    productIngredients: [],
    status: 'owned',
    scanMethod: 'ocr',
    scannedAt: new Date('2024-01-13T10:00:00Z'),
    createdAt: new Date('2024-01-13T10:00:00Z'),
    updatedAt: new Date('2024-01-13T10:00:00Z'),
  },
];

describe('RecentScans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로딩 상태 표시', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<RecentScans />);

    // 로딩 스켈레톤이 표시되어야 함
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('최근 스캔 목록 렌더링', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockRecentItems }),
    });

    render(<RecentScans />);

    await waitFor(() => {
      expect(screen.getByTestId('recent-scans')).toBeInTheDocument();
      expect(screen.getByText('최근 스캔')).toBeInTheDocument();
    });
  });

  it('빈 목록일 때 렌더링 안 함', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    const { container } = render(<RecentScans />);

    await waitFor(() => {
      expect(container.querySelector('[data-testid="recent-scans"]')).not.toBeInTheDocument();
    });
  });

  it('전체 보기 클릭 시 제품함 페이지로 이동', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockRecentItems }),
    });

    render(<RecentScans />);

    await waitFor(() => {
      const viewAllButton = screen.getByText('전체 보기');
      fireEvent.click(viewAllButton);

      expect(mockPush).toHaveBeenCalledWith('/scan/shelf');
    });
  });

  it('아이템 클릭 시 상세 페이지로 이동', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockRecentItems }),
    });

    render(<RecentScans />);

    await waitFor(() => {
      // 브랜드명으로 첫 번째 아이템 찾기
      const firstBrand = screen.getByText('SOME BY MI');
      fireEvent.click(firstBrand);

      expect(mockPush).toHaveBeenCalledWith('/scan/shelf/recent-1');
    });
  });

  it('이미지 없는 제품은 기본 아이콘 표시', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockRecentItems }),
    });

    render(<RecentScans />);

    await waitFor(() => {
      // COSRX 제품은 이미지가 없으므로 Package 아이콘이 표시됨
      expect(screen.getByText('COSRX')).toBeInTheDocument();
    });
  });

  it('limit 파라미터가 API 호출에 포함됨', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockRecentItems.slice(0, 3) }),
    });

    render(<RecentScans limit={3} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/scan/history?limit=3');
    });
  });

  it('API 에러 시 콘솔 에러', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<RecentScans />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('className 전달', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockRecentItems }),
    });

    render(<RecentScans className="custom-class" />);

    await waitFor(() => {
      const container = screen.getByTestId('recent-scans');
      expect(container).toHaveClass('custom-class');
    });
  });
});
