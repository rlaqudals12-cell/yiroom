/**
 * FriendRequestCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { FriendRequestCard } from '../../../components/social/FriendRequestCard';

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

describe('FriendRequestCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FriendRequestCard id="1" name="이지은" />);
    expect(getByTestId('friend-request-card')).toBeTruthy();
  });

  it('이름을 표시한다', () => {
    const { getByText } = renderWithTheme(<FriendRequestCard id="1" name="이지은" />);
    expect(getByText('이지은')).toBeTruthy();
  });

  it('메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(<FriendRequestCard id="1" name="이지은" message="같이 운동해요!" />);
    expect(getByText('같이 운동해요!')).toBeTruthy();
  });

  it('수락이 동작한다', () => {
    const onAccept = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <FriendRequestCard id="1" name="이지은" onAccept={onAccept} />,
    );
    fireEvent.press(getByLabelText('친구 요청 수락'));
    expect(onAccept).toHaveBeenCalledWith('1');
  });

  it('거절이 동작한다', () => {
    const onDecline = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <FriendRequestCard id="1" name="이지은" onDecline={onDecline} />,
    );
    fireEvent.press(getByLabelText('친구 요청 거절'));
    expect(onDecline).toHaveBeenCalledWith('1');
  });

  it('접근성 레이블이 있다', () => {
    const { getByLabelText } = renderWithTheme(<FriendRequestCard id="1" name="이지은" />);
    expect(getByLabelText('이지은님의 친구 요청')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FriendRequestCard id="1" name="이지은" />, true);
    expect(getByTestId('friend-request-card')).toBeTruthy();
  });
});
