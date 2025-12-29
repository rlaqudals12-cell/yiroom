/**
 * 쿠팡 파트너스 API 클라이언트
 * @description OPEN API 연동 (제품 검색, 딥링크 생성)
 * @see https://partners.coupang.com/
 */

import crypto from 'crypto';
import type { AffiliateProduct } from '@/types/affiliate';

// ============================================
// 설정 및 타입
// ============================================

interface CoupangConfig {
  accessKey: string;
  secretKey: string;
  baseUrl: string;
  vendorId: string;
}

/** 쿠팡 API 응답 제품 */
interface CoupangProductResponse {
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  categoryName: string;
  isRocket: boolean;
  isFreeShipping: boolean;
  rating: number;
  ratingCount: number;
  isOutOfStock: boolean;
}

/** 쿠팡 검색 결과 */
interface CoupangSearchResponse {
  rCode: string;
  rMessage: string;
  data: {
    productData: CoupangProductResponse[];
  };
}

/** 쿠팡 딥링크 응답 */
interface CoupangDeeplinkResponse {
  rCode: string;
  rMessage: string;
  data: {
    shortenUrl: string;
  }[];
}

/** 제품 검색 옵션 */
export interface CoupangSearchOptions {
  keyword: string;
  limit?: number;
  subId?: string;
}

// 환경변수에서 설정 로드
function getConfig(): CoupangConfig | null {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  const vendorId = process.env.COUPANG_VENDOR_ID;

  if (!accessKey || !secretKey || !vendorId) {
    return null;
  }

  return {
    accessKey,
    secretKey,
    vendorId,
    baseUrl: 'https://api-gateway.coupang.com',
  };
}

// ============================================
// HMAC 서명 생성
// ============================================

/**
 * 쿠팡 API HMAC 서명 생성
 * @description 쿠팡 OPEN API 인증에 필요한 HMAC-SHA256 서명
 */
function generateSignature(
  method: string,
  path: string,
  secretKey: string,
  timestamp: string
): string {
  const message = `${timestamp}${method}${path}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  return hmac.digest('hex');
}

/**
 * API 요청 헤더 생성
 */
function createHeaders(
  config: CoupangConfig,
  method: string,
  path: string
): Record<string, string> {
  const timestamp = Date.now().toString();
  const signature = generateSignature(method, path, config.secretKey, timestamp);

  return {
    'Content-Type': 'application/json',
    'Authorization': `CEA algorithm=HmacSHA256, access-key=${config.accessKey}, signed-date=${timestamp}, signature=${signature}`,
  };
}

// ============================================
// API 함수
// ============================================

/**
 * 쿠팡 제품 검색
 * @description 키워드로 쿠팡 제품 검색
 */
export async function searchCoupangProducts(
  options: CoupangSearchOptions
): Promise<AffiliateProduct[]> {
  const config = getConfig();

  // Mock 모드: 환경변수 없으면 Mock 데이터 반환
  if (!config) {
    console.log('[Coupang] Mock 모드: 환경변수 미설정');
    return getMockSearchResults(options.keyword, options.limit);
  }

  const path = `/v2/providers/affiliate_open_api/apis/openapi/products/search?keyword=${encodeURIComponent(options.keyword)}&limit=${options.limit || 10}`;

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'GET',
      headers: createHeaders(config, 'GET', path),
    });

    if (!response.ok) {
      console.error('[Coupang] API 에러:', response.status);
      return getMockSearchResults(options.keyword, options.limit);
    }

    const data = (await response.json()) as CoupangSearchResponse;

    if (data.rCode !== '0') {
      console.error('[Coupang] API 응답 에러:', data.rMessage);
      return getMockSearchResults(options.keyword, options.limit);
    }

    return data.data.productData.map((p) => mapCoupangProduct(p, options.subId));
  } catch (error) {
    console.error('[Coupang] API 호출 실패:', error);
    return getMockSearchResults(options.keyword, options.limit);
  }
}

/**
 * 쿠팡 딥링크 생성
 * @description 어필리에이트 트래킹이 포함된 딥링크 생성
 */
export async function createCoupangDeeplink(
  originalUrl: string,
  subId?: string
): Promise<string> {
  const config = getConfig();

  // Mock 모드
  if (!config) {
    return `https://link.coupang.com/a/mock?itemId=0&subId=${subId || 'yiroom'}`;
  }

  const path = '/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink';
  const body = {
    coupangUrls: [originalUrl],
    subId: subId || 'yiroom',
  };

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'POST',
      headers: createHeaders(config, 'POST', path),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('[Coupang] 딥링크 생성 실패:', response.status);
      return originalUrl;
    }

    const data = (await response.json()) as CoupangDeeplinkResponse;

    if (data.rCode !== '0' || !data.data?.[0]?.shortenUrl) {
      console.error('[Coupang] 딥링크 응답 에러:', data.rMessage);
      return originalUrl;
    }

    return data.data[0].shortenUrl;
  } catch (error) {
    console.error('[Coupang] 딥링크 생성 에러:', error);
    return originalUrl;
  }
}

