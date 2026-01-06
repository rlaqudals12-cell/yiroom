/**
 * Jest 셋업
 * 테스트 환경 초기화 및 모킹
 */

// =============================================================================
// Expo Router 모킹
// =============================================================================
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  usePathname: jest.fn(() => '/'),
  useFocusEffect: jest.fn((callback) => callback()),
  Link: 'Link',
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
  Slot: 'Slot',
}));

// =============================================================================
// Clerk-Expo 모킹
// =============================================================================
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
    userId: 'test_user_123',
    sessionId: 'test_session_123',
    getToken: jest.fn().mockResolvedValue('mock_jwt_token'),
    signOut: jest.fn().mockResolvedValue(undefined),
  })),
  useUser: jest.fn(() => ({
    user: {
      id: 'test_user_123',
      firstName: '테스트',
      lastName: '사용자',
      fullName: '테스트 사용자',
      imageUrl: 'https://example.com/avatar.png',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    },
    isLoaded: true,
    isSignedIn: true,
  })),
  useSession: jest.fn(() => ({
    session: {
      id: 'test_session_123',
      status: 'active',
      lastActiveAt: new Date(),
    },
    isLoaded: true,
    isSignedIn: true,
  })),
  useClerk: jest.fn(() => ({
    signOut: jest.fn().mockResolvedValue(undefined),
  })),
  ClerkProvider: ({ children }) => children,
  SignedIn: ({ children }) => children,
  SignedOut: () => null,
}));

// =============================================================================
// Supabase 모킹
// =============================================================================
const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  then: jest.fn((resolve) => resolve({ data: [], error: null })),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => mockSupabaseQuery),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'mock_token' } },
        error: null,
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test_user_123' } },
        error: null,
      }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/test.jpg' } })),
      })),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

// =============================================================================
// Gemini AI 모킹
// =============================================================================
jest.mock('@/lib/gemini', () => ({
  analyzeWithGemini: jest.fn().mockResolvedValue({
    result: 'mock_analysis_result',
    confidence: 0.9,
  }),
  analyzeImage: jest.fn().mockResolvedValue({
    description: 'Mock image analysis',
    tags: ['tag1', 'tag2'],
  }),
}));

// =============================================================================
// NativeWind/CSS Interop 모킹
// =============================================================================
jest.mock('nativewind', () => ({
  styled: (Component) => Component,
  useColorScheme: jest.fn(() => ({ colorScheme: 'light', setColorScheme: jest.fn() })),
  cssInterop: jest.fn(),
}));

// =============================================================================
// Platform 모킹
// =============================================================================
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (obj) => obj.ios ?? obj.default,
  Version: 17,
  isPad: false,
  isTVOS: false,
  isTV: false,
}));

// =============================================================================
// AccessibilityInfo 모킹
// =============================================================================
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
  isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
  isBoldTextEnabled: jest.fn().mockResolvedValue(false),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  announceForAccessibility: jest.fn(),
  setAccessibilityFocus: jest.fn(),
}));

// =============================================================================
// AsyncStorage 모킹
// =============================================================================
const mockAsyncStorage = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key, value) => {
    mockAsyncStorage.set(key, value);
    return Promise.resolve();
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(mockAsyncStorage.get(key) || null);
  }),
  removeItem: jest.fn((key) => {
    mockAsyncStorage.delete(key);
    return Promise.resolve();
  }),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([key, value]) => mockAsyncStorage.set(key, value));
    return Promise.resolve();
  }),
  multiGet: jest.fn((keys) => {
    return Promise.resolve(keys.map((key) => [key, mockAsyncStorage.get(key) || null]));
  }),
  getAllKeys: jest.fn(() => {
    return Promise.resolve(Array.from(mockAsyncStorage.keys()));
  }),
  clear: jest.fn(() => {
    mockAsyncStorage.clear();
    return Promise.resolve();
  }),
}));

// =============================================================================
// Expo 모듈 모킹
// =============================================================================
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '0.1.0',
    extra: { buildNumber: '1' },
  },
  executionEnvironment: 'storeClient',
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'ko', regionCode: 'KR' }]),
  locale: 'ko-KR',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
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
  canOpenURL: jest.fn().mockResolvedValue(true),
  getInitialURL: jest.fn().mockResolvedValue(null),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[mock]' }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification_id'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://mock-image.jpg', width: 100, height: 100 }],
  }),
  launchCameraAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://mock-camera.jpg', width: 100, height: 100 }],
  }),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

// =============================================================================
// NetInfo 모킹
// =============================================================================
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: { isConnectionExpensive: false },
  }),
  configure: jest.fn(),
}));

// =============================================================================
// Sentry 모킹
// =============================================================================
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  wrap: (component) => component,
}));

// =============================================================================
// i18n 모킹
// =============================================================================
jest.mock('@/lib/i18n', () => ({
  t: jest.fn((key) => key),
  i18n: {
    language: 'ko',
    changeLanguage: jest.fn(),
  },
  useTranslation: jest.fn(() => ({
    t: (key) => key,
    i18n: { language: 'ko', changeLanguage: jest.fn() },
  })),
}));

// =============================================================================
// React Native Gesture Handler 모킹
// =============================================================================
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((component) => component),
    Directions: {},
    GestureHandlerRootView: View,
  };
});

// =============================================================================
// React Native Reanimated: __mocks__/react-native-reanimated.js 파일로 대체됨
// jest.config.js의 moduleNameMapper에서 설정
// =============================================================================

// =============================================================================
// 타이머 설정
// =============================================================================
// 주의: useFakeTimers를 전역으로 사용하면 async 테스트에 문제가 생길 수 있음
// 특정 테스트에서 필요 시 jest.useFakeTimers() 호출
// jest.useFakeTimers();

// =============================================================================
// 콘솔 경고 억제
// =============================================================================
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  // 무시할 경고 패턴
  const ignorePatterns = [
    'Animated',
    'componentWillReceiveProps',
    'componentWillMount',
    'NativeEventEmitter',
    'Require cycle',
  ];

  if (ignorePatterns.some((pattern) => args[0]?.includes?.(pattern))) {
    return;
  }
  originalWarn(...args);
};

console.error = (...args) => {
  // 테스트 중 무시할 에러 패턴
  const ignorePatterns = [
    'Warning: ReactDOM.render',
    'Warning: An update to',
    'act(...)',
  ];

  if (ignorePatterns.some((pattern) => args[0]?.includes?.(pattern))) {
    return;
  }
  originalError(...args);
};

// =============================================================================
// 테스트 유틸리티 글로벌 설정
// =============================================================================
global.mockAsyncStorage = mockAsyncStorage;

// 각 테스트 후 AsyncStorage 초기화
afterEach(() => {
  mockAsyncStorage.clear();
});
