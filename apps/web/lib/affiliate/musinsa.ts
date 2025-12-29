/**
 * 무신사 큐레이터 어필리에이트 API 클라이언트
 * @description 무신사 제휴 연동 (제품 검색, 딥링크 생성)
 * @see https://www.musinsa.com/
 */

import type { AffiliateProduct } from '@/types/affiliate';

// ============================================
// 설정 및 타입
// ============================================

interface MusinsaConfig {
  curatorId: string;
  apiKey: string;
  baseUrl: string;
}

/** 무신사 제품 피드 항목 */
interface MusinsaProductFeed {
  goodsNo: string;
  goodsName: string;
  brandName: string;
  price: number;
  salePrice: number;
  imageUrl: string;
  goodsUrl: string;
  category: string;
  subcategory: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  discountRate: number;
}

/** 제품 검색 옵션 */
export interface MusinsaSearchOptions {
  keyword: string;
  category?: MusinsaCategory;
  limit?: number;
  subId?: string;
}

/** 무신사 카테고리 */
export type MusinsaCategory =
  | 'top'
  | 'outer'
  | 'pants'
  | 'onepiece'
  | 'skirt'
  | 'bag'
  | 'shoes'
  | 'accessory';

/** 무신사 카테고리 매핑 */
export const MUSINSA_CATEGORIES: Record<MusinsaCategory, { ko: string; id: string }> = {
  top: { ko: '상의', id: '001' },
  outer: { ko: '아우터', id: '002' },
  pants: { ko: '바지', id: '003' },
  onepiece: { ko: '원피스', id: '020' },
  skirt: { ko: '스커트', id: '022' },
  bag: { ko: '가방', id: '004' },
  shoes: { ko: '신발', id: '005' },
  accessory: { ko: '액세서리', id: '006' },
};

// 환경변수에서 설정 로드
function getConfig(): MusinsaConfig | null {
  const curatorId = process.env.MUSINSA_CURATOR_ID;
  const apiKey = process.env.MUSINSA_API_KEY;

  if (!curatorId || !apiKey) {
    return null;
  }

  return {
    curatorId,
    apiKey,
    baseUrl: 'https://api.musinsa.com',
  };
}

// ============================================
// Mock 데이터
// ============================================

const MOCK_MUSINSA_PRODUCTS: MusinsaProductFeed[] = [
  {
    goodsNo: 'MSS-001',
    goodsName: '무신사 스탠다드 에센셜 반팔티',
    brandName: '무신사 스탠다드',
    price: 29900,
    salePrice: 19900,
    imageUrl: 'https://image.msscdn.net/images/goods_img/20230101/3000001/3000001_1_500.jpg',
    goodsUrl: 'https://www.musinsa.com/app/goods/3000001',
    category: 'top',
    subcategory: '반팔 티셔츠',
    inStock: true,
    rating: 4.8,
    reviewCount: 15420,
    discountRate: 33,
  },
  {
    goodsNo: 'MSS-002',
    goodsName: '커버낫 어센틱 로고 맨투맨',
    brandName: '커버낫',
    price: 69000,
    salePrice: 48300,
    imageUrl: 'https://image.msscdn.net/images/goods_img/20230201/3000002/3000002_1_500.jpg',
    goodsUrl: 'https://www.musinsa.com/app/goods/3000002',
    category: 'top',
    subcategory: '맨투맨/스웨트셔츠',
    inStock: true,
    rating: 4.6,
    reviewCount: 8920,
    discountRate: 30,
  },
  {
    goodsNo: 'MSS-003',
    goodsName: '디스이즈네버댓 T-Logo 후드 집업',
    brandName: '디스이즈네버댓',
    price: 128000,
    salePrice: 102400,
    imageUrl: 'https://image.msscdn.net/images/goods_img/20230301/3000003/3000003_1_500.jpg',
    goodsUrl: 'https://www.musinsa.com/app/goods/3000003',
    category: 'outer',
    subcategory: '후드 집업',
    inStock: true,
    rating: 4.7,
    reviewCount: 5680,
    discountRate: 20,
  },
  {
    goodsNo: 'MSS-004',
    goodsName: '무신사 스탠다드 와이드 데님 팬츠',
    brandName: '무신사 스탠다드',
    price: 49900,
    salePrice: 39900,
    imageUrl: 'https://image.msscdn.net/images/goods_img/20230401/3000004/3000004_1_500.jpg',
    goodsUrl: 'https://www.musinsa.com/app/goods/3000004',
    category: 'pants',
    subcategory: '데님 팬츠',
    inStock: true,
    rating: 4.5,
    reviewCount: 12300,
    discountRate: 20,
  },
  {
    goodsNo: 'MSS-005',
    goodsName: '마르디 메크르디 플라워 가디건',
    brandName: '마르디 메크르디',
    price: 158000,
    salePrice: 158000,
    imageUrl: 'https://image.msscdn.net/images/goods_img/20230501/3000005/3000005_1_500.jpg',
    goodsUrl: 'https://www.musinsa.com/app/goods/3000005',
    category: 'outer',
    subcategory: '가디건',
    inStock: false,
    rating: 4.9,
    reviewCount: 3200,
    discountRate: 0,
  },
  {
    goodsNo: 'MSS-006',
    goodsName: '컨버스 척테일러 올스타 하이',
    brandName: '컨버스',
    price: 65000,
    salePrice: 52000,
    imageUrl: 'https://image.msscdn.net/images/goods_img/20230601/3000006/3000006_1_500.jpg',
    goodsUrl: 'https://www.musinsa.com/app/goods/3000006',
    category: 'shoes',
    subcategory: '캔버스/단화',
    inStock: true,
    rating: 4.7,
    reviewCount: 28400,
    discountRate: 20,
  },
];

