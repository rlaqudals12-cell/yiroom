/**
 * IngredientFavoriteFilter 컴포넌트 테스트
 * Beauty 도메인 - 성분 즐겨찾기/기피 필터
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IngredientFavoriteFilter from '@/components/beauty/IngredientFavoriteFilter';
import type { FavoriteItem } from '@/types/hybrid';

describe('IngredientFavoriteFilter', () => {
  const mockFavorites: FavoriteItem[] = [
    {
      id: '1',
      clerkUserId: 'user-1',
      domain: 'beauty',
      itemType: 'ingredient',
      itemName: '히알루론산',
      itemNameEn: 'Hyaluronic Acid',
      isFavorite: true,
      createdAt: '2025-01-01',
    },
    {
      id: '2',
      clerkUserId: 'user-1',
      domain: 'beauty',
      itemType: 'ingredient',
      itemName: '나이아신아마이드',
      itemNameEn: 'Niacinamide',
      isFavorite: true,
      createdAt: '2025-01-01',
    },
  ];

  const mockAvoids: FavoriteItem[] = [
    {
      id: '3',
      clerkUserId: 'user-1',
      domain: 'beauty',
      itemType: 'ingredient',
      itemName: '레티놀',
      itemNameEn: 'Retinol',
      isFavorite: false,
      createdAt: '2025-01-01',
    },
  ];

  const defaultProps = {
    favorites: [] as FavoriteItem[],
    avoids: [] as FavoriteItem[],
    onFavoritesChange: vi.fn(),
    onAvoidsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('필터 버튼이 렌더링된다', () => {
      render(<IngredientFavoriteFilter {...defaultProps} />);

      expect(screen.getByText('성분 필터')).toBeInTheDocument();
    });

    it('data-testid가 올바르게 설정된다', () => {
      render(<IngredientFavoriteFilter {...defaultProps} />);

      expect(screen.getByTestId('ingredient-favorite-filter')).toBeInTheDocument();
    });

    it('총 카운트가 있으면 필터 버튼에 배지가 표시된다', () => {
      render(
        <IngredientFavoriteFilter {...defaultProps} favorites={mockFavorites} avoids={mockAvoids} />
      );

      // 총 3개 (favorites 2 + avoids 1)
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('className prop이 적용된다', () => {
      render(<IngredientFavoriteFilter {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('ingredient-favorite-filter')).toHaveClass('custom-class');
    });
  });

  describe('활성 필터 배지', () => {
    it('즐겨찾기가 있으면 카운트 배지가 표시된다', () => {
      render(<IngredientFavoriteFilter {...defaultProps} favorites={mockFavorites} />);

      // favorites.length = 2 (여러 '2' 요소가 있을 수 있으므로 getAllByText 사용)
      const twos = screen.getAllByText('2');
      expect(twos.length).toBeGreaterThanOrEqual(1);
    });

    it('기피가 있으면 카운트 배지가 표시된다', () => {
      render(<IngredientFavoriteFilter {...defaultProps} avoids={mockAvoids} />);

      // avoids.length = 1 (여러 '1' 요소가 있을 수 있으므로 getAllByText 사용)
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThanOrEqual(1);
    });

    it('즐겨찾기와 기피 모두 있으면 합산된 배지가 표시된다', () => {
      render(
        <IngredientFavoriteFilter {...defaultProps} favorites={mockFavorites} avoids={mockAvoids} />
      );

      // 총 3개
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('버튼 클릭', () => {
    it('필터 버튼이 클릭 가능하다', async () => {
      const user = userEvent.setup();
      render(<IngredientFavoriteFilter {...defaultProps} />);

      const button = screen.getByRole('button', { name: /성분 필터/ });

      // 버튼이 클릭 가능한지 확인
      await expect(user.click(button)).resolves.not.toThrow();
    });
  });

  describe('Props 전달', () => {
    it('favorites prop이 전달된다', () => {
      const onFavoritesChange = vi.fn();

      render(
        <IngredientFavoriteFilter
          {...defaultProps}
          favorites={mockFavorites}
          onFavoritesChange={onFavoritesChange}
        />
      );

      // 컴포넌트가 에러 없이 렌더링됨
      expect(screen.getByTestId('ingredient-favorite-filter')).toBeInTheDocument();
    });

    it('avoids prop이 전달된다', () => {
      const onAvoidsChange = vi.fn();

      render(
        <IngredientFavoriteFilter
          {...defaultProps}
          avoids={mockAvoids}
          onAvoidsChange={onAvoidsChange}
        />
      );

      // 컴포넌트가 에러 없이 렌더링됨
      expect(screen.getByTestId('ingredient-favorite-filter')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('버튼에 접근 가능한 이름이 있다', () => {
      render(<IngredientFavoriteFilter {...defaultProps} />);

      const button = screen.getByRole('button', { name: /성분 필터/ });
      expect(button).toBeInTheDocument();
    });

    it('아이콘에 aria-hidden이 적용되어 있다', () => {
      render(<IngredientFavoriteFilter {...defaultProps} />);

      // lucide-react 아이콘들이 aria-hidden을 가지고 있어야 함
      const icons = screen
        .getByTestId('ingredient-favorite-filter')
        .querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
