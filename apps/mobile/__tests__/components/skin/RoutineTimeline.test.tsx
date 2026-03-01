/**
 * RoutineTimeline 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { RoutineTimeline, type TimelineEntry } from '../../../components/skin/RoutineTimeline';

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

const mockEntries: TimelineEntry[] = [
  { id: '1', time: '07:00', label: '클렌징', routineTime: 'morning', completed: true },
  { id: '2', time: '07:05', label: '토너', routineTime: 'morning', completed: true },
  { id: '3', time: '22:00', label: '클렌징', routineTime: 'evening', completed: false },
];

describe('RoutineTimeline', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RoutineTimeline entries={mockEntries} />,
    );
    expect(getByTestId('routine-timeline')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineTimeline entries={mockEntries} />,
    );
    expect(getByText('오늘의 루틴')).toBeTruthy();
  });

  it('시간을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <RoutineTimeline entries={mockEntries} />,
    );
    expect(getByText('07:00')).toBeTruthy();
    expect(getByText('22:00')).toBeTruthy();
  });

  it('항목 접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <RoutineTimeline entries={mockEntries} />,
    );
    expect(getByLabelText('07:00 클렌징, 완료')).toBeTruthy();
    expect(getByLabelText('22:00 클렌징')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <RoutineTimeline entries={mockEntries} />,
    );
    expect(getByLabelText('루틴 타임라인, 3개 항목')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <RoutineTimeline entries={mockEntries} />, true,
    );
    expect(getByTestId('routine-timeline')).toBeTruthy();
  });
});
