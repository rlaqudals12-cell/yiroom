/**
 * 쿠팡 제품 동기화 API
 * POST /api/affiliate/coupang/sync
 *
 * @description 쿠팡 카테고리별 제품 동기화 (관리자 전용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getCoupangCategoryProducts,
  isCoupangConfigured,
  COUPANG_CATEGORIES,
  updatePartnerSyncStatus,
  getAffiliatePartnerByName,
} from '@/lib/affiliate';
import { supabase } from '@/lib/supabase/client';
import type { CoupangCategory } from '@/lib/affiliate';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // TODO: 관리자 권한 확인
    // const isAdmin = await checkAdminRole(userId);
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { error: '관리자 권한이 필요합니다' },
    //     { status: 403 }
    //   );
    // }

    const body = await request.json();
    const { categories, limit = 100 } = body as {
      categories?: CoupangCategory[];
      limit?: number;
    };

    // 카테고리 유효성 검사
    const targetCategories: CoupangCategory[] = categories
      ? categories.filter((c) => c in COUPANG_CATEGORIES)
      : (Object.keys(COUPANG_CATEGORIES) as CoupangCategory[]);

    if (targetCategories.length === 0) {
      return NextResponse.json(
        { error: '유효한 카테고리가 없습니다' },
        { status: 400 }
      );
    }

    // 파트너 정보 조회
    const partner = await getAffiliatePartnerByName('coupang');
    if (!partner) {
      return NextResponse.json(
        { error: '쿠팡 파트너 설정이 없습니다' },
        { status: 404 }
      );
    }

    // 동기화 상태 업데이트
    await updatePartnerSyncStatus(partner.id, 'syncing');

    const results: Record<string, { added: number; updated: number; errors: number }> = {};
    let totalAdded = 0;
    const totalUpdated = 0; // TODO: upsert에서 구분 필요
    let totalErrors = 0;

    // 카테고리별 동기화
    for (const category of targetCategories) {
      const categoryId = COUPANG_CATEGORIES[category];

      try {
        const products = await getCoupangCategoryProducts(categoryId, limit);

        let added = 0;
        const updated = 0; // TODO: upsert에서 구분 필요
        let errors = 0;

        // 제품 upsert
        for (const product of products) {
          const { error } = await supabase
            .from('affiliate_products')
            .upsert(
              {
                partner_id: partner.id,
                external_product_id: product.externalProductId,
                name: product.name,
                brand: product.brand,
                category: product.category,
                image_url: product.imageUrl,
                price_krw: product.priceKrw,
                price_original_krw: product.priceOriginalKrw,
                currency: 'KRW',
                affiliate_url: product.affiliateUrl,
                direct_url: product.directUrl,
                rating: product.rating,
                review_count: product.reviewCount,
                tags: product.tags,
                is_in_stock: product.isInStock,
                is_active: true,
                last_synced_at: new Date().toISOString(),
              },
              {
                onConflict: 'partner_id,external_product_id',
              }
            );

          if (error) {
            console.error('[Sync] 제품 저장 실패:', error);
            errors++;
            totalErrors++;
          } else {
            // TODO: 실제로 추가/업데이트 구분 필요
            added++;
            totalAdded++;
          }
        }

        results[category] = { added, updated, errors };
      } catch (error) {
        console.error(`[Sync] ${category} 동기화 실패:`, error);
        results[category] = { added: 0, updated: 0, errors: 1 };
        totalErrors++;
      }
    }

    // 동기화 상태 완료
    await updatePartnerSyncStatus(
      partner.id,
      totalErrors === 0 ? 'success' : 'error',
      totalErrors > 0 ? `${totalErrors}개 오류 발생` : undefined
    );

    return NextResponse.json({
      success: true,
      isConfigured: isCoupangConfigured(),
      isMock: !isCoupangConfigured(),
      summary: {
        totalAdded,
        totalUpdated,
        totalErrors,
      },
      results,
    });
  } catch (error) {
    console.error('[API] 쿠팡 동기화 에러:', error);

    // 에러 시 상태 업데이트
    const partner = await getAffiliatePartnerByName('coupang');
    if (partner) {
      await updatePartnerSyncStatus(
        partner.id,
        'error',
        error instanceof Error ? error.message : '동기화 실패'
      );
    }

    return NextResponse.json(
      { error: '동기화 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * 동기화 상태 조회
 */
export async function GET() {
  try {
    const partner = await getAffiliatePartnerByName('coupang');

    if (!partner) {
      return NextResponse.json(
        { error: '쿠팡 파트너 설정이 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      isConfigured: isCoupangConfigured(),
      partner: {
        id: partner.id,
        name: partner.name,
        displayName: partner.displayName,
        syncStatus: partner.syncStatus,
        lastSyncedAt: partner.lastSyncedAt,
        syncErrorMessage: partner.syncErrorMessage,
      },
    });
  } catch (error) {
    console.error('[API] 동기화 상태 조회 에러:', error);
    return NextResponse.json(
      { error: '상태 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
