/**
 * 기록 탭 스크린 렌더링 테스트
 *
 * 대상: app/(tabs)/records.tsx (RecordsTab)
 * 의존성: useRouter, useTheme, useWorkoutData, useNutritionData,
 *          calculateCalorieProgress, MenuCard, SectionHeader, lucide-react-native
 */
import React from 'react';
import { render } from '@testing-library/react-native';

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

// lucide-react-native 아이콘 mock (Proxy로 모든 아이콘 자동 처리)
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target: Record<string, unknown>, prop: string) => {
        if (typeof prop !== 'string' || prop === '__esModule') return undefined;
        return function MockIcon(props: Record<string, unknown>) {
          return <View testID={`icon-${prop}`} {...props} />;
        };
      },
    }
  );
});

// 운동 데이터 mock
jest.mock('../../../hooks/useWorkoutData', () => ({
  useWorkoutData: jest.fn(() => ({
    streak: { currentStreak: 5, lastWorkoutDate: '2026-02-20' },
    todayWorkout: {
      exercises: [
        { name: '스쿼트', sets: 3, reps: 12 },
        { name: '런지', sets: 3, reps: 10 },
      ],
    },
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
      totalCalories: 1800,
      mealCount: 3,
      waterIntake: 1500,
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

import RecordsTab from '../../../app/(tabs)/records';

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

describe('RecordsTab', () => {
  describe('기본 렌더링', () => {
    it('에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<RecordsTab />);
      expect(getByTestId('records-tab')).toBeTruthy();
    });

    it('섹션 제목 "기록"이 표시된다', () => {
      const { getByText } = renderWithTheme(<RecordsTab />);
      expect(getByText('기록')).toBeTruthy();
    });
  });

  describe('오늘의 기록 요약', () => {
    it('오늘 라벨이 표시된다', () => {
      const { getByText } = renderWithTheme(<RecordsTab />);
      expect(getByText('오늘')).toBeTruthy();
    });

    it('연속 운동 일수가 표시된다', () => {
      // StatCard countUp 애니메이션은 Jest에서 미동작 → accessibilityLabel로 검증
      const { getByLabelText } = renderWithTheme(<RecordsTab />);
      expect(getByLabelText('연속 운동 5일')).toBeTruthy();
    });

    it('식사 횟수가 표시된다', () => {
      const { getByLabelText } = renderWithTheme(<RecordsTab />);
      expect(getByLabelText('식사 3')).toBeTruthy();
    });

    it('칼로리 진행률이 표시된다', () => {
      const { getByLabelText } = renderWithTheme(<RecordsTab />);
      // calculateCalorieProgress(1800, 2000) = 90
      expect(getByLabelText('칼로리 90%')).toBeTruthy();
    });
  });

  describe('수분 섭취 섹션', () => {
    it('수분 섭취 라벨이 표시된다', () => {
      const { getByText } = renderWithTheme(<RecordsTab />);
      expect(getByText('수분 섭취')).toBeTruthy();
    });

    it('수분 섭취량이 표시된다', () => {
      const { getByText } = renderWithTheme(<RecordsTab />);
      expect(getByText('1500ml')).toBeTruthy();
    });

    it('수분 목표가 표시된다', () => {
      const { getByText } = renderWithTheme(<RecordsTab />);
      expect(getByText('목표: 2000ml')).toBeTruthy();
    });
  });

  describe('메뉴 카드 표시', () => {
    it('운동 기록 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<RecordsTab />);
      expect(getByTestId('menu-workout')).toBeTruthy();
    });

    it('식단 기록 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<RecordsTab />);
      expect(getByTestId('menu-nutrition')).toBeTruthy();
    });

    it('주간 리포트 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<RecordsTab />);
      expect(getByTestId('menu-reports')).toBeTruthy();
    });

    it('운동 예정 개수가 표시된다', () => {
      const { getByText } = renderWithTheme(<RecordsTab />);
      // todayWorkout.exercises.length === 2
      expect(getByText('오늘 2개 운동 예정')).toBeTruthy();
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중에는 로딩 인디케이터를 표시한다', () => {
      const { useWorkoutData } = require('../../../hooks/useWorkoutData');
      useWorkoutData.mockReturnValueOnce({
        streak: null,
        todayWorkout: null,
        weeklyLogs: [],
        analysis: null,
        isLoading: true,
      });

      const { queryByTestId } = renderWithTheme(<RecordsTab />);
      // 로딩 중에는 StatCard가 렌더되지 않음 (SkeletonText 표시)
      expect(queryByTestId('record-stat-workout')).toBeNull();
    });
  });

  describe('데이터 없는 상태', () => {
    it('운동 기록이 없으면 기본 설명이 표시된다', () => {
      const { useWorkoutData } = require('../../../hooks/useWorkoutData');
      useWorkoutData.mockReturnValueOnce({
        streak: { currentStreak: 0, lastWorkoutDate: null },
        todayWorkout: null,
        weeklyLogs: [],
        analysis: null,
        isLoading: false,
      });

      const { getByText } = renderWithTheme(<RecordsTab />);
      expect(
        getByText('운동 루틴을 기록하고 진행 상황을 확인하세요')
      ).toBeTruthy();
    });
  });

  describe('다크 모드', () => {
    it('다크 모드에서 에러 없이 렌더링된다', () => {
      const { getByTestId } = renderWithTheme(<RecordsTab />, true);
      expect(getByTestId('records-tab')).toBeTruthy();
    });

    it('다크 모드에서 모든 메뉴가 표시된다', () => {
      const { getByTestId } = renderWithTheme(<RecordsTab />, true);
      expect(getByTestId('menu-workout')).toBeTruthy();
      expect(getByTestId('menu-nutrition')).toBeTruthy();
      expect(getByTestId('menu-reports')).toBeTruthy();
    });
  });
});
