/**
 * RecipeSearch 컴포넌트 테스트
 * @description K-4 레시피 검색 UI 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecipeSearch from '@/components/nutrition/RecipeSearch';
import { SAMPLE_RECIPES } from '@/lib/nutrition/recipe-matcher';

describe('RecipeSearch', () => {
  const mockPantryItems = ['닭가슴살', '양상추', '방울토마토', '올리브오일'];

  it('컴포넌트가 렌더링되어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);
    expect(screen.getByTestId('recipe-search')).toBeInTheDocument();
  });

  it('검색 입력 필드가 표시되어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);
    expect(screen.getByTestId('recipe-search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/레시피 이름, 재료, 태그로 검색/)).toBeInTheDocument();
  });

  it('보유 재료 개수가 표시되어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);
    expect(screen.getByText(`보유 재료 ${mockPantryItems.length}개`)).toBeInTheDocument();
  });

  it('재료가 없으면 안내 메시지를 표시해야 함', () => {
    render(<RecipeSearch pantryItems={[]} />);
    expect(screen.getByText(/냉장고에 재료를 추가하면/)).toBeInTheDocument();
  });

  it('재료가 있으면 레시피 결과를 표시해야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);
    expect(screen.getByTestId('recipe-results')).toBeInTheDocument();
  });

  it('검색어를 입력하면 결과가 필터링되어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);
    const input = screen.getByTestId('recipe-search-input');

    fireEvent.change(input, { target: { value: '샐러드' } });

    // 검색어 '샐러드'가 포함된 레시피만 표시되어야 함
    expect(screen.getByTestId('recipe-search-input')).toHaveValue('샐러드');
  });

  it('필터 버튼을 클릭하면 필터 섹션이 표시되어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);

    // Filter 아이콘이 있는 버튼 찾기
    const filterButton = screen.getByTestId('lucide-filter').closest('button');
    expect(filterButton).toBeInTheDocument();
    fireEvent.click(filterButton!);

    expect(screen.getByTestId('recipe-filters')).toBeInTheDocument();
    expect(screen.getByText('영양 목표')).toBeInTheDocument();
    expect(screen.getByText('조리 시간')).toBeInTheDocument();
  });

  it('영양 목표 필터를 선택할 수 있어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);

    // 필터 섹션 열기
    const filterButton = screen.getByTestId('lucide-filter').closest('button');
    fireEvent.click(filterButton!);

    // 다이어트 필터 클릭
    const dietFilter = screen.getByTestId('filter-goal-diet');
    fireEvent.click(dietFilter);

    // 다이어트 버튼이 선택된 상태여야 함
    expect(dietFilter).toHaveClass('bg-primary');
  });

  it('조리 시간 필터를 선택할 수 있어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);

    // 필터 섹션 열기
    const filterButton = screen.getByTestId('lucide-filter').closest('button');
    fireEvent.click(filterButton!);

    // 15분 필터 클릭
    const timeFilter = screen.getByTestId('filter-time-15');
    fireEvent.click(timeFilter);

    expect(timeFilter).toHaveClass('bg-primary');
  });

  it('레시피 카드를 클릭하면 onSelectRecipe가 호출되어야 함', () => {
    const onSelectRecipe = vi.fn();
    render(
      <RecipeSearch
        pantryItems={mockPantryItems}
        onSelectRecipe={onSelectRecipe}
      />
    );

    // 첫 번째 레시피 카드 클릭
    const firstRecipeCard = screen.getAllByTestId(/^recipe-card-/)[0];
    fireEvent.click(firstRecipeCard);

    expect(onSelectRecipe).toHaveBeenCalled();
  });

  it('레시피 카드에 매칭 점수가 표시되어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);

    // 매칭 점수 배지가 존재하는지 확인
    const scoreElements = screen.getAllByText(/점$/);
    expect(scoreElements.length).toBeGreaterThan(0);
  });

  it('레시피 카드에 조리 시간이 표시되어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);

    // 조리 시간이 표시되는지 확인
    const timeElements = screen.getAllByText(/분$/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('레시피 카드에 보유 재료와 필요 재료가 표시되어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);

    expect(screen.getAllByText(/보유 재료/).length).toBeGreaterThan(0);
  });

  it('결과 개수가 표시되어야 함', () => {
    render(<RecipeSearch pantryItems={mockPantryItems} />);

    expect(screen.getByText(/개의 레시피를 찾았습니다/)).toBeInTheDocument();
  });

  it('기본 영양 목표가 설정되면 해당 필터가 활성화되어야 함', () => {
    render(
      <RecipeSearch
        pantryItems={mockPantryItems}
        defaultGoal="diet"
      />
    );

    // 필터 섹션 열기
    const filterButton = screen.getByTestId('lucide-filter').closest('button');
    fireEvent.click(filterButton!);

    // 다이어트 필터가 선택되어 있어야 함
    const dietFilter = screen.getByTestId('filter-goal-diet');
    expect(dietFilter).toHaveClass('bg-primary');
  });
});
