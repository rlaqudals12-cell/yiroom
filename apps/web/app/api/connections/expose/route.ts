/**
 * 연결 노출 API
 *
 * @route POST /api/connections/expose
 * @auth required
 * @description 인사이트 노출 시 ConnectionAwareness 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { exposeConnection } from '@/lib/connection-awareness';

const requestSchema = z.object({
  connectionId: z.string().min(1),
  sourceModule: z.enum([
    'personal-color',
    'skin',
    'body',
    'hair',
    'makeup',
    'oral-health',
    'workout',
    'nutrition',
    'fashion',
  ]),
  targetDomain: z.string().min(1),
  connectionRule: z.string().min(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', userMessage: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', userMessage: '입력 정보를 확인해주세요.' },
        },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();
    const result = await exposeConnection(supabase, userId, validated.data);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[API] POST /api/connections/expose error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', userMessage: '서버 오류가 발생했습니다.' },
      },
      { status: 500 }
    );
  }
}
