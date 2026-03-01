/**
 * RoutineCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { RoutineCard } from '../../../components/skin/RoutineCard';

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

describe('RoutineCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RoutineCard routineTime="morning" totalSteps={5} completedSteps={3} />,
    );
    expect(getByTestId('routine-card')).toBeTruthy();
  });

  it('모닝 루틴 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineCard routineTime="morning" totalSteps={5} completedSteps={3} />,
    );
    expect(getByText('모닝 루틴')).toBeTruthy();
  });

  it('나이트 루틴 제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineCard routineTime="evening" totalSteps={4} completedSteps={4} />,
    );
    expect(getByText('나이트 루틴')).toBeTruthy();
  });

  it('퍼센트를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineCard routineTime="morning" totalSteps={5} completedSteps={3} />,
    );
    expect(getByText('60%')).toBeTruthy();
  });

  it('완료 시 완료 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineCard routineTime="morning" totalSteps={5} completedSteps={5} />,
    );
    expect(getByText('완료!')).toBeTruthy();
  });

  it('단계 정보를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineCard routineTime="morning" totalSteps={5} completedSteps={3} />,
    );
    expect(getByText('3/5단계')).toBeTruthy();
  });

  it('소요 시간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineCard routineTime="morning" totalSteps={5} completedSteps={3} estimatedMinutes={10} />,
    );
    expect(getByText('약 10분')).toBeTruthy();
  });

  it('클릭이 동작한다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <RoutineCard routineTime="morning" totalSteps={5} completedSteps={3} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('routine-card'));
    expect(onPress).toHaveBeenCalled();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <RoutineCard routineTime="morning" totalSteps={5} completedSteps={3} />,
    );
    expect(getByLabelText('모닝 루틴, 3/5단계 완료')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RoutineCard routineTime="evening" totalSteps={4} completedSteps={2} />, true,
    );
    expect(getByTestId('routine-card')).toBeTruthy();
  });
});
