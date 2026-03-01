/**
 * MealSection 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { MealSection, type MealItem } from '../../../components/nutrition/MealSection';

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

const mockItems: MealItem[] = [
  { id: '1', name: '현미밥', calories: 300, amount: '1공기' },
  { id: '2', name: '된장찌개', calories: 150 },
];

describe('MealSection', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MealSection type="lunch" items={mockItems} />,
    );
    expect(getByTestId('meal-section')).toBeTruthy();
  });

  it('식사 구간 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MealSection type="breakfast" items={[]} />,
    );
    expect(getByText('아침')).toBeTruthy();
  });

  it('총 칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MealSection type="lunch" items={mockItems} />,
    );
    expect(getByText('450kcal')).toBeTruthy();
  });

  it('음식 목록을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MealSection type="lunch" items={mockItems} />,
    );
    expect(getByText('현미밥')).toBeTruthy();
    expect(getByText('된장찌개')).toBeTruthy();
  });

  it('빈 상태를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <MealSection type="dinner" items={[]} />,
    );
    expect(getByText('기록된 음식이 없어요')).toBeTruthy();
  });

  it('추가 버튼을 표시한다', () => {
    const onAdd = jest.fn();
    const { getByText } = renderWithTheme(
      <MealSection type="lunch" items={mockItems} onAddPress={onAdd} />,
    );
    expect(getByText('+ 추가')).toBeTruthy();
  });

  it('추가 버튼 클릭이 동작한다', () => {
    const onAdd = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <MealSection type="lunch" items={mockItems} onAddPress={onAdd} />,
    );
    fireEvent.press(getByLabelText('점심 음식 추가'));
    expect(onAdd).toHaveBeenCalled();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <MealSection type="lunch" items={mockItems} />,
    );
    expect(getByLabelText('점심 2개 음식, 450kcal')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <MealSection type="lunch" items={mockItems} />, true,
    );
    expect(getByTestId('meal-section')).toBeTruthy();
  });
});
