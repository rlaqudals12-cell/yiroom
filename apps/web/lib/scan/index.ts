/**
 * 제품 스캔 모듈 통합 Export
 */

// 바코드 스캔
export {
  isBarcodeDetectorSupported,
  validateEAN13,
  validateEAN8,
  validateUPCA,
  detectBarcodeFormat,
  scanBarcodeFromVideo,
  scanBarcodeFromImage,
  stopScan,
  checkCameraPermission,
  requestCameraAccess,
  stopCameraStream,
} from './barcode';
export type { BarcodeResult, ScanOptions } from './barcode';

// 제품 조회
export { lookupProduct, searchProducts, parseIngredientsText } from './product-lookup';

// 성분 OCR
export {
  analyzeIngredientImage,
  parseIngredientsFromText,
  generateMockOcrResult,
} from './ingredient-ocr';
export type { OcrResult } from './ingredient-ocr';

// 피부 타입별 성분 매칭
export {
  SKIN_TYPE_INGREDIENTS,
  SKIN_CONCERN_INGREDIENTS,
  checkIngredientForSkinType,
  calculateSkinTypeScore,
} from './skin-ingredient-match';
export type { SkinType, IngredientRecommendation } from './skin-ingredient-match';

// 성분 상호작용
export {
  INGREDIENT_INTERACTIONS,
  detectInteractions,
  categorizeInteractions,
  calculateInteractionPenalty,
} from './ingredient-interactions';
export type {
  InteractionType,
  InteractionRule,
  InteractionWarning,
} from './ingredient-interactions';

// 호환성 분석
export { analyzeCompatibility, generateMockCompatibilityResult } from './compatibility';
export type {
  UserAnalysisData,
  CompatibilityPoint,
  IngredientNote,
  ColorMatchResult,
  CompatibilityResult,
} from './compatibility';

// 제품함
export {
  getShelfItems,
  getRecentScans,
  addToShelf,
  getShelfItem,
  updateShelfItem,
  removeFromShelf,
  findByBarcode,
  getShelfCounts,
} from './product-shelf';
export type {
  ShelfStatus,
  ScanMethod,
  ShelfItem,
  AddToShelfRequest,
  UpdateShelfItemRequest,
} from './product-shelf';

// 한국 제품 시드 데이터
export {
  KOREAN_PRODUCTS_SEED,
  findProductByBarcode,
  getProductsByBrand,
  getProductsByCategory,
  searchProductsByIngredient,
  SEED_STATS,
} from './korean-products-seed';
