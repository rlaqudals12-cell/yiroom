/**
 * VisualReportCard 컴포넌트 테스트
 *
 * 통합 비주얼 리포트 카드
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
import { VisualReportCard } from '../../../components/analysis/VisualReportCard';

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

describe('VisualReportCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <VisualReportCard analysisType="skin" overallScore={75} />,
    );
    expect(getByTestId('visual-report-card')).toBeTruthy();
  });

  it('피부 분석 타입을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <VisualReportCard analysisType="skin" overallScore={80} />,
    );
    expect(getByText('피부 분석')).toBeTruthy();
  });

  it('체형 분석 타입을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <VisualReportCard
        analysisType="body"
        overallScore={70}
        bodyType="W"
        bodyTypeLabel="웨이브 타입"
      />,
    );
    expect(getByText('체형 분석')).toBeTruthy();
    expect(getByText('웨이브 타입')).toBeTruthy();
  });

  it('퍼스널컬러 분석 타입을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <VisualReportCard
        analysisType="personal-color"
        overallScore={90}
        seasonLabel="봄 웜톤"
        confidence={85}
      />,
    );
    expect(getByText('퍼스널컬러 분석')).toBeTruthy();
    expect(getByText('봄 웜톤')).toBeTruthy();
  });

  it('피부 메트릭을 표시한다', () => {
    const metrics = [
      { id: 'hydration', name: '수분', value: 80 },
      { id: 'oiliness', name: '유분', value: 45 },
    ];
    const { getByText } = renderWithTheme(
      <VisualReportCard analysisType="skin" overallScore={75} skinMetrics={metrics} />,
    );
    expect(getByText('수분')).toBeTruthy();
    expect(getByText('유분')).toBeTruthy();
  });

  it('베스트 컬러 도트를 표시한다', () => {
    const bestColors = [
      { hex: '#FF6B6B', name: '코랄' },
      { hex: '#FFA07A', name: '살몬' },
    ];
    const { getByTestId } = renderWithTheme(
      <VisualReportCard
        analysisType="personal-color"
        overallScore={90}
        seasonLabel="가을"
        bestColors={bestColors}
      />,
    );
    expect(getByTestId('visual-report-card')).toBeTruthy();
  });

  it('분석 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <VisualReportCard
        analysisType="skin"
        overallScore={70}
        analyzedAt={new Date('2026-01-15')}
      />,
    );
    expect(getByText(/2026/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <VisualReportCard analysisType="body" overallScore={65} />,
      true,
    );
    expect(getByTestId('visual-report-card')).toBeTruthy();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <VisualReportCard analysisType="skin" overallScore={82} />,
    );
    expect(getByLabelText(/피부 분석.*82점/)).toBeTruthy();
  });
});
