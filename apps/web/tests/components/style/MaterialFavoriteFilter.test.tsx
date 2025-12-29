/**
 * MaterialFavoriteFilter 컴포넌트 테스트
 * Style 도메인 - 소재 즐겨찾기/기피 필터
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaterialFavoriteFilter from '@/components/style/MaterialFavoriteFilter';
import type { FavoriteItem } from '@/types/hybrid';

describe('MaterialFavoriteFilter', () => {
  const mockFavorites: FavoriteItem[] = [
    { id: '1', clerkUserId: 'user-1', domain: 'style', itemType: 'material', itemName: '실크', itemNameEn: 'Silk', isFavorite: true, createdAt: '2025-01-01' },
    { id: '2', clerkUserId: 'user-1', domain: 'style', itemType: 'material', itemName: '캐시미어', itemNameEn: 'Cashmere', isFavorite: true, createdAt: '2025-01-01' },
  ];

  const mockAvoids: FavoriteItem[] = [
    { id: '3', clerkUserId: 'user-1', domain: 'style', itemType: 'material', itemName: '폴리에스터', itemNameEn: 'Polyester', isFavorite: false, createdAt: '2025-01-01' },
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
      render(<MaterialFavoriteFilter {...defaultProps} />);

      expect(screen.getByText('소재 필터')).toBeInTheDocument();
    });

    it('data-testid가 올바르게 설정된다', () => {
      render(<MaterialFavoriteFilter {...defaultProps} />);

      expect(screen.getByTestId('material-favorite-filter')).toBeInTheDocument();
    });

    it('총 카운트가 있으면 필터 버튼에 배지가 표시된다', () => {
      render(
        <MaterialFavoriteFilter
          {...defaultProps}
          favorites={mockFavorites}
          avoids={mockAvoids}
        />
      );

      // 총 3개 (favorites 2 + avoids 1)
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('className prop이 적용된다', () => {
      render(
        <MaterialFavoriteFilter {...defaultProps} className="custom-class" />
      );

      expect(screen.getByTestId('material-favorite-filter')).toHaveClass('custom-class');
    });
  });

  describe('활성 필터 배지', () => {
    it('즐겨찾기가 있으면 카운트 배지가 표시된다', () => {
      render(
        <MaterialFavoriteFilter
          {...defaultProps}
          favorites={mockFavorites}
        />
      );

      // favorites.length = 2 (버튼 내부와 외부 배지 모두 표시)
      const badges = screen.getAllByText('2');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('기피가 있으면 카운트 배지가 표시된다', () => {
      render(
        <MaterialFavoriteFilter
          {...defaultProps}
          avoids={mockAvoids}
        />
      );

      // avoids.length = 1 (버튼 내부에만 표시)
      const badges = screen.getAllByText('1');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('즐겨찾기와 기피 모두 있으면 합산된 배지가 표시된다', () => {
      render(
        <MaterialFavoriteFilter
          {...defaultProps}
          favorites={mockFavorites}
          avoids={mockAvoids}
        />
      );

      // 버튼에 totalCount(3) 표시, 외부에 favorites(2) 표시
      expect(screen.getByText('3')).toBeInTheDocument(); // totalCount
      expect(screen.getByText('2')).toBeInTheDocument(); // favorites only
    });
  });

  describe('버튼 클릭', () => {
    it('필터 버튼이 클릭 가능하다', async () => {
      const user = userEvent.setup();
      render(<MaterialFavoriteFilter {...defaultProps} />);

      const button = screen.getByRole('button', { name: /소재 필터/ });

      // 버튼이 클릭 가능한지 확인
      await expect(user.click(button)).resolves.not.toThrow();
    });
  });

  describe('Props 전달', () => {
    it('favorites prop이 전달된다', () => {
      const onFavoritesChange = vi.fn();

      render(
        <MaterialFavoriteFilter
          {...defaultProps}
          favorites={mockFavorites}
          onFavoritesChange={onFavoritesChange}
        />
      );

      // 컴포넌트가 에러 없이 렌더링됨
      expect(screen.getByTestId('material-favorite-filter')).toBeInTheDocument();
    });

    it('avoids prop이 전달된다', () => {
      const onAvoidsChange = vi.fn();

      render(
        <MaterialFavoriteFilter
          {...defaultProps}
          avoids={mockAvoids}
          onAvoidsChange={onAvoidsChange}
        />
      );

      // 컴포넌트가 에러 없이 렌더링됨
      expect(screen.getByTestId('material-favorite-filter')).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('버튼에 접근 가능한 이름이 있다', () => {
      render(<MaterialFavoriteFilter {...defaultProps} />);

      const button = screen.getByRole('button', { name: /소재 필터/ });
      expect(button).toBeInTheDocument();
    });

    it('아이콘에 aria-hidden이 적용되어 있다', () => {
      render(<MaterialFavoriteFilter {...defaultProps} />);

      // lucide-react 아이콘들이 aria-hidden을 가지고 있어야 함
      const icons = screen.getByTestId('material-favorite-filter').querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Style vs Beauty 차이', () => {
    it('Style 도메인은 "소재"라는 용어를 사용한다', () => {
      render(<MaterialFavoriteFilter {...defaultProps} />);

      expect(screen.getByText('소재 필터')).toBeInTheDocument();
    });

    it('인디고색 테마를 사용한다', () => {
      render(<MaterialFavoriteFilter {...defaultProps} />);

      // 버튼 내 Heart 아이콘이 인디고색 클래스를 가지고 있어야 함
      const container = screen.getByTestId('material-favorite-filter');
      const indigoElements = container.querySelectorAll('[class*="indigo"]');
      expect(indigoElements.length).toBeGreaterThan(0);
    });
  });
});
