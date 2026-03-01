/**
 * DayExerciseList 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { DayExerciseList, type DayExercise } from '../../../components/workout/DayExerciseList';

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

const mockExercises: DayExercise[] = [
  { id: '1', name: '벤치프레스', sets: 4, reps: 10, weight: 60, restSeconds: 90, isCompleted: true },
  { id: '2', name: '덤벨 플라이', sets: 3, reps: 12, weight: 14, restSeconds: 60 },
  { id: '3', name: '푸시업', sets: 3, reps: 20 },
];

describe('DayExerciseList', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DayExerciseList dayLabel="월요일" exercises={mockExercises} />,
    );
    expect(getByTestId('day-exercise-list')).toBeTruthy();
  });

  it('날짜 레이블을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DayExerciseList dayLabel="월요일" exercises={mockExercises} />,
    );
    expect(getByText('월요일')).toBeTruthy();
  });

  it('운동 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DayExerciseList dayLabel="월요일" exercises={mockExercises} />,
    );
    expect(getByText('벤치프레스')).toBeTruthy();
    expect(getByText('덤벨 플라이')).toBeTruthy();
    expect(getByText('푸시업')).toBeTruthy();
  });

  it('세트/반복 정보를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DayExerciseList dayLabel="월요일" exercises={mockExercises} />,
    );
    expect(getByText('4세트 × 10회 · 60kg')).toBeTruthy();
    expect(getByText('3세트 × 20회')).toBeTruthy();
  });

  it('완료 수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DayExerciseList dayLabel="월요일" exercises={mockExercises} />,
    );
    expect(getByText('1/3')).toBeTruthy();
  });

  it('총 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DayExerciseList dayLabel="월요일" exercises={mockExercises} totalMinutes={45} />,
    );
    expect(getByText('45분')).toBeTruthy();
  });

  it('휴식 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DayExerciseList dayLabel="월요일" exercises={mockExercises} />,
    );
    expect(getByText('휴식 90초')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <DayExerciseList dayLabel="월요일" exercises={mockExercises} />,
    );
    expect(getByLabelText('월요일 운동 3개, 1개 완료')).toBeTruthy();
  });

  it('빈 운동 목록에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DayExerciseList dayLabel="수요일" exercises={[]} />,
    );
    expect(getByTestId('day-exercise-list')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DayExerciseList dayLabel="월요일" exercises={mockExercises} />, true,
    );
    expect(getByTestId('day-exercise-list')).toBeTruthy();
  });
});
