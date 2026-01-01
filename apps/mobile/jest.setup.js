/**
 * Jest 셋업
 * 테스트 환경 초기화 및 모킹
 */

// React Native 모킹
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'ios',
      select: (obj) => obj.ios ?? obj.default,
    },
    AccessibilityInfo: {
      isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
      isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
      isBoldTextEnabled: jest.fn().mockResolvedValue(false),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      announceForAccessibility: jest.fn(),
      setAccessibilityFocus: jest.fn(),
    },
  };
});

// AsyncStorage 모킹
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiSet: jest.fn().mockResolvedValue(undefined),
  multiGet: jest.fn().mockResolvedValue([]),
  getAllKeys: jest.fn().mockResolvedValue([]),
  clear: jest.fn().mockResolvedValue(undefined),
}));

// Expo 모듈 모킹
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '0.1.0',
    extra: { buildNumber: '1' },
  },
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'ko' }]),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
  createURL: jest.fn((path) => `yiroom://${path}`),
}));

// NetInfo 모킹
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
}));

// 타이머 모킹
jest.useFakeTimers();

// 콘솔 경고 억제 (테스트 중)
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0]?.includes?.('Animated') ||
    args[0]?.includes?.('componentWillReceiveProps')
  ) {
    return;
  }
  originalWarn(...args);
};
