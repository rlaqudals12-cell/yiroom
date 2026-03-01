/**
 * NotificationCard 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { NotificationCard } from '../../../components/notifications/NotificationCard';

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

describe('NotificationCard', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NotificationCard id="1" type="analysis" title="분석 완료" message="피부 분석이 완료되었습니다" timestamp="방금 전" />,
    );
    expect(getByTestId('notification-card')).toBeTruthy();
  });

  it('제목을 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NotificationCard id="1" type="analysis" title="분석 완료" message="피부 분석이 완료되었습니다" timestamp="방금 전" />,
    );
    expect(getByText('분석 완료')).toBeTruthy();
  });

  it('메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NotificationCard id="1" type="analysis" title="분석 완료" message="피부 분석이 완료되었습니다" timestamp="방금 전" />,
    );
    expect(getByText('피부 분석이 완료되었습니다')).toBeTruthy();
  });

  it('타임스탬프를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NotificationCard id="1" type="analysis" title="분석 완료" message="메시지" timestamp="5분 전" />,
    );
    expect(getByText('5분 전')).toBeTruthy();
  });

  it('타입별 이모지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NotificationCard id="1" type="workout" title="운동 알림" message="메시지" timestamp="방금 전" />,
    );
    expect(getByText('💪')).toBeTruthy();
  });

  it('누르면 onPress가 호출된다', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithTheme(
      <NotificationCard id="1" type="analysis" title="분석 완료" message="메시지" timestamp="방금 전" onPress={onPress} />,
    );
    fireEvent.press(getByTestId('notification-card'));
    expect(onPress).toHaveBeenCalledWith('1');
  });

  it('읽지 않은 알림 접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <NotificationCard id="1" type="analysis" title="분석 완료" message="메시지" timestamp="방금 전" isRead={false} />,
    );
    expect(getByLabelText('분석 완료, 읽지 않음')).toBeTruthy();
  });

  it('읽은 알림 접근성 레이블을 갖는다', () => {
    const { getByLabelText } = renderWithTheme(
      <NotificationCard id="1" type="analysis" title="분석 완료" message="메시지" timestamp="방금 전" isRead={true} />,
    );
    expect(getByLabelText('분석 완료, 읽음')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NotificationCard id="1" type="analysis" title="분석 완료" message="메시지" timestamp="방금 전" />,
      true,
    );
    expect(getByTestId('notification-card')).toBeTruthy();
  });
});
