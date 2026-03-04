/**
 * Safety Check API
 *
 * POST /api/safety/check — 제품 성분 4단계 안전성 검사
 *
 * @see docs/adr/ADR-070-safety-profile-architecture.md
 * @see docs/specs/SDD-SAFETY-PROFILE.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { checkProductSafety, getSafetyProfile } from '@/lib/safety';

// POST 요청 스키마
const checkSchema = z.object({
  productId: z.string().min(1, '제품 ID가 필요합니다.'),
  ingredients: z.array(z.string()).min(1, '최소 1개 성분이 필요합니다.'),
});

/**
 * POST /api/safety/check
 * 제품 성분 안전성 검사 (4단계 파이프라인)
 *
 * 동의 미완료 사용자: 개인화 없이 빈 리포트 반환
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'User not authenticated',
            userMessage: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = checkSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            userMessage: '입력 정보를 확인해주세요.',
            details: validated.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // 사용자 안전성 프로필 조회
    const profile = await getSafetyProfile(userId);

    // 4단계 파이프라인 실행
    const report = checkProductSafety({
      productId: validated.data.productId,
      ingredients: validated.data.ingredients,
      profile,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[API] POST /api/safety/check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '안전성 검사를 수행할 수 없습니다.',
        },
      },
      { status: 500 }
    );
  }
}
