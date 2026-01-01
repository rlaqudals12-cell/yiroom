/**
 * 위젯 타입 정의
 * iOS Widget Extension / Android App Widget 공통 타입
 */

// 위젯에 표시할 오늘 요약 데이터
export interface TodaySummaryData {
  // 물 섭취
  waterIntake: number; // ml
  waterGoal: number; // ml

  // 운동
  workoutCompleted: boolean;
  workoutMinutes: number;
  workoutCalories: number;

  // 영양
  caloriesConsumed: number;
  caloriesGoal: number;

  // 스트릭
  currentStreak: number;

  // 마지막 업데이트
  lastUpdated: string; // ISO 8601
}

// 위젯 크기 타입
export type WidgetSize = 'small' | 'medium' | 'large';

// 위젯 종류
export type WidgetType = 'todaySummary' | 'quickActions' | 'streak' | 'water';

// 위젯 설정
export interface WidgetConfig {
  type: WidgetType;
  size: WidgetSize;
  refreshInterval: number; // 분 단위
}

// 빠른 액션 타입
export type QuickActionType = 'addWater' | 'startWorkout' | 'logMeal' | 'viewDashboard';

// 빠른 액션 데이터
export interface QuickAction {
  type: QuickActionType;
  label: string;
  icon: string;
  deepLink: string;
}

// 위젯 딥링크 스키마
export const WIDGET_DEEP_LINKS = {
  addWater: 'yiroom://nutrition/water?action=add',
  startWorkout: 'yiroom://workout/session',
  logMeal: 'yiroom://nutrition/camera',
  viewDashboard: 'yiroom://dashboard',
  viewProducts: 'yiroom://products',
} as const;

// 기본 위젯 데이터
export const DEFAULT_SUMMARY_DATA: TodaySummaryData = {
  waterIntake: 0,
  waterGoal: 2000,
  workoutCompleted: false,
  workoutMinutes: 0,
  workoutCalories: 0,
  caloriesConsumed: 0,
  caloriesGoal: 2000,
  currentStreak: 0,
  lastUpdated: new Date().toISOString(),
};
