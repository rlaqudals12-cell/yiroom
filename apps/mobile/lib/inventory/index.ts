/**
 * 인벤토리 시스템 통합 모듈
 * 웹과 동기화된 옷장, 뷰티, 운동장비, 영양제, 냉장고 관리
 */

// ============================================================
// 타입, 상수, 순수 함수 (types.ts에서)
// ============================================================

export {
  // 카테고리 타입
  type InventoryCategory,
  type ClothingCategory,
  type Season,
  type Occasion,
  type Pattern,
  type Material,
  // 상수
  CATEGORY_LABELS,
  CLOTHING_CATEGORY_LABELS,
  SEASON_LABELS,
  OCCASION_LABELS,
  PATTERN_LABELS,
  MATERIAL_LABELS,
  CLOTHING_SUB_CATEGORIES,
  // 메타데이터 타입
  type ClothingMetadata,
  type BeautyMetadata,
  type EquipmentMetadata,
  type SupplementMetadata,
  type PantryMetadata,
  // 엔티티 타입
  type InventoryItem,
  type ClothingItem,
  type SavedOutfit,
  // DB Row 타입
  type InventoryItemRow,
  type SavedOutfitRow,
  // 변환 함수
  rowToInventoryItem,
  rowToSavedOutfit,
  toClothingItem,
  toClothingItems,
} from './types';

// ============================================================
// 훅 Re-export
// ============================================================

export { useInventory, useCloset, useSavedOutfits } from './useInventory';
export { useClosetMatcher } from './useClosetMatcher';
export type {
  BodyType3,
  PersonalColorSeason,
  MatchOptions,
  ClosetRecommendation,
  OutfitSuggestion,
  RecommendationSummary,
} from './useClosetMatcher';
