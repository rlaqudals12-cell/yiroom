/**
 * NutritionStreak 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { NutritionStreak } from '../../../components/nutrition/NutritionStreak';

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
  currentStreak: 7,
  longestStreak: 14,
  recentDays: [true, true, true, true, true, false, true],
};

describe('NutritionStreak', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<NutritionStreak {...defaultProps} />);
    expect(getByTestId('nutrition-streak')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<NutritionStreak {...defaultProps} />);
    expect(getByText('🔥 식단 기록 연속')).toBeTruthy();
  });

  it('현재 연속일을 표시한다', () => {
    const { getByText } = renderWithTheme(<NutritionStreak {...defaultProps} />);
    expect(getByText('7')).toBeTruthy();
    expect(getByText('현재')).toBeTruthy();
  });

  it('최장 연속일을 표시한다', () => {
    const { getByText } = renderWithTheme(<NutritionStreak {...defaultProps} />);
    expect(getByText('14')).toBeTruthy();
    expect(getByText('최장')).toBeTruthy();
  });

  it('요일을 표시한다', () => {
    const { getByText } = renderWithTheme(<NutritionStreak {...defaultProps} />);
    expect(getByText('월')).toBeTruthy();
    expect(getByText('일')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<NutritionStreak {...defaultProps} />);
    expect(getByLabelText('식단 기록 7일 연속, 최장 14일')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<NutritionStreak {...defaultProps} />, true);
    expect(getByTestId('nutrition-streak')).toBeTruthy();
  });
});
