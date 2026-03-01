/**
 * PlanSummaryCard 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { PlanSummaryCard } from '../../../components/workout/PlanSummaryCard';

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
  totalExercises: 20,
  totalDays: 7,
  restDays: 2,
  estimatedCalories: 3500,
  focusAreas: ['가슴', '등', '하체'],
  difficulty: '중급',
};

describe('PlanSummaryCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<PlanSummaryCard {...defaultProps} />);
    expect(getByTestId('plan-summary-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<PlanSummaryCard {...defaultProps} />);
    expect(getByText('계획 요약')).toBeTruthy();
  });

  it('운동 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<PlanSummaryCard {...defaultProps} />);
    expect(getByText('20개')).toBeTruthy();
  });

  it('운동일 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<PlanSummaryCard {...defaultProps} />);
    expect(getByText('5일')).toBeTruthy();
  });

  it('휴식일 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<PlanSummaryCard {...defaultProps} />);
    expect(getByText('2일')).toBeTruthy();
  });

  it('예상 칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(<PlanSummaryCard {...defaultProps} />);
    expect(getByText('3500kcal')).toBeTruthy();
  });

  it('난이도를 표시한다', () => {
    const { getByText } = renderWithTheme(<PlanSummaryCard {...defaultProps} />);
    expect(getByText('중급')).toBeTruthy();
  });

  it('집중 부위를 표시한다', () => {
    const { getByText } = renderWithTheme(<PlanSummaryCard {...defaultProps} />);
    expect(getByText('가슴')).toBeTruthy();
    expect(getByText('등')).toBeTruthy();
    expect(getByText('하체')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<PlanSummaryCard {...defaultProps} />);
    expect(getByLabelText('계획 요약: 20개 운동, 7일')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<PlanSummaryCard {...defaultProps} />, true);
    expect(getByTestId('plan-summary-card')).toBeTruthy();
  });
});
