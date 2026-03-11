/**
 * 분석 비교 화면 렌더링 테스트
 *
 * 대상: app/(analysis)/compare.tsx
 * testID: compare-screen
 */
import React from 'react';

import { renderWithTheme } from '../../helpers/test-utils';

// --- Standard mocks ---

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => (props: Record<string, unknown>) => <View {...props} />,
    }
  );
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = (): unknown =>
    new Proxy(
      {},
      { get: () => createChainable }
    );
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

jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
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

// --- Screen-specific mocks ---

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  router: mockRouter,
  useLocalSearchParams: jest.fn(() => ({ module: 'skin' })),
}));

const mockComparisonData = {
  data: null,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
};
jest.mock('../../../hooks/useAnalysisComparison', () => ({
  useAnalysisComparison: jest.fn(() => mockComparisonData),
}));

jest.mock('../../../hooks/useAnalysisHistory', () => ({
  // 타입만 re-export 용도
}));

jest.mock('../../../components/analysis/ComparisonCard', () => {
  const { View, Text } = require('react-native');
  return {
    ComparisonCard: (props: Record<string, unknown>) => (
      <View testID={props.testID as string}>
        <Text>ComparisonCard</Text>
      </View>
    ),
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
  };
});

// --- Import screen after mocks ---
import CompareScreen from '../../../app/(analysis)/compare';

describe('CompareScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<CompareScreen />);
    expect(getByTestId('compare-screen')).toBeTruthy();
  });

  it('데이터가 없을 때 DataStateWrapper가 빈 상태를 표시한다', () => {
    const { getByTestId } = renderWithTheme(<CompareScreen />);
    // data가 null이므로 isEmpty=true → data-state-wrapper 표시
    expect(getByTestId('data-state-wrapper')).toBeTruthy();
  });

  it('데이터가 있을 때 ComparisonCard가 표시된다', () => {
    const { useAnalysisComparison } = require('../../../hooks/useAnalysisComparison');
    useAnalysisComparison.mockReturnValue({
      data: {
        title: '피부 분석 비교',
        metrics: [],
        previousTotal: 70,
        currentTotal: 80,
        isFirstAnalysis: false,
        previousDate: new Date('2026-01-01'),
        currentDate: new Date('2026-01-15'),
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByTestId } = renderWithTheme(<CompareScreen />);
    expect(getByTestId('comparison-card')).toBeTruthy();
  });
});
