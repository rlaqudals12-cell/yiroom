/**
 * 연결 목록 API
 *
 * @route GET /api/connections
 * @auth required
 * @description 사용자의 ConnectionAwareness 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getUserConnections } from '@/lib/connection-awareness';
import type { ConnectionStatus } from '@/lib/connection-awareness';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', userMessage: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ConnectionStatus | null;
    const sourceModule = searchParams.get('sourceModule');

    const supabase = createClerkSupabaseClient();
    const connections = await getUserConnections(supabase, userId, {
      status: status ?? undefined,
      sourceModule: sourceModule ?? undefined,
    });

    return NextResponse.json({
      success: true,
      data: connections,
      summary: { total: connections.length },
    });
  } catch (error) {
    console.error('[API] GET /api/connections error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', userMessage: '서버 오류가 발생했습니다.' },
      },
      { status: 500 }
    );
  }
}
