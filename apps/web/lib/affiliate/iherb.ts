/**
 * iHerb 어필리에이트 API 클라이언트
 * @description Partnerize 연동 (제품 피드, 딥링크 생성)
 * @see https://www.partnerize.com/
 */

import type { AffiliateProduct } from '@/types/affiliate';
import { affiliateLogger } from '@/lib/utils/logger';

// ============================================
// 설정 및 타입
// ============================================

interface IHerbConfig {
  campaignId: string;
  publisherId: string;
  apiKey: string;
  baseUrl: string;
}

/** iHerb 제품 피드 항목 */
interface IHerbProductFeed {
  product_id: string;
  product_name: string;
  brand: string;
  price: number;
  currency: string;
  image_url: string;
  product_url: string;
  category: string;
  subcategory: string;
  in_stock: boolean;
  rating: number;
  review_count: number;
  discount_percent?: number;
}

/** 제품 검색 옵션 */
export interface IHerbSearchOptions {
  keyword: string;
  category?: IHerbCategory;
  limit?: number;
  subId?: string;
}

/** iHerb 카테고리 */
export type IHerbCategory =
  | 'supplements'
  | 'vitamins'
  | 'sports'
  | 'beauty'
  | 'bath'
  | 'grocery'
  | 'baby'
  | 'pets';

/** iHerb 카테고리 매핑 */
export const IHERB_CATEGORIES: Record<IHerbCategory, { ko: string; id: string }> = {
  supplements: { ko: '영양제', id: '2' },
  vitamins: { ko: '비타민', id: '3' },
  sports: { ko: '스포츠 영양', id: '7' },
  beauty: { ko: '뷰티', id: '4' },
  bath: { ko: '목욕/퍼스널케어', id: '5' },
  grocery: { ko: '식료품', id: '6' },
  baby: { ko: '유아', id: '8' },
  pets: { ko: '반려동물', id: '9' },
};

// 환경변수에서 설정 로드
function getConfig(): IHerbConfig | null {
  const campaignId = process.env.IHERB_CAMPAIGN_ID;
  const publisherId = process.env.IHERB_PUBLISHER_ID;
  const apiKey = process.env.IHERB_API_KEY;

  if (!campaignId || !publisherId || !apiKey) {
    return null;
  }

  return {
    campaignId,
    publisherId,
    apiKey,
    baseUrl: 'https://api.partnerize.com',
  };
}

// ============================================
// Mock 데이터
// ============================================

