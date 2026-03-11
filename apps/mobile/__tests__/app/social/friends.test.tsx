/**
 * 친구 목록 화면 렌더링 테스트
 *
 * 대상: app/(social)/friends/index.tsx
 * 의존성: useTheme, useFriends, useFriendStats, expo-router, getTierColor
 */
import React from 'react';

import { renderWithTheme } from '../../helpers/test-utils';

// ============================================================
// Mocks
// ============================================================

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    { get: () => (props: Record<string, unknown>) => <View {...props} /> }
  );
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = (): unknown =>
    new Proxy({}, { get: () => createChainable });
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

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

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

jest.mock('../../../components/ui', () => {
  const { View, Text } = require('react-native');
  return {
    ScreenContainer: ({
      children,
      testID,
    }: {
      children: React.ReactNode;
      testID?: string;
      [key: string]: unknown;
    }) => <View testID={testID}>{children}</View>,
    GlassCard: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    DataStateWrapper: ({
      children,
      isLoading,
      isEmpty,
    }: {
      children: React.ReactNode;
      isLoading: boolean;
      isEmpty: boolean;
      [key: string]: unknown;
    }) =>
      isLoading || isEmpty ? (
        <View testID="data-state-wrapper" />
      ) : (
        <View>{children}</View>
      ),
    SectionHeader: ({
      title,
    }: {
      title: string;
      [key: string]: unknown;
    }) => (
      <View>
        <Text>{title}</Text>
      </View>
    ),
    AnimatedCard: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View {...props}>{children}</View>,
    StatCard: ({
      label,
      value,
    }: {
      label: string;
      value: string;
      [key: string]: unknown;
    }) => (
      <View>
        <Text>{label}</Text>
        <Text>{value}</Text>
      </View>
    ),
  };
});

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({
    opacity: 1,
    transform: [{ scale: 1 }],
  })),
}));

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  router: mockRouter,
  useLocalSearchParams: () => ({}),
}));

jest.mock('../../../lib/social', () => ({
  getTierColor: jest.fn(() => '#ffd700'),
}));

const mockUseFriends = jest.fn(() => ({
  friends: [],
  isLoading: false,
  refetch: jest.fn(),
}));

const mockUseFriendStats = jest.fn(() => ({
  stats: { totalFriends: 0, pendingRequests: 0, sentRequests: 0 },
}));

jest.mock('../../../lib/social/useFriends', () => ({
  useFriends: (...args: unknown[]) => mockUseFriends(...args),
  useFriendStats: (...args: unknown[]) => mockUseFriendStats(...args),
}));

import FriendsScreen from '../../../app/(social)/friends/index';

// ============================================================
// 테스트
// ============================================================

describe('FriendsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFriends.mockReturnValue({
      friends: [],
      isLoading: false,
      refetch: jest.fn(),
    });
    mockUseFriendStats.mockReturnValue({
      stats: { totalFriends: 5, pendingRequests: 2, sentRequests: 1 },
    });
  });

  it('testID "social-friends-screen"이 존재한다', () => {
    const { getByTestId } = renderWithTheme(<FriendsScreen />);
    expect(getByTestId('social-friends-screen')).toBeTruthy();
  });

  it('친구 없을 때 빈 상태 메시지가 표시된다', () => {
    const { getByText } = renderWithTheme(<FriendsScreen />);
    expect(getByText('아직 친구가 없어요')).toBeTruthy();
    expect(getByText('친구를 찾아 함께 운동해보세요!')).toBeTruthy();
  });

  it('통계 카드에 친구 수와 요청 수가 표시된다', () => {
    const { getByText } = renderWithTheme(<FriendsScreen />);
    expect(getByText('5')).toBeTruthy();
    expect(getByText('친구')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('받은 요청')).toBeTruthy();
  });
});
