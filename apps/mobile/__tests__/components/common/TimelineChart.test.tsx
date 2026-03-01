/**
 * TimelineChart 컴포넌트 테스트
 *
 * 시간에 따른 점수 변화 바 차트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { TimelineChart } from '../../../components/common/TimelineChart';
import type { TimelineDataPoint } from '../../../components/common/TimelineChart';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system',
    setThemeMode: jest.fn(),
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>,
  );
}

const mockData: TimelineDataPoint[] = [
  { date: '2026-01-01', score: 65 },
  { date: '2026-01-08', score: 70 },
  { date: '2026-01-15', score: 72 },
  { date: '2026-01-22', score: 78 },
  { date: '2026-01-29', score: 82 },
];

describe('TimelineChart', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <TimelineChart data={mockData} />,
    );
    expect(getByTestId('timeline-chart')).toBeTruthy();
  });

  it('타이틀이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <TimelineChart data={mockData} title="피부 점수 이력" />,
    );
    expect(getByText('피부 점수 이력')).toBeTruthy();
  });

  it('상승 트렌드가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <TimelineChart data={mockData} title="점수" />,
    );
    expect(getByText('↑ 상승')).toBeTruthy();
  });

  it('하락 트렌드가 표시된다', () => {
    const downData: TimelineDataPoint[] = [
      { date: '2026-01-01', score: 80 },
      { date: '2026-01-08', score: 65 },
    ];
    const { getByText } = renderWithTheme(
      <TimelineChart data={downData} title="점수" />,
    );
    expect(getByText('↓ 하락')).toBeTruthy();
  });

  it('빈 데이터에서 빈 상태 메시지가 표시된다', () => {
    const { getByText } = renderWithTheme(
      <TimelineChart data={[]} />,
    );
    expect(getByText('아직 기록이 없어요')).toBeTruthy();
  });

  it('날짜 라벨이 포맷되어 표시된다', () => {
    const { getByText } = renderWithTheme(
      <TimelineChart data={[{ date: '2026-03-15', score: 70 }]} />,
    );
    expect(getByText('3/15')).toBeTruthy();
  });

  it('커스텀 label이 날짜 대신 표시된다', () => {
    const { getByText } = renderWithTheme(
      <TimelineChart data={[{ date: '2026-01-01', score: 70, label: '1주차' }]} />,
    );
    expect(getByText('1주차')).toBeTruthy();
  });

  it('variant skin으로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <TimelineChart data={mockData} variant="skin" />,
    );
    expect(getByTestId('timeline-chart')).toBeTruthy();
  });

  it('variant body로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <TimelineChart data={mockData} variant="body" />,
    );
    expect(getByTestId('timeline-chart')).toBeTruthy();
  });

  it('목표선이 있을 때 렌더링된다', () => {
    const { getByLabelText } = renderWithTheme(
      <TimelineChart data={mockData} targetScore={80} />,
    );
    expect(getByLabelText('목표: 80점')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <TimelineChart data={mockData} />,
      true,
    );
    expect(getByTestId('timeline-chart')).toBeTruthy();
  });
});
