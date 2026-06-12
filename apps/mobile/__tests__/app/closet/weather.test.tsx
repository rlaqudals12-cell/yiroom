/**
 * 날씨 기반 코디 추천 화면 렌더링 테스트
 *
 * 대상: app/(closet)/weather.tsx
 * 테스트 범위: 기본 렌더링, 날씨 정보 표시, 추천 코디 목록
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
    FadeInUp: createChainable(),
    FadeIn: createChainable(),
    FadeInDown: createChainable(),
    ZoomIn: createChainable(),
    SlideInRight: createChainable(),
    SlideInLeft: createChainable(),
    Easing: {
      out: () => ({}),
      exp: {},
      bezier: () => ({}),
      linear: {},
      ease: {},
      in: () => ({}),
      inOut: () => ({}),
    },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: unknown) => v,
    withSpring: (v: unknown) => v,
    withDelay: (_d: unknown, v: unknown) => v,
  };
});

jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));
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

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  return {
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
    useLocalSearchParams: () => ({}),
    Redirect: ({ href }: { href: string }) => <View testID="redirect" accessibilityLabel={href} />,
  };
});

// ADR-098 §2.4.2: WEATHER 게이팅 — 렌더링 검증을 위해 기본 ON, 게이팅 테스트에서 OFF로 전환
jest.mock('@yiroom/shared', () => ({
  FEATURE_FLAGS: {
    WELLNESS_PHASE2: false,
    CLOSET_INTEGRATION: false,
    WEATHER: true,
    SOCIAL_FEED: false,
    BADGES: false,
  },
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
      background: '#fff',
      foreground: '#000',
      card: '#f5f5f5',
      border: '#e0e0e0',
      mutedForeground: '#888',
      secondary: '#f0f0f0',
    },
    brand: { primary: '#6366f1', primaryForeground: '#fff' },
    spacing: { xxs: 2, xs: 4, sm: 8, smx: 12, md: 16, lg: 24, xl: 32 },
    radii: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
    typography: {
      size: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
      weight: { medium: '500', semibold: '600', bold: '700' },
    },
    status: { error: '#ef4444', warning: '#f59e0b', success: '#22c55e', info: '#3b82f6' },
    module: { body: { base: '#6366f1' } },
    isDark: false,
  }),
}));

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <View testID={testID}>{children}</View>
    ),
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
  };
});

// SUT
import WeatherOutfitScreen from '../../../app/(closet)/weather';
import { renderWithTheme } from '../../helpers/test-utils';

// -------------------------------------------------------------------
// 테스트
// -------------------------------------------------------------------
describe('WeatherOutfitScreen 렌더링', () => {
  it('화면이 testID "weather-outfit-screen"으로 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<WeatherOutfitScreen />);
    expect(getByTestId('weather-outfit-screen')).toBeTruthy();
  });

  it('날씨 정보가 표시된다 (온도, 상태, 습도)', () => {
    const { getByText } = renderWithTheme(<WeatherOutfitScreen />);
    expect(getByText('12\u00B0C')).toBeTruthy();
  });

  it('추천 코디 목록과 옷장 바로가기 버튼이 표시된다', () => {
    const { getByText } = renderWithTheme(<WeatherOutfitScreen />);
    expect(getByText('오늘의 추천 코디')).toBeTruthy();
    expect(getByText('가벼운 봄 레이어링')).toBeTruthy();
    expect(getByText('캐주얼 외출룩')).toBeTruthy();
    expect(getByText('오피스 룩')).toBeTruthy();
    expect(getByText('내 옷장에서 선택하기')).toBeTruthy();
  });
});

describe('WEATHER 게이팅 (ADR-098 §2.4.2)', () => {
  const { FEATURE_FLAGS } = jest.requireMock('@yiroom/shared');

  afterEach(() => {
    FEATURE_FLAGS.WEATHER = true;
  });

  it('WEATHER=false면 스타일 탭으로 리다이렉트한다', () => {
    FEATURE_FLAGS.WEATHER = false;
    const { getByTestId, queryByText } = renderWithTheme(<WeatherOutfitScreen />);
    expect(getByTestId('redirect')).toBeTruthy();
    expect(queryByText('오늘의 추천 코디')).toBeNull();
  });
});
