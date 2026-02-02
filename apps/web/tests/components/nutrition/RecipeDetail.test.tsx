/**
 * RecipeDetail 컴포넌트 테스트
 * @description K-4 레시피 상세 UI 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecipeDetail from '@/components/nutrition/RecipeDetail';
import { SAMPLE_RECIPES, type Recipe } from '@/lib/nutrition/recipe-matcher';

describe('RecipeDetail', () => {
  const mockRecipe: Recipe = SAMPLE_RECIPES[0]; // 닭가슴살 샐러드
  const mockPantryItems = ['닭가슴살', '양상추', '방울토마토', '올리브오일'];

  it('컴포넌트가 렌더링되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);
    expect(screen.getByTestId('recipe-detail')).toBeInTheDocument();
  });

  it('레시피 기본 정보가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);

    expect(screen.getByText(mockRecipe.name)).toBeInTheDocument();
    expect(screen.getByText(mockRecipe.description)).toBeInTheDocument();
  });

  it('레시피 메타 정보 카드가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);
    expect(screen.getByTestId('recipe-info-card')).toBeInTheDocument();
  });

  it('조리 시간이 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);
    expect(screen.getByText(`${mockRecipe.cookTime}분`)).toBeInTheDocument();
    expect(screen.getByText('조리 시간')).toBeInTheDocument();
  });

  it('칼로리가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);
    // 칼로리가 여러 곳에 표시될 수 있으므로 getAllBy 사용
    const calorieElements = screen.getAllByText(`${mockRecipe.nutritionInfo.calories}`);
    expect(calorieElements.length).toBeGreaterThan(0);
  });

  it('난이도가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);
    expect(screen.getByText('쉬움')).toBeInTheDocument(); // easy = 쉬움
  });

  it('영양 정보 카드가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);
    expect(screen.getByTestId('nutrition-info-card')).toBeInTheDocument();
    expect(screen.getByText('영양 정보')).toBeInTheDocument();
  });

  it('단백질, 탄수화물, 지방 정보가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);

    expect(screen.getByText(`${mockRecipe.nutritionInfo.protein}g`)).toBeInTheDocument();
    expect(screen.getByText(`${mockRecipe.nutritionInfo.carbs}g`)).toBeInTheDocument();
    expect(screen.getByText(`${mockRecipe.nutritionInfo.fat}g`)).toBeInTheDocument();
  });

  it('재료 목록 카드가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);
    expect(screen.getByTestId('ingredients-card')).toBeInTheDocument();
    expect(screen.getByText('재료')).toBeInTheDocument();
  });

  it('재료 목록이 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);

    mockRecipe.ingredients.forEach((ingredient) => {
      // 재료 이름이 여러 곳에 표시될 수 있으므로 getAllBy 사용
      const elements = screen.getAllByText(new RegExp(ingredient.name));
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('보유 재료가 있으면 보유율이 표시되어야 함', () => {
    render(
      <RecipeDetail
        recipe={mockRecipe}
        pantryItems={mockPantryItems}
      />
    );

    expect(screen.getByText(/% 보유/)).toBeInTheDocument();
  });

  it('조리 방법 카드가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);
    expect(screen.getByTestId('cooking-steps-card')).toBeInTheDocument();
    expect(screen.getByText('조리 방법')).toBeInTheDocument();
  });

  it('조리 단계가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);

    mockRecipe.steps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it('조리 단계를 클릭하면 완료 상태가 토글되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);

    // 첫 번째 단계 클릭
    const firstStep = screen.getByText(mockRecipe.steps[0]);
    fireEvent.click(firstStep);

    // 체크박스가 체크되어야 함
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();

    // 다시 클릭하면 체크 해제
    fireEvent.click(firstStep);
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('모든 단계를 완료하면 완성 메시지가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);

    // 모든 단계 클릭
    mockRecipe.steps.forEach((step) => {
      const stepElement = screen.getByText(step);
      fireEvent.click(stepElement);
    });

    expect(screen.getByText(/요리가 완성되었어요!/)).toBeInTheDocument();
  });

  it('뒤로가기 버튼이 표시되고 클릭하면 onBack이 호출되어야 함', () => {
    const onBack = vi.fn();
    render(
      <RecipeDetail
        recipe={mockRecipe}
        onBack={onBack}
      />
    );

    const backButton = screen.getByText('뒤로');
    fireEvent.click(backButton);

    expect(onBack).toHaveBeenCalled();
  });

  it('공유 버튼이 표시되고 클릭하면 onShare가 호출되어야 함', () => {
    const onShare = vi.fn();
    render(
      <RecipeDetail
        recipe={mockRecipe}
        onShare={onShare}
      />
    );

    const shareButton = screen.getByLabelText('공유하기');
    fireEvent.click(shareButton);

    expect(onShare).toHaveBeenCalledWith(mockRecipe);
  });

  it('즐겨찾기 버튼이 표시되고 클릭하면 onBookmark가 호출되어야 함', () => {
    const onBookmark = vi.fn();
    render(
      <RecipeDetail
        recipe={mockRecipe}
        onBookmark={onBookmark}
      />
    );

    // aria-label로 버튼 찾기
    const bookmarkButton = screen.getByRole('button', { name: '즐겨찾기' });
    fireEvent.click(bookmarkButton);

    expect(onBookmark).toHaveBeenCalledWith(mockRecipe);
  });

  it('누락 재료가 있으면 장보기 목록 추가 버튼이 표시되어야 함', () => {
    const onAddToShoppingList = vi.fn();
    // 일부 재료만 보유
    const partialPantryItems = ['닭가슴살'];

    render(
      <RecipeDetail
        recipe={mockRecipe}
        pantryItems={partialPantryItems}
        onAddToShoppingList={onAddToShoppingList}
      />
    );

    const addButton = screen.getByText(/장보기 목록에 추가/);
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(onAddToShoppingList).toHaveBeenCalled();
  });

  it('영양 목표 태그가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);

    // mockRecipe의 nutritionGoals에 따라 표시
    mockRecipe.nutritionGoals.forEach((goal) => {
      // 다이어트, 린매스 등의 한국어 레이블
      const goalLabels: Record<string, string> = {
        diet: '다이어트',
        bulk: '벌크업',
        lean: '린매스',
        maintenance: '유지',
      };
      expect(screen.getByText(goalLabels[goal])).toBeInTheDocument();
    });
  });

  it('태그가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);

    mockRecipe.tags.forEach((tag) => {
      expect(screen.getByText(`#${tag}`)).toBeInTheDocument();
    });
  });

  it('선택 재료는 "(선택)" 표시와 함께 렌더링되어야 함', () => {
    // 선택 재료가 있는 레시피 선택 (recipe-1에는 레몬즙이 optional)
    render(<RecipeDetail recipe={mockRecipe} />);

    expect(screen.getByText('(선택)')).toBeInTheDocument();
  });

  it('재료 카테고리 배지가 표시되어야 함', () => {
    render(<RecipeDetail recipe={mockRecipe} />);

    // 재료 카테고리가 여러 곳에 표시될 수 있으므로 getAllBy 사용
    const meatLabels = screen.getAllByText('육류');
    const vegetableLabels = screen.getAllByText('채소');

    expect(meatLabels.length).toBeGreaterThan(0);
    expect(vegetableLabels.length).toBeGreaterThan(0);
  });
});
