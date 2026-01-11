// 지역 유틸리티 통합 export
export {
  REGION_CONFIG,
  SUPPORTED_REGIONS,
  getRegionInfo,
  getAffiliateRegions,
  type SupportedRegion,
  type RegionInfo,
} from './config';

export { detectRegion, saveRegion, clearSavedRegion, hasUserSelectedRegion } from './detector';
