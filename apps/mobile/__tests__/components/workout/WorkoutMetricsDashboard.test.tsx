/**
 * WorkoutMetricsDashboard 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { WorkoutMetricsDashboard, type WorkoutMetrics } from '../../../components/workout/WorkoutMetricsDashboard';

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

const mockMetrics: WorkoutMetrics = {
  totalWorkouts: 12,
  totalMinutes: 540,
  totalCalories: 4200,
  avgIntensity: 72,
  streak: 5,
  personalBests: [
    { exercise: '벤치프레스', record: '80kg × 5회' },
    { exercise: '스쿼트', record: '100kg × 3회' },
  ],
};

describe('WorkoutMetricsDashboard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WorkoutMetricsDashboard metrics={mockMetrics} period="weekly" />,
    );
    expect(getByTestId('workout-metrics-dashboard')).toBeTruthy();
  });

  it('주간 레이블을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutMetricsDashboard metrics={mockMetrics} period="weekly" />,
    );
    expect(getByText('이번 주 운동 통계')).toBeTruthy();
  });

  it('월간 레이블을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutMetricsDashboard metrics={mockMetrics} period="monthly" />,
    );
    expect(getByText('이번 달 운동 통계')).toBeTruthy();
  });

  it('운동 횟수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutMetricsDashboard metrics={mockMetrics} period="weekly" />,
    );
    expect(getByText('12회')).toBeTruthy();
  });

  it('총 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutMetricsDashboard metrics={mockMetrics} period="weekly" />,
    );
    expect(getByText('540분')).toBeTruthy();
  });

  it('소모 칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutMetricsDashboard metrics={mockMetrics} period="weekly" />,
    );
    expect(getByText('4200kcal')).toBeTruthy();
  });

  it('평균 강도를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutMetricsDashboard metrics={mockMetrics} period="weekly" />,
    );
    expect(getByText('72%')).toBeTruthy();
  });

  it('개인 최고 기록을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutMetricsDashboard metrics={mockMetrics} period="weekly" />,
    );
    expect(getByText('벤치프레스')).toBeTruthy();
    expect(getByText('80kg × 5회')).toBeTruthy();
  });

  it('개인 최고 기록 없이 렌더링된다', () => {
    const metricsNoPB = { ...mockMetrics, personalBests: undefined };
    const { getByTestId, queryByText } = renderWithTheme(
      <WorkoutMetricsDashboard metrics={metricsNoPB} period="weekly" />,
    );
    expect(getByTestId('workout-metrics-dashboard')).toBeTruthy();
    expect(queryByText('🏆 개인 최고 기록')).toBeNull();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WorkoutMetricsDashboard metrics={mockMetrics} period="monthly" />, true,
    );
    expect(getByTestId('workout-metrics-dashboard')).toBeTruthy();
  });
});
