/**
 * MealSuggestionCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { MealSuggestionCard } from '../../../components/nutrition/MealSuggestionCard';

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
  name: '닭가슴살 샐러드',
  reason: '단백질 보충이 필요해요',
  calories: 350,
  mealType: 'lunch' as const,
};

describe('MealSuggestionCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MealSuggestionCard {...defaultProps} />,
    );
    expect(getByTestId('meal-suggestion-card')).toBeTruthy();
  });

  it('추천 식사명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MealSuggestionCard {...defaultProps} />,
    );
    expect(getByText('닭가슴살 샐러드')).toBeTruthy();
  });

  it('추천 이유를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MealSuggestionCard {...defaultProps} />,
    );
    expect(getByText('단백질 보충이 필요해요')).toBeTruthy();
  });

  it('칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MealSuggestionCard {...defaultProps} />,
    );
    expect(getByText('350kcal')).toBeTruthy();
  });

  it('매칭률을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MealSuggestionCard {...defaultProps} matchRate={88} />,
    );
    expect(getByText('88%')).toBeTruthy();
  });

  it('태그를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MealSuggestionCard {...defaultProps} tags={['고단백', '저칼로리']} />,
    );
    expect(getByText('고단백')).toBeTruthy();
    expect(getByText('저칼로리')).toBeTruthy();
  });

  it('선택 버튼이 동작한다', () => {
    const onSelect = jest.fn();
    const { getByText } = renderWithTheme(
      <MealSuggestionCard {...defaultProps} onSelect={onSelect} />,
    );
    expect(getByText('이 식사 선택')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <MealSuggestionCard {...defaultProps} matchRate={88} />,
    );
    expect(getByLabelText('추천: 닭가슴살 샐러드, 350kcal, 매칭 88%')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MealSuggestionCard {...defaultProps} />, true,
    );
    expect(getByTestId('meal-suggestion-card')).toBeTruthy();
  });
});
