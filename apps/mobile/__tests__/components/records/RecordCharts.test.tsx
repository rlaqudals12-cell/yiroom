/**
 * 기록 탭 차트 컴포넌트 테스트
 *
 * WeeklyCalorieChart, MacroBreakdownBar, WorkoutWeekHeatmap, NutrientRadar
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
import {
  WeeklyCalorieChart,
  MacroBreakdownBar,
  WorkoutWeekHeatmap,
  NutrientRadar,
  type DayCalorie,
  type WeekDay,
} from '../../../components/records';

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

// --- WeeklyCalorieChart ---
describe('WeeklyCalorieChart', () => {
  const mockData: DayCalorie[] = [
    { label: '월', calories: 1800 },
    { label: '화', calories: 2100 },
    { label: '수', calories: 1950 },
    { label: '목', calories: 2300 },
    { label: '금', calories: 1700 },
    { label: '토', calories: 2000 },
    { label: '일', calories: 0 },
  ];

  it('헤더와 평균 칼로리를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <WeeklyCalorieChart data={mockData} goal={2000} />
    );
    expect(getByText('주간 칼로리')).toBeTruthy();
    // 평균: (1800+2100+1950+2300+1700+2000+0)/7 ≈ 1693
    expect(getByText(/평균.*kcal/)).toBeTruthy();
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <WeeklyCalorieChart data={mockData} goal={2000} testID="cal-chart" />
    );
    expect(getByTestId('cal-chart')).toBeTruthy();
  });

  it('accessibilityLabel이 설정되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <WeeklyCalorieChart data={mockData} goal={2000} />
    );
    expect(getByLabelText(/주간 칼로리 차트/)).toBeTruthy();
  });

  it('모든 칼로리가 0이어도 렌더링해야 한다', () => {
    const emptyData: DayCalorie[] = [
      { label: '월', calories: 0 },
      { label: '화', calories: 0 },
      { label: '수', calories: 0 },
      { label: '목', calories: 0 },
      { label: '금', calories: 0 },
      { label: '토', calories: 0 },
      { label: '일', calories: 0 },
    ];
    const { getByText } = renderWithTheme(
      <WeeklyCalorieChart data={emptyData} goal={2000} />
    );
    expect(getByText('주간 칼로리')).toBeTruthy();
    expect(getByText(/평균 0kcal/)).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <WeeklyCalorieChart data={mockData} goal={2000} />,
      true
    );
    expect(getByText('주간 칼로리')).toBeTruthy();
  });
});

// --- MacroBreakdownBar ---
describe('MacroBreakdownBar', () => {
  it('범례를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <MacroBreakdownBar carbs={250} protein={100} fat={65} />
    );
    expect(getByText(/탄수화물/)).toBeTruthy();
    expect(getByText(/단백질/)).toBeTruthy();
    expect(getByText(/지방/)).toBeTruthy();
  });

  it('그램과 칼로리를 표시해야 한다', () => {
    const { getByText } = renderWithTheme(
      <MacroBreakdownBar carbs={100} protein={50} fat={30} />
    );
    // carbs: 100g * 4 = 400kcal
    expect(getByText(/100g \(400kcal\)/)).toBeTruthy();
    // protein: 50g * 4 = 200kcal
    expect(getByText(/50g \(200kcal\)/)).toBeTruthy();
    // fat: 30g * 9 = 270kcal
    expect(getByText(/30g \(270kcal\)/)).toBeTruthy();
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <MacroBreakdownBar carbs={100} protein={50} fat={30} testID="macro" />
    );
    expect(getByTestId('macro')).toBeTruthy();
  });

  it('accessibilityLabel에 비율이 포함되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <MacroBreakdownBar carbs={100} protein={50} fat={50} />
    );
    expect(getByLabelText(/영양소 비율/)).toBeTruthy();
  });

  it('모든 값이 0이어도 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <MacroBreakdownBar carbs={0} protein={0} fat={0} />
    );
    expect(getByText(/탄수화물/)).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <MacroBreakdownBar carbs={200} protein={80} fat={50} />,
      true
    );
    expect(getByText(/탄수화물/)).toBeTruthy();
  });
});

// --- WorkoutWeekHeatmap ---
describe('WorkoutWeekHeatmap', () => {
  const mockDays: WeekDay[] = [
    { label: '월', date: '2026-02-23', completed: true, intensity: 2 },
    { label: '화', date: '2026-02-24', completed: true, intensity: 3 },
    { label: '수', date: '2026-02-25', completed: false, intensity: 0 },
    { label: '목', date: '2026-02-26', completed: false, intensity: 0 },
    { label: '금', date: '2026-02-27', completed: false, intensity: 0 },
    { label: '토', date: '2026-02-28', completed: false, intensity: 0 },
    { label: '일', date: '2026-03-01', completed: false, intensity: 0 },
  ];

  it('제목과 완료 수를 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutWeekHeatmap days={mockDays} />
    );
    expect(getByText('이번 주 운동')).toBeTruthy();
    expect(getByText('2/7일 완료')).toBeTruthy();
  });

  it('7개 요일 라벨을 모두 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutWeekHeatmap days={mockDays} />
    );
    expect(getByText('월')).toBeTruthy();
    expect(getByText('화')).toBeTruthy();
    expect(getByText('수')).toBeTruthy();
    expect(getByText('일')).toBeTruthy();
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <WorkoutWeekHeatmap days={mockDays} testID="heatmap" />
    );
    expect(getByTestId('heatmap')).toBeTruthy();
  });

  it('accessibilityLabel에 완료 일수가 포함되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <WorkoutWeekHeatmap days={mockDays} />
    );
    expect(getByLabelText(/2일 완료/)).toBeTruthy();
  });

  it('운동 완료 셀에 접근성 라벨이 있어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <WorkoutWeekHeatmap days={mockDays} />
    );
    expect(getByLabelText('월 운동 완료')).toBeTruthy();
    expect(getByLabelText('수 운동 없음')).toBeTruthy();
  });

  it('모든 운동 미완료일 때도 렌더링해야 한다', () => {
    const emptyDays: WeekDay[] = mockDays.map((d) => ({
      ...d,
      completed: false,
      intensity: 0,
    }));
    const { getByText } = renderWithTheme(
      <WorkoutWeekHeatmap days={emptyDays} />
    );
    expect(getByText('0/7일 완료')).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <WorkoutWeekHeatmap days={mockDays} />,
      true
    );
    expect(getByText('이번 주 운동')).toBeTruthy();
  });
});

// --- NutrientRadar ---
describe('NutrientRadar', () => {
  const mockNutrients = {
    carbs: 200,
    protein: 80,
    fat: 50,
    water: 1500,
    calories: 1600,
  };

  const mockGoals = {
    carbs: 250,
    protein: 100,
    fat: 65,
    water: 2000,
    calories: 2000,
  };

  it('제목과 달성률을 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <NutrientRadar nutrients={mockNutrients} goals={mockGoals} />
    );
    expect(getByText('영양 균형')).toBeTruthy();
    expect(getByText(/목표 달성률.*%/)).toBeTruthy();
  });

  it('testID를 전달해야 한다', () => {
    const { getByTestId } = renderWithTheme(
      <NutrientRadar nutrients={mockNutrients} goals={mockGoals} testID="nutrient" />
    );
    expect(getByTestId('nutrient')).toBeTruthy();
  });

  it('accessibilityLabel에 달성률이 포함되어야 한다', () => {
    const { getByLabelText } = renderWithTheme(
      <NutrientRadar nutrients={mockNutrients} goals={mockGoals} />
    );
    expect(getByLabelText(/영양 균형 레이더 차트/)).toBeTruthy();
  });

  it('모든 값이 0이어도 렌더링해야 한다', () => {
    const zeros = { carbs: 0, protein: 0, fat: 0, water: 0, calories: 0 };
    const { getByText } = renderWithTheme(
      <NutrientRadar nutrients={zeros} goals={mockGoals} />
    );
    expect(getByText('영양 균형')).toBeTruthy();
    expect(getByText(/목표 달성률 0%/)).toBeTruthy();
  });

  it('목표 초과 시 100%로 클램프해야 한다', () => {
    const overNutrients = {
      carbs: 500,
      protein: 200,
      fat: 130,
      water: 4000,
      calories: 4000,
    };
    const { getByText } = renderWithTheme(
      <NutrientRadar nutrients={overNutrients} goals={mockGoals} />
    );
    expect(getByText(/목표 달성률 100%/)).toBeTruthy();
  });

  it('다크모드에서 렌더링해야 한다', () => {
    const { getByText } = renderWithTheme(
      <NutrientRadar nutrients={mockNutrients} goals={mockGoals} />,
      true
    );
    expect(getByText('영양 균형')).toBeTruthy();
  });
});
