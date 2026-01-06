/**
 * 위젯 타입 정의
 * iOS WidgetKit + Android App Widgets 지원
 */

export type WidgetSize = 'small' | 'medium' | 'large';

export type WidgetType =
  | 'daily-summary'
  | 'workout-progress'
  | 'nutrition-tracker'
  | 'wellness-score'
  | 'quick-actions';

/**
 * 위젯 데이터 인터페이스
 */
export interface WidgetData {
  type: WidgetType;
  size: WidgetSize;
  updatedAt: string;
}

/**
 * 일일 요약 위젯 데이터
 */
export interface DailySummaryWidgetData extends WidgetData {
  type: 'daily-summary';
  data: {
    date: string;
    steps: number;
    stepsGoal: number;
    calories: number;
    caloriesGoal: number;
    water: number;
    waterGoal: number;
    workoutMinutes: number;
    workoutGoal: number;
    wellnessScore: number;
  };
}

/**
 * 운동 진행 위젯 데이터
 */
export interface WorkoutProgressWidgetData extends WidgetData {
  type: 'workout-progress';
  data: {
    weeklyMinutes: number;
    weeklyGoal: number;
    streak: number;
    nextWorkout: {
      name: string;
      scheduledAt: string | null;
    } | null;
    todayCompleted: boolean;
  };
}

/**
 * 영양 트래커 위젯 데이터
 */
export interface NutritionTrackerWidgetData extends WidgetData {
  type: 'nutrition-tracker';
  data: {
    calories: {
      consumed: number;
      goal: number;
    };
    macros: {
      carbs: { current: number; goal: number };
      protein: { current: number; goal: number };
      fat: { current: number; goal: number };
    };
    water: {
      current: number;
      goal: number;
    };
    mealsLogged: number;
  };
}

/**
 * 웰니스 스코어 위젯 데이터
 */
export interface WellnessScoreWidgetData extends WidgetData {
  type: 'wellness-score';
  data: {
    overallScore: number;
    breakdown: {
      activity: number;
      nutrition: number;
      sleep: number;
      mindfulness: number;
    };
    trend: 'up' | 'down' | 'stable';
    weeklyChange: number;
  };
}

/**
 * 빠른 액션 위젯 데이터
 */
export interface QuickActionsWidgetData extends WidgetData {
  type: 'quick-actions';
  data: {
    actions: {
      id: string;
      icon: string;
      label: string;
      deepLink: string;
    }[];
  };
}

export type AnyWidgetData =
  | DailySummaryWidgetData
  | WorkoutProgressWidgetData
  | NutritionTrackerWidgetData
  | WellnessScoreWidgetData
  | QuickActionsWidgetData;

/**
 * 위젯 설정
 */
export interface WidgetConfig {
  type: WidgetType;
  enabled: boolean;
  refreshInterval: number; // minutes
  size: WidgetSize;
}

/**
 * 위젯 메타데이터
 */
/**
 * 오늘 요약 데이터 (기존 호환)
 */
export interface TodaySummaryData {
  date: string;
  waterIntake: number;
  waterGoal: number;
  caloriesConsumed: number;
  caloriesGoal: number;
  workoutCompleted: boolean;
  workoutMinutes: number;
  workoutCalories: number;
  currentStreak: number;
  lastUpdated: string;
}

export const DEFAULT_SUMMARY_DATA: TodaySummaryData = {
  date: new Date().toISOString().split('T')[0],
  waterIntake: 0,
  waterGoal: 2000,
  caloriesConsumed: 0,
  caloriesGoal: 2000,
  workoutCompleted: false,
  workoutMinutes: 0,
  workoutCalories: 0,
  currentStreak: 0,
  lastUpdated: new Date().toISOString(),
};

/**
 * 빠른 액션 타입
 */
export type QuickActionType = 'water' | 'workout' | 'meal' | 'checkin';

/**
 * 딥링크 맵
 */
export const WIDGET_DEEP_LINKS: Record<QuickActionType, string> = {
  water: 'yiroom://nutrition/water',
  workout: 'yiroom://workout/start',
  meal: 'yiroom://nutrition/log',
  checkin: 'yiroom://checkin',
};

export const WIDGET_METADATA: Record<
  WidgetType,
  {
    name: string;
    description: string;
    supportedSizes: WidgetSize[];
    icon: string;
  }
> = {
  'daily-summary': {
    name: '오늘의 요약',
    description: '걸음수, 칼로리, 물 섭취량을 한눈에',
    supportedSizes: ['small', 'medium'],
    icon: '📊',
  },
  'workout-progress': {
    name: '운동 진행',
    description: '주간 운동 목표와 다음 운동 일정',
    supportedSizes: ['small', 'medium'],
    icon: '💪',
  },
  'nutrition-tracker': {
    name: '영양 트래커',
    description: '오늘의 칼로리와 영양소 현황',
    supportedSizes: ['medium', 'large'],
    icon: '🥗',
  },
  'wellness-score': {
    name: '웰니스 점수',
    description: '종합 건강 점수와 트렌드',
    supportedSizes: ['small', 'medium'],
    icon: '✨',
  },
  'quick-actions': {
    name: '빠른 실행',
    description: '자주 사용하는 기능 바로가기',
    supportedSizes: ['small', 'medium'],
    icon: '⚡',
  },
};
