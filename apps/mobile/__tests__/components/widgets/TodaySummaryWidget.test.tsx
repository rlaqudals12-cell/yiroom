/**
 * TodaySummaryWidget 컴포넌트 테스트
 *
 * 오늘 요약 위젯의 3가지 사이즈(small/medium/large)별 렌더링,
 * 진행률 계산, 스트릭 배지, 운동/물/칼로리 표시 검증.
 * ThemeContext.Provider를 직접 사용하여 NativeWind/useColorScheme 충돌 회피.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

import { ThemeContext, type ThemeContextValue } from '../../../lib/theme/ThemeProvider';
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
import { TodaySummaryWidget } from '../../../components/widgets/TodaySummaryWidget';
import type { TodaySummaryData } from '../../../lib/widgets/types';

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
    <ThemeContext.Provider value={createThemeValue(isDark)}>{ui}</ThemeContext.Provider>
  );
}

// 테스트용 데이터 팩토리
function createMockSummaryData(overrides: Partial<TodaySummaryData> = {}): TodaySummaryData {
  return {
    date: '2026-02-21',
    waterIntake: 1500,
    waterGoal: 2000,
    caloriesConsumed: 1200,
    caloriesGoal: 2000,
    workoutCompleted: true,
    workoutMinutes: 45,
    workoutCalories: 300,
    currentStreak: 7,
    lastUpdated: '2026-02-21T12:00:00Z',
    ...overrides,
  };
}

describe('TodaySummaryWidget', () => {
  describe('size="large" (기본 testID 포함)', () => {
    it('기본 렌더링이 정상 동작해야 한다', () => {
      const data = createMockSummaryData();
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('오늘의 이룸')).toBeTruthy();
    });

    it('testID="today-summary-widget"이 존재해야 한다', () => {
      const data = createMockSummaryData();
      const { getByTestId } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByTestId('today-summary-widget')).toBeTruthy();
    });

    it('스트릭 배지를 표시해야 한다 (연속 일수 > 0)', () => {
      const data = createMockSummaryData({ currentStreak: 14 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('14일 연속')).toBeTruthy();
    });

    it('스트릭이 0이면 배지를 표시하지 않아야 한다', () => {
      const data = createMockSummaryData({ currentStreak: 0 });
      const { queryByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(queryByText(/일 연속/)).toBeNull();
    });

    it('운동 완료 시 시간을 표시해야 한다', () => {
      const data = createMockSummaryData({ workoutCompleted: true, workoutMinutes: 45 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('45분 완료')).toBeTruthy();
    });

    it('운동 미완료 시 "아직 안 함"을 표시해야 한다', () => {
      const data = createMockSummaryData({ workoutCompleted: false });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('아직 안 함')).toBeTruthy();
    });

    it('물 섭취량과 목표를 표시해야 한다', () => {
      const data = createMockSummaryData({ waterIntake: 1500, waterGoal: 2000 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('1500ml / 2000ml')).toBeTruthy();
    });

    it('칼로리 섭취량과 목표를 표시해야 한다', () => {
      const data = createMockSummaryData({ caloriesConsumed: 1200, caloriesGoal: 2000 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('1200 / 2000 kcal')).toBeTruthy();
    });

    it('다크 모드에서도 정상 렌더링되어야 한다', () => {
      const data = createMockSummaryData();
      const { getByText, getByTestId } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />,
        true
      );

      expect(getByTestId('today-summary-widget')).toBeTruthy();
      expect(getByText('오늘의 이룸')).toBeTruthy();
    });
  });

  describe('size="medium"', () => {
    it('타이틀을 표시해야 한다', () => {
      const data = createMockSummaryData();
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="medium" />
      );

      expect(getByText('오늘의 이룸')).toBeTruthy();
    });

    it('스트릭 배지를 표시해야 한다 (연속 일수 > 0)', () => {
      const data = createMockSummaryData({ currentStreak: 10 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="medium" />
      );

      expect(getByText('10일')).toBeTruthy();
    });

    it('스트릭이 0이면 배지를 표시하지 않아야 한다', () => {
      const data = createMockSummaryData({ currentStreak: 0 });
      const { queryByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="medium" />
      );

      // medium size에서 스트릭 배지는 "X일" 형태
      expect(queryByText('0일')).toBeNull();
    });

    it('운동 완료 시 시간을 표시해야 한다', () => {
      const data = createMockSummaryData({ workoutCompleted: true, workoutMinutes: 30 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="medium" />
      );

      expect(getByText('30분')).toBeTruthy();
    });

    it('운동 미완료 시 "대기"를 표시해야 한다', () => {
      const data = createMockSummaryData({ workoutCompleted: false });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="medium" />
      );

      expect(getByText('대기')).toBeTruthy();
    });

    it('물 섭취량을 리터 단위로 표시해야 한다', () => {
      const data = createMockSummaryData({ waterIntake: 1500 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="medium" />
      );

      // (1500 / 1000).toFixed(1) = "1.5"
      expect(getByText('1.5L')).toBeTruthy();
    });

    it('칼로리 수치를 표시해야 한다', () => {
      const data = createMockSummaryData({ caloriesConsumed: 1800 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="medium" />
      );

      expect(getByText('1800')).toBeTruthy();
    });

    it('운동/물/칼로리 라벨을 표시해야 한다', () => {
      const data = createMockSummaryData();
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="medium" />
      );

      expect(getByText('운동')).toBeTruthy();
      expect(getByText('물')).toBeTruthy();
      expect(getByText('칼로리')).toBeTruthy();
    });

    it('testID가 없어야 한다 (large에만 존재)', () => {
      const data = createMockSummaryData();
      const { queryByTestId } = renderWithTheme(
        <TodaySummaryWidget data={data} size="medium" />
      );

      expect(queryByTestId('today-summary-widget')).toBeNull();
    });
  });

  describe('size="small"', () => {
    it('스트릭이 있으면 "X일 연속" 텍스트를 표시해야 한다', () => {
      const data = createMockSummaryData({ currentStreak: 5 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="small" />
      );

      expect(getByText('5일 연속')).toBeTruthy();
    });

    it('스트릭이 0이면 "오늘 시작!" 텍스트를 표시해야 한다', () => {
      const data = createMockSummaryData({ currentStreak: 0 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="small" />
      );

      expect(getByText('오늘 시작!')).toBeTruthy();
    });

    it('운동 완료 시 체크 아이콘을 표시해야 한다', () => {
      const data = createMockSummaryData({ workoutCompleted: true });
      const { getAllByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="small" />
      );

      // 운동 완료 아이콘
      const checkmarks = getAllByText('✅');
      expect(checkmarks.length).toBeGreaterThanOrEqual(1);
    });

    it('운동 미완료 시 달리기 아이콘을 표시해야 한다', () => {
      const data = createMockSummaryData({ workoutCompleted: false });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="small" />
      );

      expect(getByText('🏃')).toBeTruthy();
    });

    it('물 목표 달성 시 체크 아이콘을 표시해야 한다', () => {
      const data = createMockSummaryData({ waterIntake: 2000, waterGoal: 2000 });
      const { getAllByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="small" />
      );

      const checkmarks = getAllByText('✅');
      expect(checkmarks.length).toBeGreaterThanOrEqual(1);
    });

    it('물 목표 미달성 시 물방울 아이콘을 표시해야 한다', () => {
      const data = createMockSummaryData({ waterIntake: 500, waterGoal: 2000 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="small" />
      );

      expect(getByText('💧')).toBeTruthy();
    });

    it('testID가 없어야 한다 (large에만 존재)', () => {
      const data = createMockSummaryData();
      const { queryByTestId } = renderWithTheme(
        <TodaySummaryWidget data={data} size="small" />
      );

      expect(queryByTestId('today-summary-widget')).toBeNull();
    });
  });

  describe('data 기본값', () => {
    it('data가 없으면 DEFAULT_SUMMARY_DATA를 사용해야 한다', () => {
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget size="medium" />
      );

      // DEFAULT_SUMMARY_DATA: waterIntake=0, workoutCompleted=false, currentStreak=0
      expect(getByText('오늘의 이룸')).toBeTruthy();
      expect(getByText('대기')).toBeTruthy();
      expect(getByText('0.0L')).toBeTruthy();
    });

    it('data 없이 small 사이즈도 정상 렌더링되어야 한다', () => {
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget size="small" />
      );

      // currentStreak = 0 -> "오늘 시작!"
      expect(getByText('오늘 시작!')).toBeTruthy();
    });

    it('size 기본값은 medium이어야 한다', () => {
      const data = createMockSummaryData();
      const { getByText, queryByTestId } = renderWithTheme(
        <TodaySummaryWidget data={data} />
      );

      // medium에는 "운동", "물", "칼로리" 라벨이 있다
      expect(getByText('운동')).toBeTruthy();
      expect(getByText('물')).toBeTruthy();
      expect(getByText('칼로리')).toBeTruthy();

      // testID는 large에만 존재
      expect(queryByTestId('today-summary-widget')).toBeNull();
    });
  });

  describe('엣지 케이스', () => {
    it('물 섭취가 목표를 초과해도 에러 없이 렌더링해야 한다', () => {
      const data = createMockSummaryData({ waterIntake: 3000, waterGoal: 2000 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('3000ml / 2000ml')).toBeTruthy();
    });

    it('칼로리가 목표를 초과해도 에러 없이 렌더링해야 한다', () => {
      const data = createMockSummaryData({ caloriesConsumed: 3000, caloriesGoal: 2000 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('3000 / 2000 kcal')).toBeTruthy();
    });

    it('모든 값이 0일 때 정상 렌더링해야 한다', () => {
      const data = createMockSummaryData({
        waterIntake: 0,
        waterGoal: 2000,
        caloriesConsumed: 0,
        caloriesGoal: 2000,
        workoutCompleted: false,
        workoutMinutes: 0,
        currentStreak: 0,
      });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('오늘의 이룸')).toBeTruthy();
      expect(getByText('아직 안 함')).toBeTruthy();
      expect(getByText('0ml / 2000ml')).toBeTruthy();
      expect(getByText('0 / 2000 kcal')).toBeTruthy();
    });

    it('운동 시간이 0이고 완료 상태일 때도 정상 렌더링해야 한다', () => {
      const data = createMockSummaryData({ workoutCompleted: true, workoutMinutes: 0 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('0분 완료')).toBeTruthy();
    });

    it('높은 스트릭 값에서도 정상 렌더링해야 한다', () => {
      const data = createMockSummaryData({ currentStreak: 365 });
      const { getByText } = renderWithTheme(
        <TodaySummaryWidget data={data} size="large" />
      );

      expect(getByText('365일 연속')).toBeTruthy();
    });
  });
});
