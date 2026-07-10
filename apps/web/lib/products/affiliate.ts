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
import { affiliateLogger } from '@/lib/utils/logger';
import type {
  AffiliateProductType,
  TrackClickInput,
  AffiliateStats,
  ProductClickStats,
  AffiliateClickRow,
} from '@/types/affiliate';

// ================================================
// 쿠팡 파트너스 클릭 시점 태깅 (수수료 귀속)
// ================================================
//
// 배경: 제품 DB의 purchase_url은 네이버 쇼핑 item.link 그대로라
// 쿠팡 링크조차 네이버 인입 리다이렉트(link.coupang.com/re/PCSNAVER...,
// lptag=I... = 네이버 귀속)여서 구매가 발생해도 이룸 수수료가 0원이었다.
// OPEN API(실적 15만원 후 해금) 없이도 www.coupang.com 상품 URL에
// lptag=<파트너스ID>&subId=<채널>을 붙이는 수동 태깅은 유효하므로,
// 클릭 시점에 쿠팡 도메인 링크만 태깅해서 연다.
// 그 외(네이버 등 수수료 불가 링크)는 지어내지 않고 원본 그대로 통과.

/** subId 허용 문자만 남기고 50자로 제한 (경로 → 파트너스 대시보드 채널 구분용) */
export function sanitizeCoupangSubId(input: string): string {
  // 선형 정규식 1회만 사용 (^_+|_+$ 백트래킹 회피 — sonarjs/slow-regex)
  const cleaned = input.replace(/[^a-zA-Z0-9_-]+/g, '_');
  let start = 0;
  let end = cleaned.length;
  while (start < end && cleaned[start] === '_') start++;
  while (end > start && cleaned[end - 1] === '_') end--;
  return cleaned.slice(start, end).slice(0, 50);
}

const isNumericParam = (v: string | null): v is string => !!v && /^\d+$/.test(v);

/**
 * 네이버 인입 리다이렉트(link.coupang.com/re/...)를 쿠팡 상품 직링크로 재작성.
 * pageKey·itemId가 숫자로 확정될 때만 재작성 — 아니면 null (귀속을 지어내지 않음).
 */
function rewriteNaverInboundRedirect(url: URL): URL | null {
  const pageKey = url.searchParams.get('pageKey');
  const itemId = url.searchParams.get('itemId');
  const vendorItemId = url.searchParams.get('vendorItemId');

  if (!isNumericParam(pageKey) || !isNumericParam(itemId)) return null;

  const direct = new URL(`https://www.coupang.com/vp/products/${pageKey}`);
  direct.searchParams.set('itemId', itemId);
  if (isNumericParam(vendorItemId)) direct.searchParams.set('vendorItemId', vendorItemId);
  return direct;
}

/**
 * 쿠팡 링크에 파트너스 태그(lptag) 부착 — 순수 함수
 *
 * - www.coupang.com / m.coupang.com 상품 URL → lptag(+subId) 부착 (기존 lptag 대체)
 * - link.coupang.com/re/... (네이버 인입 리다이렉트) → pageKey·itemId가 숫자로 확인되면
 *   www.coupang.com/vp/products/{pageKey} 직링크로 재작성 후 태깅
 * - link.coupang.com/a/... (이미 파트너스 단축링크) → 그대로 통과
 * - 파트너스 태그 미설정, 파싱 실패, 쿠팡 외 도메인 → 원본 그대로 (태깅하지 않음)
 */
export function tagCoupangAffiliateUrl(
  rawUrl: string,
  partnersTag: string | undefined,
  subId?: string
): string {
  if (!partnersTag) return rawUrl;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl;
  }

  const applyTag = (target: URL): string => {
    target.searchParams.set('lptag', partnersTag);
    if (subId) {
      const clean = sanitizeCoupangSubId(subId);
      if (clean) target.searchParams.set('subId', clean);
    }
    return target.toString();
  };

  // 쿠팡 본 도메인 상품/검색 URL → 직접 태깅
  if (url.host === 'www.coupang.com' || url.host === 'm.coupang.com') {
    return applyTag(url);
  }

  // 네이버 인입 리다이렉트만 재작성 (/a/ 파트너스 단축링크는 그대로 통과)
  if (url.host === 'link.coupang.com' && url.pathname.startsWith('/re/')) {
    const direct = rewriteNaverInboundRedirect(url);
    if (direct) return applyTag(direct);
  }

  return rawUrl;
}

