/**
 * 제품함 아이템 상세 API
 * - GET: 아이템 조회
 * - PUT: 아이템 업데이트
 * - DELETE: 아이템 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  getShelfItem,
  updateShelfItem,
  removeFromShelf,
  type UpdateShelfItemRequest,
} from '@/lib/scan/product-shelf';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = createClerkSupabaseClient();
    const item = await getShelfItem(supabase, userId, id);

    if (!item) {
      return NextResponse.json({ error: '아이템을 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('[Shelf API] GET item error:', error);
    return NextResponse.json({ error: '아이템 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body: UpdateShelfItemRequest = await request.json();
    const supabase = createClerkSupabaseClient();

    // 존재 여부 확인
    const existing = await getShelfItem(supabase, userId, id);
    if (!existing) {
      return NextResponse.json({ error: '아이템을 찾을 수 없습니다' }, { status: 404 });
    }

    const item = await updateShelfItem(supabase, userId, id, body);
    return NextResponse.json(item);
  } catch (error) {
    console.error('[Shelf API] PUT item error:', error);
    return NextResponse.json({ error: '아이템 업데이트 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = createClerkSupabaseClient();

    // 존재 여부 확인
    const existing = await getShelfItem(supabase, userId, id);
    if (!existing) {
      return NextResponse.json({ error: '아이템을 찾을 수 없습니다' }, { status: 404 });
    }

    await removeFromShelf(supabase, userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Shelf API] DELETE item error:', error);
    return NextResponse.json({ error: '아이템 삭제 중 오류가 발생했습니다' }, { status: 500 });
  }
}
