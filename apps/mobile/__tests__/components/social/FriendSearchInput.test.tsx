/**
 * FriendSearchInput 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FriendSearchInput } from '../../../components/social/FriendSearchInput';

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

describe('FriendSearchInput', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <FriendSearchInput value="" onChangeText={jest.fn()} />,
    );
    expect(getByTestId('friend-search-input')).toBeTruthy();
  });

  it('입력이 동작한다', () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <FriendSearchInput value="" onChangeText={onChangeText} />,
    );
    fireEvent.changeText(getByLabelText('친구 검색'), '김민수');
    expect(onChangeText).toHaveBeenCalledWith('김민수');
  });

  it('커스텀 placeholder를 지원한다', () => {
    const { getByPlaceholderText } = renderWithTheme(
      <FriendSearchInput value="" onChangeText={jest.fn()} placeholder="닉네임 검색" />,
    );
    expect(getByPlaceholderText('닉네임 검색')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <FriendSearchInput value="" onChangeText={jest.fn()} />, true,
    );
    expect(getByTestId('friend-search-input')).toBeTruthy();
  });
});