/**
 * 구매 링크 최종 리다이렉트 URL 생성 (클릭 게이트웨이 공용)
 * @description 쿠팡 링크면 환경변수(NEXT_PUBLIC_COUPANG_PARTNERS_TAG)의
 * 파트너스 ID로 태깅, 그 외는 원본 그대로. 태그 미설정 시 항상 원본.
 */
export function buildAffiliateRedirectUrl(rawUrl: string, subId?: string): string {
  return tagCoupangAffiliateUrl(rawUrl, process.env.NEXT_PUBLIC_COUPANG_PARTNERS_TAG, subId);
}

// ================================================
// 클릭 트래킹
// ================================================

/**
 * 어필리에이트 클릭 기록
 * @param input 클릭 정보
 */
export async function trackAffiliateClick(input: TrackClickInput): Promise<boolean> {
  const { error } = await supabase.from('affiliate_clicks').insert({
    product_type: input.productType,
    product_id: input.productId,
    clerk_user_id: input.clerkUserId ?? null,
    referrer: input.referrer ?? null,
    user_agent: input.userAgent ?? null,
    source_page: input.sourcePage ?? null,
    // IP 해시는 서버에서 처리 (클라이언트에서 접근 불가)
  });

  if (error) {
    affiliateLogger.error(' Failed to track click:', error);
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
  const sourcePage = typeof window !== 'undefined' ? window.location.pathname : undefined;

  // 클릭 트래킹 (비동기, 실패해도 링크는 열림)
  trackAffiliateClick({
    productType,
    productId,
    clerkUserId,
    referrer: typeof window !== 'undefined' ? document.referrer : undefined,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    // 현재 경로 = 귀속 분석 주 신호 (SPA에선 referrer가 대부분 빈 값)
    sourcePage,
  }).catch((err) => {
    affiliateLogger.error(' Track failed:', err);
  });

  // 새 탭에서 링크 열기 — 쿠팡 링크는 클릭 시점에 파트너스 태깅(수수료 귀속)
  if (typeof window !== 'undefined') {
    const finalUrl = buildAffiliateRedirectUrl(affiliateUrl, sourcePage);
    // 팝업 차단 시 window.open이 null 반환 → 버튼이 조용히 무반응이 됨. 현재 탭으로 폴백
    const opened = window.open(finalUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = finalUrl;
    }
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
    affiliateLogger.error(' Failed to fetch stats:', error);
    return null;
  }

  const clicks = data as AffiliateClickRow[];

  // 통계 계산
  const uniqueUserIds = new Set(clicks.filter((c) => c.clerk_user_id).map((c) => c.clerk_user_id));

  // 제품별 집계
  const productMap = new Map<string, { clicks: number; users: Set<string | null> }>();
  for (const click of clicks) {
    const key = `${click.product_type}:${click.product_id}`;
    const existing = productMap.get(key) || { clicks: 0, users: new Set() };
    existing.clicks++;
    if (click.clerk_user_id) {
      existing.users.add(click.clerk_user_id);
    }
    productMap.set(key, existing);
  }

  const byProduct: ProductClickStats[] = Array.from(productMap.entries()).map(([key, stats]) => {
    const [productType, productId] = key.split(':');
    return {
      productType: productType as AffiliateProductType,
      productId,
      productName: '', // 제품명은 별도 조회 필요
      totalClicks: stats.clicks,
      uniqueUsers: stats.users.size,
    };
  });

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
    affiliateLogger.error(' Failed to get click count:', error);
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
    affiliateLogger.error(' Failed to get today clicks:', error);
    return 0;
  }

  return count ?? 0;
}
