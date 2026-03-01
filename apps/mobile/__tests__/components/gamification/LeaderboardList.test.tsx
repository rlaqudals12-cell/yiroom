/**
 * LeaderboardList 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { LeaderboardList } from '../../../components/gamification/LeaderboardList';

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

const mockEntries = [
  { rank: 1, userName: '김민수', score: 950 },
  { rank: 2, userName: '이지은', score: 900 },
  { rank: 3, userName: '박서준', score: 850 },
];

describe('LeaderboardList', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<LeaderboardList entries={mockEntries} />);
    expect(getByTestId('leaderboard-list')).toBeTruthy();
  });

  it('타이틀을 표시한다', () => {
    const { getByText } = renderWithTheme(<LeaderboardList entries={mockEntries} />);
    expect(getByText('리더보드')).toBeTruthy();
  });

  it('빈 상태를 표시한다', () => {
    const { getByText } = renderWithTheme(<LeaderboardList entries={[]} />);
    expect(getByText('리더보드가 비어있습니다')).toBeTruthy();
  });

  it('커스텀 빈 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <LeaderboardList entries={[]} emptyMessage="아직 참여자가 없어요" />,
    );
    expect(getByText('아직 참여자가 없어요')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<LeaderboardList entries={mockEntries} />);
    expect(getByLabelText('리더보드 3명')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<LeaderboardList entries={mockEntries} />, true);
    expect(getByTestId('leaderboard-list')).toBeTruthy();
  });
});
