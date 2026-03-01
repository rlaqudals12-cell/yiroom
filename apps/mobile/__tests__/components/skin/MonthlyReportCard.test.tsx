/**
 * MonthlyReportCard 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { MonthlyReportCard } from '../../../components/skin/MonthlyReportCard';

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
  year: 2026,
  month: 2,
  totalDays: 20,
  goodDays: 12,
  normalDays: 5,
  badDays: 3,
};

describe('MonthlyReportCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MonthlyReportCard {...defaultProps} />,
    );
    expect(getByTestId('monthly-report-card')).toBeTruthy();
  });

  it('년월을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MonthlyReportCard {...defaultProps} />,
    );
    expect(getByText('2026년 2월 리포트')).toBeTruthy();
  });

  it('기록 일수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MonthlyReportCard {...defaultProps} />,
    );
    expect(getByText('20일 기록')).toBeTruthy();
  });

  it('상태별 일수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MonthlyReportCard {...defaultProps} />,
    );
    expect(getByText('좋음 12일')).toBeTruthy();
    expect(getByText('보통 5일')).toBeTruthy();
    expect(getByText('나쁨 3일')).toBeTruthy();
  });

  it('트렌드를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MonthlyReportCard {...defaultProps} trend="improving" />,
    );
    expect(getByText('개선 중')).toBeTruthy();
  });

  it('평균 점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MonthlyReportCard {...defaultProps} averageScore={78} />,
    );
    expect(getByText('78점')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <MonthlyReportCard {...defaultProps} />,
    );
    expect(getByLabelText('2026년 2월 피부 리포트, 20일 기록, 좋음 12일')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MonthlyReportCard {...defaultProps} />, true,
    );
    expect(getByTestId('monthly-report-card')).toBeTruthy();
  });
});
