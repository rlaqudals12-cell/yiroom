/**
 * WeeklyPlanCard 컴포넌트 테스트
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { WeeklyPlanCard, type DayPlan } from '../../../components/workout/WeeklyPlanCard';

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

const mockDays: DayPlan[] = [
  { day: '월', isRestDay: false, exerciseCount: 4, focusArea: '가슴', totalMinutes: 45 },
  { day: '화', isRestDay: false, exerciseCount: 3, focusArea: '등' },
  { day: '수', isRestDay: true, exerciseCount: 0 },
  { day: '목', isRestDay: false, exerciseCount: 5, focusArea: '하체' },
  { day: '금', isRestDay: false, exerciseCount: 3, focusArea: '어깨' },
  { day: '토', isRestDay: true, exerciseCount: 0 },
  { day: '일', isRestDay: true, exerciseCount: 0 },
];

describe('WeeklyPlanCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WeeklyPlanCard weekLabel="1주차" days={mockDays} />,
    );
    expect(getByTestId('weekly-plan-card')).toBeTruthy();
  });

  it('주차 레이블을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WeeklyPlanCard weekLabel="1주차" days={mockDays} />,
    );
    expect(getByText('1주차')).toBeTruthy();
  });

  it('완료일 수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WeeklyPlanCard weekLabel="1주차" days={mockDays} completedDays={3} />,
    );
    expect(getByText('3/7일')).toBeTruthy();
  });

  it('요일을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WeeklyPlanCard weekLabel="1주차" days={mockDays} />,
    );
    expect(getByText('월')).toBeTruthy();
    expect(getByText('일')).toBeTruthy();
  });

  it('휴식일을 표시한다', () => {
    const { getAllByText } = renderWithTheme(
      <WeeklyPlanCard weekLabel="1주차" days={mockDays} />,
    );
    expect(getAllByText('휴식').length).toBe(3);
  });

  it('운동 수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <WeeklyPlanCard weekLabel="1주차" days={mockDays} />,
    );
    expect(getByText('4')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  it('onDayPress 콜백이 호출된다', () => {
    const onDayPress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <WeeklyPlanCard weekLabel="1주차" days={mockDays} onDayPress={onDayPress} />,
    );
    fireEvent.press(getByLabelText('월, 4개 운동'));
    expect(onDayPress).toHaveBeenCalledWith('월');
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <WeeklyPlanCard weekLabel="1주차" days={mockDays} completedDays={2} />,
    );
    expect(getByLabelText('1주차 운동 계획, 2일 완료')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <WeeklyPlanCard weekLabel="1주차" days={mockDays} />, true,
    );
    expect(getByTestId('weekly-plan-card')).toBeTruthy();
  });
});
