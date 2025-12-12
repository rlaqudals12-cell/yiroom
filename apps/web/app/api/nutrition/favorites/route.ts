/**
 * N-1 즐겨찾기 API (Task 2.15)
 *
 * GET /api/nutrition/favorites - 즐겨찾기 목록 조회
 * POST /api/nutrition/favorites - 즐겨찾기 추가
 *
 * 자주 먹는 음식을 관리하여 빠른 식단 기록을 지원
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 즐겨찾기 추가 요청 타입
interface AddFavoriteRequest {
  food_id?: string;
  food_name: string;
  custom_name?: string;
  category?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';
  default_serving?: number;
  custom_portion?: string;
  custom_calories?: number;
  notes?: string;
}

/**
 * GET /api/nutrition/favorites
 * 사용자의 즐겨찾기 음식 목록 조회
 */
export async function GET() {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // 즐겨찾기 목록 조회 (사용 횟수 내림차순)
    const { data: favorites, error } = await supabase
      .from('favorite_foods')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('use_count', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[N-1] Favorites fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      favorites: favorites || [],
      count: favorites?.length || 0,
    });
  } catch (error) {
    console.error('[N-1] Favorites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nutrition/favorites
 * 음식을 즐겨찾기에 추가
 */
export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body: AddFavoriteRequest = await req.json();

    // 필수 필드 검증
    if (!body.food_name || body.food_name.trim() === '') {
      return NextResponse.json(
        { error: 'food_name is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 즐겨찾기 추가
    const { data: favorite, error } = await supabase
      .from('favorite_foods')
      .insert({
        clerk_user_id: userId,
        food_id: body.food_id || null,
        food_name: body.food_name.trim(),
        custom_name: body.custom_name?.trim() || null,
        category: body.category || null,
        default_serving: body.default_serving || 1.0,
        custom_portion: body.custom_portion || null,
        custom_calories: body.custom_calories || null,
        notes: body.notes || null,
        use_count: 1,
        last_used_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // 중복 키 에러 (이미 즐겨찾기에 있음)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Food already exists in favorites' },
          { status: 409 }
        );
      }

      console.error('[N-1] Favorite add error:', error);
      return NextResponse.json(
        { error: 'Failed to add favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('[N-1] Favorite add error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
