/**
 * SetTracker 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { SetTracker, type SetRecord } from '../../../components/workout/SetTracker';

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

const mockSets: SetRecord[] = [
  { setNumber: 1, targetReps: 10, targetWeight: 60, status: 'completed', actualReps: 10, actualWeight: 60 },
  { setNumber: 2, targetReps: 10, targetWeight: 60, status: 'completed', actualReps: 8, actualWeight: 60 },
  { setNumber: 3, targetReps: 10, targetWeight: 60, status: 'current' },
  { setNumber: 4, targetReps: 10, targetWeight: 60, status: 'pending' },
];

describe('SetTracker', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} />,
    );
    expect(getByTestId('set-tracker')).toBeTruthy();
  });

  it('운동 이름을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} />,
    );
    expect(getByText('벤치프레스')).toBeTruthy();
  });

  it('완료 수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} />,
    );
    expect(getByText('2/4')).toBeTruthy();
  });

  it('세트 번호를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} />,
    );
    expect(getByText('1세트')).toBeTruthy();
    expect(getByText('4세트')).toBeTruthy();
  });

  it('목표를 표시한다', () => {
    const { getAllByText } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} />,
    );
    expect(getAllByText('목표: 10회 × 60kg').length).toBeGreaterThan(0);
  });

  it('실제 기록을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} />,
    );
    expect(getByText('10회 × 60kg')).toBeTruthy();
    expect(getByText('8회 × 60kg')).toBeTruthy();
  });

  it('현재 세트에서 완료/스킵 버튼을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} />,
    );
    expect(getByText('완료')).toBeTruthy();
    expect(getByText('스킵')).toBeTruthy();
  });

  it('onSetComplete 콜백이 호출된다', () => {
    const onSetComplete = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} onSetComplete={onSetComplete} />,
    );
    fireEvent.press(getByLabelText('3세트 완료'));
    expect(onSetComplete).toHaveBeenCalledWith(3, 10, 60);
  });

  it('onSetSkip 콜백이 호출된다', () => {
    const onSetSkip = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} onSetSkip={onSetSkip} />,
    );
    fireEvent.press(getByLabelText('3세트 건너뛰기'));
    expect(onSetSkip).toHaveBeenCalledWith(3);
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} />,
    );
    expect(getByLabelText('벤치프레스 세트 추적, 2/4 완료')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <SetTracker exerciseName="벤치프레스" sets={mockSets} />, true,
    );
    expect(getByTestId('set-tracker')).toBeTruthy();
  });
});
