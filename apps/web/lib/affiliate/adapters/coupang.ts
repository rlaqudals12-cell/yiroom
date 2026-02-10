/**
 * 쿠팡 파트너스 어댑터 (v2)
 * @description PartnerAdapter 인터페이스 구현 — 쿠팡 파트너스 API
 * @see docs/adr/ADR-067-affiliate-partner-api-strategy.md
 *
 * TODO: 쿠팡 파트너스 API 키 발급 후 실제 구현
 * - API 신청: https://partners.coupang.com/
 * - HMAC 서명 방식 인증
 * - 일 50,000건 호출 제한
 */

import type {
  PartnerAdapter,
  ProductSearchQuery,
  PartnerProduct,
  TrackingParams,
  ConversionEvent,
} from './types';

// 환경 변수
const COUPANG_ACCESS_KEY = process.env.COUPANG_ACCESS_KEY ?? '';
const COUPANG_SECRET_KEY = process.env.COUPANG_SECRET_KEY ?? '';

/**
 * 쿠팡 파트너스 어댑터
 * Phase 1에서는 스켈레톤만 제공, API 키 발급 후 실제 구현 예정
 */
export class CoupangPartnerAdapter implements PartnerAdapter {
  readonly partnerId = 'coupang' as const;
  readonly displayName = '쿠팡';

  isConfigured(): boolean {
    return !!(COUPANG_ACCESS_KEY && COUPANG_SECRET_KEY);
  }

  async searchProducts(_query: ProductSearchQuery): Promise<PartnerProduct[]> {
    if (!this.isConfigured()) {
      console.warn('[CoupangAdapter] API 키 미설정 — 빈 결과 반환');
      return [];
    }

    // TODO: 쿠팡 파트너스 API 호출
    // const url = `https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/products/search`;
    // const headers = this.createHmacHeaders('GET', url);
    // const response = await fetch(`${url}?keyword=${query.keyword}&limit=${query.pageSize || 20}`, { headers });
    // return this.normalizeProducts(response.data);

    console.info('[CoupangAdapter] searchProducts 호출 — TODO: API 연동 구현');
    return [];
  }

  generateDeeplink(productId: string, trackingParams: TrackingParams): string {
    if (!this.isConfigured()) {
      // API 키 없으면 일반 URL 반환
      return `https://www.coupang.com/vp/products/${productId}`;
    }

    // TODO: 쿠팡 파트너스 딥링크 API 호출
    // const url = `https://api-gateway.coupang.com/v2/providers/affiliate_open_api/apis/openapi/deeplink`;
    // 실제 구현 시 subId에 trackingParams 인코딩
    const subId = [
      trackingParams.userId || '',
      trackingParams.sourcePage || '',
      trackingParams.recommendationType || '',
    ].join('_');

    return `https://www.coupang.com/vp/products/${productId}?subId=${encodeURIComponent(subId)}`;
  }

  parseConversionWebhook(_payload: unknown): ConversionEvent | null {
    // TODO: 쿠팡 파트너스 전환 웹훅 포맷 파싱
    // 쿠팡은 포스트백 URL 방식 사용
    console.info('[CoupangAdapter] parseConversionWebhook 호출 — TODO: 구현');
    return null;
  }

  async getProductDetail(_productId: string): Promise<PartnerProduct | null> {
    if (!this.isConfigured()) {
      return null;
    }
    // Phase 2에서 쿠팡 제품 상세 API 구현 예정
    throw new Error('[CoupangAdapter] getProductDetail 미구현 — Phase 2에서 구현 예정');
  }
}

/** 싱글톤 인스턴스 */
export const coupangAdapter = new CoupangPartnerAdapter();
