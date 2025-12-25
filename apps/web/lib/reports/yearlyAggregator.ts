/**
 * 2025 연간 리포트 집계 로직 (서버 전용)
 * Week 2: 연말 리뷰 기능
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { YearlyStats } from './yearlyTypes';

// 타입과 유틸리티 함수는 yearlyTypes.ts에서 re-export
export type { YearlyStats } from './yearlyTypes';
export { getMonthName, generateYearlyHighlights } from './yearlyTypes';

/**
 * 연간 통계 조회
 */
export async function getYearlyStats(clerkUserId: string, year = 2025): Promise<YearlyStats> {
  const supabase = createClerkSupabaseClient();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // 병렬로 모든 데이터 조회
  const [
    workoutLogsResult,
    workoutStreakResult,
    mealRecordsResult,
    nutritionStreakResult,
    waterRecordsResult,
    badgesResult,
    levelResult,
    challengesResult,
    analysesResult,
    friendsResult,
    activitiesResult,
    wellnessResult,
  ] = await Promise.all([
    // 운동 기록
    supabase
      .from('workout_logs')
      .select('exercise_name, duration_minutes, calories_burned, completed_at')
      .eq('clerk_user_id', clerkUserId)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate),

    // 운동 스트릭
    supabase
      .from('workout_streaks')
      .select('longest_streak')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle(),

    // 식사 기록
    supabase
      .from('meal_records')
      .select('total_calories, recorded_at')
      .eq('clerk_user_id', clerkUserId)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate),

    // 영양 스트릭
    supabase
      .from('nutrition_streaks')
      .select('longest_streak')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle(),

    // 수분 기록
    supabase
      .from('water_records')
      .select('amount_ml')
      .eq('clerk_user_id', clerkUserId)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate),

    // 뱃지
    supabase
      .from('user_badges')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .gte('earned_at', startDate)
      .lte('earned_at', endDate),

    // 레벨
    supabase
      .from('user_levels')
      .select('level')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle(),

    // 챌린지 참여
    supabase
      .from('challenge_participations')
      .select('status, joined_at')
      .eq('clerk_user_id', clerkUserId)
      .gte('joined_at', startDate)
      .lte('joined_at', endDate),

    // 분석 결과
    Promise.all([
      supabase.from('personal_color_assessments').select('id').eq('clerk_user_id', clerkUserId).limit(1),
      supabase.from('skin_analyses').select('id').eq('clerk_user_id', clerkUserId).limit(1),
      supabase.from('body_analyses').select('id').eq('clerk_user_id', clerkUserId).limit(1),
      supabase.from('workout_analyses').select('id').eq('clerk_user_id', clerkUserId).limit(1),
    ]),

    // 친구
    supabase
      .from('friendships')
      .select('id')
      .or(`user_id.eq.${clerkUserId},friend_id.eq.${clerkUserId}`)
      .eq('status', 'accepted'),

    // 소셜 활동
    supabase
      .from('social_activities')
      .select('id, likes_count, comments_count')
      .eq('clerk_user_id', clerkUserId)
      .gte('created_at', startDate)
      .lte('created_at', endDate),

    // 웰니스 스코어
    supabase
      .from('wellness_scores')
      .select('total_score, week_start')
      .eq('clerk_user_id', clerkUserId)
      .gte('week_start', startDate)
      .lte('week_start', endDate)
      .order('total_score', { ascending: false }),
  ]);

  // 운동 데이터 처리
  const workoutLogs = workoutLogsResult.data || [];
  const workoutsPerMonth = new Array(12).fill(0);
  const exerciseCount: Record<string, number> = {};

  workoutLogs.forEach((log) => {
    const month = new Date(log.completed_at).getMonth();
    workoutsPerMonth[month]++;
    const name = log.exercise_name || 'Unknown';
    exerciseCount[name] = (exerciseCount[name] || 0) + 1;
  });

  const favoriteExercise = Object.entries(exerciseCount)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  const mostActiveMonth = workoutsPerMonth.indexOf(Math.max(...workoutsPerMonth)) + 1;

  // 영양 데이터 처리
  const mealRecords = mealRecordsResult.data || [];
  const mealsPerMonth = new Array(12).fill(0);

  mealRecords.forEach((meal) => {
    const month = new Date(meal.recorded_at).getMonth();
    mealsPerMonth[month]++;
  });

  const mostRecordedMonth = mealsPerMonth.indexOf(Math.max(...mealsPerMonth)) + 1;

  // 수분 데이터 처리
  const waterRecords = waterRecordsResult.data || [];
  const totalWaterMl = waterRecords.reduce((sum, r) => sum + (r.amount_ml || 0), 0);

  // 챌린지 데이터 처리
  const challenges = challengesResult.data || [];
  const challengesCompleted = challenges.filter((c) => c.status === 'completed').length;
  const challengesJoined = challenges.length;

  // 분석 결과 처리
  const [pcResult, skinResult, bodyResult, workoutResult] = analysesResult;

  // 소셜 활동 처리
  const activities = activitiesResult.data || [];
  const likesReceived = activities.reduce((sum, a) => sum + (a.likes_count || 0), 0);
  const commentsReceived = activities.reduce((sum, a) => sum + (a.comments_count || 0), 0);

  // 웰니스 스코어 처리
  const wellnessScores = wellnessResult.data || [];
  const avgScore = wellnessScores.length > 0
    ? wellnessScores.reduce((sum, s) => sum + s.total_score, 0) / wellnessScores.length
    : 0;
  const bestScore = wellnessScores[0]?.total_score || 0;
  const bestWeek = wellnessScores[0]?.week_start;

  // 점수 개선 계산 (첫 4주 평균 vs 마지막 4주 평균)
  const firstFourWeeks = wellnessScores.slice(-4);
  const lastFourWeeks = wellnessScores.slice(0, 4);
  const firstAvg = firstFourWeeks.length > 0
    ? firstFourWeeks.reduce((sum, s) => sum + s.total_score, 0) / firstFourWeeks.length
    : 0;
  const lastAvg = lastFourWeeks.length > 0
    ? lastFourWeeks.reduce((sum, s) => sum + s.total_score, 0) / lastFourWeeks.length
    : 0;
  const scoreImprovement = lastAvg - firstAvg;

  return {
    year,
    userId: clerkUserId,
    workout: {
      totalWorkouts: workoutLogs.length,
      totalMinutes: workoutLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0),
      totalCaloriesBurned: workoutLogs.reduce((sum, log) => sum + (log.calories_burned || 0), 0),
      longestStreak: workoutStreakResult.data?.longest_streak || 0,
      favoriteExercise,
      mostActiveMonth: mostActiveMonth > 0 ? mostActiveMonth : undefined,
      workoutsPerMonth,
    },
    nutrition: {
      totalMeals: mealRecords.length,
      totalCalories: mealRecords.reduce((sum, meal) => sum + (meal.total_calories || 0), 0),
      averageCaloriesPerDay: mealRecords.length > 0
        ? Math.round(mealRecords.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) / 365)
        : 0,
      totalWaterMl,
      longestStreak: nutritionStreakResult.data?.longest_streak || 0,
      mostRecordedMonth: mostRecordedMonth > 0 ? mostRecordedMonth : undefined,
    },
    achievements: {
      totalBadges: badgesResult.data?.length || 0,
      currentLevel: levelResult.data?.level || 1,
      levelUps: Math.max(0, (levelResult.data?.level || 1) - 1),
      challengesCompleted,
      challengesJoined,
    },
    analyses: {
      personalColorAnalysis: (pcResult.data?.length || 0) > 0,
      skinAnalysis: (skinResult.data?.length || 0) > 0,
      bodyAnalysis: (bodyResult.data?.length || 0) > 0,
      workoutAnalysis: (workoutResult.data?.length || 0) > 0,
    },
    social: {
      friendsCount: friendsResult.data?.length || 0,
      activitiesShared: activities.length,
      likesReceived,
      commentsReceived,
    },
    wellness: {
      averageScore: Math.round(avgScore),
      bestScore,
      bestWeek,
      scoreImprovement: Math.round(scoreImprovement),
    },
  };
}
