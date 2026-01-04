/**
 * 어필리에이트 모듈 통합 Export
 * @description 모바일 앱용 어필리에이트 기능
 */

// Types
export type {
  AffiliatePartnerName,
  AffiliateProduct,
  AffiliateProductFilter,
  AffiliateProductSortBy,
  AffiliateProductRow,
  AffiliateSkinType,
  AffiliateSkinConcern,
  AffiliatePersonalColor,
  AffiliateBodyType,
  AffiliateClickInput,
  DeeplinkOptions,
  DeeplinkResult,
} from './types';

// Products Repository
export {
  getAffiliateProducts,
  getAffiliateProductById,
  getAffiliateProductsByPartner,
  getRecommendedProductsBySkin,
  getRecommendedProductsByColor,
  getRecommendedProductsByBodyType,
  searchAffiliateProducts,
  getPopularAffiliateProducts,
  getProductsByCategory,
} from './products';

// Clicks
export { createAffiliateClick, getUserClickHistory } from './clicks';

// Deeplink
export {
  createDeeplink,
  openAffiliateLink,
  trackAndOpenLink,
  identifyPartner,
} from './deeplink';

// Hooks
export { useAffiliateClick } from './useAffiliateClick';
export {
  useAffiliateProducts,
  useAffiliateProduct,
  useRecommendedProductsBySkin,
  useRecommendedProductsByColor,
  useRecommendedProductsByBodyType,
  useProductSearch,
  usePopularProducts,
  useProductsByCategory,
} from './useAffiliateProducts';

// Utils
export {
  formatPrice,
  getSeasonLabel,
  getCategoryLabel,
  getCategoryEmoji,
  calculateSkinMatchScore,
  calculateColorMatchScore,
  calculateRatingBonus,
  calculateProductMatchScore,
  calculateDiscountRate,
  sortProducts,
} from './utils';
