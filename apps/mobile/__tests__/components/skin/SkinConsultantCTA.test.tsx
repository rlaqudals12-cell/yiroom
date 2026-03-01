/**
 * SkinConsultantCTA 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { SkinConsultantCTA } from '../../../components/skin/SkinConsultantCTA';

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

describe('SkinConsultantCTA', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<SkinConsultantCTA />);
    expect(getByTestId('skin-consultant-cta')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<SkinConsultantCTA />);
    expect(getByText('AI 피부 상담')).toBeTruthy();
  });

  it('설명을 표시한다', () => {
    const { getByText } = renderWithTheme(<SkinConsultantCTA />);
    expect(getByText('분석 결과를 바탕으로 맞춤 솔루션을 제안해드려요')).toBeTruthy();
  });

  it('시작 버튼을 표시한다', () => {
    const { getByText } = renderWithTheme(<SkinConsultantCTA />);
    expect(getByText('상담 시작하기')).toBeTruthy();
  });

  it('클릭이 동작한다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <SkinConsultantCTA onPress={onPress} />,
    );
    fireEvent.press(getByTestId('skin-consultant-cta'));
    expect(onPress).toHaveBeenCalled();
  });

  it('커스텀 제목을 지원한다', () => {
    const { getByText } = renderWithTheme(
      <SkinConsultantCTA title="전문가 상담" />,
    );
    expect(getByText('전문가 상담')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<SkinConsultantCTA />);
    expect(getByLabelText('AI 피부 상담 시작하기')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<SkinConsultantCTA />, true);
    expect(getByTestId('skin-consultant-cta')).toBeTruthy();
  });
});
