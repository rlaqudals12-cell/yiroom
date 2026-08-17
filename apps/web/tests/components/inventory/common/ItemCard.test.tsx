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

  // 재발 방지: 클릭 발화 조건이 selectable까지 요구해, 선택 모드가 아닌 옷장 목록에서는
  // 카드를 눌러도 아무 일이 없었다(상세 시트=수정·삭제 경로가 영구 미개봉).
  describe('카드 탭 (상세 열기)', () => {
    it('selectable이 아니어도 onSelect가 있으면 클릭이 발화한다', () => {
      const onSelect = vi.fn();
      render(<ItemCard item={mockItem} onSelect={onSelect} />);

      fireEvent.click(screen.getByTestId('item-card'));

      expect(onSelect).toHaveBeenCalledWith(mockItem);
    });

    it('onSelect가 없으면 클릭 가능한 것처럼 보이지 않는다', () => {
      render(<ItemCard item={mockItem} />);

      expect(screen.getByTestId('item-card')).not.toHaveClass('cursor-pointer');
    });

    it('onSelect가 있으면 포인터 커서로 누를 수 있음을 알린다', () => {
      render(<ItemCard item={mockItem} onSelect={vi.fn()} />);

      expect(screen.getByTestId('item-card')).toHaveClass('cursor-pointer');
    });
  });

  // 재발 방지(2026-08 외부 리뷰): 카드가 onClick만 달린 div라 키보드로는 상세를 열 수 없었다.
  // 마우스 없이 옷장을 쓰는 사용자에게 수정·삭제 경로가 통째로 닫혀 있던 셈.
  describe('키보드 접근', () => {
    it('누를 수 있는 카드는 버튼 시맨틱과 탭 포커스를 갖는다', () => {
      render(<ItemCard item={mockItem} onSelect={vi.fn()} />);

      const card = screen.getByTestId('item-card');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabindex', '0');
      expect(card).toHaveAccessibleName('테스트 티셔츠 상세 보기');
    });

    it('Enter와 Space가 클릭과 같은 결과를 낸다', () => {
      const onSelect = vi.fn();
      render(<ItemCard item={mockItem} onSelect={onSelect} />);

      const card = screen.getByTestId('item-card');
      fireEvent.keyDown(card, { key: 'Enter' });
      fireEvent.keyDown(card, { key: ' ' });

      expect(onSelect).toHaveBeenCalledTimes(2);
      expect(onSelect).toHaveBeenCalledWith(mockItem);
    });

    it('다른 키에는 반응하지 않는다', () => {
      const onSelect = vi.fn();
      render(<ItemCard item={mockItem} onSelect={onSelect} />);

      fireEvent.keyDown(screen.getByTestId('item-card'), { key: 'a' });

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('선택 모드에서는 선택 상태를 aria-pressed로 알린다', () => {
      render(<ItemCard item={mockItem} onSelect={vi.fn()} selectable selected />);

      expect(screen.getByTestId('item-card')).toHaveAttribute('aria-pressed', 'true');
    });

    it('누를 수 없는 카드에는 버튼 시맨틱을 달지 않는다 (거짓 안내 방지)', () => {
      render(<ItemCard item={mockItem} />);

      const card = screen.getByTestId('item-card');
      expect(card).not.toHaveAttribute('role');
      expect(card).not.toHaveAttribute('tabindex');
    });

    it('즐겨찾기 키 입력이 카드 선택까지 번지지 않는다', () => {
      const onSelect = vi.fn();
      const onFavoriteToggle = vi.fn();
      render(<ItemCard item={mockItem} onSelect={onSelect} onFavoriteToggle={onFavoriteToggle} />);

      // 실제 브라우저는 버튼에서 Enter를 클릭으로 바꾸고, 그 키 이벤트는 카드로 버블링된다
      fireEvent.keyDown(screen.getByLabelText('즐겨찾기 추가'), {
        key: 'Enter',
        bubbles: true,
      });

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  // 재발 방지: 저장값은 대개 한글 색상명인데 '#' 시작만 칠해서 색 표시가 항상 빈 원이었다.
  describe('색상 스와치', () => {
    it('한글 색상명을 대표 hex로 칠한다', () => {
      const item = {
        ...mockItem,
        metadata: { ...mockItem.metadata, color: ['네이비'] },
      };
      render(<ItemCard item={item} />);

      const swatch = screen.getByTestId('item-color-swatch');
      expect(swatch).toHaveStyle({ backgroundColor: '#1F3A5F' });
      expect(swatch).toHaveAttribute('title', '네이비');
    });

    it('hex 값은 그대로 칠한다', () => {
      const item = {
        ...mockItem,
        metadata: { ...mockItem.metadata, color: ['#123456'] },
      };
      render(<ItemCard item={item} />);

      expect(screen.getByTestId('item-color-swatch')).toHaveStyle({
        backgroundColor: '#123456',
      });
    });

    it('풀 수 없는 색상명은 빈 원 대신 이름 칩으로 보여준다', () => {
      const item = {
        ...mockItem,
        metadata: { ...mockItem.metadata, color: ['연청'] },
      };
      render(<ItemCard item={item} />);

      expect(screen.queryByTestId('item-color-swatch')).not.toBeInTheDocument();
      expect(screen.getByTestId('item-color-chip')).toHaveTextContent('연청');
    });
  });
});
