/**
 * 리포트 집계 로직
 * 기존 useWorkoutData, useNutritionData 데이터로 주간/월간 리포트 생성
 */
import type { WorkoutLog } from '../../hooks/useWorkoutData';
import type { DailyNutritionSummary, NutritionSettings } from '../../hooks/useNutritionData';
import type {
  WeeklyReport,
  MonthlyReport,
  DailyReportEntry,
  WeeklyTrend,
} from './types';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// 날짜 포맷 (YYYY-MM-DD)
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 요일 라벨
function getDayLabel(dateStr: string): string {
  const day = new Date(dateStr).getDay();
  return DAY_LABELS[day];
}

/**
 * 주간 리포트 집계
 */
export function aggregateWeeklyReport(
  workoutLogs: WorkoutLog[],
  nutritionHistory: DailyNutritionSummary[],
  nutritionSettings: NutritionSettings | null,
  workoutStreak: number,
  weekStart?: Date
): WeeklyReport {
  const now = weekStart ?? new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);
  const startDate = formatDate(startOfWeek);
  const endDate = formatDate(now);

  // 일별 데이터 구축 (7일)
  const dailyData: DailyReportEntry[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = formatDate(d);

    const wLog = workoutLogs.find((l) => l.workoutDate === dateStr);
    const nLog = nutritionHistory.find((n) => n.date === dateStr);

    dailyData.push({
      date: dateStr,
      dayLabel: getDayLabel(dateStr),
      workout: {
        duration: wLog?.actualDuration ?? 0,
        calories: wLog?.actualCalories ?? 0,
        completed: wLog?.completedAt !== null && wLog?.completedAt !== undefined,
      },
      nutrition: {
        calories: nLog?.totalCalories ?? 0,
        protein: nLog?.totalProtein ?? 0,
        carbs: nLog?.totalCarbs ?? 0,
        fat: nLog?.totalFat ?? 0,
        water: nLog?.waterIntake ?? 0,
      },
    });
  }

  // 운동 집계
  const completedWorkouts = workoutLogs.filter((l) => l.completedAt != null);
  const totalDuration = completedWorkouts.reduce((s, l) => s + l.actualDuration, 0);
  const totalCalories = completedWorkouts.reduce((s, l) => s + l.actualCalories, 0);

  // 영양 집계
  const trackedDays = nutritionHistory.filter((n) => n.totalCalories > 0);
  const calorieGoal = nutritionSettings?.dailyCalorieGoal ?? 2000;
  const daysOnGoal = trackedDays.filter(
    (n) => n.totalCalories >= calorieGoal * 0.8 && n.totalCalories <= calorieGoal * 1.2
  );

  const avgCalories =
    trackedDays.length > 0
      ? Math.round(trackedDays.reduce((s, n) => s + n.totalCalories, 0) / trackedDays.length)
      : 0;
  const avgProtein =
    trackedDays.length > 0
      ? Math.round(trackedDays.reduce((s, n) => s + n.totalProtein, 0) / trackedDays.length)
      : 0;
  const avgCarbs =
    trackedDays.length > 0
      ? Math.round(trackedDays.reduce((s, n) => s + n.totalCarbs, 0) / trackedDays.length)
      : 0;
  const avgFat =
    trackedDays.length > 0
      ? Math.round(trackedDays.reduce((s, n) => s + n.totalFat, 0) / trackedDays.length)
      : 0;
  const avgWater =
    trackedDays.length > 0
      ? Math.round(trackedDays.reduce((s, n) => s + n.waterIntake, 0) / trackedDays.length)
      : 0;

  // 인사이트 생성
  const insights = generateWeeklyInsights(
    completedWorkouts.length,
    totalCalories,
    avgCalories,
    calorieGoal,
    trackedDays.length,
    workoutStreak
  );

  return {
    startDate,
    endDate,
    workout: {
      totalSessions: completedWorkouts.length,
      totalDuration,
      totalCalories,
      averageDuration:
        completedWorkouts.length > 0
          ? Math.round(totalDuration / completedWorkouts.length)
          : 0,
      completionRate: Math.round((completedWorkouts.length / 7) * 100),
      streak: workoutStreak,
    },
    nutrition: {
      averageCalories: avgCalories,
      averageProtein: avgProtein,
      averageCarbs: avgCarbs,
      averageFat: avgFat,
      averageWater: avgWater,
      daysTracked: trackedDays.length,
      goalAchievementRate:
        trackedDays.length > 0
          ? Math.round((daysOnGoal.length / trackedDays.length) * 100)
          : 0,
    },
    dailyData,
    insights,
  };
}

