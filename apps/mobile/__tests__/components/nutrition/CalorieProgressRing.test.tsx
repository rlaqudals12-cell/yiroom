/**
 * CalorieProgressRing 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { CalorieProgressRing } from '../../../components/nutrition/CalorieProgressRing';

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

describe('CalorieProgressRing', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <CalorieProgressRing consumed={1200} goal={2000} />,
    );
    expect(getByTestId('calorie-progress-ring')).toBeTruthy();
  });

  it('섭취 칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <CalorieProgressRing consumed={1200} goal={2000} />,
    );
    expect(getByText('1200')).toBeTruthy();
  });

  it('남은 칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <CalorieProgressRing consumed={1200} goal={2000} />,
    );
    expect(getByText('남은 800')).toBeTruthy();
  });

  it('초과 시 초과 텍스트를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <CalorieProgressRing consumed={2500} goal={2000} />,
    );
    expect(getByText('초과')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <CalorieProgressRing consumed={1200} goal={2000} />,
    );
    expect(getByLabelText('칼로리 1200/2000kcal, 60% 달성')).toBeTruthy();
  });

  it('커스텀 크기로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <CalorieProgressRing consumed={500} goal={2000} size={80} strokeWidth={6} />,
    );
    expect(getByTestId('calorie-progress-ring')).toBeTruthy();
  });

  it('목표가 0일 때 안전하게 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <CalorieProgressRing consumed={0} goal={0} />,
    );
    expect(getByTestId('calorie-progress-ring')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <CalorieProgressRing consumed={1200} goal={2000} />, true,
    );
    expect(getByTestId('calorie-progress-ring')).toBeTruthy();
  });
});
