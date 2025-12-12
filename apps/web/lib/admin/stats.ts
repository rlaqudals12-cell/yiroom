/**
 * 관리자 대시보드 통계
 * @description 사용자, 분석, 제품 등 통계 조회
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 대시보드 통계 타입
 */
export interface DashboardStats {
  users: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  analyses: {
    personalColor: number;
    skin: number;
    body: number;
    workout: number;
    nutrition: number;
  };
  products: {
    cosmetics: number;
    supplements: number;
    equipment: number;
    healthFoods: number;
  };
  activity: {
    workoutLogs: number;
    mealRecords: number;
    wishlists: number;
  };
}

/**
 * 날짜 범위 헬퍼
 */
function getDateRange(range: 'today' | 'week' | 'month'): Date {
  const now = new Date();
  switch (range) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
  }
}

/**
 * 대시보드 통계 조회
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createServiceRoleClient();

  const today = getDateRange('today').toISOString();
  const weekAgo = getDateRange('week').toISOString();
  const monthAgo = getDateRange('month').toISOString();

  // 병렬로 모든 통계 조회
  const [
    usersTotal,
    usersToday,
    usersWeek,
    usersMonth,
    pcAnalyses,
    skinAnalyses,
    bodyAnalyses,
    workoutAnalyses,
    nutritionSettings,
    cosmetics,
    supplements,
    equipment,
    healthFoods,
    workoutLogs,
    mealRecords,
    wishlists,
  ] = await Promise.all([
    // 사용자 통계
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', today),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo),

    // 분석 통계
    supabase.from('personal_color_assessments').select('id', { count: 'exact', head: true }),
    supabase.from('skin_analyses').select('id', { count: 'exact', head: true }),
    supabase.from('body_analyses').select('id', { count: 'exact', head: true }),
    supabase.from('workout_analyses').select('id', { count: 'exact', head: true }),
    supabase.from('nutrition_settings').select('id', { count: 'exact', head: true }),

    // 제품 통계
    supabase.from('cosmetic_products').select('id', { count: 'exact', head: true }),
    supabase.from('supplement_products').select('id', { count: 'exact', head: true }),
    supabase.from('workout_equipment').select('id', { count: 'exact', head: true }),
    supabase.from('health_foods').select('id', { count: 'exact', head: true }),

    // 활동 통계
    supabase.from('workout_logs').select('id', { count: 'exact', head: true }),
    supabase.from('meal_records').select('id', { count: 'exact', head: true }),
    supabase.from('user_wishlists').select('id', { count: 'exact', head: true }),
  ]);

  return {
    users: {
      total: usersTotal.count ?? 0,
      today: usersToday.count ?? 0,
      thisWeek: usersWeek.count ?? 0,
      thisMonth: usersMonth.count ?? 0,
    },
    analyses: {
      personalColor: pcAnalyses.count ?? 0,
      skin: skinAnalyses.count ?? 0,
      body: bodyAnalyses.count ?? 0,
      workout: workoutAnalyses.count ?? 0,
      nutrition: nutritionSettings.count ?? 0,
    },
    products: {
      cosmetics: cosmetics.count ?? 0,
      supplements: supplements.count ?? 0,
      equipment: equipment.count ?? 0,
      healthFoods: healthFoods.count ?? 0,
    },
    activity: {
      workoutLogs: workoutLogs.count ?? 0,
      mealRecords: mealRecords.count ?? 0,
      wishlists: wishlists.count ?? 0,
    },
  };
}

/**
 * 사용자 목록 조회 (페이지네이션)
 */
export interface UserListItem {
  id: string;
  clerkUserId: string;
  email: string | null;
  name: string | null;
  createdAt: Date;
  hasPersonalColor: boolean;
  hasSkin: boolean;
  hasBody: boolean;
  hasWorkout: boolean;
  hasNutrition: boolean;
}

export async function getUserList(
  page: number = 1,
  limit: number = 20
): Promise<{ users: UserListItem[]; total: number }> {
  const supabase = createServiceRoleClient();
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabase
    .from('users')
    .select(
      `
      id,
      clerk_user_id,
      email,
      name,
      created_at,
      personal_color_assessments(id),
      skin_analyses(id),
      body_analyses(id),
      workout_analyses(id),
      nutrition_settings(id)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    console.error('사용자 목록 조회 실패:', error);
    return { users: [], total: 0 };
  }

  const users: UserListItem[] = data.map((user: Record<string, unknown>) => ({
    id: user.id as string,
    clerkUserId: user.clerk_user_id as string,
    email: user.email as string | null,
    name: user.name as string | null,
    createdAt: new Date(user.created_at as string),
    hasPersonalColor: Array.isArray(user.personal_color_assessments) && user.personal_color_assessments.length > 0,
    hasSkin: Array.isArray(user.skin_analyses) && user.skin_analyses.length > 0,
    hasBody: Array.isArray(user.body_analyses) && user.body_analyses.length > 0,
    hasWorkout: Array.isArray(user.workout_analyses) && user.workout_analyses.length > 0,
    hasNutrition: Array.isArray(user.nutrition_settings) && user.nutrition_settings.length > 0,
  }));

  return { users, total: count ?? 0 };
}

/**
 * 최근 활동 로그 조회
 */
export interface RecentActivity {
  type: 'analysis' | 'workout' | 'meal' | 'wishlist';
  userId: string;
  description: string;
  createdAt: Date;
}

export async function getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
  const supabase = createServiceRoleClient();

  // 여러 테이블에서 최근 활동 조회
  const [workoutLogs, mealRecords, wishlists] = await Promise.all([
    supabase
      .from('workout_logs')
      .select('clerk_user_id, exercise_name, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('meal_records')
      .select('clerk_user_id, meal_type, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('user_wishlists')
      .select('clerk_user_id, product_type, created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  const activities: RecentActivity[] = [];

  // 운동 로그
  workoutLogs.data?.forEach((log) => {
    activities.push({
      type: 'workout',
      userId: log.clerk_user_id,
      description: `운동 완료: ${log.exercise_name}`,
      createdAt: new Date(log.created_at),
    });
  });

  // 식사 기록
  mealRecords.data?.forEach((meal) => {
    const mealTypeKr: Record<string, string> = {
      breakfast: '아침',
      lunch: '점심',
      dinner: '저녁',
      snack: '간식',
    };
    activities.push({
      type: 'meal',
      userId: meal.clerk_user_id,
      description: `식사 기록: ${mealTypeKr[meal.meal_type] || meal.meal_type}`,
      createdAt: new Date(meal.created_at),
    });
  });

  // 위시리스트
  wishlists.data?.forEach((wish) => {
    const productTypeKr: Record<string, string> = {
      cosmetic: '화장품',
      supplement: '영양제',
      workout_equipment: '운동기구',
      health_food: '건강식품',
    };
    activities.push({
      type: 'wishlist',
      userId: wish.clerk_user_id,
      description: `위시리스트 추가: ${productTypeKr[wish.product_type] || wish.product_type}`,
      createdAt: new Date(wish.created_at),
    });
  });

  // 시간순 정렬 후 limit 적용
  return activities
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}
