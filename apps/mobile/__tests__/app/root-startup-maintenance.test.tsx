import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockCleanupHiddenWellnessNotificationsOnce = jest.fn().mockResolvedValue(0);
const mockUseFonts = jest.fn((_fonts?: unknown): [boolean, Error | null] => [true, null]);

jest.mock('../../global.css', () => ({}));

jest.mock('@clerk/clerk-expo', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    getToken: jest.fn(),
    isSignedIn: false,
    userId: null,
  }),
}));

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  const Stack = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
  Stack.Screen = () => <View />;
  return { Stack };
});

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-font', () => ({ useFonts: (...args: unknown[]) => mockUseFonts(...args) }));
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return { GestureHandlerRootView: View };
});
jest.mock('../../components/common/OfflineBanner', () => ({ OfflineBanner: () => null }));
jest.mock('../../components/common/AgeVerificationGate', () => ({
  AgeVerificationGate: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View testID="root-age-verification-gate">{children}</View>;
  },
}));
jest.mock('../../lib/analytics/lifecycle', () => ({ useAnalyticsLifecycle: jest.fn() }));
jest.mock('../../lib/clerk', () => ({
  tokenCache: {},
  CLERK_PUBLISHABLE_KEY: 'pk_test',
}));
jest.mock('../../lib/monitoring/sentry', () => ({
  initSentry: jest.fn(),
  SentryErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  sentryWrap: (Component: React.ComponentType) => Component,
}));
jest.mock('../../lib/notifications/hidden-wellness-cleanup', () => ({
  cleanupHiddenWellnessNotificationsOnce: () => mockCleanupHiddenWellnessNotificationsOnce(),
}));
jest.mock('../../lib/notifications/useNotifications', () => ({
  useNotificationResponse: jest.fn(),
}));
jest.mock('../../lib/theme', () => {
  const { View } = require('react-native');
  return {
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useTheme: () => ({ colors: { card: '#fff', foreground: '#111' }, isDark: false }),
    lightColors: { mutedForeground: '#666' },
    typography: { size: { lg: 18, sm: 14 }, weight: { semibold: '600' } },
    spacing: { mlg: 20, sm: 8 },
  };
});
jest.mock('../../lib/utils/logger', () => ({
  appLogger: { warn: jest.fn() },
}));

import RootLayout from '../../app/_layout';

describe('앱 시작 유지보수', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFonts.mockReturnValue([true, null]);
  });

  it('루트 레이아웃이 마운트되면 레거시 웰니스 알림 정리를 시작한다', async () => {
    const { getByTestId } = render(<RootLayout />);

    expect(getByTestId('root-age-verification-gate')).toBeTruthy();

    await waitFor(() =>
      expect(mockCleanupHiddenWellnessNotificationsOnce).toHaveBeenCalledTimes(1)
    );
  });

  it('결과 세리프 폰트를 앱 루트에서 한 번 미리 로드한다', () => {
    render(<RootLayout />);

    expect(mockUseFonts).toHaveBeenCalledTimes(1);
    expect(mockUseFonts.mock.calls[0][0]).toHaveProperty('NanumMyeongjo_700Bold');
  });

  it('폰트 로딩 중에는 시스템 글꼴 첫 프레임을 그리지 않는다', () => {
    mockUseFonts.mockReturnValueOnce([false, null]);

    const { toJSON } = render(<RootLayout />);

    expect(toJSON()).toBeNull();
  });
});
