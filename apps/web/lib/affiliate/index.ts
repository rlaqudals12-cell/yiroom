/**
 * 어필리에이트 시스템 통합 Export
 * @description lib/affiliate 모듈의 모든 함수/타입 re-export
 */

// Partners Repository
export {
  getAffiliatePartners,
  getAffiliatePartnerByName,
  getAffiliatePartnerById,
  updatePartnerSyncStatus,
} from './partners';

// Products Repository
export {
  getAffiliateProducts,
  getAffiliateProductById,
  getAffiliateProductByExternalId,
  getAffiliateProductsByPartner,
  getRecommendedProductsBySkin,
  getRecommendedProductsByColor,
  getRecommendedProductsByBodyType,
  searchAffiliateProducts,
  getPopularAffiliateProducts,
  getAffiliateProductCount,
} from './products';

// Clicks Repository
export {
  createAffiliateClick,
  getUserClickHistory,
  getProductClickCount,
  updateClickConversion,
  getPartnerDailyStats,
  getAffiliateStatsSummary,
  getTopClickedProducts,
  hashIpAddress,
} from './clicks';
export type { AffiliateClickRecord, DailyStats } from './clicks';

// Coupang API
export {
  searchCoupangProducts,
  createCoupangDeeplink,
  getCoupangCategoryProducts,
  isCoupangConfigured,
  COUPANG_CATEGORIES,
} from './coupang';
export type { CoupangSearchOptions, CoupangCategory } from './coupang';

// Deeplink
export {
  createDeeplink,
  createMultipleDeeplinks,
  extractProductId,
  isValidDeeplink,
  getDeeplinkFormat,
} from './deeplink';
export type { DeeplinkOptions, DeeplinkResult } from './deeplink';

// iHerb API
export {
  searchIHerbProducts,
  createIHerbDeeplink,
  getIHerbCategoryProducts,
  isIHerbConfigured,
  IHERB_CATEGORIES,
} from './iherb';
export type { IHerbSearchOptions, IHerbCategory } from './iherb';

// Musinsa API
export {
  searchMusinsaProducts,
  createMusinsaDeeplink,
  getMusinsaCategoryProducts,
  isMusinsaConfigured,
  MUSINSA_CATEGORIES,
} from './musinsa';
export type { MusinsaSearchOptions, MusinsaCategory } from './musinsa';

// Types re-export (convenience)
export type {
  AffiliatePartner,
  AffiliatePartnerName,
  AffiliateProduct,
  AffiliateProductFilter,
  AffiliateProductSortBy,
  AffiliateClickCreateInput,
  AffiliateRecommendationType,
  AffiliateSyncStatus,
  AffiliateSyncResult,
} from '@/types/affiliate';
