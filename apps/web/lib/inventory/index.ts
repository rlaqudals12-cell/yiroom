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

// Storage
export {
  uploadInventoryImage,
  deleteInventoryImage,
  deleteAllUserImages,
  extractStoragePath,
  createUploadSignedUrl,
  downloadInventoryImage,
} from './storage';

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
