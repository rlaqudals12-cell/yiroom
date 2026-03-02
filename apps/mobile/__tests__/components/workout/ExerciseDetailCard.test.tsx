/**
 * ExerciseDetailCard 컴포넌트 테스트
 *
 * 개별 운동의 세부 정보(이름, 세트x반복, 중량, MET, 시간, 칼로리) 표시 검증.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ExerciseDetailCard } from '../../../components/workout/ExerciseDetailCard';

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
  name: '스쿼트',
  sets: 3,
  reps: 12,
  met: 5.0,
  duration: 30,
  caloriesBurned: 180,
};

describe('ExerciseDetailCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ExerciseDetailCard {...defaultProps} />);
    expect(getByTestId('exercise-detail-card')).toBeTruthy();
  });

  it('운동 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseDetailCard {...defaultProps} />);
    expect(getByText('스쿼트')).toBeTruthy();
  });

  it('세트x반복을 표시한다 (중량 없음)', () => {
    const { getByText } = renderWithTheme(<ExerciseDetailCard {...defaultProps} />);
    expect(getByText('3세트 x 12회')).toBeTruthy();
  });

  it('중량 포함 세트x반복을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <ExerciseDetailCard {...defaultProps} weight={60} />,
    );
    expect(getByText('3세트 x 12회 (60kg)')).toBeTruthy();
  });

  it('MET 배지를 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseDetailCard {...defaultProps} />);
    expect(getByText('MET 5')).toBeTruthy();
  });

  it('시간과 칼로리를 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseDetailCard {...defaultProps} />);
    expect(getByText('30분')).toBeTruthy();
    expect(getByText('180kcal')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <ExerciseDetailCard {...defaultProps} />,
      true,
    );
    expect(getByTestId('exercise-detail-card')).toBeTruthy();
  });
});
