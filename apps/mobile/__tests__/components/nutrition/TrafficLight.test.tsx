/**
 * TrafficLight 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { TrafficLight, type TrafficLightItem } from '../../../components/nutrition/TrafficLight';

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

const mockItems: TrafficLightItem[] = [
  { name: '나트륨', level: 'red', value: '800mg', perServing: '1회분 기준' },
  { name: '당류', level: 'amber', value: '12g' },
  { name: '식이섬유', level: 'green', value: '8g' },
];

describe('TrafficLight', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <TrafficLight items={mockItems} />,
    );
    expect(getByTestId('traffic-light')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <TrafficLight items={mockItems} />,
    );
    expect(getByText('🚦 영양 신호등')).toBeTruthy();
  });

  it('영양소 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <TrafficLight items={mockItems} />,
    );
    expect(getByText('나트륨')).toBeTruthy();
    expect(getByText('당류')).toBeTruthy();
    expect(getByText('식이섬유')).toBeTruthy();
  });

  it('값을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <TrafficLight items={mockItems} />,
    );
    expect(getByText('800mg')).toBeTruthy();
    expect(getByText('12g')).toBeTruthy();
    expect(getByText('8g')).toBeTruthy();
  });

  it('등급 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <TrafficLight items={mockItems} />,
    );
    expect(getByText('주의')).toBeTruthy();
    expect(getByText('보통')).toBeTruthy();
    expect(getByText('양호')).toBeTruthy();
  });

  it('제품명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <TrafficLight items={mockItems} productName="매운 라면" />,
    );
    expect(getByText('매운 라면')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <TrafficLight items={mockItems} productName="매운 라면" />,
    );
    expect(getByLabelText('매운 라면 영양 신호등, 3개 항목')).toBeTruthy();
  });

  it('항목별 접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <TrafficLight items={mockItems} />,
    );
    expect(getByLabelText('나트륨: 주의, 800mg')).toBeTruthy();
    expect(getByLabelText('식이섬유: 양호, 8g')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <TrafficLight items={mockItems} />, true,
    );
    expect(getByTestId('traffic-light')).toBeTruthy();
  });
});
