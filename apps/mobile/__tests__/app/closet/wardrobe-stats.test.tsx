/**
 * 옷장 통계 화면 렌더링 테스트
 *
 * 대상: app/(closet)/wardrobe-stats.tsx
 * 테스트 범위: 기본 렌더링, 카테고리 분포, 착용 빈도, CTA 버튼
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
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
}));

jest.mock('../../../lib/theme', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff', foreground: '#000', card: '#f5f5f5', border: '#e0e0e0',
      mutedForeground: '#888', secondary: '#f0f0f0',
    },
    brand: { primary: '#6366f1', primaryForeground: '#fff' },
    spacing: { xxs: 2, xs: 4, sm: 8, smx: 12, md: 16, lg: 24, xl: 32 },
    radii: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
    typography: {
      size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24 },
      weight: { medium: '500', semibold: '600', bold: '700' },
    },
    module: { body: { base: '#6366f1' } },
    score: { excellent: '#22c55e', caution: '#f59e0b', poor: '#ef4444' },
    isDark: false,
  }),
}));

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => <View testID={testID}>{children}</View>,
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
  };
});

// SUT
import WardrobeStatsScreen from '../../../app/(closet)/wardrobe-stats';
import { renderWithTheme } from '../../helpers/test-utils';

// -------------------------------------------------------------------
// 테스트
// -------------------------------------------------------------------
describe('WardrobeStatsScreen 렌더링', () => {
  it('화면이 testID "wardrobe-stats-screen"으로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WardrobeStatsScreen />);
    expect(getByTestId('wardrobe-stats-screen')).toBeTruthy();
  });

  it('통계 제목과 총 아이템 수가 표시된다', () => {
    const { getByText } = renderWithTheme(<WardrobeStatsScreen />);
    expect(getByText('옷장 통계')).toBeTruthy();
    expect(getByText('총 42개 아이템')).toBeTruthy();
  });

  it('카테고리 분포와 착용 빈도 섹션이 표시된다', () => {
    const { getByText } = renderWithTheme(<WardrobeStatsScreen />);
    expect(getByText('카테고리 분포')).toBeTruthy();
    expect(getByText('착용 빈도')).toBeTruthy();
    expect(getByText('자주 입는 옷')).toBeTruthy();
    expect(getByText('안 입는 옷 정리하기')).toBeTruthy();
  });
});
