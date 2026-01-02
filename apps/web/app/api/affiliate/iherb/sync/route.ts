/**
 * iHerb 제품 동기화 API
 * @description POST /api/affiliate/iherb/sync
 * @note Partnerize CSV 피드 다운로드 및 파싱
 *
 * 환경변수 설정 필요:
 * - IHERB_CAMPAIGN_ID: Partnerize 캠페인 ID
 * - IHERB_PUBLISHER_ID: Partnerize 퍼블리셔 ID
 * - IHERB_API_KEY: Partnerize API 키
 * - IHERB_FEED_URL: CSV 피드 URL (선택, 기본값 사용)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  isIHerbConfigured,
  getAffiliatePartnerByName,
  updatePartnerSyncStatus,
  IHERB_CATEGORIES,
} from '@/lib/affiliate';
import { isAdmin } from '@/lib/admin';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { IHerbCategory } from '@/lib/affiliate';

// CSV 피드 응답 타입
interface IHerbCSVRow {
  product_id: string;
  product_name: string;
  brand: string;
  price: string;
  currency: string;
  image_url: string;
  product_url: string;
  category: string;
  subcategory: string;
  in_stock: string;
  rating: string;
  review_count: string;
  discount_percent?: string;
}

// USD to KRW 환율
const USD_TO_KRW = 1350;

/**
 * CSV 문자열 파싱
 */
function parseCSV(csvText: string): IHerbCSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // 헤더 파싱
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));

  // 데이터 파싱
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    return row as unknown as IHerbCSVRow;
  });
}

/**
 * CSV 라인 파싱 (따옴표 처리)
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Partnerize 딥링크 생성
 */
