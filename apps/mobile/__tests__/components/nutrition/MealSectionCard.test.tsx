/**
 * MealSectionCard 컴포넌트 테스트
 *
 * 식사 유형별 음식 목록, 합계 칼로리, 추가 버튼, 빈 상태 표시 검증.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { MealSectionCard } from '../../../components/nutrition/MealSectionCard';

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

const sampleFoods = [
  { name: '현미밥', calories: 320, time: '08:00' },
  { name: '된장찌개', calories: 150 },
  { name: '계란후라이', calories: 90, time: '08:05' },
];

const defaultProps = {
  mealType: 'breakfast' as const,
  foods: sampleFoods,
  totalCalories: 560,
};

describe('MealSectionCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<MealSectionCard {...defaultProps} />);
    expect(getByTestId('meal-section-card')).toBeTruthy();
  });

  it('식사 유형 라벨을 표시한다', () => {
    const { getByText } = renderWithTheme(<MealSectionCard {...defaultProps} />);
    expect(getByText('아침')).toBeTruthy();
  });

  it('음식 목록을 표시한다', () => {
    const { getByText } = renderWithTheme(<MealSectionCard {...defaultProps} />);
    expect(getByText('현미밥')).toBeTruthy();
    expect(getByText('된장찌개')).toBeTruthy();
    expect(getByText('계란후라이')).toBeTruthy();
  });

  it('총 칼로리를 표시한다', () => {
    const { getAllByText } = renderWithTheme(<MealSectionCard {...defaultProps} />);
    // 헤더와 합계 행 모두에 totalCalories가 표시됨
    const calTexts = getAllByText('560kcal');
    expect(calTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('빈 상태를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MealSectionCard mealType="lunch" foods={[]} totalCalories={0} />,
    );
    expect(getByText('기록된 음식이 없어요')).toBeTruthy();
  });

  it('추가 버튼이 표시된다', () => {
    const onAddPress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <MealSectionCard {...defaultProps} onAddPress={onAddPress} />,
    );
    expect(getByLabelText('아침 음식 추가')).toBeTruthy();
  });

  it('추가 버튼 클릭시 콜백을 호출한다', () => {
    const onAddPress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <MealSectionCard {...defaultProps} onAddPress={onAddPress} />,
    );
    fireEvent.press(getByLabelText('아침 음식 추가'));
    expect(onAddPress).toHaveBeenCalledTimes(1);
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MealSectionCard {...defaultProps} />,
      true,
    );
    expect(getByTestId('meal-section-card')).toBeTruthy();
  });
});
