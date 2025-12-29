/**
 * 어필리에이트 딥링크 생성
 * @description 파트너별 트래킹 딥링크 통합 관리
 */

import type { AffiliatePartnerName } from '@/types/affiliate';
import { createCoupangDeeplink } from './coupang';

// ============================================
// 타입 정의
// ============================================

export interface DeeplinkOptions {
  /** 원본 제품 URL */
  productUrl: string;
  /** 파트너 이름 */
  partner: AffiliatePartnerName;
  /** 제품 ID (파트너사 기준) */
  productId?: string;
  /** 트래킹 서브 ID */
  subId?: string;
  /** 캠페인 ID */
  campaignId?: string;
}

export interface DeeplinkResult {
  /** 생성된 딥링크 */
  url: string;
  /** 파트너 이름 */
  partner: AffiliatePartnerName;
  /** 생성 성공 여부 */
  success: boolean;
  /** 에러 메시지 */
  error?: string;
}

// ============================================
// 딥링크 생성 메인 함수
// ============================================

/**
 * 파트너별 딥링크 생성
 * @description 각 파트너의 규격에 맞는 어필리에이트 딥링크 생성
 */
export async function createDeeplink(
  options: DeeplinkOptions
): Promise<DeeplinkResult> {
  const { partner, productUrl, productId, subId, campaignId } = options;

  try {
    let url: string;

    switch (partner) {
      case 'coupang':
        url = await createCoupangDeeplink(productUrl, subId || campaignId);
        break;

      case 'iherb':
        url = createIherbDeeplink(productUrl, productId, subId);
        break;

      case 'musinsa':
        url = createMusinsaDeeplink(productUrl, productId, subId);
        break;

      default:
        return {
          url: productUrl,
          partner,
          success: false,
          error: `지원하지 않는 파트너: ${partner}`,
        };
    }

    return {
      url,
      partner,
      success: true,
    };
  } catch (error) {
    console.error(`[Deeplink] ${partner} 딥링크 생성 실패:`, error);
    return {
      url: productUrl,
      partner,
      success: false,
      error: error instanceof Error ? error.message : '딥링크 생성 실패',
    };
  }
}

/**
 * 여러 파트너의 딥링크 일괄 생성
 */
export async function createMultipleDeeplinks(
  productUrls: Map<AffiliatePartnerName, string>,
  subId?: string
): Promise<Map<AffiliatePartnerName, DeeplinkResult>> {
  const results = new Map<AffiliatePartnerName, DeeplinkResult>();

  const promises = Array.from(productUrls.entries()).map(
    async ([partner, url]) => {
      const result = await createDeeplink({
        partner,
        productUrl: url,
        subId,
      });
      results.set(partner, result);
    }
  );

  await Promise.all(promises);

  return results;
}

// ============================================
// 파트너별 딥링크 생성
// ============================================

/**
 * iHerb 딥링크 생성
 * @description Partnerize 트래킹 파라미터 포함
 */
function createIherbDeeplink(
  productUrl: string,
  productId?: string,
  subId?: string
): string {
  // iHerb는 pcode 파라미터로 어필리에이트 추적
  const affiliateCode = process.env.IHERB_AFFILIATE_CODE || 'YIROOM';
  const trackingSubId = subId || 'default';

  // URL에 이미 파라미터가 있는지 확인
  const separator = productUrl.includes('?') ? '&' : '?';

  return `${productUrl}${separator}pcode=${affiliateCode}&rcode=${trackingSubId}`;
}

/**
 * 무신사 딥링크 생성
 * @description 큐레이터 트래킹 파라미터 포함
 */
function createMusinsaDeeplink(
  productUrl: string,
  productId?: string,
  subId?: string
): string {
  const curatorId = process.env.MUSINSA_CURATOR_ID || 'yiroom';
  const separator = productUrl.includes('?') ? '&' : '?';

  return `${productUrl}${separator}utm_source=curator&utm_medium=${curatorId}&utm_campaign=${subId || 'general'}`;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * URL에서 제품 ID 추출
 */
export function extractProductId(
  url: string,
  partner: AffiliatePartnerName
): string | null {
  try {
    const urlObj = new URL(url);

    switch (partner) {
      case 'coupang': {
        // 쿠팡: https://www.coupang.com/vp/products/123456
        const match = urlObj.pathname.match(/\/products\/(\d+)/);
        return match ? match[1] : null;
      }

      case 'iherb': {
        // iHerb: https://kr.iherb.com/pr/product-name/12345
        const match = urlObj.pathname.match(/\/(\d+)$/);
        return match ? match[1] : null;
      }

      case 'musinsa': {
        // 무신사: https://www.musinsa.com/app/goods/123456
        const match = urlObj.pathname.match(/\/goods\/(\d+)/);
        return match ? match[1] : null;
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * 딥링크 유효성 검사
 */
export function isValidDeeplink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validHosts = [
      'link.coupang.com',
      'www.coupang.com',
      'kr.iherb.com',
      'www.iherb.com',
      'www.musinsa.com',
    ];

    return validHosts.some((host) => urlObj.host.includes(host));
  } catch {
    return false;
  }
}

/**
 * 파트너별 딥링크 형식 반환
 */
export function getDeeplinkFormat(partner: AffiliatePartnerName): string {
  switch (partner) {
    case 'coupang':
      return 'https://link.coupang.com/a/{productId}?subId={subId}';
    case 'iherb':
      return 'https://kr.iherb.com/pr/{slug}/{productId}?pcode={code}&rcode={subId}';
    case 'musinsa':
      return 'https://www.musinsa.com/app/goods/{productId}?utm_source=curator&utm_medium={curatorId}';
    default:
      return '';
  }
}
