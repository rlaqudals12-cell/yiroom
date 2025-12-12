/**
 * 가격 크롤러 모듈
 * @description 제품 가격 실시간 업데이트를 위한 크롤러
 * @version 2.0
 * @date 2025-12-09
 *
 * 지원 소스:
 * - naver_shopping: 네이버 쇼핑 API
 * - coupang: 쿠팡 파트너스 API
 * - oliveyoung: 올리브영 (화장품 전용)
 * - mock: 테스트/개발용
 */

// 타입 내보내기
export type {
  PriceResult,
  PriceSource,
  PriceFetchRequest,
  BatchUpdateResult,
  PriceChange,
  CrawlerConfig,
} from './types';

export { DEFAULT_CRAWLER_CONFIG, PREFERRED_SOURCES_BY_TYPE } from './types';

// 가격 조회 함수
export {
  fetchPrice,
  fetchPrices,
  getAvailableSources,
  getPreferredSources,
  calculatePriceChange,
  validatePriceChange,
} from './price-fetcher';

// 가격 업데이트 함수
export {
  updatePricesForType,
  updateAllPrices,
  updateSpecificProducts,
} from './price-updater';

// 개별 소스 - Mock
export { fetchMockPrice, fetchMockPrices } from './sources/mock';

// 개별 소스 - 네이버 쇼핑
export {
  fetchNaverPrice,
  fetchNaverPrices,
  isNaverApiAvailable,
} from './sources/naver';

// 개별 소스 - 쿠팡
export {
  fetchCoupangPrice,
  fetchCoupangPrices,
  isCoupangApiAvailable,
} from './sources/coupang';

// 개별 소스 - 올리브영 (화장품 전용)
export {
  fetchOliveYoungPrice,
  fetchOliveYoungPrices,
  isOliveYoungEnabled,
  supportsProductType as oliveyoungSupportsProductType,
} from './sources/oliveyoung';
