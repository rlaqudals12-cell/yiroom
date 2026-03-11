/**
 * 홈 탭 스크린 렌더링 테스트
 *
 * 대상: app/(tabs)/index.tsx (HomeScreen)
 * 의존성: useUser, useRouter, useTheme, useOnboardingCheck,
 *          useWorkoutData, useNutritionData, useUserAnalyses, useWidgetSync,
 *          HomeHeader, HomeTodaySection, HomeQuickActions
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import {
  ThemeContext,
  type ThemeContextValue,
} from '../../../lib/theme/ThemeProvider';
import {
  brand,
  lightColors,
  darkColors,
  moduleColors,
  statusColors,
  gradeColors,
  nutrientColors,
  scoreColors,
  trustColors,
  spacing,
  radii,
  shadows,
  typography,
} from '../../../lib/theme/tokens';

// 온보딩 완료 상태로 mock (홈 화면 렌더링 전제)
jest.mock('../../../lib/onboarding', () => ({
  useOnboardingCheck: jest.fn(() => ({
    isCompleted: true,
    isLoading: false,
  })),
}));

// 위젯 동기화 mock
jest.mock('../../../lib/widgets', () => ({
  useWidgetSync: jest.fn(() => ({
    syncAll: jest.fn(),
    isLoading: false,
  })),
}));

// 운동 데이터 mock
jest.mock('../../../hooks/useWorkoutData', () => ({
  useWorkoutData: jest.fn(() => ({
    streak: { currentStreak: 3, lastWorkoutDate: '2026-02-20' },
    todayWorkout: null,
    weeklyLogs: [],
    analysis: null,
    isLoading: false,
  })),
  getWorkoutTypeLabel: jest.fn((type: string) => type),
  getWorkoutTypeDescription: jest.fn((type: string) => type),
}));

// 영양 데이터 mock
jest.mock('../../../hooks/useNutritionData', () => ({
  useNutritionData: jest.fn(() => ({
    todaySummary: {
      totalCalories: 1500,
      mealCount: 2,
      waterIntake: 1200,
    },
    weeklyHistory: [],
    settings: {
      dailyCalorieGoal: 2000,
      waterGoal: 2000,
    },
    streak: null,
    isLoading: false,
  })),
  calculateCalorieProgress: jest.fn(
    (consumed: number, goal: number) => Math.round((consumed / goal) * 100)
  ),
  getNutrientStatus: jest.fn(),
  getNutrientStatusColor: jest.fn(),
}));

// 분석 결과 mock
jest.mock('../../../hooks/useUserAnalyses', () => ({
  useUserAnalyses: jest.fn(() => ({
    personalColor: { season: 'spring' },
    skinAnalysis: null,
    bodyAnalysis: null,
    isLoading: false,
  })),
}));

// 교차 모듈 인사이트 mock
jest.mock('../../../hooks/useCrossModuleInsights', () => ({
  useCrossModuleInsights: jest.fn(() => ({
    insights: [],
  })),
}));

// 홈 하위 컴포넌트 mock (렌더링 오류 방지)
jest.mock('../../../components/home', () => {
  const { View, Text } = require('react-native');
  return {
    HomeHeader: ({ userName }: { userName: string }) => (
      <View testID="home-header">
        <Text>{userName}</Text>
      </View>
    ),
    HomeTodaySection: () => <View testID="home-today-section" />,
    HomeQuickActions: () => <View testID="home-quick-actions" />,
    CrossModuleInsight: () => <View testID="cross-module-insight" />,
    InternalizationWidget: () => <View testID="internalization-widget" />,
  };
});

// 캡슐 컴포넌트 mock
jest.mock('../../../components/capsule/DailyCapsuleCard', () => {
  const { View } = require('react-native');
  return {
    DailyCapsuleCard: () => <View testID="daily-capsule-card" />,
  };
});

// 캡슐 hooks mock
jest.mock('../../../lib/capsule/hooks', () => ({
  useDailyCapsule: jest.fn(() => ({
    capsule: null,
    isLoading: false,
    refresh: jest.fn(),
    fetchToday: jest.fn(),
  })),
}));

// UI 컴포넌트 mock
jest.mock('../../../components/ui', () => {
  const { View, Text } = require('react-native');
  return {
    GradientCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
    AnimatedCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
    GlassCard: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
    SectionHeader: ({ title, ...props }: { title: string; [key: string]: unknown }) => (
      <View {...props}><Text>{title}</Text></View>
    ),
    StatCard: ({ label, value, ...props }: { label: string; value: string; [key: string]: unknown }) => (
      <View testID="stat-card" {...props}><Text>{label}</Text><Text>{value}</Text></View>
    ),
    SkeletonText: () => <View />,
    SkeletonCard: (props: Record<string, unknown>) => <View testID={props.testID as string} />,
    SkeletonCircle: () => <View />,
    ScreenContainer: ({ children, testID }: { children: React.ReactNode; testID?: string; [key: string]: unknown }) => (
      <View testID={testID}>{children}</View>
    ),
  };
});

// react-native-safe-area-context mock
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <View {...props}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// expo-linear-gradient mock
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// expo-haptics mock
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

// lucide-react-native mock
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, {
    get: () => (props: Record<string, unknown>) => <View {...props} />,
  });
});

// react-native-reanimated mock (체이닝 전체 지원)
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  // 모든 체이닝 메서드를 지원하는 Proxy
  const createChainable = (): unknown => new Proxy({}, { get: () => createChainable });
  const AnimatedView = View;
  return {
    __esModule: true,
    default: {
      View: AnimatedView,
      createAnimatedComponent: (c: unknown) => c,
    },
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

// lib/animations mock (presets에서 Reanimated 체이닝 우회)
jest.mock('../../../lib/animations', () => ({
  TIMING: { fast: 200, normal: 300, slow: 500 },
  ENTERING: {},
  staggeredEntry: jest.fn(() => undefined),
  usePulseGlow: jest.fn(() => ({ opacity: 1, transform: [{ scale: 1 }] })),
}));

import HomeScreen from '../../../app/(tabs)/index';

function createThemeValue(isDark = false): ThemeContextValue {
  return {
    colors: isDark ? darkColors : lightColors,
    brand,
    module: moduleColors,
    status: statusColors,
    spacing,
    radii,
    shadows,
    typography,
    isDark,
    colorScheme: isDark ? 'dark' : 'light',
    themeMode: 'system' as const,
    setThemeMode: jest.fn(),
    grade: gradeColors,
    nutrient: nutrientColors,
    score: scoreColors,
    trust: trustColors,
  };
}

function renderWithTheme(ui: React.ReactElement, isDark = false) {
  return render(
    <ThemeContext.Provider value={createThemeValue(isDark)}>
      {ui}
    </ThemeContext.Provider>
  );
}

describe('HomeScreen', () => {
  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<HomeScreen />);
      expect(getByTestId('home-screen')).toBeTruthy();
    });

    it('홈 헤더가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<HomeScreen />);
      expect(getByTestId('home-header')).toBeTruthy();
    });

    it('오늘 섹션이 표시된다', () => {
      const { getByTestId } = renderWithTheme(<HomeScreen />);
      expect(getByTestId('home-today-section')).toBeTruthy();
    });

    it('퀵 액션 섹션이 표시된다', () => {
      const { getByTestId } = renderWithTheme(<HomeScreen />);
      expect(getByTestId('home-quick-actions')).toBeTruthy();
    });

    it('오늘의 요약 StatCard가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<HomeScreen />);
      // StatCard countUp 애니메이션은 Jest에서 미동작 → testID + accessibilityLabel로 검증
      expect(getByTestId('stat-workout')).toBeTruthy();
      expect(getByTestId('stat-calorie')).toBeTruthy();
      expect(getByTestId('stat-analysis')).toBeTruthy();
    });

    it('사용자 이름을 HomeHeader에 전달한다', () => {
      const { getByText } = renderWithTheme(<HomeScreen />);
      // jest.setup.js에서 useUser mock의 firstName이 '테스트'
      expect(getByText('테스트')).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<HomeScreen />, true);
      expect(getByTestId('home-screen')).toBeTruthy();
    });
  });

  describe('온보딩 미완료 상태', () => {
    it('온보딩 로딩 중에는 스켈레톤 로더를 표시한다', () => {
      const { useOnboardingCheck } = require('../../../lib/onboarding');
      // React 18 strict mode double-invocation 대응: mockReturnValue 사용
      useOnboardingCheck.mockReturnValue({
        isCompleted: false,
        isLoading: true,
      });

      const { queryByTestId } = renderWithTheme(<HomeScreen />);
      // 로딩 중에는 home-screen-loading testID 표시 (스켈레톤)
      expect(queryByTestId('home-screen-loading')).toBeTruthy();

      // 기본 mock 복원
      useOnboardingCheck.mockReturnValue({
        isCompleted: true,
        isLoading: false,
      });
    });
  });
});
