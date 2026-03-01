/**
 * DetailedFaceZoneMap 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { DetailedFaceZoneMap } from '../../../components/analysis/DetailedFaceZoneMap';
import type { DetailedZoneId, DetailedZoneStatus } from '../../../components/analysis/DetailedFaceZoneMap';

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

const mockZones: Partial<Record<DetailedZoneId, DetailedZoneStatus>> = {
  forehead_center: { score: 80, status: 'good' },
  cheek_left: { score: 55, status: 'warning' },
  nose_tip: { score: 65, status: 'normal' },
  chin_center: { score: 90, status: 'excellent' },
};

describe('DetailedFaceZoneMap', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DetailedFaceZoneMap zones={mockZones} />,
    );
    expect(getByTestId('detailed-face-zone-map')).toBeTruthy();
  });

  it('존 도트가 접근성 라벨을 가진다', () => {
    const { getByLabelText } = renderWithTheme(
      <DetailedFaceZoneMap zones={mockZones} />,
    );
    expect(getByLabelText(/이마 중앙.*80점/)).toBeTruthy();
    expect(getByLabelText(/왼쪽 볼.*55점/)).toBeTruthy();
  });

  it('존 터치 시 콜백이 호출된다', () => {
    const onZonePress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <DetailedFaceZoneMap zones={mockZones} onZonePress={onZonePress} />,
    );
    fireEvent.press(getByLabelText(/이마 중앙/));
    expect(onZonePress).toHaveBeenCalledWith('forehead_center');
  });

  it('범례를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DetailedFaceZoneMap zones={mockZones} />,
    );
    expect(getByText('매우 좋음')).toBeTruthy();
    expect(getByText('주의')).toBeTruthy();
  });

  it('sm 사이즈로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DetailedFaceZoneMap zones={mockZones} size="sm" />,
    );
    expect(getByTestId('detailed-face-zone-map')).toBeTruthy();
  });

  it('lg 사이즈로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DetailedFaceZoneMap zones={mockZones} size="lg" />,
    );
    expect(getByTestId('detailed-face-zone-map')).toBeTruthy();
  });

  it('빈 zones로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DetailedFaceZoneMap zones={{}} />,
    );
    expect(getByTestId('detailed-face-zone-map')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DetailedFaceZoneMap zones={mockZones} />,
      true,
    );
    expect(getByTestId('detailed-face-zone-map')).toBeTruthy();
  });
});
