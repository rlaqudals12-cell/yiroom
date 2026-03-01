/**
 * LeaderboardCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { LeaderboardCard } from '../../../components/gamification/LeaderboardCard';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors, brand, module: moduleColors,
    status: statusColors, grade: gradeColors, nutrient: nutrientColors,
    score: scoreColors, trust: trustColors, spacing, radii, shadows, typography,
    isDark, colorScheme: isDark ? 'dark' : 'light', themeMode: 'system', setThemeMode: jest.fn(),
  };
}
function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(<ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>);
}

describe('LeaderboardCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <LeaderboardCard rank={1} userName="김민수" score={950} />,
    );
    expect(getByTestId('leaderboard-card')).toBeTruthy();
  });

  it('사용자 이름과 점수를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LeaderboardCard rank={1} userName="김민수" score={950} />,
    );
    expect(getByText('김민수')).toBeTruthy();
    expect(getByText('950')).toBeTruthy();
  });

  it('1위에 금메달 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LeaderboardCard rank={1} userName="김민수" score={950} />,
    );
    expect(getByText('🥇')).toBeTruthy();
  });

  it('2위에 은메달 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LeaderboardCard rank={2} userName="이지은" score={900} />,
    );
    expect(getByText('🥈')).toBeTruthy();
  });

  it('3위에 동메달 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LeaderboardCard rank={3} userName="박서준" score={850} />,
    );
    expect(getByText('🥉')).toBeTruthy();
  });

  it('4위 이후에는 숫자를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LeaderboardCard rank={4} userName="정하늘" score={800} />,
    );
    expect(getByText('4')).toBeTruthy();
  });

  it('onPress 콜백이 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <LeaderboardCard rank={1} userName="김민수" score={950} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('leaderboard-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <LeaderboardCard rank={1} userName="김민수" score={950} />,
    );
    expect(getByLabelText('1위 김민수, 950점')).toBeTruthy();
  });

  it('현재 사용자 접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(
      <LeaderboardCard rank={5} userName="나" score={700} isCurrentUser />,
    );
    expect(getByLabelText('5위 나, 700점, 내 순위')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <LeaderboardCard rank={1} userName="김민수" score={950} />,
      true,
    );
    expect(getByTestId('leaderboard-card')).toBeTruthy();
  });
});
