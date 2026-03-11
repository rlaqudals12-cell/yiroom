/**
 * 옷장 아이템 추가 화면 렌더링 테스트
 *
 * 대상: app/(closet)/add.tsx
 * 테스트 범위: 기본 렌더링, 폼 섹션 표시, 저장 버튼 상태
 */
import React from 'react';

// -------------------------------------------------------------------
// Mocks (jest.mock은 호이스팅되므로 import 전에 선언)
// -------------------------------------------------------------------
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => (props: Record<string, unknown>) => <View {...props} /> });
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = (): unknown => new Proxy({}, { get: () => createChainable });
  return {
    __esModule: true,
    default: { View, createAnimatedComponent: (c: unknown) => c },
    FadeInUp: createChainable(), FadeIn: createChainable(), FadeInDown: createChainable(),
    ZoomIn: createChainable(), SlideInRight: createChainable(), SlideInLeft: createChainable(),
    Easing: { out: () => ({}), exp: {}, bezier: () => ({}), linear: {}, ease: {}, in: () => ({}), inOut: () => ({}) },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v, withSpring: (v: unknown) => v, withDelay: (_d: unknown, v: unknown) => v,
  };
});

jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), selectionAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  Stack: { Screen: () => null },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
}));

jest.mock('../../../lib/inventory', () => ({
  useCloset: jest.fn(() => ({
    addItem: jest.fn().mockResolvedValue({ id: 'new-item' }),
    items: [],
    isLoading: false,
  })),
}));

jest.mock('../../../lib/stores', () => ({
  useAppPreferencesStore: jest.fn((selector: (state: { hapticEnabled: boolean }) => boolean) =>
    selector({ hapticEnabled: false })
  ),
}));

jest.mock('../../../lib/theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff', foreground: '#000', card: '#f5f5f5', border: '#e0e0e0',
      mutedForeground: '#888', secondary: '#f0f0f0', overlayForeground: '#fff',
      destructive: '#ff0000', muted: '#ccc',
    },
    brand: { primary: '#6366f1', primaryForeground: '#fff' },
    isDark: false,
  }),
  typography: {
    size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
    weight: { medium: '500', semibold: '600', bold: '700' },
  },
  spacing: { xxs: 2, xs: 4, sm: 8, smd: 10, smx: 12, md: 16, mlg: 20, lg: 24, xl: 32, xxl: 48 },
  radii: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
}));

jest.mock('../../../lib/utils/logger', () => ({
  closetLogger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../components/ui', () => {
  const { View, Text } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => <View testID={testID}>{children}</View>,
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
    SuccessCheckmark: () => null,
  };
});

// SUT
import ClosetAddScreen from '../../../app/(closet)/add';
import { renderWithTheme } from '../../helpers/test-utils';

// -------------------------------------------------------------------
// 테스트
// -------------------------------------------------------------------
describe('ClosetAddScreen 렌더링', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('화면이 testID "closet-add-screen"으로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<ClosetAddScreen />);
    expect(getByTestId('closet-add-screen')).toBeTruthy();
  });

  it('폼 섹션 제목들이 표시된다 (기본 정보, 카테고리, 색상, 시즌)', () => {
    const { getByText } = renderWithTheme(<ClosetAddScreen />);

    expect(getByText('기본 정보')).toBeTruthy();
    expect(getByText('카테고리 *')).toBeTruthy();
    expect(getByText('색상 * (복수 선택)')).toBeTruthy();
    expect(getByText('시즌 * (복수 선택)')).toBeTruthy();
  });

  it('저장 버튼 "옷장에 추가"가 표시된다', () => {
    const { getByText } = renderWithTheme(<ClosetAddScreen />);
    expect(getByText('옷장에 추가')).toBeTruthy();
  });
});