const MOCK_IHERB_PRODUCTS: IHerbProductFeed[] = [
  {
    product_id: 'CGN-01066',
    product_name: 'California Gold Nutrition 비타민 D3 5000IU 360정',
    brand: 'California Gold Nutrition',
    price: 12.99,
    currency: 'USD',
    image_url:
      'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/cgn/cgn01066/y/10.jpg',
    product_url: 'https://kr.iherb.com/pr/california-gold-nutrition-vitamin-d3-gummies/70316',
    category: 'Supplements',
    subcategory: 'Vitamins',
    in_stock: true,
    rating: 4.7,
    review_count: 25840,
    discount_percent: 20,
  },
  {
    product_id: 'NOW-00373',
    product_name: 'NOW Foods 오메가-3 1000mg 200정',
    brand: 'NOW Foods',
    price: 15.49,
    currency: 'USD',
    image_url:
      'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/now/now00373/y/27.jpg',
    product_url: 'https://kr.iherb.com/pr/now-foods-omega-3/327',
    category: 'Supplements',
    subcategory: 'Fish Oil & Omegas',
    in_stock: true,
    rating: 4.6,
    review_count: 18920,
  },
  {
    product_id: 'LEF-02301',
    product_name: 'Life Extension 마그네슘 200mg 100캡슐',
    brand: 'Life Extension',
    price: 11.25,
    currency: 'USD',
    image_url:
      'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/lef/lef02301/y/3.jpg',
    product_url: 'https://kr.iherb.com/pr/life-extension-magnesium-caps/67730',
    category: 'Supplements',
    subcategory: 'Minerals',
    in_stock: true,
    rating: 4.5,
    review_count: 8450,
  },
  {
    product_id: 'CGN-01198',
    product_name: 'California Gold Nutrition 유청 단백질 2.27kg',
    brand: 'California Gold Nutrition',
    price: 49.99,
    currency: 'USD',
    image_url:
      'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/cgn/cgn01198/y/14.jpg',
    product_url:
      'https://kr.iherb.com/pr/california-gold-nutrition-sport-whey-protein-isolate/85498',
    category: 'Sports',
    subcategory: 'Protein',
    in_stock: true,
    rating: 4.4,
    review_count: 12300,
    discount_percent: 15,
  },
  {
    product_id: 'THN-00272',
    product_name: 'Thorne Research 비타민 B 컴플렉스 60캡슐',
    brand: 'Thorne Research',
    price: 22.0,
    currency: 'USD',
    image_url:
      'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/thr/thr00272/y/22.jpg',
    product_url: 'https://kr.iherb.com/pr/thorne-research-basic-b-complex/18494',
    category: 'Supplements',
    subcategory: 'Vitamins',
    in_stock: true,
    rating: 4.8,
    review_count: 6780,
  },
  {
    product_id: 'MDA-00994',
    product_name: 'Madre Labs 코코아 폴리페놀 코코아 50팩',
    brand: 'Madre Labs',
    price: 8.99,
    currency: 'USD',
    image_url:
      'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/mda/mda00994/y/4.jpg',
    product_url: 'https://kr.iherb.com/pr/madre-labs-cocoapolls-dark-chocolate/61710',
    category: 'Grocery',
    subcategory: 'Cocoa & Hot Chocolate',
    in_stock: false,
    rating: 4.3,
    review_count: 3200,
  },
];

// USD to KRW 환율 (실제로는 API나 캐싱된 환율 사용)
const USD_TO_KRW = 1350;

// ============================================
// API 함수
// ============================================

/**
 * iHerb 제품 검색
 */
export async function searchIHerbProducts(
  options: IHerbSearchOptions
): Promise<AffiliateProduct[]> {
  const config = getConfig();
  const { keyword, category, limit = 20, subId } = options;

  // Mock 모드: 환경변수 미설정 시
  if (!config) {
    affiliateLogger.debug('iHerb Mock 모드: mock 제품 반환');
    return getMockProducts(keyword, category, limit, subId);
  }

  // 실제 API 호출 (Partnerize Product Feed API)
  try {
    const url = new URL(`${config.baseUrl}/feed/v2/campaigns/${config.campaignId}/products`);
    url.searchParams.set('q', keyword);
    if (category) {
      url.searchParams.set('category', IHERB_CATEGORIES[category].id);
    }
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`iHerb API error: ${response.status}`);
    }

    const data = (await response.json()) as { products: IHerbProductFeed[] };
    return data.products.map((product) =>
      mapToAffiliateProduct(product, config.publisherId, subId)
    );
  } catch (error) {
    affiliateLogger.error('iHerb API 에러, mock으로 폴백:', error);
    return getMockProducts(keyword, category, limit, subId);
  }
}

/**
 * iHerb 딥링크 생성
 */
export async function createIHerbDeeplink(productUrl: string, subId?: string): Promise<string> {
  const config = getConfig();

  // Mock 모드
  if (!config) {
    // Mock: 원본 URL에 가상 tracking 파라미터 추가
    const baseUrl = productUrl.includes('?') ? productUrl : `${productUrl}?`;
    return `${baseUrl}&rcode=MOCK123${subId ? `&pcode=${subId}` : ''}`;
  }

  // Partnerize Click URL 생성
  try {
    const encodedUrl = encodeURIComponent(productUrl);
    const clickUrl = `https://prf.hn/click/camref:${config.campaignId}/pubref:${subId || ''}/destination:${encodedUrl}`;
    return clickUrl;
  } catch (error) {
    affiliateLogger.error('iHerb 딥링크 생성 에러:', error);
    // Fallback
    return productUrl;
  }
}

