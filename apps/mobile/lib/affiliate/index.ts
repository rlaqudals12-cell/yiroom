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

// Products Repository — 목록/추천은 cosmetic_products로 재배선됨.
// searchAffiliateProducts만 검색 브리지용으로 보존.
export { searchAffiliateProducts } from './products';

// Clicks
export { createAffiliateClick, getUserClickHistory } from './clicks';

// Deeplink
export { createDeeplink, openAffiliateLink, trackAndOpenLink, identifyPartner } from './deeplink';

// Hooks
export { useAffiliateClick } from './useAffiliateClick';

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
