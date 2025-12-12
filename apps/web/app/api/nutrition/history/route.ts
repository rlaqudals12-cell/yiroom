/**
 * N-1 식단 히스토리 API (Task 2.14)
 *
 * GET /api/nutrition/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=50
 *
 * 기간별 식단 기록 조회:
 * - 날짜 범위 조회 (기본: 최근 7일)
 * - 일별 요약 통계
 * - 페이지네이션 지원
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 날짜 형식 검증 (YYYY-MM-DD)
function isValidDateFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

// 날짜를 YYYY-MM-DD 형식으로 포맷
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 기본 날짜 범위 (최근 7일)
function getDefaultDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6); // 오늘 포함 7일

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

// 식단 기록 타입
interface MealRecord {
  id: string;
  clerk_user_id: string;
  meal_type: string;
  meal_date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  foods: unknown[];
  created_at: string;
}

// 일별 기록 그룹화
interface DailyRecord {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealCount: number;
  meals: MealRecord[];
}

export async function GET(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');

    // 날짜 범위 설정
    let startDate: string;
    let endDate: string;

    if (startDateParam || endDateParam) {
      // 날짜 형식 검증
      if (startDateParam && !isValidDateFormat(startDateParam)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      if (endDateParam && !isValidDateFormat(endDateParam)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }

      // 날짜 범위 검증
      if (startDateParam && endDateParam && startDateParam > endDateParam) {
        return NextResponse.json(
          { error: 'startDate must be before endDate' },
          { status: 400 }
        );
      }

      startDate = startDateParam || getDefaultDateRange().startDate;
      endDate = endDateParam || getDefaultDateRange().endDate;
    } else {
      // 기본값: 최근 7일
      const defaultRange = getDefaultDateRange();
      startDate = defaultRange.startDate;
      endDate = defaultRange.endDate;
    }

    // limit 처리 (기본 50, 최대 100)
    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 100);
      }
    }

    const supabase = createServiceRoleClient();

    // 기간 내 모든 식단 기록 조회
    const { data: meals, error } = await supabase
      .from('meal_records')
      .select('*')
      .eq('clerk_user_id', userId)
      .gte('meal_date', startDate)
      .lte('meal_date', endDate)
      .order('meal_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[N-1] History fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch history' },
        { status: 500 }
      );
    }

    const mealRecords = (meals || []) as MealRecord[];

    // 일별로 그룹화
    const dailyMap = new Map<string, DailyRecord>();

    mealRecords.forEach((meal) => {
      const date = meal.meal_date;

      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          mealCount: 0,
          meals: [],
        });
      }

      const daily = dailyMap.get(date)!;
      daily.totalCalories += meal.total_calories || 0;
      daily.totalProtein += meal.total_protein || 0;
      daily.totalCarbs += meal.total_carbs || 0;
      daily.totalFat += meal.total_fat || 0;
      daily.mealCount += 1;
      daily.meals.push(meal);
    });

    // 일별 기록 배열로 변환 (날짜 내림차순)
    const dailyRecords = Array.from(dailyMap.values()).sort(
      (a, b) => b.date.localeCompare(a.date)
    );

    // 전체 기간 요약 통계
    const totalCalories = dailyRecords.reduce((sum, d) => sum + d.totalCalories, 0);
    const totalMeals = mealRecords.length;
    const daysWithRecords = dailyRecords.length;

    // 날짜 범위 내 전체 일수 계산
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const summary = {
      totalCalories: Math.round(totalCalories),
      avgCaloriesPerDay: daysWithRecords > 0
        ? Math.round(totalCalories / daysWithRecords)
        : 0,
      totalMeals,
      daysWithRecords,
      totalProtein: Math.round(
        dailyRecords.reduce((sum, d) => sum + d.totalProtein, 0) * 10
      ) / 10,
      totalCarbs: Math.round(
        dailyRecords.reduce((sum, d) => sum + d.totalCarbs, 0) * 10
      ) / 10,
      totalFat: Math.round(
        dailyRecords.reduce((sum, d) => sum + d.totalFat, 0) * 10
      ) / 10,
    };

    return NextResponse.json({
      startDate,
      endDate,
      totalDays,
      summary,
      dailyRecords,
    });
  } catch (error) {
    console.error('[N-1] History error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
