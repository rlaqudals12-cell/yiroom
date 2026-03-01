/**
 * FriendCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FriendCard } from '../../../components/social/FriendCard';

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

describe('FriendCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FriendCard id="1" name="김민수" />);
    expect(getByTestId('friend-card')).toBeTruthy();
  });

  it('이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<FriendCard id="1" name="김민수" />);
    expect(getByText('김민수')).toBeTruthy();
  });

  it('레벨을 표시한다', () => {
    const { getByText } = renderWithTheme(<FriendCard id="1" name="김민수" level={5} />);
    expect(getByText('Lv.5')).toBeTruthy();
  });

  it('상태 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(<FriendCard id="1" name="김민수" statusMessage="화이팅!" />);
    expect(getByText('화이팅!')).toBeTruthy();
  });

  it('클릭이 동작한다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(<FriendCard id="1" name="김민수" onPress={onPress} />);
    fireEvent.press(getByTestId('friend-card'));
    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<FriendCard id="1" name="김민수" isOnline level={3} />);
    expect(getByLabelText('김민수, 온라인, 레벨 3')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FriendCard id="1" name="김민수" />, true);
    expect(getByTestId('friend-card')).toBeTruthy();
  });
});
