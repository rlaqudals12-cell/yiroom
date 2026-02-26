/**
 * 리포트 모듈 타입 정의
 */

/** 주간 리포트 요약 */
export interface WeeklyReport {
  /** 리포트 기간 시작일 (YYYY-MM-DD) */
  startDate: string;
  /** 리포트 기간 종료일 (YYYY-MM-DD) */
  endDate: string;

  /** 운동 요약 */
  workout: {
    totalSessions: number;
    totalDuration: number; // 분
    totalCalories: number;
    averageDuration: number;
    completionRate: number; // 0-100 (7일 중 몇 일 운동했나)
    streak: number;
  };

  /** 영양 요약 */
  nutrition: {
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
    averageWater: number;
    daysTracked: number;
    goalAchievementRate: number; // 0-100
  };

  /** 일별 데이터 (차트용) */
  dailyData: DailyReportEntry[];

  /** 인사이트 메시지 */
  insights: string[];
}

/** 월간 리포트 요약 */
export interface MonthlyReport {
  /** 리포트 기간 (YYYY-MM) */
  month: string;
  /** 기간 (YYYY-MM-DD) */
  startDate: string;
  endDate: string;

  /** 주간 요약 (4~5주) */
  weeklyTrends: WeeklyTrend[];

  /** 운동 월간 요약 */
  workout: {
    totalSessions: number;
    totalDuration: number;
    totalCalories: number;
    bestStreak: number;
    averageSessionsPerWeek: number;
  };

  /** 영양 월간 요약 */
  nutrition: {
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
    daysTracked: number;
    goalAchievementRate: number;
  };

  /** 인사이트 */
  insights: string[];
}

/** 일별 리포트 엔트리 */
export interface DailyReportEntry {
  date: string; // YYYY-MM-DD
  dayLabel: string; // 월, 화, 수 ...
  workout: {
    duration: number;
    calories: number;
    completed: boolean;
  };
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
}

/** 주간 트렌드 (월간 리포트 차트용) */
export interface WeeklyTrend {
  weekLabel: string; // 1주차, 2주차 ...
  startDate: string;
  endDate: string;
  workoutSessions: number;
  workoutCalories: number;
  nutritionCalories: number;
  nutritionGoalRate: number;
}
