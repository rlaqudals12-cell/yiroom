/**
 * 어필리에이트 모듈 통합 Export
 * @description 모바일 앱용 어필리에이트 기능
 */

// Types
export type {
  AffiliatePartnerName,
  AffiliateProduct,
  AffiliateClickInput,
  DeeplinkOptions,
  DeeplinkResult,
} from './types';

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
