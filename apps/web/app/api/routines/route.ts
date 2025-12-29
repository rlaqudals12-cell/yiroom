/**
 * 루틴 API 라우트
 * GET: 사용자의 루틴 목록 조회
 * POST: 루틴 생성
 * PUT: 루틴 수정
 * DELETE: 루틴 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { HybridDomain, RoutineItem } from '@/types/hybrid';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') as HybridDomain | null;
    const routineType = searchParams.get('routineType');

    const supabase = createClerkSupabaseClient();

    let query = supabase
      .from('user_routines')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false });

    if (domain) {
      query = query.eq('domain', domain);
    }
    if (routineType) {
      query = query.eq('routine_type', routineType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Routines] Error fetching:', error);
      return NextResponse.json({ error: '루틴을 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ routines: data || [] });
  } catch (error) {
    console.error('[Routines] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { domain, routineType, items = [], isActive = true } = body;

    // 유효성 검사
    if (!domain || !['beauty', 'style'].includes(domain)) {
      return NextResponse.json({ error: '유효하지 않은 도메인입니다.' }, { status: 400 });
    }
    if (!routineType || typeof routineType !== 'string') {
      return NextResponse.json({ error: '루틴 타입이 필요합니다.' }, { status: 400 });
    }
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items는 배열이어야 합니다.' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();

    const { data, error } = await supabase
      .from('user_routines')
      .insert({
        clerk_user_id: userId,
        domain,
        routine_type: routineType,
        items,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      console.error('[Routines] Error creating:', error);
      return NextResponse.json({ error: '루틴 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Routines] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, items, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: '루틴 ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();

    const updateData: { items?: RoutineItem[]; is_active?: boolean } = {};
    if (items !== undefined) updateData.items = items;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('user_routines')
      .update(updateData)
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Routines] Error updating:', error);
      return NextResponse.json({ error: '루틴 수정 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Routines] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '루틴 ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();

    const { error } = await supabase
      .from('user_routines')
      .delete()
      .eq('id', id)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[Routines] Error deleting:', error);
      return NextResponse.json({ error: '루틴 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Routines] Unexpected error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
