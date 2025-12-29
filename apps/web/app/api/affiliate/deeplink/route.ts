/**
 * 딥링크 생성 API
 * POST /api/affiliate/deeplink
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDeeplink, createMultipleDeeplinks } from '@/lib/affiliate';
import type { AffiliatePartnerName } from '@/types/affiliate';

/**
 * 단일 딥링크 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partner, productUrl, productId, subId, campaignId } = body as {
      partner: AffiliatePartnerName;
      productUrl: string;
      productId?: string;
      subId?: string;
      campaignId?: string;
    };

    // 필수 파라미터 검증
    if (!partner) {
      return NextResponse.json(
        { error: 'partner가 필요합니다' },
        { status: 400 }
      );
    }

    if (!productUrl) {
      return NextResponse.json(
        { error: 'productUrl이 필요합니다' },
        { status: 400 }
      );
    }

    // 지원 파트너 검증
    const validPartners: AffiliatePartnerName[] = ['coupang', 'iherb', 'musinsa'];
    if (!validPartners.includes(partner)) {
      return NextResponse.json(
        { error: `지원하지 않는 파트너입니다: ${partner}` },
        { status: 400 }
      );
    }

    // URL 유효성 검증
    try {
      new URL(productUrl);
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 URL입니다' },
        { status: 400 }
      );
    }

    // 딥링크 생성
    const result = await createDeeplink({
      partner,
      productUrl,
      productId,
      subId,
      campaignId,
    });

    return NextResponse.json({
      success: result.success,
      deeplink: result.url,
      partner: result.partner,
      error: result.error,
    });
  } catch (error) {
    console.error('[API] 딥링크 생성 에러:', error);
    return NextResponse.json(
      { error: '딥링크 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 다중 딥링크 생성
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, subId } = body as {
      urls: Record<string, string>; // partner -> productUrl
      subId?: string;
    };

    if (!urls || Object.keys(urls).length === 0) {
      return NextResponse.json(
        { error: 'urls가 필요합니다' },
        { status: 400 }
      );
    }

    // Map으로 변환
    const urlMap = new Map<AffiliatePartnerName, string>();
    for (const [partner, url] of Object.entries(urls)) {
      urlMap.set(partner as AffiliatePartnerName, url);
    }

    // 다중 딥링크 생성
    const results = await createMultipleDeeplinks(urlMap, subId);

    // Map을 객체로 변환
    const response: Record<string, { url: string; success: boolean; error?: string }> = {};
    for (const [partner, result] of results) {
      response[partner] = {
        url: result.url,
        success: result.success,
        error: result.error,
      };
    }

    return NextResponse.json({
      success: true,
      deeplinks: response,
    });
  } catch (error) {
    console.error('[API] 다중 딥링크 생성 에러:', error);
    return NextResponse.json(
      { error: '딥링크 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
