/**
 * 분석 이력 화면 렌더링 테스트
 *
 * 대상: app/(analysis)/history/index.tsx
 * testID: analysis-history-screen
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
  selectionAsync: jest.fn(),
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
  useLocalSearchParams: jest.fn(() => ({})),
}));

const mockHistoryHook = {
  items: [],
  isLoading: false,
  error: null,
  refetch: jest.fn(),
  hasMore: false,
  loadMore: jest.fn(),
};
jest.mock('../../../hooks/useAnalysisHistory', () => ({
  useAnalysisHistory: jest.fn(() => mockHistoryHook),
}));

jest.mock('../../../components/analysis/AnalysisHistoryCard', () => {
  const { View, Text } = require('react-native');
  return {
    AnalysisHistoryCard: ({ item }: { item: { id: string } }) => (
      <View testID="history-card">
        <Text>{item.id}</Text>
      </View>
    ),
  };
});

jest.mock('../../../components/ui', () => {
  const { View } = require('react-native');
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
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View>{children}</View>,
  };
});

// --- Import screen after mocks ---
import AnalysisHistoryScreen from '../../../app/(analysis)/history/index';

describe('AnalysisHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<AnalysisHistoryScreen />);
    expect(getByTestId('analysis-history-screen')).toBeTruthy();
  });

  it('로딩 상태에서 로딩 텍스트가 표시된다', () => {
    const { useAnalysisHistory } = require('../../../hooks/useAnalysisHistory');
    useAnalysisHistory.mockReturnValue({
      ...mockHistoryHook,
      isLoading: true,
      items: [],
    });

    const { getByText } = renderWithTheme(<AnalysisHistoryScreen />);
    expect(getByText('이력을 불러오고 있어요')).toBeTruthy();
  });

  it('빈 상태에서 안내 메시지가 표시된다', () => {
    const { useAnalysisHistory } = require('../../../hooks/useAnalysisHistory');
    useAnalysisHistory.mockReturnValue({
      ...mockHistoryHook,
      isLoading: false,
      items: [],
    });

    const { getByText } = renderWithTheme(<AnalysisHistoryScreen />);
    expect(getByText('분석 기록이 없어요')).toBeTruthy();
  });
});
