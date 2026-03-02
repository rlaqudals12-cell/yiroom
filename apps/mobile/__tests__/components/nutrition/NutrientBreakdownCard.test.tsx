/**
 * NutrientBreakdownCard 컴포넌트 테스트
 *
 * 탄수화물/단백질/지방/식이섬유의 현재 섭취량 대비 목표 프로그레스 표시 검증.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { NutrientBreakdownCard } from '../../../components/nutrition/NutrientBreakdownCard';

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

const defaultProps = {
  protein: { current: 60, target: 120 },
  carbs: { current: 200, target: 300 },
  fat: { current: 50, target: 70 },
};

describe('NutrientBreakdownCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<NutrientBreakdownCard {...defaultProps} />);
    expect(getByTestId('nutrient-breakdown-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(<NutrientBreakdownCard {...defaultProps} />);
    expect(getByText('영양소 분석')).toBeTruthy();
  });

  it('영양소 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(<NutrientBreakdownCard {...defaultProps} />);
    expect(getByText('탄수화물')).toBeTruthy();
    expect(getByText('단백질')).toBeTruthy();
    expect(getByText('지방')).toBeTruthy();
  });

  it('총 칼로리를 표시한다', () => {
    // 총 칼로리: carbs(200)*4 + protein(60)*4 + fat(50)*9 = 800+240+450 = 1490
    // 목표 칼로리: carbs(300)*4 + protein(120)*4 + fat(70)*9 = 1200+480+630 = 2310
    const { getByText } = renderWithTheme(<NutrientBreakdownCard {...defaultProps} />);
    expect(getByText('1490 / 2310kcal')).toBeTruthy();
  });

  it('식이섬유를 선택적으로 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NutrientBreakdownCard
        {...defaultProps}
        fiber={{ current: 15, target: 25 }}
      />,
    );
    expect(getByText('식이섬유')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <NutrientBreakdownCard {...defaultProps} />,
    );
    expect(
      getByLabelText('영양소 분석: 탄수화물 200g, 단백질 60g, 지방 50g'),
    ).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NutrientBreakdownCard {...defaultProps} />,
      true,
    );
    expect(getByTestId('nutrient-breakdown-card')).toBeTruthy();
  });
});
