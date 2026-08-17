// lib/closet 공개 API

// 통합 큐레이션 맥락 전달 규약 (등록 화면들이 세션을 이어받아 코디 추천으로 복귀)
export {
  CURATION_SOURCE,
  readCurationContext,
  withCurationContext,
  curationReturnHref,
  type CurationContext,
} from './curation-context';

export {
  CLOTHING_SUB_CATEGORIES,
  SEASON_LABELS,
  OCCASION_LABELS,
  PATTERN_LABELS,
  MATERIAL_LABELS,
  toClothingItem,
  toClothingItems,
  getClothingMetadata,
  CLOTHING_CATEGORY_LABELS,
  CLOSET_SORT_LABELS,
} from './types';
export type {
  ClothingCategory,
  ClothingItem,
  ClothingMetadata,
  Season,
  Occasion,
  Pattern,
  Material,
  ClosetFilterOptions,
  ClosetSortOption,
  ClosetStats,
  OutfitRecommendOptions,
} from './types';
