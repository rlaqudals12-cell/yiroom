/**
 * FriendList 컴포넌트 테스트
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FriendList } from '../../../components/social/FriendList';

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

const mockFriends = [
  { id: '1', name: '김민수', isOnline: true },
  { id: '2', name: '이지은', isOnline: false },
  { id: '3', name: '박서준', isOnline: true },
];

describe('FriendList', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FriendList friends={mockFriends} />);
    expect(getByTestId('friend-list')).toBeTruthy();
  });

  it('친구 수를 표시한다', () => {
    const { getByText } = renderWithTheme(<FriendList friends={mockFriends} />);
    expect(getByText('친구 3명 · 온라인 2명')).toBeTruthy();
  });

  it('빈 상태를 표시한다', () => {
    const { getByText } = renderWithTheme(<FriendList friends={[]} />);
    expect(getByText('아직 친구가 없어요')).toBeTruthy();
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<FriendList friends={mockFriends} />);
    expect(getByLabelText('친구 3명, 온라인 2명')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FriendList friends={mockFriends} />, true);
    expect(getByTestId('friend-list')).toBeTruthy();
  });
});
