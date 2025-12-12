import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 식사 타입별 정보 (N-1 스펙 5.1 메인 대시보드 기준)
const MEAL_TYPE_INFO = {
  breakfast: { label: '아침', icon: '🌅', order: 0 },
  lunch: { label: '점심', icon: '🌞', order: 1 },
  dinner: { label: '저녁', icon: '🌙', order: 2 },
  snack: { label: '간식', icon: '🍎', order: 3 },
} as const;

type MealType = keyof typeof MEAL_TYPE_INFO;

/**
 * N-1 오늘의 식단 조회 API (Task 2.7)
 *
 * GET /api/nutrition/meals?date=YYYY-MM-DD
 * - date가 없으면 오늘 날짜 사용
 * - 사용자의 해당 날짜 식단 기록을 반환
 */
export async function GET(req: Request) {
  try {
    // Clerk 인증 확인
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
    const { data: meals, error } = await supabase
      .from('meal_records')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('meal_date', targetDate)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[N-1] Meal records fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch meal records' },
        { status: 500 }
      );
    }

    // 식사 타입별로 그룹화
    const mealsByType: Record<MealType, typeof meals> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meals?.forEach((meal) => {
      const mealType = meal.meal_type as MealType;
      if (mealsByType[mealType]) {
        mealsByType[mealType].push(meal);
      }
      totalCalories += meal.total_calories || 0;
      totalProtein += meal.total_protein || 0;
      totalCarbs += meal.total_carbs || 0;
      totalFat += meal.total_fat || 0;
    });

    // 응답 데이터 구성
    const response = {
      date: targetDate,
      summary: {
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein * 10) / 10,
        totalCarbs: Math.round(totalCarbs * 10) / 10,
        totalFat: Math.round(totalFat * 10) / 10,
        mealCount: meals?.length || 0,
      },
      meals: Object.entries(MEAL_TYPE_INFO).map(([type, info]) => ({
        type,
        label: info.label,
        icon: info.icon,
        order: info.order,
        records: mealsByType[type as MealType] || [],
        subtotal: {
          calories: mealsByType[type as MealType]?.reduce(
            (sum, m) => sum + (m.total_calories || 0),
            0
          ) || 0,
          protein: mealsByType[type as MealType]?.reduce(
            (sum, m) => sum + (m.total_protein || 0),
            0
          ) || 0,
          carbs: mealsByType[type as MealType]?.reduce(
            (sum, m) => sum + (m.total_carbs || 0),
            0
          ) || 0,
          fat: mealsByType[type as MealType]?.reduce(
            (sum, m) => sum + (m.total_fat || 0),
            0
          ) || 0,
        },
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[N-1] Meal records error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * N-1 식사 기록 저장 API (Task 2.5)
 *
 * POST /api/nutrition/meals
 * 분석 결과를 사용자가 확인/수정 후 저장하는 엔드포인트
 */
export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // JSON 파싱
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const {
      foods,
      mealType = 'lunch',
      mealDate,
      recordType = 'photo', // 'photo' | 'search' | 'barcode' | 'manual'
      // imageBase64, // 향후 이미지 저장 기능 추가 시 사용
    } = body;

    // 필수 필드 검증
    if (!foods || !Array.isArray(foods) || foods.length === 0) {
      return NextResponse.json(
        { error: 'foods array is required and must not be empty' },
        { status: 400 }
      );
    }

    // mealType 검증
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (mealType && !validMealTypes.includes(mealType)) {
      return NextResponse.json(
        { error: `Invalid mealType. Must be one of: ${validMealTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // recordType 검증
    const validRecordTypes = ['photo', 'search', 'barcode', 'manual'];
    if (recordType && !validRecordTypes.includes(recordType)) {
      return NextResponse.json(
        { error: `Invalid recordType. Must be one of: ${validRecordTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // 총 영양소 계산
    const totals = foods.reduce(
      (acc: { calories: number; protein: number; carbs: number; fat: number }, food: {
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
      }) => ({
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    // 평균 신뢰도 계산
    const avgConfidence = foods.length > 0
      ? foods.reduce((sum: number, f: { confidence?: number }) => sum + (f.confidence || 0.8), 0) / foods.length
      : 0.8;

    // 신뢰도 레벨 결정
    const confidenceLevel = avgConfidence >= 0.85 ? 'high' : avgConfidence >= 0.7 ? 'medium' : 'low';

    // foods 배열을 DB 형식으로 변환
    const foodsForDb = foods.map((food: {
      name: string;
      portion?: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      trafficLight?: string;
      confidence?: number;
    }) => ({
      food_name: food.name,
      portion: food.portion || '1인분',
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      traffic_light: food.trafficLight || 'yellow',
      ai_confidence: food.confidence || 0.8,
    }));

    const supabase = createServiceRoleClient();

    // meal_records 테이블에 저장
    const { data, error } = await supabase
      .from('meal_records')
      .insert({
        clerk_user_id: userId,
        meal_type: mealType,
        meal_date: mealDate || new Date().toISOString().split('T')[0],
        record_type: recordType, // 'photo' | 'search' | 'barcode' | 'manual'
        foods: foodsForDb,
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein * 10) / 10,
        total_carbs: Math.round(totals.carbs * 10) / 10,
        total_fat: Math.round(totals.fat * 10) / 10,
        ai_recognized_food: recordType === 'manual' ? null : foods.map((f: { name: string }) => f.name).join(', '),
        ai_confidence: recordType === 'manual' ? null : confidenceLevel,
        user_confirmed: true,
        // 이미지 저장은 선택적 (용량 고려)
        // photo_url: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null,
      })
      .select()
      .single();

    if (error) {
      console.error('[N-1] Meal record insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save meal record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (error) {
    console.error('[N-1] Meal save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
