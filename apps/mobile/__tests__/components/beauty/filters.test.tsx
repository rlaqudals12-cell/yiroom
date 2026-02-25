/**
 * 뷰티 필터 컴포넌트 테스트
 *
 * IngredientFilter, PriceRangeFilter, RatingFilter
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import {
  IngredientFilter,
  INGREDIENTS,
} from '../../../components/beauty/IngredientFilter';
import {
  PriceRangeFilter,
  PRICE_RANGE_MAP,
  PRICE_RANGES,
} from '../../../components/beauty/PriceRangeFilter';
import {
  RatingFilter,
  RATING_OPTIONS,
} from '../../../components/beauty/RatingFilter';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// IngredientFilter
// ---------------------------------------------------------------------------
describe('IngredientFilter', () => {
  it('제목 "성분"을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <IngredientFilter selected={[]} onSelectionChange={() => {}} />
    );
    expect(getByText('성분')).toBeTruthy();
  });

  it('8개 성분 칩을 모두 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <IngredientFilter selected={[]} onSelectionChange={() => {}} />
    );
    expect(getByText('나이아신아마이드')).toBeTruthy();
    expect(getByText('레티놀')).toBeTruthy();
    expect(getByText('비타민C')).toBeTruthy();
    expect(getByText('히알루론산')).toBeTruthy();
    expect(getByText('센텔라')).toBeTruthy();
    expect(getByText('세라마이드')).toBeTruthy();
    expect(getByText('AHA/BHA')).toBeTruthy();
    expect(getByText('달팽이뮤신')).toBeTruthy();
  });

  it('INGREDIENTS 배열이 8개 항목이어야 한다', () => {
    expect(INGREDIENTS).toHaveLength(8);
    const keys = INGREDIENTS.map((i) => i.key);
    expect(keys).toEqual([
      'niacinamide',
      'retinol',
      'vitaminC',
      'hyaluronicAcid',
      'centella',
      'ceramide',
      'aha_bha',
      'snailMucin',
    ]);
  });

  it('다중 선택 모드로 칩을 추가 선택할 수 있어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <IngredientFilter
        selected={['retinol']}
        onSelectionChange={onSelectionChange}
      />
    );
    fireEvent.press(getByText('센텔라'));
    expect(onSelectionChange).toHaveBeenCalledWith(['retinol', 'centella']);
  });

  it('다중 선택 모드로 선택된 칩을 해제할 수 있어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <IngredientFilter
        selected={['retinol', 'centella']}
        onSelectionChange={onSelectionChange}
      />
    );
    fireEvent.press(getByText('레티놀'));
    expect(onSelectionChange).toHaveBeenCalledWith(['centella']);
  });

  it('빈 선택에서 칩을 누르면 배열에 추가되어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <IngredientFilter
        selected={[]}
        onSelectionChange={onSelectionChange}
      />
    );
    fireEvent.press(getByText('비타민C'));
    expect(onSelectionChange).toHaveBeenCalledWith(['vitaminC']);
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <IngredientFilter
        selected={[]}
        onSelectionChange={() => {}}
        testID="ingredient-filter"
      />
    );
    expect(getByTestId('ingredient-filter')).toBeTruthy();
  });

  it('testID가 칩 그룹에 전파되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <IngredientFilter
        selected={[]}
        onSelectionChange={() => {}}
        testID="ingredient-filter"
      />
    );
    expect(getByTestId('ingredient-filter-chips-niacinamide')).toBeTruthy();
    expect(getByTestId('ingredient-filter-chips-retinol')).toBeTruthy();
  });

  it('accessibilityLabel "성분 필터"가 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <IngredientFilter selected={[]} onSelectionChange={() => {}} />
    );
    expect(getByLabelText('성분 필터')).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <IngredientFilter selected={[]} onSelectionChange={() => {}} />,
      true
    );
    expect(getByText('성분')).toBeTruthy();
    expect(getByText('나이아신아마이드')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PriceRangeFilter
// ---------------------------------------------------------------------------
describe('PriceRangeFilter', () => {
  it('제목 "가격대"를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <PriceRangeFilter selected="all" onSelectionChange={() => {}} />
    );
    expect(getByText('가격대')).toBeTruthy();
  });

  it('5개 가격대 칩을 모두 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <PriceRangeFilter selected="all" onSelectionChange={() => {}} />
    );
    expect(getByText('전체')).toBeTruthy();
    expect(getByText('~1만원')).toBeTruthy();
    expect(getByText('1~3만원')).toBeTruthy();
    expect(getByText('3~5만원')).toBeTruthy();
    expect(getByText('5만원~')).toBeTruthy();
  });

  it('PRICE_RANGES 배열이 5개 항목이어야 한다', () => {
    expect(PRICE_RANGES).toHaveLength(5);
    const keys = PRICE_RANGES.map((r) => r.key);
    expect(keys).toEqual(['all', 'budget', 'mid', 'premium', 'luxury']);
  });

  it('단일 선택 모드로 칩을 선택할 수 있어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <PriceRangeFilter
        selected="all"
        onSelectionChange={onSelectionChange}
      />
    );
    fireEvent.press(getByText('~1만원'));
    expect(onSelectionChange).toHaveBeenCalledWith('budget');
  });

  it('같은 칩을 다시 누르면 해제되어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <PriceRangeFilter
        selected="budget"
        onSelectionChange={onSelectionChange}
      />
    );
    fireEvent.press(getByText('~1만원'));
    expect(onSelectionChange).toHaveBeenCalledWith('');
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <PriceRangeFilter
        selected="all"
        onSelectionChange={() => {}}
        testID="price-filter"
      />
    );
    expect(getByTestId('price-filter')).toBeTruthy();
  });

  it('testID가 칩 그룹에 전파되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <PriceRangeFilter
        selected="all"
        onSelectionChange={() => {}}
        testID="price-filter"
      />
    );
    expect(getByTestId('price-filter-chips-all')).toBeTruthy();
    expect(getByTestId('price-filter-chips-budget')).toBeTruthy();
    expect(getByTestId('price-filter-chips-luxury')).toBeTruthy();
  });

  it('accessibilityLabel "가격대 필터"가 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <PriceRangeFilter selected="all" onSelectionChange={() => {}} />
    );
    expect(getByLabelText('가격대 필터')).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <PriceRangeFilter selected="all" onSelectionChange={() => {}} />,
      true
    );
    expect(getByText('가격대')).toBeTruthy();
    expect(getByText('전체')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PRICE_RANGE_MAP
// ---------------------------------------------------------------------------
describe('PRICE_RANGE_MAP', () => {
  it('5개 키를 가져야 한다', () => {
    const keys = Object.keys(PRICE_RANGE_MAP);
    expect(keys).toEqual(['all', 'budget', 'mid', 'premium', 'luxury']);
  });

  it('all은 0 ~ Infinity 범위여야 한다', () => {
    expect(PRICE_RANGE_MAP.all).toEqual({ min: 0, max: Infinity });
  });

  it('budget은 0 ~ 10000 범위여야 한다', () => {
    expect(PRICE_RANGE_MAP.budget).toEqual({ min: 0, max: 10000 });
  });

  it('mid는 10000 ~ 30000 범위여야 한다', () => {
    expect(PRICE_RANGE_MAP.mid).toEqual({ min: 10000, max: 30000 });
  });

  it('premium은 30000 ~ 50000 범위여야 한다', () => {
    expect(PRICE_RANGE_MAP.premium).toEqual({ min: 30000, max: 50000 });
  });

  it('luxury는 50000 ~ Infinity 범위여야 한다', () => {
    expect(PRICE_RANGE_MAP.luxury).toEqual({ min: 50000, max: Infinity });
  });

  it('모든 범위의 min이 max보다 작거나 같아야 한다', () => {
    Object.entries(PRICE_RANGE_MAP).forEach(([key, range]) => {
      expect(range.min).toBeLessThanOrEqual(range.max);
    });
  });
});

// ---------------------------------------------------------------------------
// RatingFilter
// ---------------------------------------------------------------------------
describe('RatingFilter', () => {
  it('제목 "평점"을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <RatingFilter selected="all" onSelectionChange={() => {}} />
    );
    expect(getByText('평점')).toBeTruthy();
  });

  it('4개 평점 칩을 모두 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <RatingFilter selected="all" onSelectionChange={() => {}} />
    );
    expect(getByText('전체')).toBeTruthy();
    expect(getByText('3.5+')).toBeTruthy();
    expect(getByText('4.0+')).toBeTruthy();
    expect(getByText('4.5+')).toBeTruthy();
  });

  it('RATING_OPTIONS 배열이 4개 항목이어야 한다', () => {
    expect(RATING_OPTIONS).toHaveLength(4);
    const keys = RATING_OPTIONS.map((o) => o.key);
    expect(keys).toEqual(['all', '3.5', '4.0', '4.5']);
  });

  it('단일 선택 모드로 칩을 선택할 수 있어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <RatingFilter
        selected="all"
        onSelectionChange={onSelectionChange}
      />
    );
    fireEvent.press(getByText('4.0+'));
    expect(onSelectionChange).toHaveBeenCalledWith('4.0');
  });

  it('같은 칩을 다시 누르면 해제되어야 한다', () => {
    const onSelectionChange = jest.fn();
    const { getByText } = renderWithTheme(
      <RatingFilter
        selected="4.0"
        onSelectionChange={onSelectionChange}
      />
    );
    fireEvent.press(getByText('4.0+'));
    expect(onSelectionChange).toHaveBeenCalledWith('');
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <RatingFilter
        selected="all"
        onSelectionChange={() => {}}
        testID="rating-filter"
      />
    );
    expect(getByTestId('rating-filter')).toBeTruthy();
  });

  it('testID가 칩 그룹에 전파되어야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <RatingFilter
        selected="all"
        onSelectionChange={() => {}}
        testID="rating-filter"
      />
    );
    expect(getByTestId('rating-filter-chips-all')).toBeTruthy();
    expect(getByTestId('rating-filter-chips-3.5')).toBeTruthy();
    expect(getByTestId('rating-filter-chips-4.0')).toBeTruthy();
    expect(getByTestId('rating-filter-chips-4.5')).toBeTruthy();
  });

  it('accessibilityLabel "평점 필터"가 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <RatingFilter selected="all" onSelectionChange={() => {}} />
    );
    expect(getByLabelText('평점 필터')).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <RatingFilter selected="all" onSelectionChange={() => {}} />,
      true
    );
    expect(getByText('평점')).toBeTruthy();
    expect(getByText('전체')).toBeTruthy();
  });
});
