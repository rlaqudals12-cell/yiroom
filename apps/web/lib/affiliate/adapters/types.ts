/**
 * PartnerAdapter 인터페이스 정의
 * @description SDD-AFFILIATE-INTEGRATION v2 Adapter Pattern 기반
 * @see docs/specs/SDD-AFFILIATE-INTEGRATION.md
 * @see docs/adr/ADR-067-affiliate-partner-api-strategy.md
 */

import type { AffiliatePartnerName } from '@/types/affiliate';

// ================================================
// 검색 쿼리
// ================================================

/** 제품 검색 쿼리 */
export interface ProductSearchQuery {
  /** 검색 키워드 */
  keyword: string;
  /** 카테고리 필터 */
  category?: string;
  /** 최소 가격 (KRW) */
  minPrice?: number;
  /** 최대 가격 (KRW) */
  maxPrice?: number;
  /** 정렬 기준 */
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  /** 페이지 번호 (1-based) */
  page?: number;
  /** 페이지 크기 */
  pageSize?: number;
}

// ================================================
// 파트너 제품 (정규화)
// ================================================

/** 파트너 API에서 가져온 제품 (정규화된 형태) */
export interface PartnerProduct {
  /** 파트너 내 고유 ID */
  externalProductId: string;
  /** 제품명 */
  name: string;
  /** 브랜드 */
  brand?: string;
  /** 카테고리 */
  category?: string;
  /** 제품 설명 */
  description?: string;
  /** 메인 이미지 URL */
  imageUrl?: string;
  /** 추가 이미지 URL 목록 */
  imageUrls?: string[];
  /** 가격 (KRW) */
  priceKrw?: number;
  /** 정가 (KRW, 할인 전) */
  priceOriginalKrw?: number;
  /** 평점 (0-5) */
  rating?: number;
  /** 리뷰 수 */
  reviewCount?: number;
  /** 재고 여부 */
  isInStock: boolean;
  /** 제품 원본 URL (파트너 사이트) */
  directUrl: string;
}

// ================================================
// 트래킹
// ================================================

/** 딥링크 생성용 트래킹 파라미터 */
export interface TrackingParams {
  /** 사용자 ID (Clerk) */
  userId?: string;
  /** 유입 페이지 */
  sourcePage?: string;
  /** 유입 컴포넌트 */
  sourceComponent?: string;
  /** 추천 유형 */
  recommendationType?: string;
  /** 세션 ID */
  sessionId?: string;
}

// ================================================
// 전환 이벤트
// ================================================

/** 전환 웹훅 파싱 결과 */
export interface ConversionEvent {
  /** 외부 주문 ID */
  externalOrderId: string;
  /** 외부 제품 ID */
  externalProductId: string;
  /** 전환 금액 (KRW) */
  amountKrw: number;
  /** 커미션 금액 (KRW) */
  commissionKrw: number;
  /** 전환 시각 */
  convertedAt: Date;
  /** 원본 트래킹 ID */
  trackingId?: string;
}

// ================================================
// PartnerAdapter 인터페이스
// ================================================

/**
 * 파트너 어댑터 인터페이스
 * 각 어필리에이트 파트너(쿠팡, CJ, Amazon 등)는 이 인터페이스를 구현한다.
 *
 * @example
 * ```typescript
 * const coupang: PartnerAdapter = new CoupangAdapter();
 * const products = await coupang.searchProducts({ keyword: '샴푸' });
 * const deeplink = coupang.generateDeeplink('product-123', { userId: 'user_1' });
 * ```
 */
export interface PartnerAdapter {
  /** 파트너 식별자 */
  readonly partnerId: AffiliatePartnerName;

  /** 파트너 표시명 */
  readonly displayName: string;

  /**
   * 제품 검색
   * @param query - 검색 쿼리
   * @returns 정규화된 제품 목록
   */
  searchProducts(query: ProductSearchQuery): Promise<PartnerProduct[]>;

  /**
   * 어필리에이트 딥링크 생성
   * @param productId - 파트너 내 제품 ID
   * @param trackingParams - 트래킹 파라미터
   * @returns 어필리에이트 딥링크 URL
   */
  generateDeeplink(productId: string, trackingParams: TrackingParams): string;

  /**
   * 전환 웹훅 파싱
   * @param payload - 웹훅 raw payload
   * @returns 파싱된 전환 이벤트 또는 null (파싱 실패 시)
   */
  parseConversionWebhook(payload: unknown): ConversionEvent | null;

  /**
   * 개별 제품 상세 조회
   * @param productId - 파트너 내 제품 ID
   * @returns 제품 정보 또는 null
   */
  getProductDetail(productId: string): Promise<PartnerProduct | null>;

  /**
   * API 설정 확인 (API 키 등)
   * @returns 설정 완료 여부
   */
  isConfigured(): boolean;
}