/**
 * 쿠팡 제품 카테고리별 조회
 * @description 특정 카테고리 제품 동기화용
 */
export async function getCoupangCategoryProducts(
  categoryId: number,
  limit: number = 100
): Promise<AffiliateProduct[]> {
  const config = getConfig();

  if (!config) {
    console.log('[Coupang] Mock 모드: 카테고리 제품 조회');
    return getMockCategoryProducts(categoryId, limit);
  }

  const path = `/v2/providers/affiliate_open_api/apis/openapi/products/category?categoryId=${categoryId}&limit=${limit}`;

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'GET',
      headers: createHeaders(config, 'GET', path),
    });

    if (!response.ok) {
      console.error('[Coupang] 카테고리 API 에러:', response.status);
      return getMockCategoryProducts(categoryId, limit);
    }

    const data = (await response.json()) as CoupangSearchResponse;

    if (data.rCode !== '0') {
      console.error('[Coupang] 카테고리 API 응답 에러:', data.rMessage);
      return getMockCategoryProducts(categoryId, limit);
    }

    return data.data.productData.map((p) => mapCoupangProduct(p));
  } catch (error) {
    console.error('[Coupang] 카테고리 API 호출 실패:', error);
    return getMockCategoryProducts(categoryId, limit);
  }
}

// ============================================
// 데이터 변환
// ============================================

/**
 * 쿠팡 API 응답 → AffiliateProduct 변환
 */
function mapCoupangProduct(
  product: CoupangProductResponse,
  subId?: string
): AffiliateProduct {
  const affiliateUrl = `https://link.coupang.com/a/${product.productId}${subId ? `?subId=${subId}` : ''}`;

  return {
    id: `coupang-${product.productId}`,
    partnerId: 'coupang',
    partnerName: 'coupang',
    externalProductId: product.productId.toString(),
    name: product.productName,
    category: product.categoryName,
    imageUrl: product.productImage,
    priceKrw: product.productPrice,
    currency: 'KRW',
    affiliateUrl,
    directUrl: product.productUrl,
    rating: product.rating,
    reviewCount: product.ratingCount,
    isInStock: !product.isOutOfStock,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    // 쿠팡 특화 태그
    tags: [
      product.isRocket ? 'rocket' : '',
      product.isFreeShipping ? 'free_shipping' : '',
    ].filter(Boolean),
  };
}

// ============================================
// Mock 데이터
// ============================================

/**
 * Mock 검색 결과 생성
 */
function getMockSearchResults(
  keyword: string,
  limit: number = 10
): AffiliateProduct[] {
  const mockProducts: AffiliateProduct[] = [];

  for (let i = 0; i < Math.min(limit, 5); i++) {
    mockProducts.push({
      id: `coupang-mock-${i + 1}`,
      partnerId: 'coupang',
      partnerName: 'coupang',
      externalProductId: `mock-${i + 1}`,
      name: `${keyword} 관련 상품 ${i + 1}`,
      brand: '테스트 브랜드',
      category: '건강식품',
      imageUrl: `https://placehold.co/400x400/f0f0f0/888?text=${encodeURIComponent(keyword)}`,
      priceKrw: 15000 + i * 5000,
      priceOriginalKrw: 20000 + i * 5000,
      currency: 'KRW',
      affiliateUrl: `https://link.coupang.com/a/mock-${i + 1}?subId=yiroom`,
      rating: 4.0 + Math.random() * 0.9,
      reviewCount: 100 + i * 50,
      isInStock: true,
      isActive: true,
      tags: i % 2 === 0 ? ['rocket', 'free_shipping'] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return mockProducts;
}

/**
 * Mock 카테고리 제품 생성
 */
function getMockCategoryProducts(
  categoryId: number,
  limit: number
): AffiliateProduct[] {
  const categoryNames: Record<number, string> = {
    1: '영양제',
    2: '화장품',
    3: '건강식품',
    4: '운동용품',
  };

  const categoryName = categoryNames[categoryId] || `카테고리 ${categoryId}`;

  return getMockSearchResults(categoryName, limit);
}

// ============================================
// 유틸리티
// ============================================

/**
 * 쿠팡 API 연결 상태 확인
 */
export function isCoupangConfigured(): boolean {
  return getConfig() !== null;
}

/**
 * 쿠팡 카테고리 ID 맵핑
 */
export const COUPANG_CATEGORIES = {
  supplements: 497135, // 영양제
  cosmetics: 497134, // 화장품
  healthFood: 497136, // 건강식품
  fitness: 497137, // 운동용품
} as const;

export type CoupangCategory = keyof typeof COUPANG_CATEGORIES;
