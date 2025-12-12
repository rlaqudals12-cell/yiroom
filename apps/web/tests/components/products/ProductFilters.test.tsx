import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ProductFilters, type ProductFilterState } from '@/components/products/ProductFilters';

// next/navigation 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('ProductFilters', () => {
  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('필터 버튼 표시', () => {
      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByRole('button', { name: /필터/i })).toBeInTheDocument();
    });

    it('활성화된 필터가 없으면 배지 미표시', () => {
      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // 필터 버튼에 배지 숫자가 없어야 함 (아이콘 텍스트 제외)
      const button = screen.getByRole('button', { name: /필터/i });
      expect(button.textContent).toContain('필터');
      expect(button.textContent).not.toMatch(/\d/); // 숫자 배지 없음
    });

    it('활성화된 필터 수 배지 표시', () => {
      const filters: ProductFilterState = {
        priceRange: ['budget', 'mid'],
        skinTypes: ['dry'],
      };

      render(
        <ProductFilters
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // 3개의 필터가 활성화됨 (budget, mid, dry)
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('활성 필터 배지', () => {
    it('가격대 필터 배지 표시', () => {
      const filters: ProductFilterState = {
        priceRange: ['budget'],
      };

      render(
        <ProductFilters
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('~2만원')).toBeInTheDocument();
    });

    it('피부 타입 필터 배지 표시', () => {
      const filters: ProductFilterState = {
        skinTypes: ['dry'],
      };

      render(
        <ProductFilters
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('건성')).toBeInTheDocument();
    });

    it('피부 고민 필터 배지 표시', () => {
      const filters: ProductFilterState = {
        skinConcerns: ['hydration'],
      };

      render(
        <ProductFilters
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('수분')).toBeInTheDocument();
    });

    it('퍼스널 컬러 필터 배지 표시', () => {
      const filters: ProductFilterState = {
        personalColorSeasons: ['Summer'],
      };

      render(
        <ProductFilters
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect(screen.getByText('여름 쿨톤')).toBeInTheDocument();
    });
  });

  describe('필터 배지 제거', () => {
    it('배지 X 버튼 클릭 시 해당 필터 제거', () => {
      const filters: ProductFilterState = {
        priceRange: ['budget', 'mid'],
      };

      render(
        <ProductFilters
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // ~2만원 배지를 찾고 그 안의 버튼 클릭 (Badge 컴포넌트가 직접 텍스트를 포함)
      const budgetBadge = screen.getByText('~2만원');
      // Badge 컴포넌트 내의 버튼 찾기
      const removeButton = budgetBadge.querySelector('button');

      expect(removeButton).toBeTruthy();
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      // budget이 제거된 필터로 콜백 호출됨
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        priceRange: ['mid'],
      });
    });

    it('마지막 필터 제거 시 해당 키 삭제', () => {
      const filters: ProductFilterState = {
        skinTypes: ['dry'],
      };

      render(
        <ProductFilters
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // 건성 배지를 찾고 그 안의 버튼 클릭
      const dryBadge = screen.getByText('건성');
      const removeButton = dryBadge.querySelector('button');

      expect(removeButton).toBeTruthy();
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      // skinTypes가 undefined가 됨
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        skinTypes: undefined,
      });
    });
  });

  describe('Sheet 열기/닫기', () => {
    it('필터 버튼 클릭 시 Sheet 열림', async () => {
      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const filterButton = screen.getByRole('button', { name: /필터/i });
      fireEvent.click(filterButton);

      // Sheet 내용이 표시됨
      expect(await screen.findByText('가격대')).toBeInTheDocument();
      expect(screen.getByText('피부 타입')).toBeInTheDocument();
      expect(screen.getByText('피부 고민')).toBeInTheDocument();
      expect(screen.getByText('퍼스널 컬러')).toBeInTheDocument();
    });
  });

  describe('userAnalysis 적용', () => {
    it('userAnalysis가 있으면 "내 분석 결과 적용" 버튼 표시', async () => {
      const userAnalysis = {
        skinType: 'dry' as const,
        skinConcerns: ['hydration' as const],
        personalColorSeason: 'Summer' as const,
      };

      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
          userAnalysis={userAnalysis}
        />
      );

      // Sheet 열기
      const filterButton = screen.getByRole('button', { name: /필터/i });
      fireEvent.click(filterButton);

      expect(await screen.findByText('내 분석 결과 적용')).toBeInTheDocument();
    });

    it('userAnalysis가 없으면 버튼 미표시', async () => {
      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Sheet 열기
      const filterButton = screen.getByRole('button', { name: /필터/i });
      fireEvent.click(filterButton);

      // Sheet이 열릴 때까지 대기
      await screen.findByText('가격대');

      expect(screen.queryByText('내 분석 결과 적용')).not.toBeInTheDocument();
    });
  });

  describe('필터 옵션', () => {
    it('가격대 옵션 표시', async () => {
      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Sheet 열기
      const filterButton = screen.getByRole('button', { name: /필터/i });
      fireEvent.click(filterButton);

      // 가격대 옵션 확인
      expect(await screen.findByText('~2만원')).toBeInTheDocument();
      expect(screen.getByText('2~5만원')).toBeInTheDocument();
      expect(screen.getByText('5만원~')).toBeInTheDocument();
    });

    it('피부 타입 옵션 표시', async () => {
      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Sheet 열기
      const filterButton = screen.getByRole('button', { name: /필터/i });
      fireEvent.click(filterButton);

      // 피부 타입 옵션 확인
      expect(await screen.findByText('건성')).toBeInTheDocument();
      expect(screen.getByText('지성')).toBeInTheDocument();
      expect(screen.getByText('복합성')).toBeInTheDocument();
      expect(screen.getByText('민감성')).toBeInTheDocument();
      expect(screen.getByText('중성')).toBeInTheDocument();
    });

    it('피부 고민 옵션 표시', async () => {
      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Sheet 열기
      const filterButton = screen.getByRole('button', { name: /필터/i });
      fireEvent.click(filterButton);

      // 피부 고민 옵션 확인
      expect(await screen.findByText('여드름')).toBeInTheDocument();
      expect(screen.getByText('노화')).toBeInTheDocument();
      expect(screen.getByText('미백')).toBeInTheDocument();
      expect(screen.getByText('수분')).toBeInTheDocument();
      expect(screen.getByText('모공')).toBeInTheDocument();
      expect(screen.getByText('홍조')).toBeInTheDocument();
    });

    it('퍼스널 컬러 옵션 표시', async () => {
      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Sheet 열기
      const filterButton = screen.getByRole('button', { name: /필터/i });
      fireEvent.click(filterButton);

      // 퍼스널 컬러 옵션 확인
      expect(await screen.findByText('봄 웜톤')).toBeInTheDocument();
      expect(screen.getByText('여름 쿨톤')).toBeInTheDocument();
      expect(screen.getByText('가을 웜톤')).toBeInTheDocument();
      expect(screen.getByText('겨울 쿨톤')).toBeInTheDocument();
    });
  });

  describe('초기화 버튼', () => {
    it('초기화 버튼 표시', async () => {
      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Sheet 열기
      const filterButton = screen.getByRole('button', { name: /필터/i });
      fireEvent.click(filterButton);

      expect(await screen.findByText('초기화')).toBeInTheDocument();
    });
  });

  describe('적용하기 버튼', () => {
    it('적용하기 버튼 표시', async () => {
      render(
        <ProductFilters
          filters={{}}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Sheet 열기
      const filterButton = screen.getByRole('button', { name: /필터/i });
      fireEvent.click(filterButton);

      expect(await screen.findByText('적용하기')).toBeInTheDocument();
    });
  });
});
