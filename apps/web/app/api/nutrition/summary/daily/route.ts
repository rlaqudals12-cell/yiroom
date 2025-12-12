/**
 * N-1 일일 영양 요약 API (Task 2.8)
 *
 * GET /api/nutrition/summary/daily?date=YYYY-MM-DD
 * 해당 날짜의 영양 섭취 요약을 반환
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 기본 영양 목표 (향후 nutrition_settings에서 가져올 예정)
const DEFAULT_TARGETS = {
  calories: 2000,
  carbs: 250, // g
  protein: 80, // g
  fat: 55, // g
  water: 2000, // ml
};

// 신호등 분류 기준 (칼로리 밀도 기반)
function getSignalRatio(foods: Array<{ traffic_light?: string }>) {
  if (!foods || foods.length === 0) {
    return { green: 0, yellow: 0, red: 0 };
  }

  let green = 0;
  let yellow = 0;
  let red = 0;

  foods.forEach((food) => {
    switch (food.traffic_light) {
      case 'green':
        green++;
        break;
      case 'red':
        red++;
        break;
      default:
        yellow++;
    }
  });

  const total = green + yellow + red;
  return {
    green: Math.round((green / total) * 100),
    yellow: Math.round((yellow / total) * 100),
    red: Math.round((red / total) * 100),
  };
}

// AI 인사이트 생성
function generateInsights(
  consumed: { calories: number; protein: number; carbs: number; fat: number; water: number },
  target: typeof DEFAULT_TARGETS,
  signalRatio: { green: number; yellow: number; red: number }
): string[] {
  const insights: string[] = [];

  // 단백질 부족
  const proteinPercent = Math.round((consumed.protein / target.protein) * 100);
  if (proteinPercent < 70) {
    insights.push('단백질이 부족해요! 닭가슴살이나 계란을 추천해요 🍗');
  }

  // 탄수화물 초과
  const carbsPercent = Math.round((consumed.carbs / target.carbs) * 100);
  if (carbsPercent > 120) {
    insights.push('탄수화물 섭취가 많아요. 다음 끼니는 가볍게! 🥗');
  }

  // 수분 부족
  const waterPercent = Math.round((consumed.water / target.water) * 100);
  if (waterPercent < 50) {
    insights.push('수분 섭취가 부족해요! 물 한 잔 마셔볼까요? 💧');
  }

  // 칼로리 초과
  const caloriePercent = Math.round((consumed.calories / target.calories) * 100);
  if (caloriePercent > 100) {
    insights.push('오늘 칼로리 목표를 초과했어요. 가벼운 운동을 추천해요 🏃');
  }

  // 신호등 관련
  if (signalRatio.red > 40) {
    insights.push('고칼로리 음식이 많았어요. 내일은 초록색 위주로! 🟢');
  } else if (signalRatio.green > 40) {
    insights.push('건강한 식단이에요! 이 습관 유지하세요 💚');
  }

  // 목표 달성
  if (caloriePercent >= 90 && caloriePercent <= 110) {
    insights.push('오늘 칼로리 목표 달성! 잘하고 있어요 🎉');
  }

  // 최대 3개만 반환
  return insights.slice(0, 3);
}

/**
 * GET /api/nutrition/summary/daily?date=YYYY-MM-DD
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터에서 날짜 추출
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    // 날짜 형식 검증 (YYYY-MM-DD)
    let targetDate: string;
    if (dateParam) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      targetDate = dateParam;
    } else {
      // 오늘 날짜 (한국 시간 기준)
      const now = new Date();
      const koreaOffset = 9 * 60; // UTC+9
      const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000);
      targetDate = koreaTime.toISOString().split('T')[0];
    }

    const supabase = createServiceRoleClient();

    // 해당 날짜의 모든 식사 기록 조회
    const { data: meals, error: mealsError } = await supabase
      .from('meal_records')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('meal_date', targetDate)
      .order('created_at', { ascending: true });

    if (mealsError) {
      console.error('[N-1] Daily summary fetch error:', mealsError);
      return NextResponse.json(
        { error: 'Failed to fetch daily summary' },
        { status: 500 }
      );
    }

    // 해당 날짜의 수분 섭취 기록 조회
    const { data: waterRecords } = await supabase
      .from('water_records')
      .select('amount_ml, effective_ml')
      .eq('clerk_user_id', userId)
      .eq('record_date', targetDate);

    // 총 수분 섭취량 계산
    const totalWater = waterRecords?.reduce(
      (sum, record) => sum + (record.effective_ml || record.amount_ml || 0),
      0
    ) || 0;

    // 영양소 총합 계산
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    const allFoods: Array<{ traffic_light?: string }> = [];

    meals?.forEach((meal) => {
      totalCalories += meal.total_calories || 0;
      totalCarbs += meal.total_carbs || 0;
      totalProtein += meal.total_protein || 0;
      totalFat += meal.total_fat || 0;

      // 신호등 비율 계산을 위해 모든 음식 수집
      if (meal.foods && Array.isArray(meal.foods)) {
        allFoods.push(...meal.foods);
      }
    });

    // 사용자 설정에서 목표 가져오기 (없으면 기본값 사용)
    const { data: settings } = await supabase
      .from('nutrition_settings')
      .select('daily_calories, daily_carbs, daily_protein, daily_fat, daily_water')
      .eq('clerk_user_id', userId)
      .single();

    const target = {
      calories: settings?.daily_calories || DEFAULT_TARGETS.calories,
      carbs: settings?.daily_carbs || DEFAULT_TARGETS.carbs,
      protein: settings?.daily_protein || DEFAULT_TARGETS.protein,
      fat: settings?.daily_fat || DEFAULT_TARGETS.fat,
      water: settings?.daily_water || DEFAULT_TARGETS.water,
    };

    // 섭취량
    const consumed = {
      calories: Math.round(totalCalories),
      carbs: Math.round(totalCarbs * 10) / 10,
      protein: Math.round(totalProtein * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      water: totalWater,
    };

    // 달성률 계산
    const achievement = {
      calories_percent: Math.round((consumed.calories / target.calories) * 100),
      carbs_percent: Math.round((consumed.carbs / target.carbs) * 100),
      protein_percent: Math.round((consumed.protein / target.protein) * 100),
      fat_percent: Math.round((consumed.fat / target.fat) * 100),
      water_percent: Math.round((consumed.water / target.water) * 100),
    };

    // 신호등 비율
    const signalRatio = getSignalRatio(allFoods);

    // AI 인사이트 생성
    const insights = generateInsights(consumed, target, signalRatio);

    // 식사별 요약
    const mealsSummary = meals?.map((meal) => ({
      id: meal.id,
      meal_type: meal.meal_type,
      meal_time: meal.meal_time,
      calories: meal.total_calories || 0,
      protein: meal.total_protein || 0,
      carbs: meal.total_carbs || 0,
      fat: meal.total_fat || 0,
      foods: meal.foods || [],
      created_at: meal.created_at,
    })) || [];

    const response = {
      date: targetDate,
      target,
      consumed,
      achievement,
      signal_ratio: signalRatio,
      meals: mealsSummary,
      meal_count: mealsSummary.length,
      insights,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[N-1] Daily summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
