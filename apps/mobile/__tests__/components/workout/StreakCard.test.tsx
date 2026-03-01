/**
 * StreakCard 컴포넌트 테스트
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { StreakCard } from '../../../components/workout/StreakCard';

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
  currentStreak: 15,
  longestStreak: 30,
  weeklyGoal: 5,
  weeklyCompleted: 3,
  recentDays: [true, true, false, true, false, false, false],
};

describe('StreakCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<StreakCard {...defaultProps} />);
    expect(getByTestId('streak-card')).toBeTruthy();
  });

  it('현재 스트릭을 표시한다', () => {
    const { getByText } = renderWithTheme(<StreakCard {...defaultProps} />);
    expect(getByText('15일')).toBeTruthy();
  });

  it('최고 기록을 표시한다', () => {
    const { getByText } = renderWithTheme(<StreakCard {...defaultProps} />);
    expect(getByText('30일')).toBeTruthy();
  });

  it('주간 진행을 표시한다', () => {
    const { getByText } = renderWithTheme(<StreakCard {...defaultProps} />);
    expect(getByText('이번 주 3/5')).toBeTruthy();
  });

  it('요일 도트를 표시한다', () => {
    const { getByText } = renderWithTheme(<StreakCard {...defaultProps} />);
    expect(getByText('월')).toBeTruthy();
    expect(getByText('일')).toBeTruthy();
  });

  it('recentDays 없이 렌더링된다', () => {
    const { getByTestId, queryByText } = renderWithTheme(
      <StreakCard {...defaultProps} recentDays={[]} />,
    );
    expect(getByTestId('streak-card')).toBeTruthy();
    // 빈 배열이면 도트 표시 안 됨
    expect(queryByText('월')).toBeNull();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<StreakCard {...defaultProps} />);
    expect(getByLabelText('연속 15일, 이번 주 3/5일')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<StreakCard {...defaultProps} />, true);
    expect(getByTestId('streak-card')).toBeTruthy();
  });
});
