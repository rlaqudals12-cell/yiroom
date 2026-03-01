/**
 * NotificationList 컴포넌트 테스트
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand, lightColors, darkColors, moduleColors, statusColors,
  gradeColors, nutrientColors, scoreColors, trustColors,
  spacing, radii, shadows, typography,
} from '../../../lib/theme/tokens';
import { NotificationList } from '../../../components/notifications/NotificationList';

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

const mockNotifications = [
  { id: '1', type: 'analysis' as const, title: '분석 완료', message: '피부 분석 완료', timestamp: '방금 전', isRead: false },
  { id: '2', type: 'workout' as const, title: '운동 알림', message: '오늘 운동 시간', timestamp: '1시간 전', isRead: true },
];

describe('NotificationList', () => {
  it('렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NotificationList notifications={mockNotifications} />,
    );
    expect(getByTestId('notification-list')).toBeTruthy();
  });

  it('알림 카드를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NotificationList notifications={mockNotifications} />,
    );
    expect(getByText('분석 완료')).toBeTruthy();
    expect(getByText('운동 알림')).toBeTruthy();
  });

  it('빈 상태를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NotificationList notifications={[]} />,
    );
    expect(getByText('새로운 알림이 없습니다')).toBeTruthy();
  });

  it('커스텀 빈 메시지를 표시한다', () => {
    const { getByText } = renderWithTheme(
      <NotificationList notifications={[]} emptyMessage="알림이 없어요" />,
    );
    expect(getByText('알림이 없어요')).toBeTruthy();
  });

  it('접근성 레이블에 읽지 않은 알림 수를 포함한다', () => {
    const { getByLabelText } = renderWithTheme(
      <NotificationList notifications={mockNotifications} />,
    );
    expect(getByLabelText('알림 2개, 읽지 않은 알림 1개')).toBeTruthy();
  });

  it('다크모드에서 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(
      <NotificationList notifications={mockNotifications} />,
      true,
    );
    expect(getByTestId('notification-list')).toBeTruthy();
  });
});
