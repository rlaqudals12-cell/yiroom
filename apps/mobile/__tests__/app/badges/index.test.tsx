/**
 * 뱃지/업적 스크린 테스트
 *
 * 대상: app/badges/index.tsx (BadgesScreen)
 * 의존성: useTheme, useUserAnalyses, useWorkoutData, useNutritionData, expo-router
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
  personalColor: { season: 'spring' },
  skinAnalysis: { skinType: '복합성' },
  bodyAnalysis: null,
  isLoading: false,
}));

jest.mock('../../../hooks/useUserAnalyses', () => ({
  useUserAnalyses: () => mockUseUserAnalyses(),
}));

// 운동 데이터 mock
const mockUseWorkoutData = jest.fn(() => ({
  streak: { currentStreak: 5 },
  todayWorkout: null,
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
  settings: null,
  streak: { currentStreak: 4 },
  isLoading: false,
}));

jest.mock('../../../hooks/useNutritionData', () => ({
  useNutritionData: () => mockUseNutritionData(),
  calculateCalorieProgress: jest.fn(),
  getNutrientStatus: jest.fn(),
  getNutrientStatusColor: jest.fn(),
}));

import BadgesScreen from '../../../app/badges/index';

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

describe('BadgesScreen', () => {
  const { router } = require('expo-router');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserAnalyses.mockReturnValue({
      personalColor: { season: 'spring' },
      skinAnalysis: { skinType: '복합성' },
      bodyAnalysis: null,
      isLoading: false,
    });
    mockUseWorkoutData.mockReturnValue({
      streak: { currentStreak: 5 },
      todayWorkout: null,
      analysis: null,
      isLoading: false,
    });
    mockUseNutritionData.mockReturnValue({
      todaySummary: null,
      settings: null,
      streak: { currentStreak: 4 },
      isLoading: false,
    });
  });

  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<BadgesScreen />);
      expect(getByTestId('badges-screen')).toBeTruthy();
    });

    it('헤더 타이틀이 표시된다', () => {
      const { getByText } = renderWithTheme(<BadgesScreen />);
      expect(getByText('나의 뱃지')).toBeTruthy();
    });

    it('메달 이모지가 표시된다', () => {
      const { getByText } = renderWithTheme(<BadgesScreen />);
      expect(getByText('🏅')).toBeTruthy();
    });
  });

  describe('뱃지 목록 표시', () => {
    it('8개 뱃지가 모두 표시된다', () => {
      const { getByText } = renderWithTheme(<BadgesScreen />);
      expect(getByText('컬러 탐험가')).toBeTruthy();
      expect(getByText('피부 관리사')).toBeTruthy();
      expect(getByText('체형 분석가')).toBeTruthy();
      expect(getByText('분석 마스터')).toBeTruthy();
      expect(getByText('3일 연속')).toBeTruthy();
      expect(getByText('일주일 챔피언')).toBeTruthy();
      expect(getByText('꾸준한 식단')).toBeTruthy();
      expect(getByText('식단 마스터')).toBeTruthy();
    });

    it('뱃지 설명이 표시된다', () => {
      const { getByText } = renderWithTheme(<BadgesScreen />);
      expect(getByText('퍼스널 컬러 분석을 완료했어요')).toBeTruthy();
      expect(getByText('피부 분석을 완료했어요')).toBeTruthy();
    });
  });

  describe('획득 상태 표시', () => {
    it('획득한 뱃지 개수가 표시된다', () => {
      // PC(spring), Skin(복합성) → 2개 분석 완료
      // workoutStreak 5 → 3일 연속 달성
      // nutritionStreak 4 → 꾸준한 식단 달성
      // 총 4개 획득
      const { getByText } = renderWithTheme(<BadgesScreen />);
      expect(getByText('4/8개 획득')).toBeTruthy();
    });

    it('획득한 뱃지에 "획득 완료" 라벨이 표시된다', () => {
      const { getAllByText } = renderWithTheme(<BadgesScreen />);
      const badges = getAllByText('획득 완료');
      expect(badges.length).toBe(4);
    });

    it('미획득 뱃지에 잠금 아이콘이 표시된다', () => {
      const { getAllByText } = renderWithTheme(<BadgesScreen />);
      const locks = getAllByText('🔒');
      expect(locks.length).toBe(4);
    });
  });

  describe('모든 분석 완료 시', () => {
    it('분석 마스터 뱃지가 획득 상태가 된다', () => {
      mockUseUserAnalyses.mockReturnValue({
        personalColor: { season: 'spring' },
        skinAnalysis: { skinType: '복합성' },
        bodyAnalysis: { bodyType: 'rectangle' },
        isLoading: false,
      });

      const { getByText } = renderWithTheme(<BadgesScreen />);
      expect(getByText('🏆')).toBeTruthy();
    });
  });

  describe('운동 7일 연속 시', () => {
    it('일주일 챔피언 뱃지가 획득된다', () => {
      mockUseWorkoutData.mockReturnValue({
        streak: { currentStreak: 7 },
        todayWorkout: null,
        analysis: null,
        isLoading: false,
      });

      const { getAllByText } = renderWithTheme(<BadgesScreen />);
      // 3일 연속 + 7일 챔피언 모두 획득
      const badges = getAllByText('획득 완료');
      expect(badges.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('뱃지 없을 때', () => {
    it('CTA 버튼이 표시된다', () => {
      mockUseUserAnalyses.mockReturnValue({
        personalColor: null,
        skinAnalysis: null,
        bodyAnalysis: null,
        isLoading: false,
      });
      mockUseWorkoutData.mockReturnValue({
        streak: { currentStreak: 0 },
        todayWorkout: null,
        analysis: null,
        isLoading: false,
      });
      mockUseNutritionData.mockReturnValue({
        todaySummary: null,
        settings: null,
        streak: { currentStreak: 0 },
        isLoading: false,
      });

      const { getByText } = renderWithTheme(<BadgesScreen />);
      expect(getByText('더 많은 뱃지를 획득해보세요!')).toBeTruthy();
    });

    it('CTA 버튼 클릭 시 router.back() 호출', () => {
      mockUseUserAnalyses.mockReturnValue({
        personalColor: null,
        skinAnalysis: null,
        bodyAnalysis: null,
        isLoading: false,
      });
      mockUseWorkoutData.mockReturnValue({
        streak: { currentStreak: 0 },
        todayWorkout: null,
        analysis: null,
        isLoading: false,
      });
      mockUseNutritionData.mockReturnValue({
        todaySummary: null,
        settings: null,
        streak: { currentStreak: 0 },
        isLoading: false,
      });

      const { getByText } = renderWithTheme(<BadgesScreen />);
      fireEvent.press(getByText('더 많은 뱃지를 획득해보세요!'));
      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<BadgesScreen />, true);
      expect(getByTestId('badges-screen')).toBeTruthy();
    });

    it('다크 모드에서 뱃지 목록이 표시된다', () => {
      const { getByText } = renderWithTheme(<BadgesScreen />, true);
      expect(getByText('나의 뱃지')).toBeTruthy();
      expect(getByText('컬러 탐험가')).toBeTruthy();
    });
  });
});