/**
 * iHerb 카테고리별 베스트셀러 조회
 */
export async function getIHerbCategoryProducts(
  category: IHerbCategory,
  limit = 10,
  subId?: string
): Promise<AffiliateProduct[]> {
  return searchIHerbProducts({
    keyword: '',
    category,
    limit,
    subId,
  });
}

/**
 * 환경변수 설정 여부 확인
 */
export function isIHerbConfigured(): boolean {
  return getConfig() !== null;
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * Mock 제품 필터링 및 반환
 */
function getMockProducts(
  keyword: string,
  category: IHerbCategory | undefined,
  limit: number,
  subId?: string
): AffiliateProduct[] {
  let filtered = MOCK_IHERB_PRODUCTS;

  // 키워드 필터링
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.product_name.toLowerCase().includes(lowerKeyword) ||
        p.brand.toLowerCase().includes(lowerKeyword) ||
        p.category.toLowerCase().includes(lowerKeyword)
    );
  }

  // 카테고리 필터링
  if (category) {
    const categoryName = IHERB_CATEGORIES[category].ko;
    filtered = filtered.filter(
      (p) =>
        p.category.toLowerCase().includes(category) ||
        p.subcategory.toLowerCase().includes(category) ||
        p.category === categoryName
    );
  }

  // 제한 적용 및 변환
  return filtered.slice(0, limit).map((product) => ({
    id: `iherb-mock-${product.product_id}`,
    partnerId: 'iherb',
    partnerName: 'iherb',
    externalProductId: product.product_id,
    name: product.product_name,
    brand: product.brand,
    priceKrw: Math.round(product.price * USD_TO_KRW),
    priceOriginalKrw: product.discount_percent
      ? Math.round((product.price / (1 - product.discount_percent / 100)) * USD_TO_KRW)
      : undefined,
    currency: 'KRW',
    imageUrl: product.image_url,
    affiliateUrl: createMockDeeplink(product.product_url, subId),
    category: product.category,
    isInStock: product.in_stock,
    rating: product.rating,
    reviewCount: product.review_count,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

/**
 * Mock 딥링크 생성
 */
function createMockDeeplink(productUrl: string, subId?: string): string {
  const separator = productUrl.includes('?') ? '&' : '?';
  return `${productUrl}${separator}rcode=MOCK123${subId ? `&pcode=${subId}` : ''}`;
}

/**
 * iHerb 제품을 AffiliateProduct로 변환
 */
function mapToAffiliateProduct(
  product: IHerbProductFeed,
  publisherId: string,
  subId?: string
): AffiliateProduct {
  const priceKrw = Math.round(product.price * USD_TO_KRW);
  const priceOriginalKrw = product.discount_percent
    ? Math.round((product.price / (1 - product.discount_percent / 100)) * USD_TO_KRW)
    : undefined;

  // Partnerize 딥링크 URL 생성
  const encodedUrl = encodeURIComponent(product.product_url);
  const affiliateUrl = `https://prf.hn/click/camref:${publisherId}/pubref:${subId || ''}/destination:${encodedUrl}`;

  return {
    id: `iherb-${product.product_id}`,
    partnerId: 'iherb',
    partnerName: 'iherb',
    externalProductId: product.product_id,
    name: product.product_name,
    brand: product.brand,
    priceKrw,
    priceOriginalKrw,
    currency: 'KRW',
    imageUrl: product.image_url,
    affiliateUrl,
    category: product.category,
    isInStock: product.in_stock,
    rating: product.rating,
    reviewCount: product.review_count,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
