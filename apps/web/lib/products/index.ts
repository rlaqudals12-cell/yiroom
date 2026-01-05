/**
 * Product API 통합 Export
 * @description 기존 lib/products.ts API 호환성 유지
 * @version 3.0 - Repository 패턴 리팩토링
 */

// ================================================
// 화장품 (Cosmetic)
// ================================================
export {
  getCosmeticProducts,
  getCosmeticProductById,
  getRecommendedCosmetics,
  getCosmeticBrands,
} from './repositories/cosmetic';

// ================================================
// 영양제 (Supplement)
// ================================================
export {
  getSupplementProducts,
  getSupplementProductById,
  getRecommendedSupplements,
  getSupplementBrands,
} from './repositories/supplement';

// ================================================
// 운동 기구 (Equipment)
// ================================================
export {
  getWorkoutEquipment,
  getWorkoutEquipmentById,
  getRecommendedEquipment,
  getWorkoutEquipmentBrands,
} from './repositories/equipment';

// ================================================
// 건강식품 (Health Food)
// ================================================
export {
  getHealthFoods,
  getHealthFoodById,
  getRecommendedHealthFoods,
  getHighProteinFoods,
  getHealthFoodBrands,
} from './repositories/healthfood';

// ================================================
// 가격 히스토리 (Price History)
// ================================================
export {
  recordPriceHistory,
  getPriceHistory,
  getLowestPrice,
  getPriceDropProducts,
} from './repositories/price-history';

// ================================================
// 통합 검색 서비스 (Search Service)
// ================================================
export {
  PRODUCT_CATEGORIES,
  getProductsByCategory,
  searchProducts,
  getProductType,
  getProductById,
  productTypeToPath,
  pathToProductType,
} from './services/search';

// ================================================
// 리뷰 서비스 (Reviews)
// ================================================
export {
  getProductReviews,
  getReviewSummary,
  hasUserReviewed,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleReviewHelpful,
  getRatingText,
  getRatingColor,
} from './services/reviews';

// ================================================
// 상호작용 서비스 (Interactions)
// ================================================
export {
  getInteractionBetween,
  getIngredientInteractions,
  getInteractionsByType,
  checkProductInteractions,
  checkWishlistInteractions,
  summarizeInteractions,
  filterWarningsOnly,
  filterSynergiesOnly,
} from './services/interactions';

// ================================================
// 매칭 서비스 (Matching)
// ================================================
export { calculateMatchScore, addMatchInfo, addMatchInfoToProducts } from './matching';
export type { UserProfile, MatchResult } from './matching';

// ================================================
// 어필리에이트 서비스 (Affiliate)
// ================================================
export {
  trackAffiliateClick,
  openAffiliateLink,
  getAffiliateStats,
  getProductClickCount,
  getTodayClickCount,
} from './affiliate';

// ================================================
// 화장품 성분 (Ingredients)
// ================================================
export {
  getIngredientById,
  searchIngredients,
  getProductIngredients,
  getCaution20Ingredients,
  getAllergenIngredients,
  getIngredientsByCategory,
  analyzeProductIngredients,
  ingredientExists,
  getFunctionCounts,
} from './repositories/ingredients';

export {
  analyzeIngredientsWithAI,
  generateMockIngredientSummary,
} from './services/ingredient-analysis';
export type { AIIngredientKeyword, AIIngredientSummary } from './services/ingredient-analysis';
