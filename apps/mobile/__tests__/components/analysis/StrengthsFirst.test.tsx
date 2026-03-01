/**
 * StrengthsFirst 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { StrengthsFirst } from '../../../components/analysis/StrengthsFirst';

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

describe('StrengthsFirst', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <StrengthsFirst analysisType="skin" />,
    );
    expect(getByTestId('strengths-first')).toBeTruthy();
  });

  it('강점 섹션을 표시한다', () => {
    const metrics = [
      { id: 'hydration', name: '수분', value: 85 },
      { id: 'elasticity', name: '탄력', value: 80 },
      { id: 'pores', name: '모공', value: 75 },
      { id: 'oiliness', name: '유분', value: 40 },
    ];
    const { getByText } = renderWithTheme(
      <StrengthsFirst analysisType="skin" metrics={metrics} />,
    );
    expect(getByText('나의 강점')).toBeTruthy();
    expect(getByText('수분')).toBeTruthy();
  });

  it('성장 가능성 섹션을 표시한다', () => {
    const metrics = [
      { id: 'hydration', name: '수분', value: 85 },
      { id: 'oiliness', name: '유분', value: 40 },
    ];
    const { getByText } = renderWithTheme(
      <StrengthsFirst analysisType="skin" metrics={metrics} />,
    );
    expect(getByText('성장 가능성')).toBeTruthy();
    expect(getByText(/유분.*개선/)).toBeTruthy();
  });

  it('모든 항목 우수 시 축하 메시지를 표시한다', () => {
    const metrics = [
      { id: 'hydration', name: '수분', value: 85 },
      { id: 'elasticity', name: '탄력', value: 90 },
    ];
    const { getByText } = renderWithTheme(
      <StrengthsFirst analysisType="skin" metrics={metrics} />,
    );
    expect(getByText(/모든 항목.*우수/)).toBeTruthy();
  });

  it('체형 강점을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <StrengthsFirst
        analysisType="body"
        strengths={['어깨 비율 우수', '허리 라인 균형']}
      />,
    );
    expect(getByText('어깨 비율 우수')).toBeTruthy();
  });

  it('퍼스널컬러 베스트 색상을 표시한다', () => {
    const bestColors = [
      { hex: '#FF6B6B', name: '코랄' },
      { hex: '#FFA07A', name: '살몬' },
    ];
    const { getByTestId } = renderWithTheme(
      <StrengthsFirst analysisType="personal-color" bestColors={bestColors} />,
    );
    expect(getByTestId('strengths-first')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <StrengthsFirst analysisType="skin" />,
      true,
    );
    expect(getByTestId('strengths-first')).toBeTruthy();
  });
});
