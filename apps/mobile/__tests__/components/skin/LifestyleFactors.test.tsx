/**
 * LifestyleFactors 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { LifestyleFactors, type LifestyleFactor } from '../../../components/skin/LifestyleFactors';

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

const mockFactors: LifestyleFactor[] = [
  { id: 'sleep', label: '수면', emoji: '😴', value: 4 },
  { id: 'stress', label: '스트레스', emoji: '😰', value: 2 },
  { id: 'exercise', label: '운동', emoji: '🏃', value: 3 },
];

describe('LifestyleFactors', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <LifestyleFactors factors={mockFactors} />,
    );
    expect(getByTestId('lifestyle-factors')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LifestyleFactors factors={mockFactors} />,
    );
    expect(getByText('생활 요인')).toBeTruthy();
  });

  it('요인 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LifestyleFactors factors={mockFactors} />,
    );
    expect(getByText('수면')).toBeTruthy();
    expect(getByText('스트레스')).toBeTruthy();
    expect(getByText('운동')).toBeTruthy();
  });

  it('값 변경이 동작한다', () => {
    const onValueChange = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <LifestyleFactors factors={mockFactors} onValueChange={onValueChange} />,
    );
    fireEvent.press(getByLabelText('수면 5점'));
    expect(onValueChange).toHaveBeenCalledWith('sleep', 5);
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <LifestyleFactors factors={mockFactors} />,
    );
    expect(getByLabelText('수면: 4점')).toBeTruthy();
    expect(getByLabelText('스트레스: 2점')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <LifestyleFactors factors={mockFactors} />, true,
    );
    expect(getByTestId('lifestyle-factors')).toBeTruthy();
  });
});
