/**
 * 인벤토리 모듈 통합 export
 */

// Repository (DB CRUD)
export {
  getInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  recordItemUsage,
  toggleFavorite,
  getSavedOutfits,
  getSavedOutfitById,
  createOutfit,
  updateOutfit,
  deleteOutfit,
  recordOutfitWear,
  getInventoryStats,
  getTopUsedItems,
  getUnusedItems,
  getClothingByColor,
  getClothingBySeason,
  getOutfitCandidates,
} from './repository';

// Image Processing
export {
  extractDominantColors,
  removeBackgroundClient,
  classifyClothing,
  resizeImage,
  validateImageFile,
  dataUrlToBlob,
  blobToDataUrl,
  type ClothingClassificationResult,
} from './imageProcessing';

// Capsule Bridge (캡슐 연동)
export {
  getItemsForCapsule,
  estimateDepletion,
  getRepurchaseNeeded,
  checkGapAgainstInventory,
  type CapsuleDomain,
  type DepletionEstimate,
  type GapItem,
  type GapCheckResult,
} from './capsule-bridge';

// Expiry Alerts (유통기한 알림)
export {
  getExpiryStatus,
  getDaysRemaining,
  getExpiryMessage,
  generateExpiryAlerts,
  getExpiringItems,
  getExpirySummary,
  type ExpiryStatus,
  type ExpiryAlert,
  type ExpirySummary,
} from './expiry-alerts';

// Product Synergy (성분 시너지/충돌)
export {
  extractIngredientKeywords,
  analyzeInteraction,
  analyzeInventoryInteractions,
  inferRoutineStep,
  suggestRoutineOrder,
  type InteractionType,
  type ProductInteraction,
  type RoutineStep,
  type RoutineOrderSuggestion,
} from './product-synergy';

// Routine Bridge (인벤토리↔스킨케어 루틴 연동)
export {
  matchProductsToRoutine,
  getMissingStepMessages,
  getLowStockMessages,
  getRoutineCoverageSummary,
  type InventoryProduct,
  type RoutineStepMatch,
  type RoutineInventoryResult,
} from './routine-bridge';

// Closet Matcher (퍼스널컬러/체형/날씨 기반 추천)
export {
  calculateMatchScore,
  recommendFromCloset,
  suggestOutfitFromCloset,
  getRecommendationSummary,
  type BodyType3,
  type MatchScore,
  type ClosetRecommendation,
  type OutfitSuggestion,
} from './closetMatcher';
