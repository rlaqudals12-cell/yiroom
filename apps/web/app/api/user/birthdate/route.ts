/**
 * 생년월일 조회 및 저장 API
 * GET/POST /api/user/birthdate
 *
 * 한국 청소년보호법 준수: 만 14세 미만 회원가입 차단
 */
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { isValidBirthDate, isMinor, MINIMUM_AGE } from '@/lib/age-verification';

// 요청 스키마
const birthDateSchema = z.object({
  birthDate: z.string().refine(isValidBirthDate, {
    message: '올바른 생년월일 형식이 아닙니다. (YYYY-MM-DD)',
  }),
});

/**
 * GET: 현재 사용자의 생년월일 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'AUTH_ERROR', message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = createClerkSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('birth_date')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      console.error('[API] GET /user/birthdate error:', error);
      return NextResponse.json(
        { success: false, error: 'DB_ERROR', message: '사용자 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        birthDate: data?.birth_date || null,
        hasBirthDate: !!data?.birth_date,
      },
    });
  } catch (error) {
    console.error('[API] GET /user/birthdate unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR', message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST: 생년월일 저장 (최초 입력 또는 수정)
 * 만 14세 미만인 경우 저장 거부
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'AUTH_ERROR', message: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'INVALID_REQUEST', message: '잘못된 요청입니다.' },
        { status: 400 }
      );
    }

    // 스키마 검증
    const parsed = birthDateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: parsed.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const { birthDate } = parsed.data;

    // 만 14세 미만 확인
    if (isMinor(birthDate)) {
      return NextResponse.json(
        {
          success: false,
          error: 'AGE_RESTRICTION',
          message: `만 ${MINIMUM_AGE}세 이상만 서비스를 이용할 수 있습니다.`,
          isMinor: true,
        },
        { status: 403 }
      );
    }

    // 생년월일 저장 (UPSERT로 레코드가 없으면 생성)
    const supabase = createClerkSupabaseClient();
    const { error } = await supabase.from('users').upsert(
      {
        clerk_user_id: userId,
        birth_date: birthDate,
      },
      {
        onConflict: 'clerk_user_id',
      }
    );

    if (error) {
      console.error('[API] POST /user/birthdate error:', error);
      return NextResponse.json(
        { success: false, error: 'DB_ERROR', message: '생년월일을 저장할 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '생년월일이 저장되었습니다.',
      data: { birthDate },
    });
  } catch (error) {
    console.error('[API] POST /user/birthdate unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR', message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
