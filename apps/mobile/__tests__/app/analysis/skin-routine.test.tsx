/**
 * 스킨케어 루틴 화면 렌더링 테스트
 *
 * 대상: app/(analysis)/skin/routine.tsx
 * testID: analysis-skin-routine-screen
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

const mockRoutineHook = {
  loading: false,
  error: null,
  skinData: null,
  activeTime: 'morning' as const,
  morningSteps: [],
  eveningSteps: [],
  currentSteps: [],
  personalizationNote: null,
  skinTypeLabel: '',
  timeLabel: '아침',
  formattedTime: '5분',
  setActiveTime: jest.fn(),
  refresh: jest.fn(),
};
jest.mock('../../../lib/skincare', () => ({
  useSkincareRoutine: jest.fn(() => mockRoutineHook),
  getCategoryInfo: jest.fn(() => ({ emoji: '🧴', label: '보습' })),
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
import SkincareRoutineScreen from '../../../app/(analysis)/skin/routine';

describe('SkincareRoutineScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('에러 없이 렌더링된다', () => {
    const { getByTestId } = renderWithTheme(<SkincareRoutineScreen />);
    expect(getByTestId('analysis-skin-routine-screen')).toBeTruthy();
  });

  it('스킨 데이터가 없으면 DataStateWrapper 빈 상태가 표시된다', () => {
    const { getByTestId } = renderWithTheme(<SkincareRoutineScreen />);
    // skinData가 null이므로 isEmpty=true
    expect(getByTestId('data-state-wrapper')).toBeTruthy();
  });

  it('스킨 데이터가 있으면 루틴 제목이 표시된다', () => {
    const { useSkincareRoutine } = require('../../../lib/skincare');
    useSkincareRoutine.mockReturnValue({
      ...mockRoutineHook,
      skinData: { skin_type: 'combination' },
      skinTypeLabel: '복합성',
    });

    const { getByText } = renderWithTheme(<SkincareRoutineScreen />);
    expect(getByText('오늘의 스킨케어 루틴')).toBeTruthy();
  });
});
