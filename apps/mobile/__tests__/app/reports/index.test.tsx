/**
 * R-1 통합 리포트 스크린 테스트
 *
 * 대상: app/(reports)/index.tsx (ReportsScreen)
 * 의존성: useTheme, useUser, useUserAnalyses, useWorkoutData, useNutritionData, expo-router
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

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

// react-native-safe-area-context mock
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

// 분석 결과 mock
const mockUseUserAnalyses = jest.fn(() => ({
  personalColor: null,
  skinAnalysis: null,
  bodyAnalysis: null,
  isLoading: false,
}));

jest.mock('../../../hooks/useUserAnalyses', () => ({
  useUserAnalyses: () => mockUseUserAnalyses(),
}));

// 운동 데이터 mock
const mockUseWorkoutData = jest.fn(() => ({
  streak: { currentStreak: 0 },
  todayWorkout: null,
  weeklyLogs: [],
  analysis: null,
  isLoading: false,
}));

jest.mock('../../../hooks/useWorkoutData', () => ({
  useWorkoutData: () => mockUseWorkoutData(),
  getWorkoutTypeLabel: jest.fn((type: string) => type),
  getWorkoutTypeDescription: jest.fn((type: string) => type),
}));

// 영양 데이터 mock
const mockUseNutritionData = jest.fn(() => ({
  todaySummary: null,
  weeklyHistory: [],
  settings: null,
  streak: { currentStreak: 0 },
  isLoading: false,
}));

jest.mock('../../../hooks/useNutritionData', () => ({
  useNutritionData: () => mockUseNutritionData(),
  calculateCalorieProgress: jest.fn(() => 0),
  getNutrientStatus: jest.fn(),
  getNutrientStatusColor: jest.fn(),
}));

// 로거 mock
jest.mock('../../../lib/utils/logger', () => ({
  profileLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

import ReportsScreen from '../../../app/(reports)/index';

// ============================================================
// 테마 헬퍼
// ============================================================

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

// ============================================================
// 테스트
// ============================================================

describe('ReportsScreen', () => {
  const { router } = require('expo-router');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserAnalyses.mockReturnValue({
      personalColor: null,
      skinAnalysis: null,
      bodyAnalysis: null,
      isLoading: false,
    });
    mockUseWorkoutData.mockReturnValue({
      streak: { currentStreak: 0 },
      todayWorkout: null,
      weeklyLogs: [],
      analysis: null,
      isLoading: false,
    });
    mockUseNutritionData.mockReturnValue({
      todaySummary: null,
      weeklyHistory: [],
      settings: null,
      streak: { currentStreak: 0 },
      isLoading: false,
    });
  });

  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<ReportsScreen />);
      expect(getByTestId('reports-screen')).toBeTruthy();
    });

    it('프로필 헤더에 사용자 이름이 표시된다', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />);
      // jest.setup.js mock: firstName = '테스트'
      expect(getByText('테스트')).toBeTruthy();
    });

    it('섹션 타이틀들이 표시된다', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText('나의 분석 결과')).toBeTruthy();
      expect(getByText('운동 현황')).toBeTruthy();
      expect(getByText('영양 현황')).toBeTruthy();
    });

    it('인사이트 섹션이 표시된다', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText('오늘의 인사이트')).toBeTruthy();
    });
  });

  describe('데이터 없는 초기 상태', () => {
    it('분석 안내 배너가 표시된다', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText('분석을 완료하면 실제 결과가 여기에 표시돼요!')).toBeTruthy();
    });

    it('프로필 헤더에 미분석 상태 표시', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText('아직 분석 결과가 없어요')).toBeTruthy();
    });

    it('분석 카드에 "분석하기" 텍스트가 표시된다', () => {
      const { getAllByText } = renderWithTheme(<ReportsScreen />);
      const analyzeButtons = getAllByText('분석하기');
      expect(analyzeButtons.length).toBe(3);
    });

    it('운동 빈 상태 메시지가 표시된다', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText('운동을 시작해보세요')).toBeTruthy();
    });

    it('영양 빈 상태 메시지가 표시된다', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText('식단을 기록해보세요')).toBeTruthy();
    });

    it('기본 인사이트 메시지가 표시된다', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText('분석을 시작하면 맞춤 인사이트를 제공해드려요!')).toBeTruthy();
    });
  });

  describe('분석 데이터가 있을 때', () => {
    beforeEach(() => {
      mockUseUserAnalyses.mockReturnValue({
        personalColor: { season: 'Spring', tone: 'Bright', colorPalette: [] },
        skinAnalysis: { skinType: 'combination', overallScore: 78, concerns: [] },
        bodyAnalysis: { bodyType: 'hourglass', height: 165, weight: 55, bmi: 20.2 },
        isLoading: false,
      });
    });

    it('안내 배너가 숨겨진다', () => {
      const { queryByText } = renderWithTheme(<ReportsScreen />);
      expect(queryByText('분석을 완료하면 실제 결과가 여기에 표시돼요!')).toBeNull();
    });

    it('프로필 헤더에 완료된 분석이 표시된다', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText('퍼스널컬러, 피부, 체형 분석 완료')).toBeTruthy();
    });

    it('퍼스널 컬러 결과가 표시된다', () => {
      const { getByText, getByTestId } = renderWithTheme(<ReportsScreen />);
      expect(getByTestId('report-card-pc')).toBeTruthy();
      expect(getByText('봄 웜톤')).toBeTruthy();
    });

    it('피부 분석 결과가 표시된다', () => {
      const { getByText, getByTestId } = renderWithTheme(<ReportsScreen />);
      expect(getByTestId('report-card-skin')).toBeTruthy();
      expect(getByText('복합성')).toBeTruthy();
      expect(getByText('78점')).toBeTruthy();
    });

    it('체형 분석 결과가 표시된다', () => {
      const { getByText, getByTestId } = renderWithTheme(<ReportsScreen />);
      expect(getByTestId('report-card-body')).toBeTruthy();
      expect(getByText('모래시계형')).toBeTruthy();
      expect(getByText('BMI 20.2')).toBeTruthy();
    });

    it('맞춤 인사이트 메시지가 표시된다', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText(/봄 웜톤인 당신에게는/)).toBeTruthy();
    });
  });

  describe('운동 데이터가 있을 때', () => {
    it('운동 연속 일수가 표시된다', () => {
      mockUseWorkoutData.mockReturnValue({
        streak: { currentStreak: 5 },
        todayWorkout: null,
        weeklyLogs: [],
        analysis: { workoutType: 'strength' },
        isLoading: false,
      });

      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText('5일 연속 운동 중')).toBeTruthy();
    });
  });

  describe('영양 데이터가 있을 때', () => {
    it('오늘 섭취 칼로리가 표시된다', () => {
      mockUseNutritionData.mockReturnValue({
        todaySummary: { totalCalories: 1850, totalProtein: 80, totalCarbs: 200, totalFat: 60, waterIntake: 1500, mealCount: 3, date: '2026-02-21' },
        weeklyHistory: [],
        settings: { dailyCalorieGoal: 2000, proteinGoal: 100, carbsGoal: 250, fatGoal: 70, waterGoal: 2000, mealCount: 3 },
        streak: { currentStreak: 3 },
        isLoading: false,
      });

      const { getByText } = renderWithTheme(<ReportsScreen />);
      expect(getByText('1850 kcal')).toBeTruthy();
      expect(getByText('목표: 2000 kcal')).toBeTruthy();
    });
  });

  describe('네비게이션 상호작용', () => {
    it('퍼스널 컬러 카드 클릭 시 분석 페이지로 이동', () => {
      const { getByTestId } = renderWithTheme(<ReportsScreen />);
      fireEvent.press(getByTestId('report-card-pc'));
      expect(router.push).toHaveBeenCalledWith('/(analysis)/personal-color');
    });

    it('피부 분석 카드 클릭 시 분석 페이지로 이동', () => {
      const { getByTestId } = renderWithTheme(<ReportsScreen />);
      fireEvent.press(getByTestId('report-card-skin'));
      expect(router.push).toHaveBeenCalledWith('/(analysis)/skin');
    });

    it('체형 분석 카드 클릭 시 분석 페이지로 이동', () => {
      const { getByTestId } = renderWithTheme(<ReportsScreen />);
      fireEvent.press(getByTestId('report-card-body'));
      expect(router.push).toHaveBeenCalledWith('/(analysis)/body');
    });

    it('운동 카드 클릭 시 운동 온보딩으로 이동', () => {
      const { getByTestId } = renderWithTheme(<ReportsScreen />);
      fireEvent.press(getByTestId('report-workout'));
      expect(router.push).toHaveBeenCalledWith('/(workout)/onboarding');
    });

    it('영양 카드 클릭 시 영양 대시보드로 이동', () => {
      const { getByTestId } = renderWithTheme(<ReportsScreen />);
      fireEvent.press(getByTestId('report-nutrition'));
      expect(router.push).toHaveBeenCalledWith('/(nutrition)/dashboard');
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<ReportsScreen />, true);
      expect(getByTestId('reports-screen')).toBeTruthy();
    });

    it('다크 모드에서 섹션들이 표시된다', () => {
      const { getByText } = renderWithTheme(<ReportsScreen />, true);
      expect(getByText('나의 분석 결과')).toBeTruthy();
      expect(getByText('오늘의 인사이트')).toBeTruthy();
    });
  });
});
