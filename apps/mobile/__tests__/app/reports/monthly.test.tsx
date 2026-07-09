/**
 * 월간 리포트 화면 렌더링 테스트
 *
 * 대상: app/(reports)/monthly.tsx
 * 의존성: useTheme, useMonthlyReport, ScreenContainer, DataStateWrapper, GlassCard
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

// useMonthlyReport mock
const mockRefetch = jest.fn();
const mockUseMonthlyReport = jest.fn(() => ({
  report: null,
  isLoading: false,
  error: null,
  refetch: mockRefetch,
}));

jest.mock('../../../hooks/useMonthlyReport', () => ({
  useMonthlyReport: (...args: unknown[]) => (mockUseMonthlyReport as jest.Mock)(...args),
}));

import MonthlyReportScreen from '../../../app/(reports)/monthly';

// ============================================================
// 테스트
// ============================================================

describe('MonthlyReportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMonthlyReport.mockReturnValue({
      report: null,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('testID "monthly-report-screen"이 존재한다', () => {
    const { getByTestId } = renderWithTheme(<MonthlyReportScreen />);
    expect(getByTestId('monthly-report-screen')).toBeTruthy();
  });

  it('데이터 없을 때 빈 상태 래퍼가 표시된다', () => {
    const { getByTestId } = renderWithTheme(<MonthlyReportScreen />);
    // report가 null이면 isEmpty=true → DataStateWrapper가 빈 상태 렌더
    expect(getByTestId('data-state-wrapper')).toBeTruthy();
  });

  it('리포트 데이터가 있으면 운동 요약이 표시된다', () => {
    mockUseMonthlyReport.mockReturnValue({
      report: {
        month: '2026-03',
        workout: {
          totalSessions: 12,
          totalDuration: 720,
          totalCalories: 4500,
          bestStreak: 5,
        },
        nutrition: {
          averageCalories: 1800,
          averageProtein: 90,
          averageCarbs: 200,
          averageFat: 60,
          daysTracked: 20,
          goalAchievementRate: 75,
        },
        weeklyTrends: [
          {
            weekLabel: '1주차',
            workoutSessions: 3,
            workoutCalories: 1200,
            nutritionGoalRate: 80,
          },
        ],
        insights: ['운동 빈도가 증가했어요'],
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { getByText } = renderWithTheme(<MonthlyReportScreen />);
    expect(getByText('운동 요약')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
    expect(getByText('영양 요약')).toBeTruthy();
  });
});
