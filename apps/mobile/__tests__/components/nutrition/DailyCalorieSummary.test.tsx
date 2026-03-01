/**
 * DailyCalorieSummary 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { DailyCalorieSummary } from '../../../components/nutrition/DailyCalorieSummary';

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

describe('DailyCalorieSummary', () => {
  const defaultProps = {
    goal: 2000,
    consumed: 1200,
    carbs: 150,
    protein: 80,
    fat: 40,
  };

  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<DailyCalorieSummary {...defaultProps} />);
    expect(getByTestId('daily-calorie-summary')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<DailyCalorieSummary {...defaultProps} />);
    expect(getByText('오늘의 칼로리')).toBeTruthy();
  });

  it('퍼센트를 표시한다', () => {
    const { getByText } = renderWithTheme(<DailyCalorieSummary {...defaultProps} />);
    expect(getByText('60%')).toBeTruthy();
  });

  it('섭취/목표/남은 칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(<DailyCalorieSummary {...defaultProps} />);
    expect(getByText('1200')).toBeTruthy();
    expect(getByText('2000')).toBeTruthy();
    expect(getByText('800')).toBeTruthy();
  });

  it('탄단지를 표시한다', () => {
    const { getByText } = renderWithTheme(<DailyCalorieSummary {...defaultProps} />);
    expect(getByText('탄 150g')).toBeTruthy();
    expect(getByText('단 80g')).toBeTruthy();
    expect(getByText('지 40g')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<DailyCalorieSummary {...defaultProps} />);
    expect(getByLabelText('오늘 1200/2000kcal 섭취, 60% 달성')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<DailyCalorieSummary {...defaultProps} />, true);
    expect(getByTestId('daily-calorie-summary')).toBeTruthy();
  });
});
