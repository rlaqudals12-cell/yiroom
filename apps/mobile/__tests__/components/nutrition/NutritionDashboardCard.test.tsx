/**
 * NutritionDashboardCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { NutritionDashboardCard } from '../../../components/nutrition/NutritionDashboardCard';

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

const defaultProps = {
  todayCalories: 1500,
  goalCalories: 2000,
  mealsLogged: 2,
};

describe('NutritionDashboardCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NutritionDashboardCard {...defaultProps} />,
    );
    expect(getByTestId('nutrition-dashboard-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutritionDashboardCard {...defaultProps} />,
    );
    expect(getByText('오늘의 영양')).toBeTruthy();
  });

  it('퍼센트를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutritionDashboardCard {...defaultProps} />,
    );
    expect(getByText('75%')).toBeTruthy();
  });

  it('칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutritionDashboardCard {...defaultProps} />,
    );
    expect(getByText('1500')).toBeTruthy();
    expect(getByText('/ 2000kcal')).toBeTruthy();
  });

  it('기록된 식사 수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutritionDashboardCard {...defaultProps} />,
    );
    expect(getByText('2')).toBeTruthy();
    expect(getByText('끼 기록')).toBeTruthy();
  });

  it('수분 섭취를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutritionDashboardCard {...defaultProps} waterIntake={1200} waterGoal={2000} />,
    );
    expect(getByText('/ 2000ml')).toBeTruthy();
  });

  it('탄단지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutritionDashboardCard {...defaultProps} macros={{ carbs: 150, protein: 80, fat: 40 }} />,
    );
    expect(getByText('탄 150g')).toBeTruthy();
    expect(getByText('단 80g')).toBeTruthy();
    expect(getByText('지 40g')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <NutritionDashboardCard {...defaultProps} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('nutrition-dashboard-card'));
    expect(onPress).toHaveBeenCalled();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <NutritionDashboardCard {...defaultProps} />,
    );
    expect(getByLabelText('오늘 영양 1500/2000kcal, 2끼 기록')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NutritionDashboardCard {...defaultProps} />, true,
    );
    expect(getByTestId('nutrition-dashboard-card')).toBeTruthy();
  });
});
