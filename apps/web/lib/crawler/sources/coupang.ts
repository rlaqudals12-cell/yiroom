/**
 * 쿠팡 파트너스 API 가격 소스
 * @description 쿠팡 파트너스 API를 통한 실시간 가격 조회
 * @version 1.0
 * @date 2025-12-09
 *
 * 사용하려면 쿠팡 파트너스 가입 필요:
 * https://partners.coupang.com/
 *
 * 환경 변수:
 * - COUPANG_ACCESS_KEY: 쿠팡 파트너스 Access Key
 * - COUPANG_SECRET_KEY: 쿠팡 파트너스 Secret Key
 */

import crypto from 'crypto';
import type { PriceFetchRequest, PriceResult } from '../types';

const COUPANG_API_URL = 'https://api-gateway.coupang.com';
// 향후 확장용 도메인 상수 (현재 미사용)
const _COUPANG_DOMAIN = 'api-gateway.coupang.com';
void _COUPANG_DOMAIN;

interface CoupangProductData {
  productId: number;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  categoryName: string;
  isRocket: boolean;
  isFreeShipping: boolean;
}

interface CoupangSearchResponse {
  rCode: string;
  rMessage: string;
  data: {
    productData: CoupangProductData[];
  };
}

/**
 * HMAC 서명 생성 (쿠팡 API 인증용)
 */
function generateHmacSignature(
  method: string,
  url: string,
  secretKey: string,
  accessKey: string
): { authorization: string; datetime: string } {
  const datetime = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

  const message = `${datetime}${method}${url.split('?')[0]}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');

  const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;

  return { authorization, datetime };
}

/**
 * 쿠팡 파트너스 API로 상품 검색
 */
async function searchCoupangProducts(
  keyword: string,
  limit = 5
): Promise<CoupangProductData[]> {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;

  if (!accessKey || !secretKey) {
    throw new Error('Coupang API credentials not configured');
  }

  const path = `/v2/providers/affiliate_open_api/apis/openapi/products/search`;
  const query = `?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  const url = `${path}${query}`;

  const { authorization } = generateHmacSignature(
    'GET',
    url,
    secretKey,
    accessKey
  );

  const response = await fetch(`${COUPANG_API_URL}${url}`, {
    method: 'GET',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Coupang API error: ${response.status}`);
  }

  const data: CoupangSearchResponse = await response.json();

  if (data.rCode !== '0') {
    throw new Error(`Coupang API error: ${data.rMessage}`);
  }

  return data.data?.productData || [];
}

/**
 * 쿠팡 가격 조회
 */
export async function fetchCoupangPrice(
  request: PriceFetchRequest
): Promise<PriceResult> {
  // API 키 확인
  if (!isCoupangApiAvailable()) {
    return {
      productId: request.productId,
      productType: request.productType,
      price: 0,
      source: 'coupang',
      fetchedAt: new Date(),
      success: false,
      error: 'Coupang API credentials not configured',
    };
  }

  try {
    // 검색어 구성: 브랜드 + 제품명
    const keyword = `${request.brand} ${request.productName}`;
    const products = await searchCoupangProducts(keyword, 5);

    if (products.length === 0) {
      return {
        productId: request.productId,
        productType: request.productType,
        price: 0,
        source: 'coupang',
        fetchedAt: new Date(),
        success: false,
        error: 'No results found',
      };
    }

    // 가장 유사한 제품 찾기
    const bestMatch = findBestMatch(products, request);

    return {
      productId: request.productId,
      productType: request.productType,
      price: bestMatch.productPrice,
      source: 'coupang',
      url: bestMatch.productUrl,
      fetchedAt: new Date(),
      success: true,
    };
  } catch (error) {
    return {
      productId: request.productId,
      productType: request.productType,
      price: 0,
      source: 'coupang',
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
  products: CoupangProductData[],
  request: PriceFetchRequest
): CoupangProductData {
  // 브랜드명이 포함된 제품 우선
  const brandMatch = products.find((p) =>
    p.productName.toLowerCase().includes(request.brand.toLowerCase())
  );

  if (brandMatch) {
    return brandMatch;
  }

  // 제품명 유사도가 가장 높은 제품 선택
  let bestMatch = products[0];
  let bestScore = 0;

  for (const product of products) {
    const score = calculateSimilarity(product.productName, request.productName);
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
 * 쿠팡 API 사용 가능 여부 확인
 */
export function isCoupangApiAvailable(): boolean {
  return !!(
    process.env.COUPANG_ACCESS_KEY && process.env.COUPANG_SECRET_KEY
  );
}

/**
 * 쿠팡 배치 가격 조회
 */
export async function fetchCoupangPrices(
  requests: PriceFetchRequest[],
  delayMs = 200
): Promise<PriceResult[]> {
  const results: PriceResult[] = [];

  for (const request of requests) {
    const result = await fetchCoupangPrice(request);
    results.push(result);

    // API Rate Limit 방지
    if (requests.indexOf(request) < requests.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
