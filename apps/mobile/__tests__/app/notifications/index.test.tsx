/**
 * 알림 인박스 스크린 테스트
 *
 * 대상: app/notifications/index.tsx (NotificationsScreen)
 * 의존성: useTheme
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import {
  ThemeContext,
  type ThemeContextValue,
} from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

// react-native-safe-area-context mock
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

import NotificationsScreen from '../../../app/notifications/index';

// ============================================================
// 테마 헬퍼
// ============================================================

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

// ============================================================
// 테스트
// ============================================================

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<NotificationsScreen />);
      expect(getByTestId('notifications-screen')).toBeTruthy();
    });

    it('헤더 타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<NotificationsScreen />);
      expect(getByText('알림')).toBeTruthy();
    });

    it('부제가 표시된다', () => {
      const { getByText } = renderWithTheme(<NotificationsScreen />);
      expect(getByText('최근 받은 알림을 확인하세요')).toBeTruthy();
    });
  });

  describe('빈 상태', () => {
    it('빈 상태 아이콘이 표시된다', () => {
      const { getByText } = renderWithTheme(<NotificationsScreen />);
      expect(getByText('🔔')).toBeTruthy();
    });

    it('빈 상태 메시지가 표시된다', () => {
      const { getByText } = renderWithTheme(<NotificationsScreen />);
      expect(getByText('아직 알림이 없어요')).toBeTruthy();
    });

    it('알림 설정 안내 메시지가 표시된다', () => {
      const { getByText } = renderWithTheme(<NotificationsScreen />);
      expect(getByText(/설정에서 알림을 활성화해보세요/)).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<NotificationsScreen />, true);
      expect(getByTestId('notifications-screen')).toBeTruthy();
    });

    it('다크 모드에서 배경색이 변경된다', () => {
      const { getByTestId } = renderWithTheme(<NotificationsScreen />, true);
      const screen = getByTestId('notifications-screen');

      const flatStyle = Array.isArray(screen.props.style)
        ? Object.assign({}, ...screen.props.style)
        : screen.props.style;
      expect(flatStyle.backgroundColor).toBe(darkColors.background);
    });

    it('다크 모드에서 빈 상태 메시지가 표시된다', () => {
      const { getByText } = renderWithTheme(<NotificationsScreen />, true);
      expect(getByText('아직 알림이 없어요')).toBeTruthy();
    });
  });
});
