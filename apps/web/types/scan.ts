/**
 * 제품 스캔 관련 타입 정의
 * Phase F: 바코드/성분 스캔 맞춤 분석
 */

// ============================================
// 스캔 방식
// ============================================

export type ScanMethod = 'barcode' | 'ocr' | 'search';

export type BarcodeType = 'EAN-13' | 'EAN-8' | 'UPC-A' | 'CODE-128' | 'QR';

// ============================================
// 성분 관련
// ============================================

export type IngredientCategory =
  | 'moisturizing'
  | 'exfoliating'
  | 'antioxidant'
  | 'brightening'
  | 'anti_aging'
  | 'soothing'
  | 'cleansing'
  | 'preservative'
  | 'fragrance'
  | 'surfactant'
  | 'other';

export type IngredientConcentration = 'high' | 'medium' | 'low' | 'unknown';

export interface ProductIngredient {
  order: number;
  inciName: string;
  nameKo?: string;
  concentration?: IngredientConcentration;
  purpose?: IngredientCategory[];
  ewgGrade?: number;
  note?: string;
}

export interface IngredientMaster {
  id: string;
  inciName: string;
  nameKo?: string;
  nameEn?: string;
  category: IngredientCategory;
  functions: string[];
  ewgGrade?: number;
  recommendedForSkinTypes?: string[];
  cautionForSkinTypes?: string[];
  avoidForSkinTypes?: string[];
  synergyWith?: string[];
  avoidWith?: string[];
  descriptionKo?: string;
  benefitsKo?: string[];
  sideEffectsKo?: string[];
}

// ============================================
// 제품 관련
// ============================================

export type ProductCategory =
  | 'skincare'
  | 'makeup'
  | 'bodycare'
  | 'haircare'
  | 'suncare'
  | 'fragrance'
  | 'supplement'
  | 'other';

export type PriceRange = 'budget' | 'mid' | 'premium' | 'luxury';

export type ProductDataSource = 'manual' | 'open_beauty_facts' | 'user_submitted';

export interface GlobalProduct {
  id: string;
  barcode?: string;
  name: string;
  nameEn?: string;
  brand: string;
  category: ProductCategory;
  subcategory?: string;
  ingredients: ProductIngredient[];
  keyIngredients?: string[];
  originCountry?: string;
  availableRegions?: string[];
  imageUrl?: string;
  volume?: string;
  priceRange?: PriceRange;
  ewgGrade?: number;
  cosdnaAcneScore?: number;
  cosdnaIrritantScore?: number;
  userRating?: number;
  reviewCount?: number;
  dataSource: ProductDataSource;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 조회 결과
// ============================================

export type ProductLookupSource = 'internal_db' | 'open_beauty_facts' | 'ocr_analysis';

export interface ProductLookupResult {
  found: boolean;
  source: ProductLookupSource;
  product?: GlobalProduct;
  confidence: number;
  error?: string;
}

// ============================================
// 호환성 분석
// ============================================

export type CompatibilityBasis =
  | 'skin_type'
  | 'sensitivity'
  | 'concerns'
  | 'personal_color'
  | 'general';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CompatibilityPoint {
  title: string;
  description: string;
  basedOn: CompatibilityBasis;
  confidence: ConfidenceLevel;
}

export interface IngredientNote {
  ingredient: string;
  inciName: string;
  note: string;
  ewgGrade?: number;
}

export type InteractionType = 'synergy' | 'caution' | 'avoid_together';

export interface InteractionWarning {
  ingredient1: string;
  ingredient2: string;
  type: InteractionType;
  reason: string;
  recommendation: string;
}

export interface SkinCompatibility {
  score: number;
  goodPoints: CompatibilityPoint[];
  warnings: CompatibilityPoint[];
}

export interface ColorMatch {
  isRecommended: boolean;
  matchScore: number;
  reason: string;
  alternatives?: string[];
}

export interface IngredientAnalysis {
  beneficial: IngredientNote[];
  caution: IngredientNote[];
  avoid: IngredientNote[];
  interactions: InteractionWarning[];
}

export interface CompatibilityResult {
  overallScore: number;
  skinCompatibility: SkinCompatibility;
  colorMatch?: ColorMatch;
  ingredientAnalysis: IngredientAnalysis;
}

// ============================================
// 사용자 제품함
// ============================================

export type ShelfStatus = 'owned' | 'wishlist' | 'used_up';

export interface UserProductShelf {
  id: string;
  clerkUserId: string;
  productId: string;
  product?: GlobalProduct;
  scannedAt: string;
  scanMethod: ScanMethod;
  compatibilityScore?: number;
  analysisResult?: CompatibilityResult;
  status: ShelfStatus;
  userNote?: string;
  rating?: number;
  createdAt: string;
}

// ============================================
// API 요청/응답
// ============================================

export interface BarcodeScanRequest {
  barcode: string;
}

export interface OcrScanRequest {
  imageBase64: string;
}

export interface AnalyzeRequest {
  productId?: string;
  ingredients?: ProductIngredient[];
}

export interface AddToShelfRequest {
  productId: string;
  status: ShelfStatus;
  note?: string;
}

export interface ScanAnalysisResponse {
  success: boolean;
  product: GlobalProduct;
  compatibility: CompatibilityResult;
  userAnalysisUsed: {
    skinAnalysis: boolean;
    personalColor: boolean;
  };
}

// ============================================
// OCR 결과
// ============================================

export interface OcrIngredient {
  order: number;
  nameKo: string;
  nameInci?: string;
  concentration: IngredientConcentration;
  note?: string;
}

export interface OcrResult {
  productName?: string;
  brandName?: string;
  ingredients: OcrIngredient[];
  confidence: ConfidenceLevel;
  language: 'ko' | 'en' | 'ja' | 'zh' | 'other';
}
