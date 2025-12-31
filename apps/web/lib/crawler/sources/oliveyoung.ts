/**
 * 올리브영 가격 소스 (화장품 전용)
 * @description 올리브영 웹사이트에서 화장품 가격 조회
 * @version 1.0
 * @date 2025-12-09
 *
 * 주의사항:
 * - 화장품(cosmetic) 타입만 지원
 * - 웹 스크래핑 방식 사용 (API 없음)
 * - Rate Limit 준수 필수 (1초당 1요청 권장)
 * - robots.txt 및 이용약관 확인 필요
 *
 * 환경 변수:
 * - OLIVEYOUNG_ENABLED: 올리브영 스크래핑 활성화 여부 (true/false)
 */

import { crawlerLogger } from '@/lib/utils/logger';
import type { PriceFetchRequest, PriceResult } from '../types';

const OLIVEYOUNG_SEARCH_URL = 'https://www.oliveyoung.co.kr/store/search/getSearchMain.do';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface OliveYoungProduct {
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  productUrl: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
}

/**
 * 올리브영 검색 결과 파싱
 * HTML에서 상품 정보 추출
 */
function parseSearchResults(html: string): OliveYoungProduct[] {
  const products: OliveYoungProduct[] = [];

  try {
    // 상품 리스트 영역 추출 (정규식 기반 파싱)
    // 실제 구현 시에는 cheerio 등의 HTML 파서 사용 권장

    // 상품 가격 패턴: data-price="숫자"
    const pricePattern = /data-ref-price="(\d+)"/g;
    const namePattern = /prd_name[^>]*>([^<]+)</g;
    const brandPattern = /tx_brand[^>]*>([^<]+)</g;
    const urlPattern = /goods_no=(\d+)/g;

    // 간단한 패턴 매칭 (실제로는 더 정교한 파싱 필요)
    const prices = [...html.matchAll(pricePattern)].map((m) => parseInt(m[1], 10));
    const names = [...html.matchAll(namePattern)].map((m) => m[1].trim());
    const brands = [...html.matchAll(brandPattern)].map((m) => m[1].trim());
    const goodsNos = [...html.matchAll(urlPattern)].map((m) => m[1]);

    // 최소 개수만큼 상품 생성
    const count = Math.min(prices.length, names.length, 5);

    for (let i = 0; i < count; i++) {
      products.push({
        name: names[i] || `상품 ${i + 1}`,
        brand: brands[i] || '',
        price: prices[i] || 0,
        productUrl: goodsNos[i]
          ? `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNos[i]}`
          : '',
      });
    }
  } catch (error) {
    crawlerLogger.error('OliveYoung parse error:', error);
  }

  return products;
}

/**
 * 올리브영 상품 검색
 */
async function searchOliveYoungProducts(keyword: string, limit = 5): Promise<OliveYoungProduct[]> {
  const searchUrl = `${OLIVEYOUNG_SEARCH_URL}?query=${encodeURIComponent(keyword)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`OliveYoung HTTP error: ${response.status}`);
    }

    const html = await response.text();
    const products = parseSearchResults(html);

    return products.slice(0, limit);
  } catch (error) {
    crawlerLogger.error('OliveYoung search error:', error);
    throw error;
  }
}

/**
 * 올리브영 가격 조회 (화장품 전용)
 */
export async function fetchOliveYoungPrice(request: PriceFetchRequest): Promise<PriceResult> {
  // 화장품이 아니면 바로 실패 반환
  if (request.productType !== 'cosmetic') {
    return {
      productId: request.productId,
      productType: request.productType,
      price: 0,
      source: 'oliveyoung',
      fetchedAt: new Date(),
      success: false,
      error: 'OliveYoung only supports cosmetic products',
    };
  }

  // 활성화 여부 확인
  if (!isOliveYoungEnabled()) {
    return {
      productId: request.productId,
      productType: request.productType,
      price: 0,
      source: 'oliveyoung',
      fetchedAt: new Date(),
      success: false,
      error: 'OliveYoung scraping is disabled',
    };
  }

  try {
    // 검색어 구성
    const keyword = `${request.brand} ${request.productName}`;
    const products = await searchOliveYoungProducts(keyword, 5);

    if (products.length === 0) {
      return {
        productId: request.productId,
        productType: request.productType,
        price: 0,
        source: 'oliveyoung',
        fetchedAt: new Date(),
        success: false,
        error: 'No results found',
      };
    }

    // 가장 유사한 제품 찾기
    const bestMatch = findBestMatch(products, request);

    if (!bestMatch.price || bestMatch.price <= 0) {
      return {
        productId: request.productId,
        productType: request.productType,
        price: 0,
        source: 'oliveyoung',
        fetchedAt: new Date(),
        success: false,
        error: 'Price not found',
      };
    }

    return {
      productId: request.productId,
      productType: request.productType,
      price: bestMatch.price,
      source: 'oliveyoung',
      url: bestMatch.productUrl,
      fetchedAt: new Date(),
      success: true,
    };
  } catch (error) {
    return {
      productId: request.productId,
      productType: request.productType,
      price: 0,
      source: 'oliveyoung',
      fetchedAt: new Date(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 검색 결과에서 가장 유사한 제품 찾기
 */
function findBestMatch(
  products: OliveYoungProduct[],
  request: PriceFetchRequest
): OliveYoungProduct {
  // 브랜드명이 일치하는 제품 우선
  const brandMatch = products.find(
    (p) =>
      p.brand.toLowerCase().includes(request.brand.toLowerCase()) ||
      p.name.toLowerCase().includes(request.brand.toLowerCase())
  );

  if (brandMatch && brandMatch.price > 0) {
    return brandMatch;
  }

  // 제품명 유사도가 가장 높은 제품 선택
  let bestMatch = products[0];
  let bestScore = 0;

  for (const product of products) {
    if (product.price <= 0) continue;

    const score = calculateSimilarity(product.name, request.productName);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  return bestMatch;
}

/**
 * 문자열 유사도 계산
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));

  let common = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      common++;
    }
  }

  return common / Math.max(words1.size, words2.size);
}

/**
 * 올리브영 스크래핑 활성화 여부
 */
export function isOliveYoungEnabled(): boolean {
  return process.env.OLIVEYOUNG_ENABLED === 'true';
}

/**
 * 올리브영 배치 가격 조회 (화장품만)
 * Rate Limit을 위해 긴 딜레이 사용
 */
export async function fetchOliveYoungPrices(
  requests: PriceFetchRequest[],
  delayMs = 1000
): Promise<PriceResult[]> {
  // 화장품만 필터링
  const cosmeticRequests = requests.filter((r) => r.productType === 'cosmetic');
  const results: PriceResult[] = [];

  for (const request of cosmeticRequests) {
    const result = await fetchOliveYoungPrice(request);
    results.push(result);

    // Rate Limit 방지 (1초 딜레이 권장)
    if (cosmeticRequests.indexOf(request) < cosmeticRequests.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // 화장품이 아닌 요청은 실패로 추가
  const nonCosmeticRequests = requests.filter((r) => r.productType !== 'cosmetic');
  for (const request of nonCosmeticRequests) {
    results.push({
      productId: request.productId,
      productType: request.productType,
      price: 0,
      source: 'oliveyoung',
      fetchedAt: new Date(),
      success: false,
      error: 'OliveYoung only supports cosmetic products',
    });
  }

  return results;
}

/**
 * 올리브영 지원 여부 확인
 */
export function supportsProductType(productType: string): boolean {
  return productType === 'cosmetic';
}
