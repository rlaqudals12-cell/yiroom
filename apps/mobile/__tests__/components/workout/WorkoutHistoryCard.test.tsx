/**
 * WorkoutHistoryCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { WorkoutHistoryCard } from '../../../components/workout/WorkoutHistoryCard';

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
  date: '2026-02-28',
  workoutType: '상체 운동',
  duration: 45,
  caloriesBurned: 320,
  exerciseCount: 5,
};

describe('WorkoutHistoryCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WorkoutHistoryCard {...defaultProps} />);
    expect(getByTestId('workout-history-card')).toBeTruthy();
  });

  it('날짜를 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutHistoryCard {...defaultProps} />);
    expect(getByText('2026-02-28')).toBeTruthy();
  });

  it('운동 유형 뱃지를 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutHistoryCard {...defaultProps} />);
    expect(getByText('상체 운동')).toBeTruthy();
  });

  it('시간을 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutHistoryCard {...defaultProps} />);
    expect(getByText('45분')).toBeTruthy();
  });

  it('칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutHistoryCard {...defaultProps} />);
    expect(getByText('320kcal')).toBeTruthy();
  });

  it('운동 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<WorkoutHistoryCard {...defaultProps} />);
    expect(getByText('5개')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(<WorkoutHistoryCard {...defaultProps} onPress={onPress} />);
    fireEvent.press(getByTestId('workout-history-card'));
    expect(onPress).toHaveBeenCalled();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<WorkoutHistoryCard {...defaultProps} />);
    expect(getByLabelText('2026-02-28 상체 운동 운동, 45분, 320kcal')).toBeTruthy();
  });

  it('커스텀 testID를 사용한다', () => {
    const { getByTestId } = renderWithTheme(
      <WorkoutHistoryCard {...defaultProps} testID="custom-id" />,
    );
    expect(getByTestId('custom-id')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WorkoutHistoryCard {...defaultProps} />, true);
    expect(getByTestId('workout-history-card')).toBeTruthy();
  });
});
