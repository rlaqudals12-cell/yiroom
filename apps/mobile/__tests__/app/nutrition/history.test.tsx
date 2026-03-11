/**
 * 영양 히스토리 화면 렌더링 테스트
 *
 * 대상: app/(nutrition)/history/index.tsx
 * 의존성: useTheme, ScreenContainer, GlassCard, MOCK_HISTORY 데이터
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

jest.mock('../../../lib/theme', () => {
  const actual = jest.requireActual('../../../lib/theme');
  return {
    ...actual,
    coloredShadow: jest.fn(() => ({})),
  };
});

import NutritionHistoryScreen from '../../../app/(nutrition)/history/index';

// ============================================================
// 테스트
// ============================================================

describe('NutritionHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('testID "nutrition-history-screen"이 존재한다', () => {
    const { getByTestId } = renderWithTheme(<NutritionHistoryScreen />);
    expect(getByTestId('nutrition-history-screen')).toBeTruthy();
  });

  it('영양 히스토리 제목이 표시된다', () => {
    const { getByText } = renderWithTheme(<NutritionHistoryScreen />);
    expect(getByText('영양 히스토리')).toBeTruthy();
  });

  it('MOCK 데이터의 첫 번째 기록 날짜 라벨이 표시된다', () => {
    const { getByText } = renderWithTheme(<NutritionHistoryScreen />);
    expect(getByText('오늘')).toBeTruthy();
  });
});
