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

// LayoutAnimation mock (테스트 환경에서 미지원)
jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation', () => ({
  configureNext: jest.fn(),
  Presets: { easeInEaseOut: {} },
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

    it('더 보기 버튼이 표시된다', () => {
      const { getByText } = renderWithTheme(<HomeScreen />);
      expect(getByText('더 보기')).toBeTruthy();
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
    it('온보딩 로딩 중에는 로딩 인디케이터를 표시한다', () => {
      const { useOnboardingCheck } = require('../../../lib/onboarding');
      useOnboardingCheck.mockReturnValueOnce({
        isCompleted: false,
        isLoading: true,
      });

      const { queryByTestId } = renderWithTheme(<HomeScreen />);
      // 로딩 중에는 home-screen testID가 없음 (로딩 화면 표시)
      expect(queryByTestId('home-screen')).toBeNull();
    });
  });
});
