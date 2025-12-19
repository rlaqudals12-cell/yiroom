/**
 * 어필리에이트 Service
 * @description 클릭 트래킹 + 통계 조회
 *
 * 주의:
 * - trackAffiliateClick, openAffiliateLink: 클라이언트에서 호출 가능
 * - getAffiliateStats, getProductClickCount, getTodayClickCount: 서버 전용 (service_role 필요)
 */

import { supabase } from '@/lib/supabase/client';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type {
  AffiliateProductType,
  TrackClickInput,
  AffiliateStats,
  ProductClickStats,
  AffiliateClickRow,
} from '@/types/affiliate';

// ================================================
// 클릭 트래킹
// ================================================

/**
 * 어필리에이트 클릭 기록
 * @param input 클릭 정보
 */
export async function trackAffiliateClick(
  input: TrackClickInput
): Promise<boolean> {
  const { error } = await supabase.from('affiliate_clicks').insert({
    product_type: input.productType,
    product_id: input.productId,
    clerk_user_id: input.clerkUserId ?? null,
    referrer: input.referrer ?? null,
    user_agent: input.userAgent ?? null,
    // IP 해시는 서버에서 처리 (클라이언트에서 접근 불가)
  });

  if (error) {
    console.error('[Affiliate] Failed to track click:', error);
    return false;
  }

  return true;
}

/**
 * 어필리에이트 링크 열기 + 클릭 트래킹
 * @param affiliateUrl 어필리에이트 URL
 * @param productType 제품 타입
 * @param productId 제품 ID
 * @param clerkUserId 사용자 ID (선택)
 */
export async function openAffiliateLink(
  affiliateUrl: string,
  productType: AffiliateProductType,
  productId: string,
  clerkUserId?: string
): Promise<void> {
  // 클릭 트래킹 (비동기, 실패해도 링크는 열림)
  trackAffiliateClick({
    productType,
    productId,
    clerkUserId,
    referrer: typeof window !== 'undefined' ? document.referrer : undefined,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
  }).catch((err) => {
    console.error('[Affiliate] Track failed:', err);
  });

  // 새 탭에서 링크 열기
  if (typeof window !== 'undefined') {
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
  }
}

// ================================================
// 통계 조회 (관리자용 - 서버 전용)
// ================================================

/**
 * 어필리에이트 통계 조회
 * 주의: 서버 전용 함수 (API Route, Server Action에서만 호출)
 * @param startDate 시작일
 * @param endDate 종료일
 */
export async function getAffiliateStats(
  startDate: Date,
  endDate: Date
): Promise<AffiliateStats | null> {
  const serviceClient = createServiceRoleClient();
  const startStr = startDate.toISOString();
  const endStr = endDate.toISOString();

  // 기간 내 모든 클릭 조회
  const { data, error } = await serviceClient
    .from('affiliate_clicks')
    .select('*')
    .gte('clicked_at', startStr)
    .lte('clicked_at', endStr)
    .order('clicked_at', { ascending: false });

  if (error) {
    console.error('[Affiliate] Failed to fetch stats:', error);
    return null;
  }

  const clicks = data as AffiliateClickRow[];

  // 통계 계산
  const uniqueUserIds = new Set(
    clicks.filter((c) => c.clerk_user_id).map((c) => c.clerk_user_id)
  );

  // 제품별 집계
  const productMap = new Map<
    string,
    { clicks: number; users: Set<string | null> }
  >();
  for (const click of clicks) {
    const key = `${click.product_type}:${click.product_id}`;
    const existing = productMap.get(key) || { clicks: 0, users: new Set() };
    existing.clicks++;
    if (click.clerk_user_id) {
      existing.users.add(click.clerk_user_id);
    }
    productMap.set(key, existing);
  }

  const byProduct: ProductClickStats[] = Array.from(productMap.entries()).map(
    ([key, stats]) => {
      const [productType, productId] = key.split(':');
      return {
        productType: productType as AffiliateProductType,
        productId,
        productName: '', // 제품명은 별도 조회 필요
        totalClicks: stats.clicks,
        uniqueUsers: stats.users.size,
      };
    }
  );

  // 일별 집계
  const dateMap = new Map<string, number>();
  for (const click of clicks) {
    const date = click.clicked_at.split('T')[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  }

  const byDate = Array.from(dateMap.entries())
    .map(([date, clickCount]) => ({ date, clicks: clickCount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    period: {
      startDate: startStr.split('T')[0],
      endDate: endStr.split('T')[0],
    },
    totalClicks: clicks.length,
    uniqueUsers: uniqueUserIds.size,
    byProduct: byProduct.sort((a, b) => b.totalClicks - a.totalClicks),
    byDate,
  };
}

/**
 * 특정 제품의 클릭 수 조회
 * 주의: 서버 전용 함수 (API Route, Server Action에서만 호출)
 * @param productType 제품 타입
 * @param productId 제품 ID
 */
export async function getProductClickCount(
  productType: AffiliateProductType,
  productId: string
): Promise<number> {
  const serviceClient = createServiceRoleClient();
  const { count, error } = await serviceClient
    .from('affiliate_clicks')
    .select('*', { count: 'exact', head: true })
    .eq('product_type', productType)
    .eq('product_id', productId);

  if (error) {
    console.error('[Affiliate] Failed to get click count:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * 오늘 클릭 수 조회
 * 주의: 서버 전용 함수 (API Route, Server Action에서만 호출)
 */
export async function getTodayClickCount(): Promise<number> {
  const serviceClient = createServiceRoleClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await serviceClient
    .from('affiliate_clicks')
    .select('*', { count: 'exact', head: true })
    .gte('clicked_at', today.toISOString());

  if (error) {
    console.error('[Affiliate] Failed to get today clicks:', error);
    return 0;
  }

  return count ?? 0;
}
