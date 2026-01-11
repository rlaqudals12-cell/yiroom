/**
 * 어필리에이트 클릭 트래킹 API
 * POST /api/affiliate/click
 *
 * @description 제품 클릭 시 호출되어 클릭 기록 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAffiliateClick, hashIpAddress } from '@/lib/affiliate/clicks';
import { getAffiliateProductById } from '@/lib/affiliate/products';
import { applyRateLimit } from '@/lib/security/rate-limit';
import type { AffiliateRecommendationType } from '@/types/affiliate';

/** 요청 Body */
interface ClickRequestBody {
  productId: string;
  sourcePage: string;
  sourceComponent: string;
  recommendationType?: AffiliateRecommendationType;
  sessionId?: string;
}

/**
 * POST /api/affiliate/click
 * 클릭 이벤트 기록 및 리다이렉트 URL 반환
 */
export async function POST(request: NextRequest) {
  try {
    // 사용자 ID (로그인한 경우)
    const { userId } = await auth();

    // Rate Limit 체크
    const rateLimitResult = applyRateLimit(request, userId);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const body = (await request.json()) as ClickRequestBody;

    // 필수 필드 검증
    if (!body.productId || !body.sourcePage || !body.sourceComponent) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // 제품 존재 확인 및 어필리에이트 URL 조회
    const product = await getAffiliateProductById(body.productId);
    if (!product) {
      return NextResponse.json(
        { error: '제품을 찾을 수 없습니다.' },
        { status: 404, headers: rateLimitResult.headers }
      );
    }

    // IP 해시 (익명화)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0] || 'unknown';
    const ipHash = hashIpAddress(ip);

    // User Agent
    const userAgent = request.headers.get('user-agent') ?? undefined;

    // 클릭 기록 저장
    const click = await createAffiliateClick({
      productId: body.productId,
      clerkUserId: userId ?? undefined,
      sourcePage: body.sourcePage,
      sourceComponent: body.sourceComponent,
      recommendationType: body.recommendationType,
      userAgent,
      ipHash,
      sessionId: body.sessionId,
    });

    if (!click) {
      // 클릭 기록 실패해도 리다이렉트는 진행
      console.error('[Affiliate] 클릭 기록 저장 실패, 계속 진행');
    }

    // 어필리에이트 URL 반환 (Rate Limit 헤더 포함)
    return NextResponse.json(
      {
        success: true,
        affiliateUrl: product.affiliateUrl,
        clickId: click?.id,
      },
      { headers: rateLimitResult.headers }
    );
  } catch (error) {
    console.error('[Affiliate] 클릭 처리 에러:', error);
    return NextResponse.json({ error: '클릭 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
