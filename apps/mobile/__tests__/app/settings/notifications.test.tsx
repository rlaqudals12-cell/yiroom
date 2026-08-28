/**
 * 알림 설정 화면 테스트
 *
 * 대상: app/settings/notifications.tsx (NotificationsSettingsScreen)
 * 의존성: useTheme, useNotificationPermission, useNotificationSettings,
 *          useNotificationScheduler, expo-haptics
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
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
    personalizedTriggers: {
      streakReminder: true,
      reanalysisDue: true,
      seasonalTip: true,
      morningRoutine: true,
      eveningRecap: true,
    },
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

// 아침 브리핑 훅 mock (웰니스 마스터 토글과 독립 — 로딩·전이 제어)
const mockBriefingEnable = jest.fn().mockResolvedValue(true);
const mockBriefingDisable = jest.fn().mockResolvedValue(undefined);
const mockBriefingSetTime = jest.fn().mockResolvedValue(undefined);

let mockBriefingState = {
  settings: { enabled: false, hour: 7, minute: 30 },
  isLoading: false,
  enable: mockBriefingEnable,
  disable: mockBriefingDisable,
  setTime: mockBriefingSetTime,
  shouldShowProposal: false,
  acceptProposal: jest.fn(),
  dismissProposal: jest.fn(),
};

jest.mock('../../../lib/notifications/useMorningBriefing', () => ({
  useMorningBriefing: jest.fn(() => mockBriefingState),
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
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
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
        personalizedTriggers: {
          streakReminder: true,
          reanalysisDue: true,
          seasonalTip: true,
          morningRoutine: true,
          eveningRecap: true,
        },
      },
      isLoading: false,
      isSyncing: false,
      updateSettings: mockUpdateSettings,
      resetSettings: jest.fn(),
      applySettings: mockApplySettings,
      syncFromServer: jest.fn(),
    };

    mockBriefingState = {
      settings: { enabled: false, hour: 7, minute: 30 },
      isLoading: false,
      enable: mockBriefingEnable,
      disable: mockBriefingDisable,
      setTime: mockBriefingSetTime,
      shouldShowProposal: false,
      acceptProposal: jest.fn(),
      dismissProposal: jest.fn(),
    };
  });

  describe('아침 브리핑 (ADR-114/118)', () => {
    it('아침 브리핑 토글을 항상 표시한다', () => {
      const { getByTestId, getByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(getByTestId('briefing-toggle')).toBeTruthy();
      expect(getByText('아침 브리핑 알림')).toBeTruthy();
    });

    it('토글 ON 시 enable을 호출한다', () => {
      const { getByTestId } = renderWithTheme(<NotificationsSettingsScreen />);
      fireEvent(getByTestId('briefing-toggle'), 'valueChange', true);
      expect(mockBriefingEnable).toHaveBeenCalledTimes(1);
    });

    it('켜져 있으면 시각 프리셋을 표시하고 선택 시 setTime을 호출한다', () => {
      mockBriefingState = {
        ...mockBriefingState,
        settings: { enabled: true, hour: 7, minute: 30 },
      };

      const { getByTestId } = renderWithTheme(<NotificationsSettingsScreen />);
      const preset = getByTestId('briefing-time-8-0');
      expect(preset).toBeTruthy();

      fireEvent.press(preset);
      expect(mockBriefingSetTime).toHaveBeenCalledWith(8, 0);
    });

    it('꺼져 있으면 시각 프리셋을 표시하지 않는다', () => {
      const { queryByTestId } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(queryByTestId('briefing-time-7-30')).toBeNull();
    });
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

    it('WELLNESS_PHASE2=false이면 물·식사·운동 알림 설정을 표시하지 않는다', () => {
      const { queryByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(queryByText('수분 섭취 알림')).toBeNull();
      expect(queryByText('식사 기록 알림')).toBeNull();
      expect(queryByText('운동 리마인더')).toBeNull();
      expect(queryByText('스트릭 경고')).toBeNull();
    });

    it('출시 플래그가 닫힌 소셜·성취 알림 항목을 표시하지 않는다', () => {
      const { queryByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(queryByText('소셜 & 성취')).toBeNull();
      expect(queryByText('소셜 알림')).toBeNull();
      expect(queryByText('성취 알림')).toBeNull();
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

  describe('웰니스 알림 설정 게이트', () => {
    it('저장된 구형 설정이 true여도 수분 간격 선택을 노출하지 않는다', () => {
      const { queryByText } = renderWithTheme(<NotificationsSettingsScreen />);
      expect(queryByText('알림 간격')).toBeNull();
      expect(queryByText('1시간')).toBeNull();
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

    it('다크 모드에서도 닫힌 웰니스 알림 섹션은 표시되지 않는다', () => {
      const { getByText, queryByText } = renderWithTheme(<NotificationsSettingsScreen />, true);
      expect(getByText('알림 사용')).toBeTruthy();
      expect(queryByText('수분 섭취 알림')).toBeNull();
      expect(queryByText('운동 리마인더')).toBeNull();
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
