/**
 * 가격 조회 서비스
 * @description 여러 소스에서 가격을 조회하는 통합 인터페이스
 * @version 2.0
 * @date 2025-12-09
 *
 * 지원 소스:
 * - naver_shopping: 네이버 쇼핑 API
 * - coupang: 쿠팡 파트너스 API
 * - oliveyoung: 올리브영 (화장품 전용)
 * - mock: 테스트/개발용
 */

import type {
  PriceFetchRequest,
  PriceResult,
  PriceSource,
} from './types';
import { PREFERRED_SOURCES_BY_TYPE } from './types';
import { fetchMockPrice } from './sources/mock';
import { fetchNaverPrice, isNaverApiAvailable } from './sources/naver';
import { fetchCoupangPrice, isCoupangApiAvailable } from './sources/coupang';
import {
  fetchOliveYoungPrice,
  isOliveYoungEnabled,
  supportsProductType as oliveyoungSupports,
} from './sources/oliveyoung';

/**
 * 가격 조회 (단일 제품)
 * 제품 타입에 따라 최적의 소스 자동 선택
 */
export async function fetchPrice(
  request: PriceFetchRequest,
  preferredSource?: PriceSource
): Promise<PriceResult> {
  // 선호 소스가 지정된 경우
  if (preferredSource) {
    return fetchPriceFromSource(request, preferredSource);
  }

  // 제품 타입별 권장 소스 순서대로 시도
  const preferredSources =
    PREFERRED_SOURCES_BY_TYPE[request.productType] || ['naver_shopping', 'mock'];

  for (const source of preferredSources) {
    // 소스가 사용 가능한지 확인
    if (!isSourceAvailable(source, request.productType)) {
      continue;
    }

    const result = await fetchPriceFromSource(request, source);
    if (result.success) {
      return result;
    }

    console.warn(
      `[PriceFetcher] ${source} failed for ${request.productId}, trying next source`
    );
  }

  // 모든 소스 실패 시 Mock으로 폴백
  console.warn(
    `[PriceFetcher] All sources failed for ${request.productId}, using mock`
  );
  return fetchMockPrice(request);
}

/**
 * 특정 소스에서 가격 조회
 */
async function fetchPriceFromSource(
  request: PriceFetchRequest,
  source: PriceSource
): Promise<PriceResult> {
  switch (source) {
    case 'naver_shopping':
      return fetchNaverPrice(request);

    case 'coupang':
      return fetchCoupangPrice(request);

    case 'oliveyoung':
      return fetchOliveYoungPrice(request);

    case 'mock':
      return fetchMockPrice(request);

    default:
      // 미구현 소스는 Mock으로 폴백
      return fetchMockPrice(request);
  }
}

/**
 * 소스가 사용 가능한지 확인
 */
function isSourceAvailable(source: PriceSource, productType: string): boolean {
  switch (source) {
    case 'naver_shopping':
      return isNaverApiAvailable();

    case 'coupang':
      return isCoupangApiAvailable();

    case 'oliveyoung':
      // 올리브영은 화장품만 지원 + 활성화 여부
      return isOliveYoungEnabled() && oliveyoungSupports(productType);

    case 'mock':
      return true;

    default:
      return false;
  }
}

/**
 * 가격 배치 조회 (여러 제품)
 */
export async function fetchPrices(
  requests: PriceFetchRequest[],
  options: {
    source?: PriceSource;
    delayMs?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<PriceResult[]> {
  const { source, delayMs = 100, onProgress } = options;
  const results: PriceResult[] = [];

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];

    try {
      const result = await fetchPrice(request, source);
      results.push(result);
    } catch (error) {
      results.push({
        productId: request.productId,
        productType: request.productType,
        price: 0,
        source: source || 'mock',
        fetchedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // 진행 상황 콜백
    if (onProgress) {
      onProgress(i + 1, requests.length);
    }

    // Rate Limit 방지를 위한 딜레이
    if (i < requests.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * 사용 가능한 소스 목록 반환
 */
export function getAvailableSources(productType?: string): PriceSource[] {
  const sources: PriceSource[] = ['mock'];

  if (isNaverApiAvailable()) {
    sources.unshift('naver_shopping');
  }

  if (isCoupangApiAvailable()) {
    sources.unshift('coupang');
  }

  // 올리브영은 화장품인 경우만 추가
  if (isOliveYoungEnabled() && (!productType || productType === 'cosmetic')) {
    sources.unshift('oliveyoung');
  }

  return sources;
}

/**
 * 제품 타입에 권장되는 소스 목록 반환
 */
export function getPreferredSources(productType: string): PriceSource[] {
  return PREFERRED_SOURCES_BY_TYPE[productType] || ['naver_shopping', 'mock'];
}

/**
 * 가격 변동률 계산
 */
export function calculatePriceChange(
  oldPrice: number,
  newPrice: number
): {
  changeAmount: number;
  changePercent: number;
  changeType: 'increase' | 'decrease' | 'unchanged';
} {
  const changeAmount = newPrice - oldPrice;
  const changePercent =
    oldPrice > 0 ? Math.round((changeAmount / oldPrice) * 1000) / 10 : 0;

  let changeType: 'increase' | 'decrease' | 'unchanged';
  if (changePercent > 0) {
    changeType = 'increase';
  } else if (changePercent < 0) {
    changeType = 'decrease';
  } else {
    changeType = 'unchanged';
  }

  return { changeAmount, changePercent, changeType };
}

/**
 * 가격 유효성 검증
 * 너무 큰 변동은 오류일 수 있음
 */
export function validatePriceChange(
  oldPrice: number,
  newPrice: number,
  threshold = 50
): {
  isValid: boolean;
  reason?: string;
} {
  // 새 가격이 0이면 무효
  if (newPrice <= 0) {
    return { isValid: false, reason: 'New price is zero or negative' };
  }

  // 기존 가격이 없으면 유효
  if (!oldPrice || oldPrice <= 0) {
    return { isValid: true };
  }

  // 변동률 계산
  const changePercent = Math.abs((newPrice - oldPrice) / oldPrice) * 100;

  // threshold% 이상 변동은 경고
  if (changePercent > threshold) {
    return {
      isValid: false,
      reason: `Price change exceeds ${threshold}%: ${changePercent.toFixed(1)}%`,
    };
  }

  return { isValid: true };
}
