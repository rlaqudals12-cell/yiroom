/**
 * 어필리에이트 클릭 Repository
 * @description 클릭 트래킹, 통계 조회
 */

import { supabase } from '@/lib/supabase/client';
import { affiliateLogger } from '@/lib/utils/logger';
import type { AffiliateClickCreateInput, AffiliateRecommendationType } from '@/types/affiliate';

/** 클릭 DB Row */
interface ClickRow {
  id: string;
  product_id: string;
  clerk_user_id: string | null;
  source_page: string | null;
  source_component: string | null;
  recommendation_type: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  session_id: string | null;
  clicked_at: string;
  converted_at: string | null;
  conversion_value_krw: number | null;
  commission_krw: number | null;
}

/** 클릭 앱 타입 */
export interface AffiliateClickRecord {
  id: string;
  productId: string;
  clerkUserId?: string;
  sourcePage?: string;
  sourceComponent?: string;
  recommendationType?: AffiliateRecommendationType;
  userAgent?: string;
  ipHash?: string;
  sessionId?: string;
  clickedAt: Date;
  convertedAt?: Date;
  conversionValueKrw?: number;
  commissionKrw?: number;
}

/**
 * DB Row → 앱 타입 변환
 */
function mapClickRow(row: ClickRow): AffiliateClickRecord {
  return {
    id: row.id,
    productId: row.product_id,
    clerkUserId: row.clerk_user_id ?? undefined,
    sourcePage: row.source_page ?? undefined,
    sourceComponent: row.source_component ?? undefined,
    recommendationType: row.recommendation_type as AffiliateRecommendationType | undefined,
    userAgent: row.user_agent ?? undefined,
    ipHash: row.ip_hash ?? undefined,
    sessionId: row.session_id ?? undefined,
    clickedAt: new Date(row.clicked_at),
    convertedAt: row.converted_at ? new Date(row.converted_at) : undefined,
    conversionValueKrw: row.conversion_value_krw ?? undefined,
    commissionKrw: row.commission_krw ?? undefined,
  };
}

/**
 * 클릭 기록 생성
 */
export async function createAffiliateClick(
  input: AffiliateClickCreateInput
): Promise<AffiliateClickRecord | null> {
  const insertData = {
    product_id: input.productId,
    clerk_user_id: input.clerkUserId ?? null,
    source_page: input.sourcePage,
    source_component: input.sourceComponent,
    recommendation_type: input.recommendationType ?? null,
    user_agent: input.userAgent ?? null,
    ip_hash: input.ipHash ?? null,
    session_id: input.sessionId ?? null,
  };

  const { data, error } = await supabase
    .from('affiliate_clicks')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    affiliateLogger.error('클릭 기록 실패:', error);
    return null;
  }

  return mapClickRow(data as ClickRow);
}

/**
 * 사용자 클릭 히스토리 조회
 */
export async function getUserClickHistory(
  clerkUserId: string,
  limit = 20
): Promise<AffiliateClickRecord[]> {
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .order('clicked_at', { ascending: false })
    .limit(limit);

  if (error) {
    affiliateLogger.error('클릭 히스토리 조회 실패:', error);
    return [];
  }

  return (data as ClickRow[]).map(mapClickRow);
}

/**
 * 제품별 클릭 수 조회
 */
export async function getProductClickCount(productId: string): Promise<number> {
  const { count, error } = await supabase
    .from('affiliate_clicks')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (error) {
    affiliateLogger.error('클릭 수 조회 실패:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * 전환 업데이트 (웹훅에서 호출)
 */
export async function updateClickConversion(
  clickId: string,
  conversionValueKrw: number,
  commissionKrw: number
): Promise<boolean> {
  const { error } = await supabase
    .from('affiliate_clicks')
    .update({
      converted_at: new Date().toISOString(),
      conversion_value_krw: conversionValueKrw,
      commission_krw: commissionKrw,
    })
    .eq('id', clickId);

  if (error) {
    affiliateLogger.error('전환 업데이트 실패:', error);
    return false;
  }

  return true;
}

/** 일별 통계 */
export interface DailyStats {
  date: string;
  totalClicks: number;
  uniqueClicks: number;
  conversions: number;
  totalSalesKrw: number;
  totalCommissionKrw: number;
}

/**
 * 파트너별 일별 통계 조회
 */
export async function getPartnerDailyStats(
  partnerId: string,
  startDate: string,
  endDate: string
): Promise<DailyStats[]> {
  const { data, error } = await supabase
    .from('affiliate_daily_stats')
    .select('*')
    .eq('partner_id', partnerId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    affiliateLogger.error('일별 통계 조회 실패:', error);
    return [];
  }

  return data.map((row) => ({
    date: row.date,
    totalClicks: row.total_clicks,
    uniqueClicks: row.unique_clicks,
    conversions: row.conversions,
    totalSalesKrw: row.total_sales_krw,
    totalCommissionKrw: row.total_commission_krw,
  }));
}

/**
 * 전체 통계 요약
 */
export async function getAffiliateStatsSummary(
  startDate: string,
  endDate: string
): Promise<{
  totalClicks: number;
  totalConversions: number;
  totalSalesKrw: number;
  totalCommissionKrw: number;
  conversionRate: number;
}> {
  const { data, error } = await supabase
    .from('affiliate_daily_stats')
    .select('total_clicks, conversions, total_sales_krw, total_commission_krw')
    .gte('date', startDate)
    .lte('date', endDate);

  if (error || !data) {
    affiliateLogger.error('통계 요약 조회 실패:', error);
    return {
      totalClicks: 0,
      totalConversions: 0,
      totalSalesKrw: 0,
      totalCommissionKrw: 0,
      conversionRate: 0,
    };
  }

  const totals = data.reduce(
    (acc, row) => ({
      totalClicks: acc.totalClicks + row.total_clicks,
      totalConversions: acc.totalConversions + row.conversions,
      totalSalesKrw: acc.totalSalesKrw + row.total_sales_krw,
      totalCommissionKrw: acc.totalCommissionKrw + row.total_commission_krw,
    }),
    { totalClicks: 0, totalConversions: 0, totalSalesKrw: 0, totalCommissionKrw: 0 }
  );

  return {
    ...totals,
    conversionRate:
      totals.totalClicks > 0 ? (totals.totalConversions / totals.totalClicks) * 100 : 0,
  };
}

/**
 * 인기 제품 (클릭 기준)
 */
export async function getTopClickedProducts(
  partnerId?: string,
  limit = 10
): Promise<{ productId: string; clicks: number }[]> {
  // 최근 30일 기준 상위 제품
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const query = supabase
    .from('affiliate_clicks')
    .select('product_id')
    .gte('clicked_at', thirtyDaysAgo.toISOString());

  // partnerId 필터는 product 조인 필요 - 여기서는 단순화
  const { data, error } = await query;

  if (error || !data) {
    affiliateLogger.error('인기 제품 조회 실패:', error);
    return [];
  }

  // 수동 집계 (Supabase에서 GROUP BY 미지원)
  const countMap = new Map<string, number>();
  data.forEach((row) => {
    const id = row.product_id;
    countMap.set(id, (countMap.get(id) || 0) + 1);
  });

  return Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId, clicks]) => ({ productId, clicks }));
}

/**
 * IP 해시 생성 (개인정보 익명화)
 */
export function hashIpAddress(ip: string): string {
  // 간단한 해시 (실제로는 crypto.subtle.digest 사용 권장)
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
