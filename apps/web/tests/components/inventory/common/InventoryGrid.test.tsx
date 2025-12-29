/**
 * InventoryGrid 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryGrid } from '@/components/inventory/common/InventoryGrid';
import type { InventoryItem } from '@/types/inventory';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

const mockItems: InventoryItem[] = [
  {
    id: 'item-1',
    clerkUserId: 'user-123',
    category: 'closet',
    subCategory: 'top',
    name: '아이템 1',
    imageUrl: '/item1.png',
    originalImageUrl: null,
    brand: 'Brand1',
    tags: ['캐주얼'],
    isFavorite: false,
    useCount: 5,
    lastUsedAt: null,
    expiryDate: null,
    metadata: {},
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-01T10:00:00Z',
  },
  {
    id: 'item-2',
    clerkUserId: 'user-123',
    category: 'closet',
    subCategory: 'bottom',
    name: '아이템 2',
    imageUrl: '/item2.png',
    originalImageUrl: null,
    brand: 'Brand2',
    tags: ['포멀'],
    isFavorite: true,
    useCount: 10,
    lastUsedAt: null,
    expiryDate: null,
    metadata: {},
    createdAt: '2025-12-01T10:00:00Z',
    updatedAt: '2025-12-01T10:00:00Z',
  },
];

describe('InventoryGrid', () => {
  it('renders all items', () => {
    render(<InventoryGrid items={mockItems} />);

    expect(screen.getByText('아이템 1')).toBeInTheDocument();
    expect(screen.getByText('아이템 2')).toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    render(<InventoryGrid items={[]} emptyMessage="옷장이 비어있습니다" />);

    expect(screen.getByTestId('inventory-grid-empty')).toBeInTheDocument();
    expect(screen.getByText('옷장이 비어있습니다')).toBeInTheDocument();
  });

  it('shows add button in empty state', () => {
    const onAddNew = vi.fn();
    render(<InventoryGrid items={[]} onAddNew={onAddNew} />);

    const addButton = screen.getByText('아이템 추가하기');
    fireEvent.click(addButton);

    expect(onAddNew).toHaveBeenCalled();
  });

  it('shows custom empty action button', () => {
    const onClick = vi.fn();
    render(
      <InventoryGrid
        items={[]}
        emptyAction={{ label: '사진 찍기', onClick }}
      />
    );

    const button = screen.getByText('사진 찍기');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it('renders add button when onAddNew is provided', () => {
    const onAddNew = vi.fn();
    render(<InventoryGrid items={mockItems} onAddNew={onAddNew} />);

    const addButton = screen.getByText('추가');
    fireEvent.click(addButton);

    expect(onAddNew).toHaveBeenCalled();
  });

  it('shows loading skeletons', () => {
    render(<InventoryGrid items={[]} loading />);

    const grid = screen.getByTestId('inventory-grid');
    // 4개의 스켈레톤이 렌더링되어야 함
    const skeletons = grid.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('handles item selection in selectable mode', () => {
    const onItemSelect = vi.fn();
    render(
      <InventoryGrid
        items={mockItems}
        onItemSelect={onItemSelect}
        selectable
      />
    );

    const firstCard = screen.getByText('아이템 1').closest('[data-testid="item-card"]');
    fireEvent.click(firstCard!);

    expect(onItemSelect).toHaveBeenCalledWith(mockItems[0]);
  });

  it('shows selected state for selected items', () => {
    render(
      <InventoryGrid
        items={mockItems}
        selectedIds={['item-1']}
        selectable
      />
    );

    const cards = screen.getAllByTestId('item-card');
    expect(cards[0]).toHaveClass('ring-2');
    expect(cards[1]).not.toHaveClass('ring-2');
  });
});
