/**
 * N-1 음성 식단 기록 API
 *
 * POST /api/nutrition/voice-record
 * Body: { transcript: string, mealType?: string }
 * Returns: { success: boolean, parsed: ParsedFoodItem[], savedMeal?: object }
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { parseVoiceInput, type ParsedFoodItem } from '@/lib/nutrition/voice-parser';

// 유효한 식사 타입
const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
type MealType = (typeof VALID_MEAL_TYPES)[number];

/**
 * POST /api/nutrition/voice-record
 * 음성 인식 텍스트를 파싱하여 식단으로 저장
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { transcript, mealType = 'snack' } = body;

    // 입력 검증
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'transcript is required and must be a string' },
        { status: 400 }
      );
    }

    if (transcript.length < 2) {
      return NextResponse.json(
        { error: 'transcript must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (transcript.length > 500) {
      return NextResponse.json(
        { error: 'transcript must not exceed 500 characters' },
        { status: 400 }
      );
    }

    // 식사 타입 검증
    const validMealType: MealType = VALID_MEAL_TYPES.includes(mealType as MealType)
      ? (mealType as MealType)
      : 'snack';

    // 음성 텍스트 파싱
    let parsedFoods: ParsedFoodItem[] = [];
    try {
      parsedFoods = parseVoiceInput(transcript);
    } catch (parseError) {
      console.error('[N-1] Voice parsing error:', parseError);
      // 파싱 실패해도 에러는 아님 - 빈 배열 반환
    }

    if (parsedFoods.length === 0) {
      return NextResponse.json({
        success: false,
        message: '음식을 인식하지 못했어요. 다시 말씀해주세요.',
        parsed: [],
        transcript,
      });
    }

    // 현재 날짜/시간 (한국 시간)
    const now = new Date();
    const koreaOffset = 9 * 60;
    const koreaTime = new Date(now.getTime() + koreaOffset * 60 * 1000);
    const recordDate = koreaTime.toISOString().split('T')[0];
    const recordTime = koreaTime.toISOString().split('T')[1].substring(0, 5);

    const supabase = createServiceRoleClient();

    // 식사 기록 저장
    const { data: meal, error: mealError } = await supabase
      .from('meal_records')
      .insert({
        clerk_user_id: userId,
        meal_date: recordDate,
        meal_time: recordTime,
        meal_type: validMealType,
        total_calories: parsedFoods.reduce((sum, f) => sum + (f.estimatedCalories || 0), 0),
        total_protein: parsedFoods.reduce((sum, f) => sum + (f.estimatedProtein || 0), 0),
        total_carbs: parsedFoods.reduce((sum, f) => sum + (f.estimatedCarbs || 0), 0),
        total_fat: parsedFoods.reduce((sum, f) => sum + (f.estimatedFat || 0), 0),
        foods: parsedFoods,
        source: 'voice',
        raw_transcript: transcript,
      })
      .select()
      .single();

    if (mealError) {
      console.error('[N-1] Meal insert error:', mealError);
      return NextResponse.json({ error: 'Failed to save meal record' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      parsed: parsedFoods,
      savedMeal: {
        id: meal.id,
        mealType: meal.meal_type,
        mealDate: meal.meal_date,
        mealTime: meal.meal_time,
        totalCalories: meal.total_calories,
        foodCount: parsedFoods.length,
      },
      transcript,
    });
  } catch (error) {
    console.error('[N-1] Voice record error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
