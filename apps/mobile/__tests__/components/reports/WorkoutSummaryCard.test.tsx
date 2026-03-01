/**
 * WorkoutSummaryCard 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { WorkoutSummaryCard } from '../../../components/reports/WorkoutSummaryCard';

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

describe('WorkoutSummaryCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WorkoutSummaryCard totalSessions={5} totalMinutes={150} totalCalories={800} period="이번 주" />,
    );
    expect(getByTestId('workout-summary-card')).toBeTruthy();
  });

  it('제목과 기간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutSummaryCard totalSessions={5} totalMinutes={150} totalCalories={800} period="이번 주" />,
    );
    expect(getByText('운동 요약')).toBeTruthy();
    expect(getByText('이번 주')).toBeTruthy();
  });

  it('통계를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutSummaryCard totalSessions={5} totalMinutes={150} totalCalories={800} period="이번 주" />,
    );
    expect(getByText('5')).toBeTruthy();
    expect(getByText('150')).toBeTruthy();
    expect(getByText('800')).toBeTruthy();
  });

  it('라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutSummaryCard totalSessions={5} totalMinutes={150} totalCalories={800} period="이번 주" />,
    );
    expect(getByText('운동 횟수')).toBeTruthy();
    expect(getByText('총 시간(분)')).toBeTruthy();
    expect(getByText('소모 칼로리')).toBeTruthy();
  });

  it('접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <WorkoutSummaryCard totalSessions={5} totalMinutes={150} totalCalories={800} period="이번 주" />,
    );
    expect(getByLabelText('이번 주 운동 요약')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WorkoutSummaryCard totalSessions={5} totalMinutes={150} totalCalories={800} period="이번 주" />,
      true,
    );
    expect(getByTestId('workout-summary-card')).toBeTruthy();
  });
});
