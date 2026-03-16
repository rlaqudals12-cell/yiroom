/**
 * 올리브영 파트너 어댑터
 * @description PartnerAdapter 인터페이스 구현 — 기존 올리브영 크롤러 래핑
 * @see docs/adr/ADR-067-affiliate-partner-api-strategy.md
 *
 * 기존 크롤러(lib/crawler/sources/oliveyoung.ts)를 PartnerAdapter 인터페이스로 감싸서
 * 어필리에이트 시스템과 통합한다.
 *
 * 환경 변수:
 * - OLIVEYOUNG_ENABLED: 올리브영 기능 활성화 여부 (true/false)
 */

import type {
  PartnerAdapter,
  ProductSearchQuery,
  PartnerProduct,
  TrackingParams,
  ConversionEvent,
} from './types';

// 올리브영 기본 URL
const OLIVEYOUNG_BASE_URL = 'https://www.oliveyoung.co.kr';
const OLIVEYOUNG_SEARCH_URL = `${OLIVEYOUNG_BASE_URL}/store/search/getSearchMain.do`;
const OLIVEYOUNG_PRODUCT_URL = `${OLIVEYOUNG_BASE_URL}/store/goods/getGoodsDetail.do`;

// 크롤링용 User-Agent
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** 올리브영 검색 결과 내부 타입 */
interface OliveYoungRawProduct {
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  productUrl: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  goodsNo?: string;
}

/**
 * 올리브영 HTML 검색 결과 파싱
 * 기존 크롤러(oliveyoung.ts)의 parseSearchResults와 동일한 로직
 */
function parseSearchResults(html: string): OliveYoungRawProduct[] {
  const products: OliveYoungRawProduct[] = [];

  try {
    const pricePattern = /data-ref-price="(\d+)"/g;
    const namePattern = /prd_name[^>]*>([^<]+)</g;
    const brandPattern = /tx_brand[^>]*>([^<]+)</g;
    const urlPattern = /goods_no=(\d+)/g;

    const prices = [...html.matchAll(pricePattern)].map((m) => parseInt(m[1], 10));
    const names = [...html.matchAll(namePattern)].map((m) => m[1].trim());
    const brands = [...html.matchAll(brandPattern)].map((m) => m[1].trim());
    const goodsNos = [...html.matchAll(urlPattern)].map((m) => m[1]);

    const count = Math.min(prices.length, names.length, 20);

    for (let i = 0; i < count; i++) {
      const goodsNo = goodsNos[i] || '';
      products.push({
        name: names[i] || `상품 ${i + 1}`,
        brand: brands[i] || '',
        price: prices[i] || 0,
        goodsNo,
        productUrl: goodsNo ? `${OLIVEYOUNG_PRODUCT_URL}?goodsNo=${goodsNo}` : '',
      });
    }
  } catch {
    // 파싱 실패 시 빈 배열 반환
  }

  return products;
}

/**
 * 올리브영 검색 API 호출
 */
async function searchOliveYoung(keyword: string, limit: number): Promise<OliveYoungRawProduct[]> {
  const searchUrl = `${OLIVEYOUNG_SEARCH_URL}?query=${encodeURIComponent(keyword)}`;

  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`올리브영 검색 실패: HTTP ${response.status}`);
  }

  const html = await response.text();
  const products = parseSearchResults(html);
  return products.slice(0, limit);
}

/**
 * 내부 제품 → PartnerProduct 변환
 */
function toPartnerProduct(raw: OliveYoungRawProduct): PartnerProduct {
  return {
    externalProductId: raw.goodsNo || '',
    name: raw.name,
    brand: raw.brand || undefined,
    category: 'cosmetic',
    imageUrl: raw.imageUrl,
    priceKrw: raw.price > 0 ? raw.price : undefined,
    priceOriginalKrw: raw.originalPrice,
    rating: raw.rating,
    reviewCount: raw.reviewCount,
    isInStock: true,
    directUrl: raw.productUrl,
  };
}

/**
 * 올리브영 파트너 어댑터
 * 화장품 전문 — 올리브영 웹사이트 기반 검색 + UTM 딥링크 생성
 */
export class OliveYoungPartnerAdapter implements PartnerAdapter {
  readonly partnerId = 'oliveyoung' as const;
  readonly displayName = '올리브영';

  /**
   * OLIVEYOUNG_ENABLED 환경변수 확인
   * 킬스위치 역할 — false면 모든 기능 비활성화
   */
  isConfigured(): boolean {
    return process.env.OLIVEYOUNG_ENABLED === 'true';
  }

  /**
   * 올리브영 상품 검색
   * 기존 크롤러 래핑 → PartnerProduct[] 정규화
   */
  async searchProducts(query: ProductSearchQuery): Promise<PartnerProduct[]> {
    if (!this.isConfigured()) {
      console.warn('[OliveYoungAdapter] 비활성화 상태 — 빈 결과 반환');
      return [];
    }

    try {
      const limit = query.pageSize ?? 10;
      const rawProducts = await searchOliveYoung(query.keyword, limit);
      return rawProducts.map(toPartnerProduct);
    } catch (error) {
      console.error('[OliveYoungAdapter] 검색 실패:', error);
      return [];
    }
  }

  /**
   * 어필리에이트 딥링크 생성
   * 올리브영 URL + UTM 파라미터 (ref=yiroom)
   */
  generateDeeplink(productId: string, trackingParams: TrackingParams): string {
    const baseUrl = `${OLIVEYOUNG_PRODUCT_URL}?goodsNo=${productId}`;

    // UTM 파라미터 구성
    const utmParams = new URLSearchParams({
      utm_source: 'yiroom',
      utm_medium: 'affiliate',
      utm_campaign: trackingParams.recommendationType || 'general',
      ref: 'yiroom',
    });

    // 트래킹 정보 추가
    if (trackingParams.userId) {
      utmParams.set('utm_content', trackingParams.userId);
    }
    if (trackingParams.sourcePage) {
      utmParams.set('utm_term', trackingParams.sourcePage);
    }

    return `${baseUrl}&${utmParams.toString()}`;
  }

  /**
   * 전환 웹훅 파싱 (스켈레톤)
   * 올리브영 어필리에이트 프로그램 연동 시 구현 예정
   */
  parseConversionWebhook(_payload: unknown): ConversionEvent | null {
    // [DEFERRED] 올리브영 어필리에이트 전환 추적 연동 시 구현
    return null;
  }

  /**
   * 개별 제품 상세 조회
   * 올리브영은 개별 조회 API가 없어 검색으로 대체
   */
  async getProductDetail(productId: string): Promise<PartnerProduct | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      // 제품 번호로 검색하여 매칭
      const rawProducts = await searchOliveYoung(productId, 5);
      const match = rawProducts.find((p) => p.goodsNo === productId);
      return match ? toPartnerProduct(match) : null;
    } catch {
      return null;
    }
  }
}

/** 싱글톤 인스턴스 */
export const oliveYoungAdapter = new OliveYoungPartnerAdapter();
