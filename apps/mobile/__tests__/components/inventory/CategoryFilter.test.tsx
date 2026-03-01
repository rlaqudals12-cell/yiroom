/**
 * CategoryFilter 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { CategoryFilter } from '../../../components/inventory/CategoryFilter';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}
function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(<ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>);
}

const categories = [
  { id: 'all', label: '전체', count: 10 },
  { id: 'skincare', label: '스킨케어', emoji: '🧴', count: 5 },
  { id: 'makeup', label: '메이크업', emoji: '💄', count: 3 },
];

describe('CategoryFilter', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<CategoryFilter categories={categories} />);
    expect(getByTestId('category-filter')).toBeTruthy();
  });

  it('카테고리 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(<CategoryFilter categories={categories} />);
    expect(getByText('전체')).toBeTruthy();
    expect(getByText('스킨케어')).toBeTruthy();
    expect(getByText('메이크업')).toBeTruthy();
  });

  it('이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(<CategoryFilter categories={categories} />);
    expect(getByText('🧴')).toBeTruthy();
    expect(getByText('💄')).toBeTruthy();
  });

  it('카운트를 표시한다', () => {
    const { getByText } = renderWithTheme(<CategoryFilter categories={categories} />);
    expect(getByText('10')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  it('onSelect 호출 시 id를 전달한다', () => {
    const onSelect = jest.fn();
    const { getByText } = renderWithTheme(
      <CategoryFilter categories={categories} onSelect={onSelect} />,
    );
    fireEvent.press(getByText('스킨케어'));
    expect(onSelect).toHaveBeenCalledWith('skincare');
  });

  it('선택된 칩의 접근성 레이블에 선택됨 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <CategoryFilter categories={categories} selectedId="skincare" />,
    );
    expect(getByLabelText('스킨케어 5개, 선택됨')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<CategoryFilter categories={categories} />, true);
    expect(getByTestId('category-filter')).toBeTruthy();
  });
});
