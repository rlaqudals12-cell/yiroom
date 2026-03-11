/**
 * 피부 다이어리 화면 렌더링 테스트
 *
 * 대상: app/(analysis)/skin/diary.tsx
 * testID: skin-diary-screen
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
}));

const mockDiaryHook = {
  entries: [],
  loading: false,
  error: null,
  summary: null,
  year: 2026,
  month: 3,
  setMonth: jest.fn(),
  deleteEntry: jest.fn(),
  refresh: jest.fn(),
};
jest.mock('../../../hooks/useSkinDiary', () => ({
  useSkinDiary: jest.fn(() => mockDiaryHook),
}));

jest.mock('../../../lib/skincare/diary-types', () => ({
  CONDITION_LABELS: { good: '좋음', normal: '보통', bad: '나쁨' },
  CONDITION_EMOJIS: { good: '😊', normal: '😐', bad: '😟' },
  WEATHER_ICONS: { sunny: '☀️', cloudy: '☁️', rainy: '🌧️' },
  WEATHER_LABELS: { sunny: '맑음', cloudy: '흐림', rainy: '비' },
}));

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
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => <View>{children}</View>,
  };
});

// --- Import screen after mocks ---
import SkinDiaryScreen from '../../../app/(analysis)/skin/diary';

describe('SkinDiaryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<SkinDiaryScreen />);
    expect(getByTestId('skin-diary-screen')).toBeTruthy();
  });

  it('로딩 상태에서 로딩 텍스트가 표시된다', () => {
    const { useSkinDiary } = require('../../../hooks/useSkinDiary');
    useSkinDiary.mockReturnValue({
      ...mockDiaryHook,
      loading: true,
      entries: [],
    });

    const { getByText } = renderWithTheme(<SkinDiaryScreen />);
    expect(getByText('다이어리를 불러오는 중...')).toBeTruthy();
  });

  it('빈 상태에서 안내 메시지가 표시된다', () => {
    const { useSkinDiary } = require('../../../hooks/useSkinDiary');
    useSkinDiary.mockReturnValue(mockDiaryHook);

    const { getByText } = renderWithTheme(<SkinDiaryScreen />);
    expect(getByText('아직 기록이 없어요')).toBeTruthy();
  });
});
