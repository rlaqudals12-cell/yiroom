/**
 * ItemCard 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemCard } from '@/components/inventory/common/ItemCard';
import type { InventoryItem } from '@/types/inventory';

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
    color: ['#FFFFFF', '화이트'],
    season: ['spring', 'summer'],
    occasion: ['casual'],
  },
  createdAt: '2025-12-01T10:00:00Z',
  updatedAt: '2025-12-20T10:00:00Z',
};

describe('ItemCard', () => {
  it('renders item name and brand', () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText('테스트 티셔츠')).toBeInTheDocument();
    expect(screen.getByText('TestBrand')).toBeInTheDocument();
  });

  it('renders item image', () => {
    render(<ItemCard item={mockItem} />);

    const img = screen.getByAltText('테스트 티셔츠');
    expect(img).toHaveAttribute('src', '/test-image.png');
  });

  it('shows use count', () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText('5회 착용')).toBeInTheDocument();
  });

  it('displays first tag', () => {
    render(<ItemCard item={mockItem} />);

    expect(screen.getByText('캐주얼')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('calls onFavoriteToggle when heart is clicked', () => {
    const onFavoriteToggle = vi.fn();
    render(<ItemCard item={mockItem} onFavoriteToggle={onFavoriteToggle} />);

    const heartButton = screen.getByLabelText('즐겨찾기 추가');
    fireEvent.click(heartButton);

    expect(onFavoriteToggle).toHaveBeenCalledWith(mockItem);
  });

  it('shows filled heart when item is favorite', () => {
    const favoriteItem = { ...mockItem, isFavorite: true };
    render(<ItemCard item={favoriteItem} />);

    const heartButton = screen.getByLabelText('즐겨찾기 해제');
    expect(heartButton).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked in selectable mode', () => {
    const onSelect = vi.fn();
    render(<ItemCard item={mockItem} onSelect={onSelect} selectable />);

    const card = screen.getByTestId('item-card');
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledWith(mockItem);
  });

  it('shows selection checkbox in selectable mode', () => {
    render(<ItemCard item={mockItem} selectable selected={false} />);

    const card = screen.getByTestId('item-card');
    // 체크박스 스타일의 원형 요소 확인
    expect(card.querySelector('.rounded-full.border-2')).toBeInTheDocument();
  });

  it('applies selected styles when selected', () => {
    render(<ItemCard item={mockItem} selectable selected />);

    const card = screen.getByTestId('item-card');
    expect(card).toHaveClass('ring-2');
  });
});
