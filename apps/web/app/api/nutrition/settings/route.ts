import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { upsertPreferences } from '@/lib/preferences';
import { allergiesToPreferences, dislikedFoodsToPreferences } from '@/lib/preferences/converters';
import type {
  MealStyle,
  CookingSkill,
  BudgetLevel,
  AllergyType,
  NutritionGoal,
  ActivityLevel,
} from '@/types/nutrition';

// 영양 설정 저장 요청 타입
interface NutritionSettingsRequest {
  goal: NutritionGoal;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  activityLevel: ActivityLevel;
  mealStyle: MealStyle;
  cookingSkill: CookingSkill;
  budget: BudgetLevel;
  allergies: AllergyType[];
  dislikedFoods: string[];
  mealCount: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

/**
 * N-1 영양 설정 저장 API
 * POST: 온보딩 완료 시 영양 설정 저장 (upsert)
 * GET: 현재 사용자의 영양 설정 조회
 */

// POST: 영양 설정 저장
export async function POST(request: Request) {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body: NutritionSettingsRequest = await request.json();

    // 필수 필드 검증
    if (!body.goal || !body.bmr || !body.tdee || !body.dailyCalorieTarget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Supabase에 저장 (upsert)
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('nutrition_settings')
      .upsert(
        {
          clerk_user_id: userId,
          goal: body.goal,
          bmr: body.bmr,
          tdee: body.tdee,
          daily_calorie_target: body.dailyCalorieTarget,
          activity_level: body.activityLevel,
          meal_style: body.mealStyle,
          cooking_skill: body.cookingSkill,
          budget: body.budget,
          allergies: body.allergies,
          disliked_foods: body.dislikedFoods,
          meal_count: body.mealCount,
          protein_target: body.proteinTarget,
          carbs_target: body.carbsTarget,
          fat_target: body.fatTarget,
        },
        {
          onConflict: 'clerk_user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Nutrition settings save error:', error);
      return NextResponse.json(
        { error: 'Failed to save nutrition settings', details: error.message },
        { status: 500 }
      );
    }

    // Dual Write: user_preferences에도 저장 (allergies + dislikedFoods)
    try {
      const preferences = [
        ...allergiesToPreferences(body.allergies, userId),
        ...dislikedFoodsToPreferences(body.dislikedFoods, userId),
      ];

      if (preferences.length > 0) {
        await upsertPreferences(supabase, preferences);
        console.log(`[N-1] Saved ${preferences.length} preferences to user_preferences`);
      }
    } catch (prefError) {
      // user_preferences 저장 실패해도 기존 로직은 정상 동작
      console.error('[N-1] Failed to save preferences (non-critical):', prefError);
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Nutrition settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 간헐적 단식 설정 업데이트 요청 타입
interface FastingSettingsRequest {
  fasting_enabled?: boolean;
  fasting_type?: '16:8' | '18:6' | '20:4' | 'custom' | null;
  fasting_start_time?: string | null;
  eating_window_hours?: number | null;
}

// PATCH: 영양 설정 부분 업데이트 (간헐적 단식 등)
export async function PATCH(request: Request) {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body: FastingSettingsRequest = await request.json();

    // Supabase에서 업데이트
    const supabase = createServiceRoleClient();

    // 업데이트할 필드만 추출
    const updateData: Record<string, unknown> = {};

    if (body.fasting_enabled !== undefined) {
      updateData.fasting_enabled = body.fasting_enabled;
    }
    if (body.fasting_type !== undefined) {
      updateData.fasting_type = body.fasting_type;
    }
    if (body.fasting_start_time !== undefined) {
      updateData.fasting_start_time = body.fasting_start_time;
    }
    if (body.eating_window_hours !== undefined) {
      updateData.eating_window_hours = body.eating_window_hours;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('nutrition_settings')
      .update(updateData)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[N-1] Nutrition settings update error:', error);
      return NextResponse.json(
        { error: 'Failed to update nutrition settings', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Nutrition settings not found. Please complete onboarding first.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[N-1] Nutrition settings PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: 영양 설정 조회
export async function GET() {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Supabase에서 조회
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('nutrition_settings')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (사용자 설정이 없는 경우)
      console.error('Nutrition settings fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch nutrition settings', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null,
      hasSettings: !!data,
    });
  } catch (error) {
    console.error('Nutrition settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
