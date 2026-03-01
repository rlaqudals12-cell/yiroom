/**
 * FoodResultCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FoodResultCard } from '../../../components/nutrition/FoodResultCard';

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
  name: '비빔밥',
  confidence: 92,
  calories: 550,
  servingSize: '1인분 (350g)',
  carbs: 75,
  protein: 20,
  fat: 15,
};

describe('FoodResultCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FoodResultCard {...defaultProps} />);
    expect(getByTestId('food-result-card')).toBeTruthy();
  });

  it('음식 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<FoodResultCard {...defaultProps} />);
    expect(getByText('비빔밥')).toBeTruthy();
  });

  it('신뢰도를 표시한다', () => {
    const { getByText } = renderWithTheme(<FoodResultCard {...defaultProps} />);
    expect(getByText('92%')).toBeTruthy();
  });

  it('칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(<FoodResultCard {...defaultProps} />);
    expect(getByText('550')).toBeTruthy();
  });

  it('제공량을 표시한다', () => {
    const { getByText } = renderWithTheme(<FoodResultCard {...defaultProps} />);
    expect(getByText('1인분 (350g)')).toBeTruthy();
  });

  it('건강 평가를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <FoodResultCard {...defaultProps} healthRating="good" />,
    );
    expect(getByText('건강해요')).toBeTruthy();
  });

  it('주의 평가를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <FoodResultCard {...defaultProps} healthRating="caution" />,
    );
    expect(getByText('주의하세요')).toBeTruthy();
  });

  it('메모를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <FoodResultCard {...defaultProps} note="매운 양념은 위에 부담이 될 수 있어요" />,
    );
    expect(getByText('매운 양념은 위에 부담이 될 수 있어요')).toBeTruthy();
  });

  it('추가 버튼이 동작한다', () => {
    const onAdd = jest.fn();
    const { getByText } = renderWithTheme(
      <FoodResultCard {...defaultProps} onAdd={onAdd} />,
    );
    fireEvent.press(getByText('식단에 추가'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<FoodResultCard {...defaultProps} />);
    expect(getByLabelText('비빔밥 분석 결과, 550kcal, 신뢰도 92%')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FoodResultCard {...defaultProps} />, true);
    expect(getByTestId('food-result-card')).toBeTruthy();
  });
});