// ============================================
// API 함수
// ============================================

/**
 * 무신사 제품 검색
 */
export async function searchMusinsaProducts(
  options: MusinsaSearchOptions
): Promise<AffiliateProduct[]> {
  const config = getConfig();
  const { keyword, category, limit = 20, subId } = options;

  // Mock 모드: 환경변수 미설정 시
  if (!config) {
    console.log('[Musinsa] Mock mode - returning mock products');
    return getMockProducts(keyword, category, limit, subId);
  }

  // 실제 API 호출 (무신사 큐레이터 API)
  try {
    const url = new URL(`${config.baseUrl}/curator/v1/products`);
    url.searchParams.set('keyword', keyword);
    if (category) {
      url.searchParams.set('categoryId', MUSINSA_CATEGORIES[category].id);
    }
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString(), {
      headers: {
        'X-Musinsa-Curator-Id': config.curatorId,
        'X-Api-Key': config.apiKey,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Musinsa API error: ${response.status}`);
    }

    const data = (await response.json()) as { data: { list: MusinsaProductFeed[] } };
    return data.data.list.map((product) => mapToAffiliateProduct(product, config.curatorId, subId));
  } catch (error) {
    console.error('[Musinsa] API error, falling back to mock:', error);
    return getMockProducts(keyword, category, limit, subId);
  }
}

/**
 * 무신사 딥링크 생성
 */
export async function createMusinsaDeeplink(
  productUrl: string,
  subId?: string
): Promise<string> {
  const config = getConfig();

  // Mock 모드
  if (!config) {
    // Mock: 원본 URL에 가상 tracking 파라미터 추가
    const separator = productUrl.includes('?') ? '&' : '?';
    return `${productUrl}${separator}curator=MOCK123${subId ? `&utm_source=${subId}` : ''}`;
  }

  // 무신사 큐레이터 딥링크 생성
  try {
    const separator = productUrl.includes('?') ? '&' : '?';
    return `${productUrl}${separator}curator=${config.curatorId}${subId ? `&utm_source=${subId}` : ''}`;
  } catch (error) {
    console.error('[Musinsa] Deeplink error:', error);
    return productUrl;
  }
}

/**
 * 무신사 카테고리별 베스트 조회
 */
export async function getMusinsaCategoryProducts(
  category: MusinsaCategory,
  limit = 10,
  subId?: string
): Promise<AffiliateProduct[]> {
  return searchMusinsaProducts({
    keyword: '',
    category,
    limit,
    subId,
  });
}

/**
 * 환경변수 설정 여부 확인
 */
export function isMusinsaConfigured(): boolean {
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
  category: MusinsaCategory | undefined,
  limit: number,
  subId?: string
): AffiliateProduct[] {
  let filtered = MOCK_MUSINSA_PRODUCTS;

  // 키워드 필터링
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.goodsName.toLowerCase().includes(lowerKeyword) ||
        p.brandName.toLowerCase().includes(lowerKeyword) ||
        p.category.toLowerCase().includes(lowerKeyword)
    );
  }

  // 카테고리 필터링
  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  // 제한 적용 및 변환
  return filtered.slice(0, limit).map((product) => ({
    id: `musinsa-mock-${product.goodsNo}`,
    partnerId: 'musinsa',
    partnerName: 'musinsa',
    externalProductId: product.goodsNo,
    name: product.goodsName,
    brand: product.brandName,
    priceKrw: product.salePrice,
    priceOriginalKrw: product.price !== product.salePrice ? product.price : undefined,
    currency: 'KRW',
    imageUrl: product.imageUrl,
    affiliateUrl: createMockDeeplink(product.goodsUrl, subId),
    category: product.category,
    isInStock: product.inStock,
    rating: product.rating,
    reviewCount: product.reviewCount,
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
  return `${productUrl}${separator}curator=MOCK123${subId ? `&utm_source=${subId}` : ''}`;
}

/**
 * 무신사 제품을 AffiliateProduct로 변환
 */
function mapToAffiliateProduct(
  product: MusinsaProductFeed,
  curatorId: string,
  subId?: string
): AffiliateProduct {
  // 무신사 큐레이터 딥링크 URL 생성
  const separator = product.goodsUrl.includes('?') ? '&' : '?';
  const affiliateUrl = `${product.goodsUrl}${separator}curator=${curatorId}${subId ? `&utm_source=${subId}` : ''}`;

  return {
    id: `musinsa-${product.goodsNo}`,
    partnerId: 'musinsa',
    partnerName: 'musinsa',
    externalProductId: product.goodsNo,
    name: product.goodsName,
    brand: product.brandName,
    priceKrw: product.salePrice,
    priceOriginalKrw: product.price !== product.salePrice ? product.price : undefined,
    currency: 'KRW',
    imageUrl: product.imageUrl,
    affiliateUrl,
    category: product.category,
    isInStock: product.inStock,
    rating: product.rating,
    reviewCount: product.reviewCount,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
