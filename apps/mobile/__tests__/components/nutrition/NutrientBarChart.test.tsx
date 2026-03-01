/**
 * NutrientBarChart 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { NutrientBarChart, type NutrientData } from '../../../components/nutrition/NutrientBarChart';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>,
  );
}

const mockNutrients: NutrientData[] = [
  { name: '탄수화물', current: 150, goal: 250, unit: 'g', color: '#60A5FA' },
  { name: '단백질', current: 60, goal: 80, unit: 'g', color: '#34D399' },
  { name: '지방', current: 50, goal: 60, unit: 'g', color: '#FBBF24' },
];

describe('NutrientBarChart', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NutrientBarChart nutrients={mockNutrients} />,
    );
    expect(getByTestId('nutrient-bar-chart')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutrientBarChart nutrients={mockNutrients} title="영양소 현황" />,
    );
    expect(getByText('영양소 현황')).toBeTruthy();
  });

  it('영양소 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutrientBarChart nutrients={mockNutrients} />,
    );
    expect(getByText('탄수화물')).toBeTruthy();
    expect(getByText('단백질')).toBeTruthy();
    expect(getByText('지방')).toBeTruthy();
  });

  it('현재/목표 값을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutrientBarChart nutrients={mockNutrients} />,
    );
    expect(getByText('150/250g')).toBeTruthy();
    expect(getByText('60/80g')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <NutrientBarChart nutrients={mockNutrients} title="영양소" />,
    );
    expect(getByLabelText('영양소 차트, 3개 항목')).toBeTruthy();
  });

  it('빈 배열로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NutrientBarChart nutrients={[]} />,
    );
    expect(getByTestId('nutrient-bar-chart')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NutrientBarChart nutrients={mockNutrients} />, true,
    );
    expect(getByTestId('nutrient-bar-chart')).toBeTruthy();
  });
});
