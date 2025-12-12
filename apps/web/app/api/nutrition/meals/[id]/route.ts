/**
 * N-1 개별 식단 기록 API (Task 2.8)
 *
 * PUT /api/nutrition/meals/:id - 식단 수정
 * DELETE /api/nutrition/meals/:id - 식단 삭제
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/nutrition/meals/:id
 * 식단 기록 수정
 */
export async function PUT(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid meal record ID format' },
        { status: 400 }
      );
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

    const supabase = createServiceRoleClient();

    // 기존 기록 확인 (소유권 검증)
    const { data: existingRecord, error: fetchError } = await supabase
      .from('meal_records')
      .select('id, clerk_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: 'Meal record not found' },
        { status: 404 }
      );
    }

    if (existingRecord.clerk_user_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this record' },
        { status: 403 }
      );
    }

    // 수정 가능한 필드 추출
    const {
      foods,
      mealType,
      mealDate,
      mealTime,
    } = body;

    // 업데이트할 데이터 구성
    const updateData: Record<string, unknown> = {};

    // mealType 검증 및 추가
    if (mealType !== undefined) {
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (!validMealTypes.includes(mealType)) {
        return NextResponse.json(
          { error: `Invalid mealType. Must be one of: ${validMealTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.meal_type = mealType;
    }

    // mealDate 검증 및 추가
    if (mealDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(mealDate)) {
        return NextResponse.json(
          { error: 'Invalid mealDate format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
      updateData.meal_date = mealDate;
    }

    // mealTime 추가
    if (mealTime !== undefined) {
      updateData.meal_time = mealTime;
    }

    // foods 배열 처리
    if (foods !== undefined) {
      if (!Array.isArray(foods) || foods.length === 0) {
        return NextResponse.json(
          { error: 'foods must be a non-empty array' },
          { status: 400 }
        );
      }

      // 총 영양소 재계산
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

      updateData.foods = foodsForDb;
      updateData.total_calories = Math.round(totals.calories);
      updateData.total_protein = Math.round(totals.protein * 10) / 10;
      updateData.total_carbs = Math.round(totals.carbs * 10) / 10;
      updateData.total_fat = Math.round(totals.fat * 10) / 10;
      updateData.ai_recognized_food = foods.map((f: { name: string }) => f.name).join(', ');
    }

    // 업데이트할 데이터가 없으면 에러
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // 업데이트 실행
    const { data, error } = await supabase
      .from('meal_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[N-1] Meal record update error:', error);
      return NextResponse.json(
        { error: 'Failed to update meal record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (error) {
    console.error('[N-1] Meal update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nutrition/meals/:id
 * 식단 기록 삭제
 */
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid meal record ID format' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 기존 기록 확인 (소유권 검증)
    const { data: existingRecord, error: fetchError } = await supabase
      .from('meal_records')
      .select('id, clerk_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingRecord) {
      return NextResponse.json(
        { error: 'Meal record not found' },
        { status: 404 }
      );
    }

    if (existingRecord.clerk_user_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this record' },
        { status: 403 }
      );
    }

    // 삭제 실행
    const { error } = await supabase
      .from('meal_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[N-1] Meal record delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete meal record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '식단 기록이 삭제되었습니다',
    });
  } catch (error) {
    console.error('[N-1] Meal delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/nutrition/meals/:id
 * 개별 식단 기록 조회
 */
export async function GET(req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // UUID 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid meal record ID format' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 기록 조회
    const { data, error } = await supabase
      .from('meal_records')
      .select('*')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Meal record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[N-1] Meal get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
