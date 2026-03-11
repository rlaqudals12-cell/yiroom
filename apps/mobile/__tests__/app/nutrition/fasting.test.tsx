/**
 * 단식 트래커 화면 렌더링 테스트
 *
 * 대상: app/(nutrition)/fasting/index.tsx
 * 의존성: useTheme, useClerkSupabaseClient, ScreenContainer, DataStateWrapper
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
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
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

// Supabase mock — 단식 데이터 빈 상태 반환
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  not: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
};

jest.mock('../../../lib/supabase', () => ({
  useClerkSupabaseClient: () => mockSupabase,
}));

jest.mock('../../../lib/utils/logger', () => ({
  nutritionLogger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import FastingTrackerScreen from '../../../app/(nutrition)/fasting/index';

// ============================================================
// 테스트
// ============================================================

describe('FastingTrackerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // limit() 체인 후 호출되는 maybeSingle 설정
    mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });
    // not() 체인 후 history 반환
    mockSupabase.limit.mockReturnThis();
    // 이후 체인에서 history가 필요하면 data: [] 반환
  });

  it('testID "fasting-tracker-screen"이 존재한다', () => {
    const { getByTestId } = renderWithTheme(<FastingTrackerScreen />);
    expect(getByTestId('fasting-tracker-screen')).toBeTruthy();
  });

  it('단식 시작 버튼이 표시된다', async () => {
    const { findByText } = renderWithTheme(<FastingTrackerScreen />);
    const button = await findByText('단식 시작');
    expect(button).toBeTruthy();
  });

  it('타이머 초기값 00:00:00이 표시된다', async () => {
    const { findByText } = renderWithTheme(<FastingTrackerScreen />);
    const timer = await findByText('00:00:00');
    expect(timer).toBeTruthy();
  });
});
