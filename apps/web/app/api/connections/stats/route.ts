/**
 * 연결 통계 API
 *
 * @route GET /api/connections/stats
 * @auth required
 * @description 사용자의 내재화 통계 조회
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getConnectionStats } from '@/lib/connection-awareness';

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', userMessage: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const supabase = createClerkSupabaseClient();
    const stats = await getConnectionStats(supabase, userId);

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('[API] GET /api/connections/stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', userMessage: '서버 오류가 발생했습니다.' },
      },
      { status: 500 }
    );
  }
}
