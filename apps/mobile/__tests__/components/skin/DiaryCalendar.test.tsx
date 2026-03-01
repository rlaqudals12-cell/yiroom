/**
 * DiaryCalendar 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { DiaryCalendar, type DayEntry } from '../../../components/skin/DiaryCalendar';

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

const mockEntries: DayEntry[] = [
  { date: 1, condition: 'good' },
  { date: 5, condition: 'normal' },
  { date: 10, condition: 'bad' },
];

describe('DiaryCalendar', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DiaryCalendar year={2026} month={3} entries={mockEntries} />,
    );
    expect(getByTestId('diary-calendar')).toBeTruthy();
  });

  it('년월을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DiaryCalendar year={2026} month={3} entries={mockEntries} />,
    );
    expect(getByText('2026년 3월')).toBeTruthy();
  });

  it('요일 헤더를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DiaryCalendar year={2026} month={3} entries={mockEntries} />,
    );
    expect(getByText('월')).toBeTruthy();
    expect(getByText('일')).toBeTruthy();
  });

  it('날짜를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <DiaryCalendar year={2026} month={3} entries={mockEntries} />,
    );
    expect(getByText('1')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
    expect(getByText('31')).toBeTruthy();
  });

  it('날짜 클릭이 동작한다', () => {
    const onDatePress = jest.fn();
    const { getByText } = renderWithTheme(
      <DiaryCalendar year={2026} month={3} entries={mockEntries} onDatePress={onDatePress} />,
    );
    fireEvent.press(getByText('5'));
    expect(onDatePress).toHaveBeenCalledWith(5);
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <DiaryCalendar year={2026} month={3} entries={mockEntries} />,
    );
    expect(getByLabelText('2026년 3월 피부 일기, 3일 기록')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <DiaryCalendar year={2026} month={3} entries={mockEntries} />, true,
    );
    expect(getByTestId('diary-calendar')).toBeTruthy();
  });
});
