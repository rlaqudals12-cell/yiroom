/**
 * 쿠폰/프로모션 API 라우트
 * GET: 활성 프로모션 + 내 쿠폰 목록
 * POST: 쿠폰 발급
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getActivePromotions, getUserCoupons, issueCoupon } from '@/lib/products/services/coupons';

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', userMessage: '로그인이 필요해요.' } },
        { status: 401 }
      );
    }

    const supabase = createClerkSupabaseClient();

    const [promotions, coupons] = await Promise.all([
      getActivePromotions(supabase),
      getUserCoupons(supabase, userId),
    ]);

    return NextResponse.json({
      success: true,
      data: { promotions, coupons },
    });
  } catch (error) {
    console.error('[Coupons] GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', userMessage: '서버 오류가 발생했어요.' } },
      { status: 500 }
    );
  }
}

// 쿠폰 발급 요청 스키마
const issueSchema = z.object({
  promotionId: z.string().uuid('유효하지 않은 프로모션 ID예요.'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', userMessage: '로그인이 필요해요.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = issueSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            userMessage: '입력 정보를 확인해주세요.',
            details: validated.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();
    const coupon = await issueCoupon(supabase, userId, validated.data.promotionId);

    if (!coupon) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND_ERROR',
            userMessage: '쿠폰을 발급할 수 없어요. 프로모션이 종료되었거나 소진되었을 수 있어요.',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error) {
    console.error('[Coupons] POST error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', userMessage: '서버 오류가 발생했어요.' } },
      { status: 500 }
    );
  }
}
