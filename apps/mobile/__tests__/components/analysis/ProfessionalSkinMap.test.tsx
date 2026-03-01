/**
 * ProfessionalSkinMap 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ProfessionalSkinMap } from '../../../components/analysis/ProfessionalSkinMap';
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
  forehead_center: { score: 85, status: 'good', concerns: [] },
  nose_bridge: { score: 60, status: 'normal', concerns: ['블랙헤드'] },
  cheek_left: { score: 45, status: 'warning', concerns: ['건조', '홍조'] },
  chin_center: { score: 30, status: 'critical', concerns: ['여드름'] },
};

describe('ProfessionalSkinMap', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ProfessionalSkinMap zones={mockZones} />,
    );
    expect(getByTestId('professional-skin-map')).toBeTruthy();
  });

  it('평균 점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ProfessionalSkinMap zones={mockZones} />,
    );
    expect(getByText('평균 점수')).toBeTruthy();
    // (85 + 60 + 45 + 30) / 4 = 55
    expect(getByText('55점')).toBeTruthy();
  });

  it('존 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ProfessionalSkinMap zones={mockZones} />,
    );
    expect(getByText('이마 중앙')).toBeTruthy();
    expect(getByText('콧등')).toBeTruthy();
    expect(getByText('왼쪽 볼')).toBeTruthy();
    expect(getByText('턱 중앙')).toBeTruthy();
  });

  it('존 점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ProfessionalSkinMap zones={mockZones} />,
    );
    expect(getByText('85')).toBeTruthy();
    expect(getByText('60')).toBeTruthy();
    expect(getByText('45')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
  });

  it('존 상태 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ProfessionalSkinMap zones={mockZones} />,
    );
    expect(getByText('좋음')).toBeTruthy();
    expect(getByText('보통')).toBeTruthy();
    expect(getByText('주의')).toBeTruthy();
    expect(getByText('관리 필요')).toBeTruthy();
  });

  it('존 클릭 시 onZoneSelect를 호출한다', () => {
    const mockOnSelect = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <ProfessionalSkinMap zones={mockZones} onZoneSelect={mockOnSelect} />,
    );
    fireEvent.press(getByLabelText(/이마 중앙: 85점/));
    expect(mockOnSelect).toHaveBeenCalledWith('forehead_center');
  });

  it('존별 접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <ProfessionalSkinMap zones={mockZones} />,
    );
    expect(getByLabelText(/이마 중앙: 85점, 좋음/)).toBeTruthy();
    expect(getByLabelText(/콧등: 60점, 보통/)).toBeTruthy();
  });

  it('전체 접근성 라벨이 포함된다', () => {
    const { getByLabelText } = renderWithTheme(
      <ProfessionalSkinMap zones={mockZones} />,
    );
    expect(getByLabelText(/전문가 피부 맵.*평균 점수 55점.*4개 존/)).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ProfessionalSkinMap zones={mockZones} />,
      true,
    );
    expect(getByTestId('professional-skin-map')).toBeTruthy();
  });
});
