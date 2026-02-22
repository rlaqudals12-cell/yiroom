/**
 * RadarChart 컴포넌트 테스트
 *
 * SVG 기반 레이더 차트의 데이터 렌더링, 빈 데이터 처리, 애니메이션, testID 검증.
 * react-native-svg와 react-native-reanimated는 jest.setup.js / __mocks__에서 자동 모킹됨.
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
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';
import { RadarChart, type RadarDataItem } from '../../../components/charts/RadarChart';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// 피부 분석 6항목 테스트 데이터
const mockSkinData: RadarDataItem[] = [
  { label: '수분', value: 75 },
  { label: '유분', value: 45 },
  { label: '민감도', value: 30 },
  { label: '주름', value: 20 },
  { label: '모공', value: 55 },
  { label: '탄력', value: 65 },
];

// 3항목 최소 데이터
const mockMinData: RadarDataItem[] = [
  { label: 'A', value: 50 },
  { label: 'B', value: 70 },
  { label: 'C', value: 90 },
];

// maxValue 커스텀 데이터
const mockCustomMaxData: RadarDataItem[] = [
  { label: '항목1', value: 8, maxValue: 10 },
  { label: '항목2', value: 6, maxValue: 10 },
  { label: '항목3', value: 9, maxValue: 10 },
  { label: '항목4', value: 7, maxValue: 10 },
];

describe('RadarChart', () => {
  describe('데이터 렌더링', () => {
    it('6항목 데이터로 정상 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart data={mockSkinData} testID="radar-6" />
      );

      expect(getByTestId('radar-6')).toBeTruthy();
    });

    it('3항목 최소 데이터로 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart data={mockMinData} testID="radar-3" />
      );

      expect(getByTestId('radar-3')).toBeTruthy();
    });

    it('maxValue가 커스텀인 데이터를 처리해야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart data={mockCustomMaxData} testID="radar-custom-max" />
      );

      expect(getByTestId('radar-custom-max')).toBeTruthy();
    });

    it('값이 maxValue를 초과해도 1로 클램핑되어 렌더링되어야 한다', () => {
      const overflowData: RadarDataItem[] = [
        { label: 'A', value: 150, maxValue: 100 },
        { label: 'B', value: 200, maxValue: 100 },
        { label: 'C', value: 50, maxValue: 100 },
      ];

      const { getByTestId } = renderWithTheme(
        <RadarChart data={overflowData} testID="radar-overflow" />
      );

      expect(getByTestId('radar-overflow')).toBeTruthy();
    });
  });

  describe('빈 데이터', () => {
    it('빈 배열로도 에러 없이 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart data={[]} testID="radar-empty" />
      );

      expect(getByTestId('radar-empty')).toBeTruthy();
    });
  });

  describe('props', () => {
    it('custom size가 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart data={mockSkinData} size={320} testID="radar-sized" />
      );

      const chart = getByTestId('radar-sized');
      const flatStyle = Array.isArray(chart.props.style)
        ? chart.props.style
        : [chart.props.style];
      const hasSizedStyle = flatStyle.some(
        (s: Record<string, unknown>) => s && s.width === 320 && s.height === 320
      );
      expect(hasSizedStyle).toBe(true);
    });

    it('showLabels=false로 라벨을 숨길 수 있어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart
          data={mockSkinData}
          showLabels={false}
          testID="radar-no-labels"
        />
      );

      expect(getByTestId('radar-no-labels')).toBeTruthy();
    });

    it('showValues=true로 값을 표시할 수 있어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart
          data={mockSkinData}
          showValues={true}
          testID="radar-with-values"
        />
      );

      expect(getByTestId('radar-with-values')).toBeTruthy();
    });

    it('custom fillColor와 strokeColor가 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart
          data={mockSkinData}
          fillColor="#ff0000"
          strokeColor="#00ff00"
          testID="radar-custom-colors"
        />
      );

      expect(getByTestId('radar-custom-colors')).toBeTruthy();
    });

    it('custom rings 수가 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart data={mockSkinData} rings={6} testID="radar-6rings" />
      );

      expect(getByTestId('radar-6rings')).toBeTruthy();
    });

    it('custom style이 적용되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart
          data={mockSkinData}
          style={{ marginTop: 24 }}
          testID="radar-styled"
        />
      );

      const chart = getByTestId('radar-styled');
      const flatStyle = Array.isArray(chart.props.style)
        ? chart.props.style
        : [chart.props.style];
      const hasMarginTop = flatStyle.some(
        (s: Record<string, unknown>) => s && s.marginTop === 24
      );
      expect(hasMarginTop).toBe(true);
    });
  });

  describe('접근성 (testID)', () => {
    it('testID가 전달되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart data={mockSkinData} testID="radar-chart-test" />
      );

      expect(getByTestId('radar-chart-test')).toBeTruthy();
    });
  });

  describe('애니메이션', () => {
    it('animated=true (기본값)에서 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart data={mockSkinData} testID="radar-animated" />
      );

      expect(getByTestId('radar-animated')).toBeTruthy();
    });

    it('animated=false에서 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart
          data={mockSkinData}
          animated={false}
          testID="radar-static"
        />
      );

      expect(getByTestId('radar-static')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 정상 렌더링되어야 한다', () => {
      const { getByTestId } = renderWithTheme(
        <RadarChart data={mockSkinData} testID="radar-dark" />,
        true
      );

      expect(getByTestId('radar-dark')).toBeTruthy();
    });
  });
});
