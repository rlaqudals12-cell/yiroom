/**
 * TrendChart 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { TrendChart } from '../../../components/analysis/TrendChart';
import type { TrendDataPoint } from '../../../components/analysis/TrendChart';

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

const mockData: TrendDataPoint[] = [
  { date: new Date('2026-01-01'), score: 60 },
  { date: new Date('2026-01-15'), score: 65 },
  { date: new Date('2026-02-01'), score: 70 },
  { date: new Date('2026-02-15'), score: 75 },
];

describe('TrendChart', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<TrendChart data={mockData} />);
    expect(getByTestId('trend-chart')).toBeTruthy();
  });

  it('빈 데이터 시 안내 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(<TrendChart data={[]} />);
    expect(getByText('분석 기록이 없어요')).toBeTruthy();
  });

  it('점수 추이 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<TrendChart data={mockData} />);
    expect(getByText('점수 추이')).toBeTruthy();
  });

  it('상승 트렌드를 표시한다', () => {
    const { getByText } = renderWithTheme(<TrendChart data={mockData} />);
    expect(getByText('상승')).toBeTruthy();
  });

  it('하락 트렌드를 표시한다', () => {
    const downData: TrendDataPoint[] = [
      { date: new Date('2026-01-01'), score: 80 },
      { date: new Date('2026-02-01'), score: 60 },
    ];
    const { getByText } = renderWithTheme(<TrendChart data={downData} />);
    expect(getByText('하락')).toBeTruthy();
  });

  it('유지 트렌드를 표시한다', () => {
    const sameData: TrendDataPoint[] = [
      { date: new Date('2026-01-01'), score: 70 },
      { date: new Date('2026-02-01'), score: 72 },
    ];
    const { getByText } = renderWithTheme(<TrendChart data={sameData} />);
    expect(getByText('유지')).toBeTruthy();
  });

  it('범례를 표시한다', () => {
    const { getByText } = renderWithTheme(<TrendChart data={mockData} />);
    expect(getByText(/60점.*75점/)).toBeTruthy();
  });

  it('목표선과 함께 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <TrendChart data={mockData} showGoal goalScore={80} />,
    );
    expect(getByTestId('trend-chart')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<TrendChart data={mockData} />, true);
    expect(getByTestId('trend-chart')).toBeTruthy();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(<TrendChart data={mockData} />);
    expect(getByLabelText(/트렌드 차트.*상승/)).toBeTruthy();
  });
});
