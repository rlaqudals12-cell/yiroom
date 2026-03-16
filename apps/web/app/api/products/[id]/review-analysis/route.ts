/**
 * Review AI Analysis API
 * GET: 제품 리뷰 AI 분석 결과 조회
 *
 * @route GET /api/products/[id]/review-analysis?type=cosmetic
 * @auth required
 * @see ADR-092 리뷰 트리거 + 24시간 캐싱
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { analyzeProductReviews } from '@/lib/products/services/review-analysis';
import type { ReviewProductType } from '@/types/review';

/** 허용되는 제품 타입 */
const VALID_PRODUCT_TYPES: ReviewProductType[] = [
  'cosmetic',
  'supplement',
  'equipment',
  'healthfood',
];

/**
 * GET /api/products/[id]/review-analysis
 *
 * Query Parameters:
 * - type: 제품 타입 (cosmetic | supplement | equipment | healthfood) — 필수
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            userMessage: '로그인이 필요해요.',
          },
        },
        { status: 401 }
      );
    }

    // 2. 파라미터 검증
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('type') as ReviewProductType | null;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            userMessage: '제품 정보가 필요해요.',
          },
        },
        { status: 400 }
      );
    }

    if (!productType || !VALID_PRODUCT_TYPES.includes(productType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            userMessage: '올바른 제품 타입을 입력해주세요.',
          },
        },
        { status: 400 }
      );
    }

    // 3. AI 분석 실행 (캐시 확인 → Gemini → Fallback)
    const supabase = createClerkSupabaseClient();
    const result = await analyzeProductReviews(supabase, productId, productType);

    // 4. 리뷰 부족 시
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_REVIEWS',
            userMessage: '리뷰가 5개 이상이어야 AI 분석이 가능해요.',
          },
        },
        { status: 422 }
      );
    }

    // 5. 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[Review Analysis API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          userMessage: '리뷰 분석 중 오류가 발생했어요.',
        },
      },
      { status: 500 }
    );
  }
}
