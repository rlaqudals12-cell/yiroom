/**
 * 쿠폰 적용 API 라우트
 * POST: 쿠폰 코드 검증 + 할인 계산
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { applyCoupon } from '@/lib/products/services/coupons';

// 쿠폰 적용 요청 스키마
const applySchema = z.object({
  couponCode: z.string().min(1, '쿠폰 코드를 입력해주세요.').max(20),
  orderAmount: z.number().positive('주문 금액은 0보다 커야 해요.'),
  partnerName: z.string().optional(),
  category: z.string().optional(),
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
    const validated = applySchema.safeParse(body);

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

    const { couponCode, orderAmount, partnerName, category } = validated.data;
    const supabase = createClerkSupabaseClient();

    const result = await applyCoupon(supabase, couponCode, orderAmount, partnerName, category);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Coupons] Apply error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', userMessage: '서버 오류가 발생했어요.' } },
      { status: 500 }
    );
  }
}
