/**
 * 어필리에이트 딥링크 생성 및 열기
 * @description 모바일 앱에서 외부 앱/브라우저로 연결
 */

import * as Linking from 'expo-linking';
import type { AffiliatePartnerName, DeeplinkOptions, DeeplinkResult } from './types';

// 환경변수 (app.config.ts에서 설정)
const IHERB_AFFILIATE_CODE = process.env.EXPO_PUBLIC_IHERB_AFFILIATE_CODE || 'YIROOM';
const MUSINSA_CURATOR_ID = process.env.EXPO_PUBLIC_MUSINSA_CURATOR_ID || 'yiroom';

/**
 * 파트너별 딥링크 생성
 */
export function createDeeplink(options: DeeplinkOptions): DeeplinkResult {
  const { partner, productUrl, subId } = options;

  try {
    let url: string;

    switch (partner) {
      case 'coupang':
        url = createCoupangDeeplink(productUrl, subId);
        break;
      case 'iherb':
        url = createIherbDeeplink(productUrl, subId);
        break;
      case 'musinsa':
        url = createMusinsaDeeplink(productUrl, subId);
        break;
      default:
        return {
          url: productUrl,
          partner,
          success: false,
          error: `지원하지 않는 파트너: ${partner}`,
        };
    }

    return { url, partner, success: true };
  } catch (error) {
    console.error(`[Affiliate] ${partner} 딥링크 생성 실패:`, error);
    return {
      url: productUrl,
      partner,
      success: false,
      error: error instanceof Error ? error.message : '딥링크 생성 실패',
    };
  }
}

/**
 * 딥링크 열기 (외부 앱/브라우저)
 */
export async function openAffiliateLink(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      console.warn('[Affiliate] URL을 열 수 없음:', url);
      return false;
    }
  } catch (error) {
    console.error('[Affiliate] 링크 열기 실패:', error);
    return false;
  }
}

/**
 * 클릭 트래킹 후 링크 열기 (통합 함수)
 */
export async function trackAndOpenLink(
  productUrl: string,
  partner: AffiliatePartnerName,
  subId?: string
): Promise<boolean> {
  const result = createDeeplink({ productUrl, partner, subId });
  if (result.success) {
    return openAffiliateLink(result.url);
  }
  // Fallback: 원본 URL 열기
  return openAffiliateLink(productUrl);
}

// ============================================
// 파트너별 딥링크 생성
// ============================================

function createCoupangDeeplink(productUrl: string, subId?: string): string {
  // 쿠팡 파트너스 딥링크 형식
  // 실제로는 API 호출이 필요하지만, 모바일에서는 웹 URL에 파라미터 추가
  const separator = productUrl.includes('?') ? '&' : '?';
  return `${productUrl}${separator}subId=${subId || 'yiroom-mobile'}`;
}

function createIherbDeeplink(productUrl: string, subId?: string): string {
  const separator = productUrl.includes('?') ? '&' : '?';
  return `${productUrl}${separator}pcode=${IHERB_AFFILIATE_CODE}&rcode=${subId || 'mobile'}`;
}

function createMusinsaDeeplink(productUrl: string, subId?: string): string {
  const separator = productUrl.includes('?') ? '&' : '?';
  return `${productUrl}${separator}utm_source=curator&utm_medium=${MUSINSA_CURATOR_ID}&utm_campaign=${subId || 'mobile'}`;
}

// ============================================
// 유틸리티
// ============================================

/**
 * URL에서 파트너 식별
 */
export function identifyPartner(url: string): AffiliatePartnerName | null {
  try {
    const urlObj = new URL(url);
    const host = urlObj.host.toLowerCase();

    if (host.includes('coupang')) return 'coupang';
    if (host.includes('iherb')) return 'iherb';
    if (host.includes('musinsa')) return 'musinsa';

    return null;
  } catch {
    return null;
  }
}
