/**
 * 네이버 쇼핑 API 가격 소스
 * @description 네이버 쇼핑 API를 통한 실시간 가격 조회
 * @version 1.0
 * @date 2025-12-09
 *
 * 사용하려면 네이버 개발자 센터에서 API 키 발급 필요:
 * https://developers.naver.com/products/service-api/search/search.md
 *
 * 환경 변수:
 * - NAVER_CLIENT_ID: 네이버 API 클라이언트 ID
 * - NAVER_CLIENT_SECRET: 네이버 API 클라이언트 시크릿
 */

import type { PriceFetchRequest, PriceResult } from '../types';

const NAVER_SHOPPING_API_URL =
  'https://openapi.naver.com/v1/search/shop.json';

interface NaverShoppingItem {
  title: string;
  link: string;
  image: string;
  lprice: string; // 최저가
  hprice: string; // 최고가
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

interface NaverShoppingResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverShoppingItem[];
}

/**
 * 네이버 쇼핑 API로 가격 조회
 */
export async function fetchNaverPrice(
  request: PriceFetchRequest
): Promise<PriceResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  // API 키가 없으면 실패 반환
  if (!clientId || !clientSecret) {
    return {
      productId: request.productId,
      productType: request.productType,
      price: 0,
      source: 'naver_shopping',
      fetchedAt: new Date(),
      success: false,
      error: 'Naver API credentials not configured',
    };
  }

  try {
    // 검색어 구성: 브랜드 + 제품명
    const query = encodeURIComponent(`${request.brand} ${request.productName}`);
    const url = `${NAVER_SHOPPING_API_URL}?query=${query}&display=5&sort=sim`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`Naver API error: ${response.status}`);
    }

    const data: NaverShoppingResponse = await response.json();

    if (data.items.length === 0) {
      return {
        productId: request.productId,
        productType: request.productType,
        price: 0,
        source: 'naver_shopping',
        fetchedAt: new Date(),
        success: false,
        error: 'No results found',
      };
    }

    // 가장 유사한 제품의 최저가 반환
    const bestMatch = findBestMatch(data.items, request);
    const price = parseInt(bestMatch.lprice, 10);

    return {
      productId: request.productId,
      productType: request.productType,
      price,
      source: 'naver_shopping',
      url: bestMatch.link,
      fetchedAt: new Date(),
      success: true,
    };
  } catch (error) {
    return {
      productId: request.productId,
      productType: request.productType,
      price: 0,
      source: 'naver_shopping',
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
  items: NaverShoppingItem[],
  request: PriceFetchRequest
): NaverShoppingItem {
  // 브랜드명이 일치하는 제품 우선
  const brandMatch = items.find(
    (item) =>
      item.brand.toLowerCase().includes(request.brand.toLowerCase()) ||
      item.maker.toLowerCase().includes(request.brand.toLowerCase())
  );

  if (brandMatch) {
    return brandMatch;
  }

  // 제품명 유사도가 가장 높은 제품 선택
  let bestMatch = items[0];
  let bestScore = 0;

  for (const item of items) {
    const score = calculateSimilarity(
      item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
      request.productName
    );
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

/**
 * 문자열 유사도 계산 (간단한 버전)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // 공통 단어 비율 계산
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
 * 네이버 API 사용 가능 여부 확인
 */
export function isNaverApiAvailable(): boolean {
  return !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
}

/**
 * 네이버 배치 가격 조회 (Rate Limit 고려)
 */
export async function fetchNaverPrices(
  requests: PriceFetchRequest[],
  delayMs = 100
): Promise<PriceResult[]> {
  const results: PriceResult[] = [];

  for (const request of requests) {
    const result = await fetchNaverPrice(request);
    results.push(result);

    // API Rate Limit 방지를 위한 딜레이
    if (requests.indexOf(request) < requests.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