/**
 * 월간 리포트 집계
 */
export function aggregateMonthlyReport(
  workoutLogs: WorkoutLog[],
  nutritionHistory: DailyNutritionSummary[],
  nutritionSettings: NutritionSettings | null,
  month?: Date
): MonthlyReport {
  const target = month ?? new Date();
  const year = target.getFullYear();
  const mon = target.getMonth();

  const firstDay = new Date(year, mon, 1);
  const lastDay = new Date(year, mon + 1, 0);
  const startDate = formatDate(firstDay);
  const endDate = formatDate(lastDay);
  const monthStr = `${year}-${String(mon + 1).padStart(2, '0')}`;

  // 주간 트렌드 (주별 분할)
  const weeklyTrends: WeeklyTrend[] = [];
  let weekStart = new Date(firstDay);
  let weekNum = 1;

  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());

    const wStart = formatDate(weekStart);
    const wEnd = formatDate(weekEnd);

    const weekWorkouts = workoutLogs.filter(
      (l) => l.workoutDate >= wStart && l.workoutDate <= wEnd && l.completedAt != null
    );
    const weekNutrition = nutritionHistory.filter(
      (n) => n.date >= wStart && n.date <= wEnd && n.totalCalories > 0
    );

    const calorieGoal = nutritionSettings?.dailyCalorieGoal ?? 2000;
    const daysOnGoal = weekNutrition.filter(
      (n) => n.totalCalories >= calorieGoal * 0.8 && n.totalCalories <= calorieGoal * 1.2
    );

    weeklyTrends.push({
      weekLabel: `${weekNum}주차`,
      startDate: wStart,
      endDate: wEnd,
      workoutSessions: weekWorkouts.length,
      workoutCalories: weekWorkouts.reduce((s, l) => s + l.actualCalories, 0),
      nutritionCalories:
        weekNutrition.length > 0
          ? Math.round(
              weekNutrition.reduce((s, n) => s + n.totalCalories, 0) / weekNutrition.length
            )
          : 0,
      nutritionGoalRate:
        weekNutrition.length > 0
          ? Math.round((daysOnGoal.length / weekNutrition.length) * 100)
          : 0,
    });

    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() + 1);
    weekNum++;
  }

  // 월간 운동 집계
  const completedWorkouts = workoutLogs.filter((l) => l.completedAt != null);
  const totalDuration = completedWorkouts.reduce((s, l) => s + l.actualDuration, 0);
  const totalCalories = completedWorkouts.reduce((s, l) => s + l.actualCalories, 0);
  const totalWeeks = weeklyTrends.length || 1;

  // 베스트 스트릭 계산 (이번 달 내)
  const sortedDates = completedWorkouts
    .map((l) => l.workoutDate)
    .sort();
  let bestStreak = 0;
  let currentStreak = 0;
  let prevDate = '';
  for (const dateStr of sortedDates) {
    if (prevDate) {
      const prev = new Date(prevDate);
      const curr = new Date(dateStr);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    bestStreak = Math.max(bestStreak, currentStreak);
    prevDate = dateStr;
  }

  // 월간 영양 집계
  const trackedDays = nutritionHistory.filter((n) => n.totalCalories > 0);
  const calorieGoal = nutritionSettings?.dailyCalorieGoal ?? 2000;
  const daysOnGoal = trackedDays.filter(
    (n) => n.totalCalories >= calorieGoal * 0.8 && n.totalCalories <= calorieGoal * 1.2
  );

  const avgCalories =
    trackedDays.length > 0
      ? Math.round(trackedDays.reduce((s, n) => s + n.totalCalories, 0) / trackedDays.length)
      : 0;

  // 인사이트
  const insights = generateMonthlyInsights(
    completedWorkouts.length,
    totalDuration,
    avgCalories,
    calorieGoal,
    trackedDays.length,
    bestStreak
  );

  return {
    month: monthStr,
    startDate,
    endDate,
    weeklyTrends,
    workout: {
      totalSessions: completedWorkouts.length,
      totalDuration,
      totalCalories,
      bestStreak,
      averageSessionsPerWeek: Math.round((completedWorkouts.length / totalWeeks) * 10) / 10,
    },
    nutrition: {
      averageCalories: avgCalories,
      averageProtein:
        trackedDays.length > 0
          ? Math.round(trackedDays.reduce((s, n) => s + n.totalProtein, 0) / trackedDays.length)
          : 0,
      averageCarbs:
        trackedDays.length > 0
          ? Math.round(trackedDays.reduce((s, n) => s + n.totalCarbs, 0) / trackedDays.length)
          : 0,
      averageFat:
        trackedDays.length > 0
          ? Math.round(trackedDays.reduce((s, n) => s + n.totalFat, 0) / trackedDays.length)
          : 0,
      daysTracked: trackedDays.length,
      goalAchievementRate:
        trackedDays.length > 0
          ? Math.round((daysOnGoal.length / trackedDays.length) * 100)
          : 0,
    },
    insights,
  };
}

