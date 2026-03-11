/**
 * 스타일 갤러리 화면 렌더링 테스트
 *
 * 대상: app/(closet)/gallery.tsx
 * 테스트 범위: 기본 렌더링, 검색바 표시, 카테고리 필터, 로딩/빈 상태
 */
import React from 'react';

// -------------------------------------------------------------------
// Mocks
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
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: (props: Record<string, unknown>) => <View {...props} /> };
});

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
}));

// Supabase mock - gallery가 직접 supabase를 사용함
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => ({
    from: jest.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
    })),
  }),
}));

jest.mock('../../../lib/theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff', foreground: '#000', card: '#f5f5f5', border: '#e0e0e0',
      mutedForeground: '#888', secondary: '#f0f0f0', muted: '#ccc',
    },
    brand: { primary: '#6366f1', primaryForeground: '#fff' },
    spacing: { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    radii: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
    typography: {
      size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20 },
      weight: { medium: '500', semibold: '600', bold: '700' },
    },
    shadows: { card: {} },
    isDark: false,
  }),
  spacing: { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
}));

jest.mock('../../../lib/utils/logger', () => ({
  closetLogger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => <View testID={testID}>{children}</View>,
  };
});

// SUT
import StyleGalleryScreen from '../../../app/(closet)/gallery';
import { renderWithTheme } from '../../helpers/test-utils';

// -------------------------------------------------------------------
// 테스트
// -------------------------------------------------------------------
describe('StyleGalleryScreen 렌더링', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 기본: 로딩 완료, 빈 배열
    mockLimit.mockResolvedValue({ data: [], error: null });
  });

  it('화면이 testID "style-gallery-screen"으로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<StyleGalleryScreen />);
    expect(getByTestId('style-gallery-screen')).toBeTruthy();
  });

  it('카테고리 필터 라벨들이 표시된다', () => {
    const { getByText } = renderWithTheme(<StyleGalleryScreen />);
    expect(getByText('전체')).toBeTruthy();
    expect(getByText('상의')).toBeTruthy();
    expect(getByText('하의')).toBeTruthy();
  });

  it('검색 입력 플레이스홀더가 표시된다', () => {
    const { getByPlaceholderText } = renderWithTheme(<StyleGalleryScreen />);
    expect(getByPlaceholderText('아이템 검색')).toBeTruthy();
  });
});
