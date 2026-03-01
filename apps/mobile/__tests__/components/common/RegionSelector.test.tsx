/**
 * RegionSelector 컴포넌트 테스트
 *
 * 국가/지역 선택기
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

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
import { RegionSelector } from '../../../components/common/RegionSelector';

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

describe('RegionSelector', () => {
  const mockOnChange = jest.fn();

  afterEach(() => {
    mockOnChange.mockClear();
  });

  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RegionSelector value="KR" onChange={mockOnChange} />,
    );
    expect(getByTestId('region-selector')).toBeTruthy();
  });

  it('현재 선택된 지역이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RegionSelector value="KR" onChange={mockOnChange} />,
    );
    expect(getByText('대한민국')).toBeTruthy();
    expect(getByText('🇰🇷')).toBeTruthy();
  });

  it('라벨이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RegionSelector value="KR" onChange={mockOnChange} label="지역" />,
    );
    expect(getByText('지역')).toBeTruthy();
  });

  it('커스텀 라벨이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RegionSelector value="KR" onChange={mockOnChange} label="국가 선택" />,
    );
    expect(getByText('국가 선택')).toBeTruthy();
  });

  it('선택 버튼 클릭 시 모달이 열린다', () => {
    const { getByTestId } = renderWithTheme(
      <RegionSelector value="KR" onChange={mockOnChange} />,
    );
    fireEvent.press(getByTestId('region-selector-button'));
    expect(getByTestId('region-selector-modal')).toBeTruthy();
  });

  it('모달에 지역 목록이 표시된다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <RegionSelector value="KR" onChange={mockOnChange} />,
    );
    fireEvent.press(getByTestId('region-selector-button'));
    expect(getByText('미국')).toBeTruthy();
    expect(getByText('일본')).toBeTruthy();
    expect(getByText('중국')).toBeTruthy();
    expect(getByText('영국')).toBeTruthy();
  });

  it('모달에 선택된 항목에 체크 표시가 있다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <RegionSelector value="KR" onChange={mockOnChange} />,
    );
    fireEvent.press(getByTestId('region-selector-button'));
    expect(getByText('✓')).toBeTruthy();
  });

  it('접근성 라벨이 올바르다', () => {
    const { getByLabelText } = renderWithTheme(
      <RegionSelector value="KR" onChange={mockOnChange} />,
    );
    expect(getByLabelText('지역 선택: 현재 대한민국')).toBeTruthy();
  });

  it('US 선택 시 미국이 표시된다', () => {
    const { getByText } = renderWithTheme(
      <RegionSelector value="US" onChange={mockOnChange} />,
    );
    expect(getByText('미국')).toBeTruthy();
    expect(getByText('🇺🇸')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RegionSelector value="KR" onChange={mockOnChange} />,
      true,
    );
    expect(getByTestId('region-selector')).toBeTruthy();
  });
});
