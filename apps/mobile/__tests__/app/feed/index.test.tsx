/**
 * 피드 목록 화면 렌더링 테스트
 *
 * 대상: app/(feed)/index.tsx (FeedScreen)
 * 의존성: useFeed, useRouter, useTheme
 */
import React from 'react';

import { renderWithTheme } from '../../helpers/test-utils';

// --- 공통 mock ---

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
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// --- 컴포넌트/라이브러리 mock ---

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
  return {
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string; [key: string]: unknown }) => <View testID={testID}>{children}</View>,
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <View {...props}>{children}</View>,
  };
});

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

const mockUseFeed = jest.fn(() => ({
  items: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  hasMore: false,
  activeTab: 'all' as const,
  setActiveTab: jest.fn(),
  refetch: jest.fn(),
  loadMore: jest.fn(),
  handleLike: jest.fn(),
}));

jest.mock('../../../lib/feed/useFeed', () => ({
  useFeed: () => mockUseFeed(),
}));

// --- 테스트 ---

import FeedScreen from '../../../app/(feed)/index';

describe('FeedScreen', () => {
  beforeEach(() => {
    mockUseFeed.mockReturnValue({
      items: [],
      isLoading: false,
      isLoadingMore: false,
      error: null,
      hasMore: false,
      activeTab: 'all' as const,
      setActiveTab: jest.fn(),
      refetch: jest.fn(),
      loadMore: jest.fn(),
      handleLike: jest.fn(),
    });
  });

  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<FeedScreen />);
    expect(getByTestId('feed-screen')).toBeTruthy();
  });

  it('로딩 상태에서 로딩 텍스트가 표시된다', () => {
    mockUseFeed.mockReturnValue({
      items: [],
      isLoading: true,
      isLoadingMore: false,
      error: null,
      hasMore: false,
      activeTab: 'all' as const,
      setActiveTab: jest.fn(),
      refetch: jest.fn(),
      loadMore: jest.fn(),
      handleLike: jest.fn(),
    });

    const { getByText } = renderWithTheme(<FeedScreen />);
    expect(getByText('피드를 불러오는 중...')).toBeTruthy();
  });

  it('탭 라벨이 표시된다', () => {
    const { getByText } = renderWithTheme(<FeedScreen />);
    expect(getByText('내 활동')).toBeTruthy();
    expect(getByText('친구')).toBeTruthy();
    expect(getByText('전체')).toBeTruthy();
  });
});
