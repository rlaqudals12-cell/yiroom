/**
 * FoodCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FoodCard } from '../../../components/nutrition/FoodCard';

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
  id: '1',
  name: '현미밥',
  calories: 300,
  servingSize: '1공기 (210g)',
  carbs: 65,
  protein: 6,
  fat: 2,
};

describe('FoodCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FoodCard {...defaultProps} />);
    expect(getByTestId('food-card')).toBeTruthy();
  });

  it('음식 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<FoodCard {...defaultProps} />);
    expect(getByText('현미밥')).toBeTruthy();
  });

  it('칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(<FoodCard {...defaultProps} />);
    expect(getByText('300')).toBeTruthy();
  });

  it('제공량을 표시한다', () => {
    const { getByText } = renderWithTheme(<FoodCard {...defaultProps} />);
    expect(getByText('1회 제공량: 1공기 (210g)')).toBeTruthy();
  });

  it('영양소를 표시한다', () => {
    const { getByText } = renderWithTheme(<FoodCard {...defaultProps} />);
    expect(getByText('탄 65g')).toBeTruthy();
    expect(getByText('단 6g')).toBeTruthy();
    expect(getByText('지 2g')).toBeTruthy();
  });

  it('카테고리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <FoodCard {...defaultProps} category="곡물" />,
    );
    expect(getByText('곡물')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <FoodCard {...defaultProps} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('food-card'));
    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('컴팩트 모드로 렌더링된다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <FoodCard {...defaultProps} compact />,
    );
    expect(getByTestId('food-card')).toBeTruthy();
    expect(getByText('300kcal')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<FoodCard {...defaultProps} />);
    expect(getByLabelText('현미밥 300kcal, 1공기 (210g)')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FoodCard {...defaultProps} />, true);
    expect(getByTestId('food-card')).toBeTruthy();
  });
});
