/**
 * 스캔 히스토리 API
 * - GET: 최근 스캔 히스토리 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getRecentScans } from '@/lib/scan/product-shelf';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createClerkSupabaseClient();
    const items = await getRecentScans(supabase, userId, limit);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('[History API] GET error:', error);
    return NextResponse.json({ error: '히스토리 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}
