/**
 * 패션 모듈 공개 API
 *
 * @module lib/fashion
 * @description K-2 패션 확장 - 스타일 추천, 사이즈 추천, Best 10 생성
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md
 */

// Best 10 생성기
export {
  getStyleBest10,
  getAllStyleBest10,
  filterByPersonalColor,
  filterBySeason,
  filterByOccasion,
  getPersonalizedBest10,
  STYLE_CATEGORY_LABELS,
} from './best10-generator';

export type {
  StyleCategory,
  OutfitItem,
  OutfitRecommendation,
  StyleBest10,
} from './best10-generator';

// 사이즈 추천
export {
  determineHeightFit,
  recommendSize,
  convertToUnisexSize,
  convertFromUnisexSize,
} from './size-recommendation';

export type {
  FitType,
  HeightFit,
  Gender,
  SizeCategory,
  UserMeasurements,
  SizeRecommendation,
  SizeProfile,
} from './size-recommendation';

// 스타일 카테고리
export {
  STYLE_CATEGORY_KEYWORDS,
  STYLE_CATEGORIES_DETAIL,
  STYLE_TREND_ITEMS_2026,
  TREND_BONUS_2026,
  STYLE_BY_PERSONAL_COLOR,
  getStyleLabel,
  getStyleDetail,
  getRecommendedStyles,
  inferStyleCategory,
  isTrendItem2026,
  calculateTrendBonus,
  calculateStyleCompatibility,
  getAllStyleCategories,
  getRisingTrendStyles,
} from './style-categories';

export type { StyleCategoryDetail } from './style-categories';

// 옷장 연동
export {
  generateOutfitCombinations,
  SAMPLE_WARDROBE,
} from './wardrobe';

export type {
  ClothingCategory,
  ClothingColor,
  WardrobeItem,
  OutfitCombination,
  OutfitRecommendationResult,
} from './wardrobe';
