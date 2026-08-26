/**
 * 분석 이력 화면 렌더링 테스트
 *
 * 대상: app/(analysis)/history/index.tsx
 * testID: analysis-history-screen
 */
import React from 'react';
import { fireEvent } from '@testing-library/react-native';

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

const mockPush = jest.fn();
let mockSearchParams: { module?: string } = {};
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: jest.fn(() => mockSearchParams),
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
  const { Pressable, Text } = require('react-native');
  return {
    AnalysisHistoryCard: ({
      item,
      onPress,
    }: {
      item: { id: string };
      onPress: (item: { id: string }) => void;
    }) => (
      <Pressable testID="history-card" onPress={() => onPress(item)}>
        <Text>{item.id}</Text>
      </Pressable>
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
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
    DataStateWrapper: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View>{children}</View>
    ),
  };
});

// --- Import screen after mocks ---
import AnalysisHistoryScreen from '../../../app/(analysis)/history/index';

describe('AnalysisHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    const { useAnalysisHistory } = require('../../../hooks/useAnalysisHistory');
    useAnalysisHistory.mockReturnValue(mockHistoryHook);
  });

  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<AnalysisHistoryScreen />);
    expect(getByTestId('analysis-history-screen')).toBeTruthy();
  });

  it('/(analysis)/history?module=posture 직접 진입은 숨김 축 대신 전체 이력으로 폴백한다', () => {
    mockSearchParams = { module: 'posture' };
    const { useAnalysisHistory } = require('../../../hooks/useAnalysisHistory');

    renderWithTheme(<AnalysisHistoryScreen />);

    expect(useAnalysisHistory).toHaveBeenCalledWith('all', 'all');
  });

  it.each([
    ['personal-color', '/(analysis)/personal-color/result'],
    ['skin', '/(analysis)/skin/result'],
    ['body', '/(analysis)/body/result'],
    ['hair', '/(analysis)/hair/result'],
    ['makeup', '/(analysis)/makeup/result'],
  ] as const)('이력의 %s 행은 해당 historyId의 저장 결과 목적지를 연다', (moduleType, pathname) => {
    const { useAnalysisHistory } = require('../../../hooks/useAnalysisHistory');
    useAnalysisHistory.mockReturnValue({
      ...mockHistoryHook,
      items: [
        {
          id: `${moduleType}-history-2`,
          moduleType,
          createdAt: new Date('2026-08-20T00:00:00Z'),
          summary: `${moduleType} 저장 결과`,
        },
      ],
    });
    const { getByTestId } = renderWithTheme(<AnalysisHistoryScreen />);

    fireEvent.press(getByTestId('history-card'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname,
      params: { historyId: `${moduleType}-history-2` },
    });
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