function createDeeplink(productUrl: string, campaignId: string, publisherId: string): string {
  const encodedUrl = encodeURIComponent(productUrl);
  return `https://prf.hn/click/camref:${campaignId}/pubref:${publisherId}/destination:${encodedUrl}`;
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
    if (!isIHerbConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Mock 모드: 실제 동기화는 Partnerize 연동 후 가능합니다',
        isMock: true,
        syncedCount: 0,
        requiredEnvVars: ['IHERB_CAMPAIGN_ID', 'IHERB_PUBLISHER_ID', 'IHERB_API_KEY'],
      });
    }

    const body = await request.json().catch(() => ({}));
    const {
      category,
      fullSync = false,
      limit = 500,
    } = body as {
      category?: IHerbCategory;
      fullSync?: boolean;
      limit?: number;
    };

    // 파트너 정보 조회
    const partner = await getAffiliatePartnerByName('iherb');
    if (!partner) {
      return NextResponse.json({ error: 'iHerb 파트너 설정이 없습니다' }, { status: 404 });
    }

    // 동기화 상태 업데이트
    await updatePartnerSyncStatus(partner.id, 'syncing');

    const campaignId = process.env.IHERB_CAMPAIGN_ID!;
    const publisherId = process.env.IHERB_PUBLISHER_ID!;
    const apiKey = process.env.IHERB_API_KEY!;

    // CSV 피드 URL 구성
    // Partnerize는 일반적으로 다음 형식의 피드 URL을 제공:
    // https://api.partnerize.com/feed/v2/campaigns/{campaign_id}/products.csv
    const feedUrl =
      process.env.IHERB_FEED_URL ||
      `https://api.partnerize.com/feed/v2/campaigns/${campaignId}/products.csv`;

    let csvText: string;
    let products: IHerbCSVRow[];

    try {
      // CSV 피드 다운로드
      const feedResponse = await fetch(feedUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'text/csv',
        },
      });

      if (!feedResponse.ok) {
        throw new Error(`CSV 피드 다운로드 실패: ${feedResponse.status}`);
      }

      csvText = await feedResponse.text();
      products = parseCSV(csvText);
    } catch (feedError) {
      console.error('[iHerb Sync] CSV 피드 다운로드 실패:', feedError);

      // 동기화 실패 상태로 업데이트
      await updatePartnerSyncStatus(
        partner.id,
        'error',
        feedError instanceof Error ? feedError.message : 'CSV 피드 다운로드 실패'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'CSV 피드 다운로드 실패',
          message: '환경변수와 피드 URL을 확인하세요',
        },
        { status: 500 }
      );
    }

    // 카테고리 필터링
    if (category && !fullSync) {
      const categoryInfo = IHERB_CATEGORIES[category];
      products = products.filter(
        (p) =>
          p.category?.toLowerCase().includes(category) ||
          p.subcategory?.toLowerCase().includes(category) ||
          p.category?.includes(categoryInfo.ko)
      );
    }

    // 개수 제한
    products = products.slice(0, limit);

    // 결과 추적
    let added = 0;
    let updated = 0;
    let errors = 0;

    // DB에 upsert
    for (const product of products) {
      // 기존 제품 확인 (add/update 구분용)
      const { data: existing } = await supabase
        .from('affiliate_products')
        .select('id')
        .eq('partner_id', partner.id)
        .eq('external_product_id', product.product_id)
        .single();

      const priceUsd = parseFloat(product.price) || 0;
      const discountPercent = parseFloat(product.discount_percent || '0');
      const priceKrw = Math.round(priceUsd * USD_TO_KRW);
      const priceOriginalKrw =
        discountPercent > 0
          ? Math.round((priceUsd / (1 - discountPercent / 100)) * USD_TO_KRW)
          : null;

      const { error } = await supabase.from('affiliate_products').upsert(
        {
          partner_id: partner.id,
          external_product_id: product.product_id,
          name: product.product_name,
          brand: product.brand,
          category: product.category,
          subcategory: product.subcategory,
          image_url: product.image_url,
          price_krw: priceKrw,
          price_original_krw: priceOriginalKrw,
          currency: 'KRW',
          affiliate_url: createDeeplink(product.product_url, campaignId, publisherId),
          direct_url: product.product_url,
          rating: parseFloat(product.rating) || null,
          review_count: parseInt(product.review_count, 10) || 0,
          is_in_stock: product.in_stock === 'true' || product.in_stock === '1',
          is_active: true,
          last_synced_at: new Date().toISOString(),
        },
        {
          onConflict: 'partner_id,external_product_id',
        }
      );

      if (error) {
        console.error('[iHerb Sync] 제품 저장 실패:', error);
        errors++;
      } else if (existing) {
        updated++;
      } else {
        added++;
      }
    }

    // 동기화 완료 상태
    await updatePartnerSyncStatus(
      partner.id,
      errors === 0 ? 'success' : 'error',
      errors > 0 ? `${errors}개 오류 발생` : undefined
    );

    return NextResponse.json({
      success: true,
      isMock: false,
      message: fullSync
        ? `전체 동기화 완료: ${added}개 추가, ${updated}개 업데이트`
        : `${category || '전체'} 카테고리 동기화 완료`,
      summary: {
        totalProcessed: products.length,
        added,
        updated,
        errors,
      },
    });
  } catch (error) {
    console.error('[iHerb Sync API] Error:', error);

    // 에러 시 상태 업데이트
    const partner = await getAffiliatePartnerByName('iherb');
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
    const partner = await getAffiliatePartnerByName('iherb');

    if (!partner) {
      return NextResponse.json({ error: 'iHerb 파트너 설정이 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      isConfigured: isIHerbConfigured(),
      partner: {
        id: partner.id,
        name: partner.name,
        displayName: partner.displayName,
        syncStatus: partner.syncStatus,
        lastSyncedAt: partner.lastSyncedAt,
        syncErrorMessage: partner.syncErrorMessage,
      },
      categories: IHERB_CATEGORIES,
    });
  } catch (error) {
    console.error('[iHerb Sync API] GET Error:', error);
    return NextResponse.json({ error: '상태 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}
