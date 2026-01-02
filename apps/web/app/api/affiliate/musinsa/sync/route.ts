/**
 * 무신사 제품 동기화 API
 * @description POST /api/affiliate/musinsa/sync
 * @note 무신사 큐레이터 API 연동
 *
 * 환경변수 설정 필요:
 * - MUSINSA_CURATOR_ID: 무신사 큐레이터 ID
 * - MUSINSA_API_KEY: 무신사 API 키
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  isMusinsaConfigured,
  getAffiliatePartnerByName,
  updatePartnerSyncStatus,
  MUSINSA_CATEGORIES,
} from '@/lib/affiliate';
import { isAdmin } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { MusinsaCategory } from '@/lib/affiliate';

// 무신사 API 응답 타입
interface MusinsaAPIProduct {
  goodsNo: string;
  goodsName: string;
  brandName: string;
  price: number;
  salePrice: number;
  imageUrl: string;
  goodsUrl: string;
  category: string;
  subcategory?: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
  discountRate: number;
}

interface MusinsaAPIResponse {
  success: boolean;
  data: {
    list: MusinsaAPIProduct[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
}

/**
 * 무신사 큐레이터 딥링크 생성
 */
function createDeeplink(productUrl: string, curatorId: string): string {
  const separator = productUrl.includes('?') ? '&' : '?';
  return `${productUrl}${separator}curator=${curatorId}`;
}

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient();

  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    // 관리자 권한 확인
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 });
    }

    // 환경변수 확인
    if (!isMusinsaConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Mock 모드: 실제 동기화는 무신사 큐레이터 가입 후 가능합니다',
        isMock: true,
        syncedCount: 0,
        requiredEnvVars: ['MUSINSA_CURATOR_ID', 'MUSINSA_API_KEY'],
      });
    }

    const body = await request.json().catch(() => ({}));
    const {
      categories,
      fullSync = false,
      limit = 100,
      page = 1,
    } = body as {
      categories?: MusinsaCategory[];
      fullSync?: boolean;
      limit?: number;
      page?: number;
    };

    // 파트너 정보 조회
    const partner = await getAffiliatePartnerByName('musinsa');
    if (!partner) {
      return NextResponse.json({ error: '무신사 파트너 설정이 없습니다' }, { status: 404 });
    }

    // 동기화 상태 업데이트
    await updatePartnerSyncStatus(partner.id, 'syncing');

    const curatorId = process.env.MUSINSA_CURATOR_ID!;
    const apiKey = process.env.MUSINSA_API_KEY!;
    const baseUrl = 'https://api.musinsa.com';

    // 타겟 카테고리 결정
    const targetCategories: MusinsaCategory[] =
      fullSync || !categories
        ? (Object.keys(MUSINSA_CATEGORIES) as MusinsaCategory[])
        : categories.filter((c) => c in MUSINSA_CATEGORIES);

    if (targetCategories.length === 0) {
      return NextResponse.json({ error: '유효한 카테고리가 없습니다' }, { status: 400 });
    }

    // 결과 추적
    const results: Record<string, { added: number; updated: number; errors: number }> = {};
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    // 카테고리별 동기화
    for (const category of targetCategories) {
      const categoryInfo = MUSINSA_CATEGORIES[category];
      let categoryAdded = 0;
      let categoryUpdated = 0;
      let categoryErrors = 0;

      try {
        // 무신사 큐레이터 API 호출
        const url = new URL(`${baseUrl}/curator/v1/products`);
        url.searchParams.set('categoryId', categoryInfo.id);
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('page', String(page));

        const response = await fetch(url.toString(), {
          headers: {
            'X-Musinsa-Curator-Id': curatorId,
            'X-Api-Key': apiKey,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`무신사 API 에러: ${response.status}`);
        }

        const apiResponse: MusinsaAPIResponse = await response.json();
        const products = apiResponse.data.list;

        // DB에 upsert
        for (const product of products) {
          // 기존 제품 확인 (add/update 구분용)
          const { data: existing } = await supabase
            .from('affiliate_products')
            .select('id')
            .eq('partner_id', partner.id)
            .eq('external_product_id', product.goodsNo)
            .single();

          const { error } = await supabase.from('affiliate_products').upsert(
            {
              partner_id: partner.id,
              external_product_id: product.goodsNo,
              name: product.goodsName,
              brand: product.brandName,
              category: product.category,
              subcategory: product.subcategory || null,
              image_url: product.imageUrl,
              price_krw: product.salePrice,
              price_original_krw: product.price !== product.salePrice ? product.price : null,
              currency: 'KRW',
              affiliate_url: createDeeplink(product.goodsUrl, curatorId),
              direct_url: product.goodsUrl,
              rating: product.rating || null,
              review_count: product.reviewCount || 0,
              is_in_stock: product.inStock,
              is_active: true,
              last_synced_at: new Date().toISOString(),
            },
            {
              onConflict: 'partner_id,external_product_id',
            }
          );

          if (error) {
            console.error('[Musinsa Sync] 제품 저장 실패:', error);
            categoryErrors++;
            totalErrors++;
          } else if (existing) {
            categoryUpdated++;
            totalUpdated++;
          } else {
            categoryAdded++;
            totalAdded++;
          }
        }

        results[category] = {
          added: categoryAdded,
          updated: categoryUpdated,
          errors: categoryErrors,
        };
      } catch (error) {
        console.error(`[Musinsa Sync] ${category} 동기화 실패:`, error);
        results[category] = { added: 0, updated: 0, errors: 1 };
        totalErrors++;
      }
    }

    // 동기화 완료 상태
    await updatePartnerSyncStatus(
      partner.id,
      totalErrors === 0 ? 'success' : 'error',
      totalErrors > 0 ? `${totalErrors}개 오류 발생` : undefined
    );

    return NextResponse.json({
      success: true,
      isMock: false,
      message: fullSync
        ? `전체 동기화 완료: ${totalAdded}개 추가, ${totalUpdated}개 업데이트`
        : `${targetCategories.length}개 카테고리 동기화 완료`,
      summary: {
        totalAdded,
        totalUpdated,
        totalErrors,
      },
      results,
    });
  } catch (error) {
    console.error('[Musinsa Sync API] Error:', error);

    // 에러 시 상태 업데이트
    const partner = await getAffiliatePartnerByName('musinsa');
    if (partner) {
      await updatePartnerSyncStatus(
        partner.id,
        'error',
        error instanceof Error ? error.message : '동기화 실패'
      );
    }

    return NextResponse.json({ error: '동기화 중 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * 동기화 상태 조회
 */
export async function GET() {
  try {
    const partner = await getAffiliatePartnerByName('musinsa');

    if (!partner) {
      return NextResponse.json({ error: '무신사 파트너 설정이 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      isConfigured: isMusinsaConfigured(),
      partner: {
        id: partner.id,
        name: partner.name,
        displayName: partner.displayName,
        syncStatus: partner.syncStatus,
        lastSyncedAt: partner.lastSyncedAt,
        syncErrorMessage: partner.syncErrorMessage,
      },
      categories: MUSINSA_CATEGORIES,
    });
  } catch (error) {
    console.error('[Musinsa Sync API] GET Error:', error);
    return NextResponse.json({ error: '상태 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}
