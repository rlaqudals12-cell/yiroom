/**
 * NutritionSummaryCard 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { NutritionSummaryCard } from '../../../components/reports/NutritionSummaryCard';

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

describe('NutritionSummaryCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NutritionSummaryCard avgCalories={2000} avgCarbs={250} avgProtein={80} avgFat={65} period="이번 주" />,
    );
    expect(getByTestId('nutrition-summary-card')).toBeTruthy();
  });

  it('제목과 기간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutritionSummaryCard avgCalories={2000} avgCarbs={250} avgProtein={80} avgFat={65} period="이번 주" />,
    );
    expect(getByText('영양 요약')).toBeTruthy();
    expect(getByText('이번 주')).toBeTruthy();
  });

  it('평균 칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutritionSummaryCard avgCalories={2000} avgCarbs={250} avgProtein={80} avgFat={65} period="이번 주" />,
    );
    expect(getByText('평균 2000kcal')).toBeTruthy();
  });

  it('매크로 영양소를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutritionSummaryCard avgCalories={2000} avgCarbs={250} avgProtein={80} avgFat={65} period="이번 주" />,
    );
    expect(getByText('탄수화물')).toBeTruthy();
    expect(getByText('250g')).toBeTruthy();
    expect(getByText('단백질')).toBeTruthy();
    expect(getByText('80g')).toBeTruthy();
    expect(getByText('지방')).toBeTruthy();
    expect(getByText('65g')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <NutritionSummaryCard avgCalories={2000} avgCarbs={250} avgProtein={80} avgFat={65} period="이번 주" />,
    );
    expect(getByLabelText('이번 주 영양 요약')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NutritionSummaryCard avgCalories={2000} avgCarbs={250} avgProtein={80} avgFat={65} period="이번 주" />,
      true,
    );
    expect(getByTestId('nutrition-summary-card')).toBeTruthy();
  });
});
