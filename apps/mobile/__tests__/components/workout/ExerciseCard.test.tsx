/**
 * ExerciseCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ExerciseCard } from '../../../components/workout/ExerciseCard';

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
  id: 'ex-1',
  name: '스쿼트',
  difficulty: 'intermediate' as const,
  muscleGroups: ['legs' as const, 'core' as const],
  met: 5.0,
};

describe('ExerciseCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ExerciseCard {...defaultProps} />);
    expect(getByTestId('exercise-card')).toBeTruthy();
  });

  it('운동 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseCard {...defaultProps} />);
    expect(getByText('스쿼트')).toBeTruthy();
  });

  it('영어 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseCard {...defaultProps} nameEn="Squat" />);
    expect(getByText('Squat')).toBeTruthy();
  });

  it('난이도 뱃지를 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseCard {...defaultProps} />);
    expect(getByText('중급')).toBeTruthy();
  });

  it('근육 그룹을 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseCard {...defaultProps} />);
    expect(getByText('하체')).toBeTruthy();
    expect(getByText('코어')).toBeTruthy();
  });

  it('MET 값을 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseCard {...defaultProps} />);
    expect(getByText('MET 5')).toBeTruthy();
  });

  it('칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseCard {...defaultProps} caloriesPerMinute={8} />);
    expect(getByText('8 kcal/분')).toBeTruthy();
  });

  it('소요시간을 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseCard {...defaultProps} durationMinutes={30} />);
    expect(getByText('30분')).toBeTruthy();
  });

  it('compact 모드로 렌더링된다', () => {
    const { getByTestId, getByText } = renderWithTheme(<ExerciseCard {...defaultProps} compact />);
    expect(getByTestId('exercise-card')).toBeTruthy();
    expect(getByText('스쿼트')).toBeTruthy();
    expect(getByText('중급')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(<ExerciseCard {...defaultProps} onPress={onPress} />);
    fireEvent.press(getByTestId('exercise-card'));
    expect(onPress).toHaveBeenCalledWith('ex-1');
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<ExerciseCard {...defaultProps} />);
    expect(getByLabelText('스쿼트, 중급, MET 5')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ExerciseCard {...defaultProps} />, true);
    expect(getByTestId('exercise-card')).toBeTruthy();
  });
});
