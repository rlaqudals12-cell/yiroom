/**
 * WorkoutTypeCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { WorkoutTypeCard } from '../../../components/workout/WorkoutTypeCard';

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

describe('WorkoutTypeCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WorkoutTypeCard type="strength" />);
    expect(getByTestId('workout-type-card')).toBeTruthy();
  });

  it('유형 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutTypeCard type="strength" />);
    expect(getByText('근력')).toBeTruthy();
    expect(getByText('근육 강화 운동')).toBeTruthy();
  });

  it('cardio 유형을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutTypeCard type="cardio" />);
    expect(getByText('유산소')).toBeTruthy();
  });

  it('flexibility 유형을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutTypeCard type="flexibility" />);
    expect(getByText('유연성')).toBeTruthy();
  });

  it('hiit 유형을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutTypeCard type="hiit" />);
    expect(getByText('HIIT')).toBeTruthy();
  });

  it('count를 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutTypeCard type="strength" count={12} />);
    expect(getByText('12개')).toBeTruthy();
  });

  it('선택 상태에서 접근성을 반영한다', () => {
    const { getByLabelText } = renderWithTheme(<WorkoutTypeCard type="strength" isSelected />);
    expect(getByLabelText('근력 운동 유형, 선택됨')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(<WorkoutTypeCard type="cardio" onPress={onPress} />);
    fireEvent.press(getByTestId('workout-type-card'));
    expect(onPress).toHaveBeenCalledWith('cardio');
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WorkoutTypeCard type="balance" />, true);
    expect(getByTestId('workout-type-card')).toBeTruthy();
  });
});
