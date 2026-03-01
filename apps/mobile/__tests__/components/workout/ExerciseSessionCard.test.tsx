/**
 * ExerciseSessionCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { ExerciseSessionCard } from '../../../components/workout/ExerciseSessionCard';

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
  name: '벤치프레스',
  sets: 4,
  reps: 10,
  weight: 60,
  status: 'pending' as const,
};

describe('ExerciseSessionCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ExerciseSessionCard {...defaultProps} />);
    expect(getByTestId('exercise-session-card')).toBeTruthy();
  });

  it('운동 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseSessionCard {...defaultProps} />);
    expect(getByText('벤치프레스')).toBeTruthy();
  });

  it('세트/반복 정보를 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseSessionCard {...defaultProps} />);
    expect(getByText('4세트 × 10회 · 60kg')).toBeTruthy();
  });

  it('무게 없이 렌더링된다', () => {
    const { getByText } = renderWithTheme(
      <ExerciseSessionCard {...defaultProps} weight={undefined} />,
    );
    expect(getByText('4세트 × 10회')).toBeTruthy();
  });

  it('pending 상태에서 시작/건너뛰기 버튼을 표시한다', () => {
    const { getByText } = renderWithTheme(<ExerciseSessionCard {...defaultProps} />);
    expect(getByText('시작')).toBeTruthy();
    expect(getByText('건너뛰기')).toBeTruthy();
  });

  it('in_progress 상태에서 진행 바를 표시한다', () => {
    const { getByTestId, getByText } = renderWithTheme(
      <ExerciseSessionCard {...defaultProps} status="in_progress" currentSet={2} />,
    );
    expect(getByTestId('exercise-session-card')).toBeTruthy();
    expect(getByText('2/4')).toBeTruthy();
  });

  it('completed 상태를 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ExerciseSessionCard {...defaultProps} status="completed" />,
    );
    expect(getByLabelText('벤치프레스, 완료, 4세트 10회')).toBeTruthy();
  });

  it('skipped 상태를 표시한다', () => {
    const { getByLabelText } = renderWithTheme(
      <ExerciseSessionCard {...defaultProps} status="skipped" />,
    );
    expect(getByLabelText('벤치프레스, 건너뜀, 4세트 10회')).toBeTruthy();
  });

  it('onStart 콜백이 호출된다', () => {
    const onStart = jest.fn();
    const { getByText } = renderWithTheme(
      <ExerciseSessionCard {...defaultProps} onStart={onStart} />,
    );
    fireEvent.press(getByText('시작'));
    expect(onStart).toHaveBeenCalled();
  });

  it('onSkip 콜백이 호출된다', () => {
    const onSkip = jest.fn();
    const { getByText } = renderWithTheme(
      <ExerciseSessionCard {...defaultProps} onSkip={onSkip} />,
    );
    fireEvent.press(getByText('건너뛰기'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ExerciseSessionCard {...defaultProps} />, true);
    expect(getByTestId('exercise-session-card')).toBeTruthy();
  });
});
