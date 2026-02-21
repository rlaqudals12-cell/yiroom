/**
 * 알림 설정 화면 테스트
 *
 * 대상: app/settings/notifications.tsx (NotificationsSettingsScreen)
 * 의존성: useTheme, useNotificationPermission, useNotificationSettings,
 *          useNotificationScheduler, expo-haptics
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

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

// ============================================================
// Mock 설정
// ============================================================

// notifications.tsx에서 Platform.OS를 직접 참조하므로
// Platform.ios.js 모듈을 mock하여 Platform.OS가 undefined 되는 것을 방지
jest.mock('react-native/Libraries/Utilities/Platform.ios', () => ({
  __esModule: true,
  default: {
    OS: 'ios',
    select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
    Version: '17.0',
    isPad: false,
    isTV: false,
    isVision: false,
    isTesting: true,
    constants: {
      osVersion: '17.0',
      interfaceIdiom: 'phone',
      isTesting: true,
      forceTouchAvailable: false,
      reactNativeVersion: { major: 0, minor: 79, patch: 0 },
      systemName: 'iOS',
    },
  },
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: {
    OS: 'ios',
    select: (obj: Record<string, unknown>) => obj.ios ?? obj.default,
    Version: '17.0',
    isPad: false,
    isTV: false,
    isVision: false,
    isTesting: true,
    constants: {
      osVersion: '17.0',
      interfaceIdiom: 'phone',
      isTesting: true,
      forceTouchAvailable: false,
      reactNativeVersion: { major: 0, minor: 79, patch: 0 },
      systemName: 'iOS',
    },
  },
}));

// 알림 훅 mock 값
const mockRequestPermission = jest.fn().mockResolvedValue(true);
const mockUpdateSettings = jest.fn().mockResolvedValue(undefined);
const mockApplySettings = jest.fn().mockResolvedValue(undefined);
const mockSendNow = jest.fn().mockResolvedValue('test-notification-id');

let mockPermissionState = {
  hasPermission: true,
  isLoading: false,
  requestPermission: mockRequestPermission,
};

let mockSettingsState = {
  settings: {
    enabled: true,
    workoutReminder: true,
    workoutReminderTime: '09:00',
    nutritionReminder: true,
    mealReminderTimes: {
      breakfast: '08:30',
      lunch: '12:30',
      dinner: '18:30',
    },
    waterReminder: true,
    waterReminderInterval: 2,
    streakWarning: true,
    socialNotifications: true,
    achievementNotifications: true,
  },
  isLoading: false,
  isSyncing: false,
  updateSettings: mockUpdateSettings,
  resetSettings: jest.fn(),
  applySettings: mockApplySettings,
  syncFromServer: jest.fn(),
};

jest.mock('../../../lib/notifications/useNotifications', () => ({
  useNotificationPermission: jest.fn(() => mockPermissionState),
  useNotificationSettings: jest.fn(() => mockSettingsState),
  useNotificationScheduler: jest.fn(() => ({
    sendNow: mockSendNow,
    schedule: jest.fn(),
    cancel: jest.fn(),
    cancelAll: jest.fn(),
  })),
}));

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

import NotificationsSettingsScreen from '../../../app/settings/notifications';

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

describe('NotificationsSettingsScreen', () => {
  const Haptics = require('expo-haptics');

  beforeEach(() => {
    jest.clearAllMocks();

    // 기본 상태 복원
    mockPermissionState = {
      hasPermission: true,
      isLoading: false,
      requestPermission: mockRequestPermission,
    };

    mockSettingsState = {
      settings: {
        enabled: true,
        workoutReminder: true,
        workoutReminderTime: '09:00',
        nutritionReminder: true,
        mealReminderTimes: {
          breakfast: '08:30',
          lunch: '12:30',
          dinner: '18:30',
        },
        waterReminder: true,
        waterReminderInterval: 2,
        streakWarning: true,
        socialNotifications: true,
        achievementNotifications: true,
      },
      isLoading: false,
      isSyncing: false,
      updateSettings: mockUpdateSettings,
      resetSettings: jest.fn(),
      applySettings: mockApplySettings,
      syncFromServer: jest.fn(),
    };
  });

  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByTestId('settings-notifications-screen')).toBeTruthy();
    });

    it('testID가 settings-notifications-screen으로 설정된다', () => {
      const { getByTestId } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByTestId('settings-notifications-screen')).toBeTruthy();
    });
  });

  describe('로딩 상태', () => {
    it('권한 로딩 중일 때 로딩 인디케이터를 표시한다', () => {
      mockPermissionState = {
        ...mockPermissionState,
        isLoading: true,
      };

      const { queryByTestId } = renderWithTheme(<NotificationsSettingsScreen />);
      // 로딩 중이면 메인 화면이 렌더링되지 않음
      expect(queryByTestId('settings-notifications-screen')).toBeNull();
    });

    it('설정 로딩 중일 때 로딩 인디케이터를 표시한다', () => {
      mockSettingsState = {
        ...mockSettingsState,
        isLoading: true,
      };

      const { queryByTestId } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(queryByTestId('settings-notifications-screen')).toBeNull();
    });
  });

  describe('주요 UI 요소 표시', () => {
    it('마스터 토글(알림 사용)을 표시한다', () => {
      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByText('알림 사용')).toBeTruthy();
      expect(getByText('모든 알림 켜기/끄기')).toBeTruthy();
    });

    it('영양 섹션 알림 항목들을 표시한다', () => {
      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByText('수분 섭취 알림')).toBeTruthy();
      expect(getByText('식사 기록 알림')).toBeTruthy();
    });

    it('운동 섹션 알림 항목들을 표시한다', () => {
      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByText('운동 리마인더')).toBeTruthy();
      expect(getByText('스트릭 경고')).toBeTruthy();
    });

    it('소셜 & 성취 알림 항목들을 표시한다', () => {
      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByText('소셜 알림')).toBeTruthy();
      expect(getByText('성취 알림')).toBeTruthy();
    });

    it('테스트 알림 버튼을 표시한다', () => {
      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByText('테스트 알림 보내기')).toBeTruthy();
    });

    it('하단 안내 텍스트를 표시한다', () => {
      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByText(/알림은 앱이 백그라운드에 있을 때도 동작합니다/)).toBeTruthy();
    });
  });

  describe('권한 미허용 상태', () => {
    it('권한이 없을 때 권한 요청 배너를 표시한다', () => {
      mockPermissionState = {
        ...mockPermissionState,
        hasPermission: false,
      };

      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByText('알림 권한이 필요합니다')).toBeTruthy();
      expect(getByText('탭하여 권한을 허용해주세요')).toBeTruthy();
    });

    it('권한 배너 클릭 시 권한 요청을 호출한다', async () => {
      mockPermissionState = {
        ...mockPermissionState,
        hasPermission: false,
      };

      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);

      await act(async () => {
        fireEvent.press(getByText('알림 권한이 필요합니다'));
      });

      expect(Haptics.impactAsync).toHaveBeenCalled();
      expect(mockRequestPermission).toHaveBeenCalled();
    });
  });

  describe('마스터 토글 상호작용', () => {
    it('알림이 비활성화되면 하위 설정 항목들이 숨겨진다', () => {
      mockSettingsState = {
        ...mockSettingsState,
        settings: {
          ...mockSettingsState.settings,
          enabled: false,
        },
      };

      const { queryByText } = renderWithTheme(<NotificationsSettingsScreen />);
      // 마스터 토글은 보이지만 하위 섹션은 안 보임
      expect(queryByText('수분 섭취 알림')).toBeNull();
      expect(queryByText('운동 리마인더')).toBeNull();
      expect(queryByText('소셜 알림')).toBeNull();
      expect(queryByText('테스트 알림 보내기')).toBeNull();
    });
  });

  describe('물 알림 간격 선택', () => {
    it('수분 알림 활성화 시 간격 선택 옵션을 표시한다', () => {
      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByText('알림 간격')).toBeTruthy();
      expect(getByText('1시간')).toBeTruthy();
      expect(getByText('2시간')).toBeTruthy();
      expect(getByText('3시간')).toBeTruthy();
      expect(getByText('4시간')).toBeTruthy();
    });

    it('간격 버튼 클릭 시 updateSettings를 호출한다', async () => {
      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);

      await act(async () => {
        fireEvent.press(getByText('3시간'));
      });

      expect(Haptics.selectionAsync).toHaveBeenCalled();
      expect(mockUpdateSettings).toHaveBeenCalledWith({ waterReminderInterval: 3 });
    });

    it('수분 알림 비활성화 시 간격 선택이 숨겨진다', () => {
      mockSettingsState = {
        ...mockSettingsState,
        settings: {
          ...mockSettingsState.settings,
          waterReminder: false,
        },
      };

      const { queryByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(queryByText('알림 간격')).toBeNull();
    });
  });

  describe('테스트 알림 전송', () => {
    it('테스트 알림 버튼 클릭 시 알림을 전송한다', async () => {
      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);

      await act(async () => {
        fireEvent.press(getByText('테스트 알림 보내기'));
      });

      expect(Haptics.impactAsync).toHaveBeenCalled();
      expect(mockSendNow).toHaveBeenCalledWith('test');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<NotificationsSettingsScreen />, true);
      expect(getByTestId('settings-notifications-screen')).toBeTruthy();
    });

    it('다크 모드에서 배경색이 변경된다', () => {
      const { getByTestId } = renderWithTheme(<NotificationsSettingsScreen />, true);
      const screen = getByTestId('settings-notifications-screen');
      const flatStyle = Array.isArray(screen.props.style)
        ? Object.assign({}, ...screen.props.style)
        : screen.props.style;
      expect(flatStyle.backgroundColor).toBe(darkColors.background);
    });

    it('다크 모드에서 모든 알림 섹션이 표시된다', () => {
      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />, true);
      expect(getByText('알림 사용')).toBeTruthy();
      expect(getByText('수분 섭취 알림')).toBeTruthy();
      expect(getByText('운동 리마인더')).toBeTruthy();
    });
  });

  describe('엣지 케이스', () => {
    it('모든 알림이 비활성화된 상태에서도 안내 텍스트를 표시한다', () => {
      mockSettingsState = {
        ...mockSettingsState,
        settings: {
          ...mockSettingsState.settings,
          enabled: false,
        },
      };

      const { getByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByText(/알림은 앱이 백그라운드에 있을 때도 동작합니다/)).toBeTruthy();
    });

    it('권한이 있고 알림이 활성화된 상태에서 권한 배너가 표시되지 않는다', () => {
      const { queryByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(queryByText('알림 권한이 필요합니다')).toBeNull();
    });
  });
});
