/**
 * Mock 가격 소스
 * @description 테스트 및 개발용 Mock 가격 데이터 제공
 * @version 1.0
 * @date 2025-12-09
 */

import type { PriceFetchRequest, PriceResult } from '../types';

/**
 * Mock 가격 조회
 * 실제 가격에서 -5% ~ +5% 범위의 랜덤 변동 적용
 */
export async function fetchMockPrice(
  request: PriceFetchRequest
): Promise<PriceResult> {
  // 실제 API 호출 시뮬레이션 (100-500ms 딜레이)
  await new Promise((resolve) =>
    setTimeout(resolve, 100 + Math.random() * 400)
  );

  // 현재 가격이 없으면 브랜드/제품명 기반으로 가격 생성
  const basePrice = request.currentPrice || generateBasePrice(request);

  // -5% ~ +5% 랜덤 변동
  const variation = 0.95 + Math.random() * 0.1;
  const newPrice = Math.round(basePrice * variation);

  return {
    productId: request.productId,
    productType: request.productType,
    price: newPrice,
    source: 'mock',
    fetchedAt: new Date(),
    success: true,
  };
}

/**
 * 제품 정보 기반 기본 가격 생성
 */
function generateBasePrice(request: PriceFetchRequest): number {
  // 제품 타입별 기본 가격 범위
  const priceRanges: Record<string, { min: number; max: number }> = {
    cosmetic: { min: 15000, max: 80000 },
    supplement: { min: 20000, max: 60000 },
    workout_equipment: { min: 30000, max: 200000 },
    health_food: { min: 25000, max: 80000 },
  };

  const range = priceRanges[request.productType] || { min: 20000, max: 50000 };

  // 브랜드명 해시로 일관된 가격 생성
  const brandHash = hashString(request.brand);
  const nameHash = hashString(request.productName);
  const combinedHash = (brandHash + nameHash) % 100;

  // 범위 내에서 가격 결정
  const price = range.min + (combinedHash / 100) * (range.max - range.min);
  return Math.round(price / 1000) * 1000; // 1000원 단위로 반올림
}

/**
 * 문자열 해시 함수
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Mock 배치 가격 조회
 */
export async function fetchMockPrices(
  requests: PriceFetchRequest[]
): Promise<PriceResult[]> {
  const results: PriceResult[] = [];

  for (const request of requests) {
    try {
      const result = await fetchMockPrice(request);
      results.push(result);
    } catch (error) {
      results.push({
        productId: request.productId,
        productType: request.productType,
        price: 0,
        source: 'mock',
        fetchedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}