// 주간 인사이트 생성
function generateWeeklyInsights(
  sessions: number,
  _totalCalories: number,
  avgCalories: number,
  calorieGoal: number,
  trackedDays: number,
  streak: number
): string[] {
  const insights: string[] = [];

  // 운동 인사이트
  if (sessions >= 5) {
    insights.push('이번 주 운동 5회 이상 달성! 훌륭해요');
  } else if (sessions >= 3) {
    insights.push(`이번 주 ${sessions}회 운동했어요. 꾸준히 하고 있어요`);
  } else if (sessions > 0) {
    insights.push(`이번 주 ${sessions}회 운동했어요. 조금만 더 힘내봐요`);
  } else {
    insights.push('이번 주 아직 운동 기록이 없어요. 가벼운 걷기부터 시작해볼까요?');
  }

  // 영양 인사이트
  if (trackedDays >= 5) {
    const ratio = avgCalories / calorieGoal;
    if (ratio >= 0.9 && ratio <= 1.1) {
      insights.push('목표 칼로리를 잘 지키고 있어요');
    } else if (ratio < 0.9) {
      insights.push('칼로리 섭취가 목표보다 부족해요. 균형 잡힌 식사를 해보세요');
    } else {
      insights.push('칼로리 섭취가 목표보다 많아요. 간식을 줄여볼까요?');
    }
  } else if (trackedDays > 0) {
    insights.push('영양 기록이 더 많으면 정확한 분석이 가능해요');
  }

  // 스트릭 인사이트
  if (streak >= 7) {
    insights.push(`${streak}일 연속 운동 중! 대단한 기록이에요`);
  } else if (streak >= 3) {
    insights.push(`${streak}일 연속 운동 중이에요. 계속 이어가봐요`);
  }

  return insights.length > 0
    ? insights
    : ['이번 주 데이터가 부족해요. 기록을 시작해보세요!'];
}

// 월간 인사이트 생성
function generateMonthlyInsights(
  sessions: number,
  totalDuration: number,
  avgCalories: number,
  calorieGoal: number,
  trackedDays: number,
  bestStreak: number
): string[] {
  const insights: string[] = [];

  // 운동 인사이트
  if (sessions >= 20) {
    insights.push(`이번 달 ${sessions}회 운동! 정말 꾸준해요`);
  } else if (sessions >= 12) {
    insights.push(`이번 달 ${sessions}회 운동했어요. 좋은 페이스예요`);
  } else if (sessions > 0) {
    insights.push(`이번 달 ${sessions}회 운동했어요. 다음 달은 더 화이팅!`);
  }

  // 총 운동 시간
  if (totalDuration >= 600) {
    const hours = Math.round(totalDuration / 60);
    insights.push(`총 ${hours}시간 운동으로 건강한 한 달을 보냈어요`);
  }

  // 영양 인사이트
  if (trackedDays >= 20) {
    const ratio = avgCalories / calorieGoal;
    if (ratio >= 0.9 && ratio <= 1.1) {
      insights.push('영양 관리가 매우 잘 되고 있어요');
    }
  }

  // 베스트 스트릭
  if (bestStreak >= 5) {
    insights.push(`이번 달 최장 ${bestStreak}일 연속 운동 기록!`);
  }

  return insights.length > 0
    ? insights
    : ['이번 달 데이터를 분석하고 있어요. 기록을 더 쌓아보세요!'];
}
