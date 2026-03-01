/**
 * PhotoOverlayMap 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { PhotoOverlayMap } from '../../../components/analysis/PhotoOverlayMap';
import type { OverlayZoneId, OverlayZoneStatus } from '../../../components/analysis/PhotoOverlayMap';

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

const mockZones: Partial<Record<OverlayZoneId, OverlayZoneStatus>> = {
  forehead: { score: 80, status: 'good', label: '이마' },
  tZone: { score: 55, status: 'warning', label: 'T존' },
  cheeks: { score: 70, status: 'normal', label: '볼' },
};

describe('PhotoOverlayMap', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <PhotoOverlayMap imageUrl="https://example.com/face.jpg" zones={mockZones} />,
    );
    expect(getByTestId('photo-overlay-map')).toBeTruthy();
  });

  it('이미지를 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <PhotoOverlayMap imageUrl="https://example.com/face.jpg" zones={mockZones} />,
    );
    expect(getByLabelText('분석 사진')).toBeTruthy();
  });

  it('존 라벨을 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <PhotoOverlayMap
        imageUrl="https://example.com/face.jpg"
        zones={mockZones}
        showLabels
      />,
    );
    expect(getByLabelText(/이마.*80점/)).toBeTruthy();
    expect(getByLabelText(/T존.*55점/)).toBeTruthy();
  });

  it('존 터치 시 콜백이 호출된다', () => {
    const onZonePress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <PhotoOverlayMap
        imageUrl="https://example.com/face.jpg"
        zones={mockZones}
        onZonePress={onZonePress}
      />,
    );
    fireEvent.press(getByLabelText(/이마/));
    expect(onZonePress).toHaveBeenCalledWith('forehead');
  });

  it('빈 zones로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <PhotoOverlayMap imageUrl="https://example.com/face.jpg" zones={{}} />,
    );
    expect(getByTestId('photo-overlay-map')).toBeTruthy();
  });

  it('showLabels=false로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <PhotoOverlayMap
        imageUrl="https://example.com/face.jpg"
        zones={mockZones}
        showLabels={false}
      />,
    );
    expect(getByTestId('photo-overlay-map')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <PhotoOverlayMap imageUrl="https://example.com/face.jpg" zones={mockZones} />,
      true,
    );
    expect(getByTestId('photo-overlay-map')).toBeTruthy();
  });
});
