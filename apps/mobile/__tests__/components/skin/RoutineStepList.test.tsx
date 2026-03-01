/**
 * RoutineStepList 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { RoutineStepList, type RoutineStep } from '../../../components/skin/RoutineStepList';

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

const mockSteps: RoutineStep[] = [
  { id: '1', order: 1, name: '클렌징', product: '약산성 폼클렌저', completed: true, durationSeconds: 60 },
  { id: '2', order: 2, name: '토너', product: '히알루론산 토너', completed: false },
  { id: '3', order: 3, name: '세럼', completed: false },
];

describe('RoutineStepList', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RoutineStepList steps={mockSteps} />,
    );
    expect(getByTestId('routine-step-list')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineStepList steps={mockSteps} />,
    );
    expect(getByText('루틴 단계')).toBeTruthy();
  });

  it('단계 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineStepList steps={mockSteps} />,
    );
    expect(getByText('1. 클렌징')).toBeTruthy();
    expect(getByText('2. 토너')).toBeTruthy();
    expect(getByText('3. 세럼')).toBeTruthy();
  });

  it('제품명을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineStepList steps={mockSteps} />,
    );
    expect(getByText('약산성 폼클렌저')).toBeTruthy();
    expect(getByText('히알루론산 토너')).toBeTruthy();
  });

  it('시간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineStepList steps={mockSteps} />,
    );
    expect(getByText('60초')).toBeTruthy();
  });

  it('토글이 동작한다', () => {
    const onToggle = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <RoutineStepList steps={mockSteps} onToggle={onToggle} />,
    );
    fireEvent.press(getByLabelText('2단계 토너'));
    expect(onToggle).toHaveBeenCalledWith('2');
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <RoutineStepList steps={mockSteps} />,
    );
    expect(getByLabelText('1단계 클렌징, 완료')).toBeTruthy();
    expect(getByLabelText('루틴 단계 3개')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RoutineStepList steps={mockSteps} />, true,
    );
    expect(getByTestId('routine-step-list')).toBeTruthy();
  });
});
