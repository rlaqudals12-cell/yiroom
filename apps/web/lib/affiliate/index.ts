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

// Stats (Dashboard)
export {
  getDashboardSummary,
  getPartnerRevenues,
  getDailyRevenueTrend,
  getTopProducts,
  getDateRange,
} from './stats';
export type { PartnerRevenue, DailyRevenueTrend, DashboardSummary, TopProduct } from './stats';

// A/B Testing
export {
  getExperiments,
  getExperiment,
  assignVariant,
  getAssignmentFromCookie,
  setAssignmentCookie,
  getChannelOrder,
  trackABEvent,
  flushEvents,
  getMockResults,
  calculateSignificance,
} from './ab-test';
export type { ABExperiment, ABVariant, ABResult, ABEvent, UserAssignment } from './ab-test';

// Global Links (Region-based)
export {
  createGlobalDeeplink,
  createRegionalDeeplinks,
  createAllRegionalDeeplinks,
  getRegionalPartners,
  getPartnerInfo,
  isAffiliateSupported,
  GLOBAL_PARTNER_CONFIG,
} from './global-links';
export type {
  GlobalPartnerName,
  GlobalDeeplinkOptions,
  GlobalDeeplinkResult,
} from './global-links';

// Partner Adapters (v2)
export { getAdapter, getConfiguredAdapters, coupangAdapter } from './adapters';
export type {
  PartnerAdapter,
  ProductSearchQuery,
  PartnerProduct,
  TrackingParams,
  ConversionEvent,
} from './adapters';

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
