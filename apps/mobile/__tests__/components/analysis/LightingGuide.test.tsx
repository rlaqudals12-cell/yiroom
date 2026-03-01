/**
 * LightingGuide 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { LightingGuide } from '../../../components/analysis/LightingGuide';

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

describe('LightingGuide', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<LightingGuide />);
    expect(getByTestId('lighting-guide')).toBeTruthy();
  });

  it('촬영 환경 체크 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<LightingGuide />);
    expect(getByText('촬영 환경 체크')).toBeTruthy();
  });

  it('모든 항목 통과 시 긍정 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LightingGuide brightness="ok" uniformity="ok" hasShadow={false} />,
    );
    expect(getByText(/촬영 환경이 좋아요/)).toBeTruthy();
  });

  it('밝기 부족을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LightingGuide brightness="low" />,
    );
    expect(getByText('밝기 부족')).toBeTruthy();
  });

  it('밝기 과다를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LightingGuide brightness="high" />,
    );
    expect(getByText('밝기 과다')).toBeTruthy();
  });

  it('조명 불균일을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LightingGuide uniformity="uneven" />,
    );
    expect(getByText('조명 불균일')).toBeTruthy();
  });

  it('그림자 존재를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LightingGuide hasShadow />,
    );
    expect(getByText('그림자가 있어요')).toBeTruthy();
  });

  it('권장사항을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LightingGuide
        brightness="low"
        recommendation="조명을 밝은 곳으로 이동해주세요"
      />,
    );
    expect(getByText('조명을 밝은 곳으로 이동해주세요')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<LightingGuide />, true);
    expect(getByTestId('lighting-guide')).toBeTruthy();
  });
});
