/**
 * 어필리에이트 딥링크 생성
 * @description 파트너별 트래킹 딥링크 통합 관리
 */

import type { AffiliatePartnerName } from '@/types/affiliate';
import { affiliateLogger } from '@/lib/utils/logger';
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
  /** 정보 링크 생성 성공을 수익 귀속 성공으로 오인하지 않도록 구분한다. */
  linkType: 'affiliate' | 'information';
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
export async function createDeeplink(options: DeeplinkOptions): Promise<DeeplinkResult> {
  const { partner, productUrl, subId, campaignId } = options;

  try {
    let url: string;

    switch (partner) {
      case 'coupang': {
        const deeplink = await createCoupangDeeplink(productUrl, subId || campaignId);
        // OPEN API 미해금(키 없음)이면 Mock URL이 돌아온다 — 수익 링크로 표기하면 거짓이므로 정보 링크로 강등
        if (deeplink.includes('link.coupang.com/a/mock')) {
          return { url: productUrl, partner, success: true, linkType: 'information' };
        }
        url = deeplink;
        break;
      }

      case 'iherb':
      case 'musinsa':
      case 'oliveyoung':
        // 미가입·승인 대기 판매처에는 추측한 수익 추적 파라미터를 붙이지 않는다.
        return { url: productUrl, partner, success: true, linkType: 'information' };

      default:
        return {
          url: productUrl,
          partner,
          success: false,
          linkType: 'information',
          error: `지원하지 않는 파트너: ${partner}`,
        };
    }

    return {
      url,
      partner,
      success: true,
      linkType: url.startsWith('https://link.coupang.com/') ? 'affiliate' : 'information',
    };
  } catch (error) {
    affiliateLogger.error(`${partner} 딥링크 생성 실패:`, error);
    return {
      url: productUrl,
      partner,
      success: false,
      linkType: 'information',
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

  const promises = Array.from(productUrls.entries()).map(async ([partner, url]) => {
    const result = await createDeeplink({
      partner,
      productUrl: url,
      subId,
    });
    results.set(partner, result);
  });

  await Promise.all(promises);

  return results;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * URL에서 제품 ID 추출
 */
export function extractProductId(url: string, partner: AffiliatePartnerName): string | null {
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
      return 'https://kr.iherb.com/pr/{slug}/{productId}';
    case 'musinsa':
      return 'https://www.musinsa.com/app/goods/{productId}';
    default:
      return '';
  }
}
