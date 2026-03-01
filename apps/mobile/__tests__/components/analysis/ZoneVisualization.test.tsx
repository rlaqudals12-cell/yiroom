/**
 * ZoneVisualization 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ZoneVisualization, type ZoneData, type ZoneId } from '../../../components/analysis/ZoneVisualization';

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

const mockZones: Partial<Record<ZoneId, ZoneData>> = {
  forehead: { score: 80, status: 'good', label: '이마', concerns: ['주름'], recommendations: ['보습 크림 사용'] },
  tZone: { score: 55, status: 'warning', label: 'T존', metrics: [{ name: '유분', value: 72 }] },
  cheeks: { score: 70, status: 'normal', label: '볼' },
};

describe('ZoneVisualization', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ZoneVisualization zones={mockZones} />,
    );
    expect(getByTestId('zone-visualization')).toBeTruthy();
  });

  it('존 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ZoneVisualization zones={mockZones} />,
    );
    expect(getByText('이마')).toBeTruthy();
    expect(getByText('T존')).toBeTruthy();
    expect(getByText('볼')).toBeTruthy();
  });

  it('존 점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ZoneVisualization zones={mockZones} />,
    );
    expect(getByText('80')).toBeTruthy();
    expect(getByText('55')).toBeTruthy();
    expect(getByText('70')).toBeTruthy();
  });

  it('활력도 점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ZoneVisualization zones={mockZones} vitalityScore={75} />,
    );
    expect(getByText('피부 활력도')).toBeTruthy();
    expect(getByText('75')).toBeTruthy();
  });

  it('T-U존 차이를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ZoneVisualization zones={mockZones} tUZoneDiff={15} />,
    );
    expect(getByText('T-U존 차이')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
  });

  it('주요 피부 고민을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ZoneVisualization zones={mockZones} primaryConcerns={['건조함', '모공']} />,
    );
    expect(getByText('주요 피부 고민')).toBeTruthy();
    expect(getByText('건조함')).toBeTruthy();
    expect(getByText('모공')).toBeTruthy();
  });

  it('접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <ZoneVisualization zones={mockZones} />,
    );
    expect(getByLabelText(/피부 존 시각화.*3개 존/)).toBeTruthy();
  });

  it('존별 접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <ZoneVisualization zones={mockZones} />,
    );
    expect(getByLabelText(/이마: 80점/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ZoneVisualization zones={mockZones} />,
      true,
    );
    expect(getByTestId('zone-visualization')).toBeTruthy();
  });
});
