/**
 * 제품함 API
 * - GET: 제품함 목록 조회
 * - POST: 제품함에 추가
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  getShelfItems,
  addToShelf,
  getShelfCounts,
  type AddToShelfRequest,
  type ShelfStatus,
} from '@/lib/scan/product-shelf';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ShelfStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeCounts = searchParams.get('counts') === 'true';

    const supabase = createClerkSupabaseClient();

    // 아이템 목록 조회
    const result = await getShelfItems(supabase, userId, {
      status: status || undefined,
      limit,
      offset,
    });

    // 카운트 포함 여부
    let counts = undefined;
    if (includeCounts) {
      counts = await getShelfCounts(supabase, userId);
    }

    return NextResponse.json({
      items: result.items,
      total: result.total,
      counts,
    });
  } catch (error) {
    console.error('[Shelf API] GET error:', error);
    return NextResponse.json({ error: '제품함 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const body: AddToShelfRequest = await request.json();

    // 필수 필드 검증
    if (!body.productName) {
      return NextResponse.json({ error: '제품 이름이 필요합니다' }, { status: 400 });
    }

    if (!body.scanMethod) {
      return NextResponse.json({ error: '스캔 방법이 필요합니다' }, { status: 400 });
    }

    const supabase = createClerkSupabaseClient();
    const item = await addToShelf(supabase, userId, body);

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('[Shelf API] POST error:', error);
    return NextResponse.json({ error: '제품함 추가 중 오류가 발생했습니다' }, { status: 500 });
  }
}
