/**
 * Phase J: 스마트 매칭 시스템 타입 정의
 * - 사이즈 매칭
 * - 가격 비교
 * - 사용자 설정
 * - 피드백
 * - 알림
 */

// ============================================
// 바코드
// ============================================

export type BarcodeType = 'EAN13' | 'UPC' | 'QR';

export interface ProductBarcode {
  id: string;
  barcode: string;
  barcodeType: BarcodeType;
  productId?: string;
  productName?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  source?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductBarcodeDB {
  id: string;
  barcode: string;
  barcode_type: string;
  product_id: string | null;
  product_name: string | null;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  source: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// 사용자 설정
// ============================================

export interface BudgetSettings {
  clothing?: { min?: number; max?: number; preferred?: number };
  skincare?: { min?: number; max?: number; preferred?: number };
  supplements?: { min?: number; max?: number; preferred?: number };
  equipment?: { min?: number; max?: number; preferred?: number };
}

export type NotificationFrequency = 'realtime' | 'daily' | 'weekly';

export interface UserPreferences {
  clerkUserId: string;

  // 예산
  budget: BudgetSettings;

  // 브랜드
  favoriteBrands: string[];
  blockedBrands: string[];

  // 쇼핑
  preferredPlatforms: string[];
  prioritizeFreeDelivery: boolean;
  prioritizeFastDelivery: boolean;
  prioritizePoints: boolean;

  // 추천
  showAlternatives: boolean;
  showPriceComparison: boolean;
  notifyPriceDrop: boolean;
  notifyRestock: boolean;

  // 알림
  notificationEmail: boolean;
  notificationPush: boolean;
  notificationFrequency: NotificationFrequency;

  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferencesDB {
  clerk_user_id: string;
  budget: BudgetSettings;
  favorite_brands: string[];
  blocked_brands: string[];
  preferred_platforms: string[];
  prioritize_free_delivery: boolean;
  prioritize_fast_delivery: boolean;
  prioritize_points: boolean;
  show_alternatives: boolean;
  show_price_comparison: boolean;
  notify_price_drop: boolean;
  notify_restock: boolean;
  notification_email: boolean;
  notification_push: boolean;
  notification_frequency: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// 신체 치수
// ============================================

export type PreferredFit = 'tight' | 'regular' | 'loose';

export interface UserBodyMeasurements {
  clerkUserId: string;

  // 기본
  height?: number;
  weight?: number;
  bodyType?: string;

  // 상세 (cm)
  chest?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  armLength?: number;
  inseam?: number;
  footLength?: number;

  // 선호
  preferredFit: PreferredFit;

  createdAt: Date;
  updatedAt: Date;
}

export interface UserBodyMeasurementsDB {
  clerk_user_id: string;
  height: number | null;
  weight: number | null;
  body_type: string | null;
  chest: number | null;
  waist: number | null;
  hip: number | null;
  shoulder: number | null;
  arm_length: number | null;
  inseam: number | null;
  foot_length: number | null;
  preferred_fit: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// 사이즈 기록
// ============================================

export type SizeFit = 'small' | 'perfect' | 'large';

export interface UserSizeHistory {
  id: string;
  clerkUserId: string;
  brandId: string;
  brandName: string;
  category: string;
  size: string;
  fit?: SizeFit;
  productId?: string;
  purchaseDate?: Date;
  createdAt: Date;
}

export interface UserSizeHistoryDB {
  id: string;
  clerk_user_id: string;
  brand_id: string;
  brand_name: string;
  category: string;
  size: string;
  fit: string | null;
  product_id: string | null;
  purchase_date: string | null;
  created_at: string;
}

// ============================================
// 브랜드 사이즈 차트
// ============================================

export type ClothingCategory = 'top' | 'bottom' | 'outer' | 'dress' | 'shoes';
export type FitStyle = 'slim' | 'regular' | 'oversized';

export interface SizeMeasurements {
  chest?: { min: number; max: number };
  waist?: { min: number; max: number };
  shoulder?: { min: number; max: number };
  length?: { min: number; max: number };
}

export interface SizeMapping {
  label: string;
  minHeight?: number;
  maxHeight?: number;
  minWeight?: number;
  maxWeight?: number;
  measurements: SizeMeasurements;
}

export interface BrandSizeChart {
  id: string;
  brandId: string;
  brandName: string;
  country?: string;
  category: ClothingCategory;
  fitStyle?: FitStyle;
  sizeMappings: SizeMapping[];
  source?: string;
  lastVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandSizeChartDB {
  id: string;
  brand_id: string;
  brand_name: string;
  country: string | null;
  category: string;
  fit_style: string | null;
  size_mappings: SizeMapping[];
  source: string | null;
  last_verified: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// 제품 실측
// ============================================

export interface ActualMeasurements {
  totalLength?: number;
  shoulderWidth?: number;
  chestWidth?: number;
  sleeveLength?: number;
  waistWidth?: number;
  hipWidth?: number;
  thighWidth?: number;
  rise?: number;
  hemWidth?: number;
}

export interface SizeMeasurement {
  size: string;
  actualMeasurements: ActualMeasurements;
}

export type MeasurementSource = 'official' | 'musinsa' | 'user_report' | 'ai_extracted';

export interface ProductMeasurements {
  id: string;
  productId: string;
  sizeMeasurements: SizeMeasurement[];
  source?: MeasurementSource;
  reliability: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductMeasurementsDB {
  id: string;
  product_id: string;
  size_measurements: SizeMeasurement[];
  source: string | null;
  reliability: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// 사이즈 추천
// ============================================

export type SizeRecommendationBasis = 'history' | 'measurements' | 'brand_chart' | 'general';

export interface SizeRecommendation {
  recommendedSize: string;
  confidence: number;
  basis: SizeRecommendationBasis;
  alternatives: { size: string; note: string }[];
  brandInfo?: {
    fitStyle?: string;
    sizeNote?: string;
  };
}

// ============================================
// 가격 모니터링
// ============================================

export interface PriceWatch {
  id: string;
  clerkUserId: string;
  productId: string;
  targetPrice?: number;
  percentDrop?: number;
  platforms: string[];
  currentLowestPrice?: number;
  lowestPlatform?: string;
  notified: boolean;
  notifiedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PriceWatchDB {
  id: string;
  clerk_user_id: string;
  product_id: string;
  target_price: number | null;
  percent_drop: number | null;
  platforms: string[];
  current_lowest_price: number | null;
  lowest_platform: string | null;
  notified: boolean;
  notified_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface PriceHistory {
  id: string;
  productId: string;
  platform: string;
  price: number;
  originalPrice?: number;
  recordedAt: Date;
}

export interface PriceHistoryDB {
  id: string;
  product_id: string;
  platform: string;
  price: number;
  original_price: number | null;
  recorded_at: string;
}

// ============================================
// 가격 비교
// ============================================

export type DeliveryType = 'rocket' | 'next_day' | 'standard' | 'international';
export type PriceReliability = 'live' | 'cached' | 'estimated';

export interface PurchaseOption {
  platform: string;
  originalPrice: number;
  salePrice: number;
  discountPercent: number;
  deliveryType: DeliveryType;
  deliveryDays: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number;
  points?: number;
  inStock: boolean;
  stockCount?: number;
  affiliateUrl: string;
  commissionRate: number;
  lastUpdated: Date;
  reliability: PriceReliability;
}

export interface PriceComparison {
  productId: string;
  options: PurchaseOption[];
  bestPrice?: PurchaseOption;
  fastestDelivery?: PurchaseOption;
  bestValue?: PurchaseOption;
  lastUpdated: Date;
}

// ============================================
// 피드백
// ============================================

export type FeedbackType =
  | 'purchase_review'
  | 'size_feedback'
  | 'match_feedback'
  | 'recommendation_rating'
  | 'usage_report';

export type ColorAccuracy = 'different' | 'similar' | 'exact';

export interface UserFeedback {
  id: string;
  clerkUserId: string;
  feedbackType: FeedbackType;
  productId?: string;
  recommendationId?: string;
  rating?: number;
  sizeFit?: SizeFit;
  colorAccuracy?: ColorAccuracy;
  wouldRecommend?: boolean;
  comment?: string;
  pros?: string[];
  cons?: string[];
  photos?: string[];
  createdAt: Date;
}

export interface UserFeedbackDB {
  id: string;
  clerk_user_id: string;
  feedback_type: string;
  product_id: string | null;
  recommendation_id: string | null;
  rating: number | null;
  size_fit: string | null;
  color_accuracy: string | null;
  would_recommend: boolean | null;
  comment: string | null;
  pros: string[] | null;
  cons: string[] | null;
  photos: string[] | null;
  created_at: string;
}

// ============================================
// 알림
// ============================================

export type NotificationType =
  | 'product_running_low'
  | 'expiry_approaching'
  | 'price_drop'
  | 'back_in_stock'
  | 'new_recommendation'
  | 'size_available'
  | 'similar_product'
  | 'reorder_reminder';

export interface SmartNotification {
  id: string;
  clerkUserId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  imageUrl?: string;
  productId?: string;
  inventoryItemId?: string;
  actionUrl?: string;
  read: boolean;
  readAt?: Date;
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
}

export interface SmartNotificationDB {
  id: string;
  clerk_user_id: string;
  notification_type: string;
  title: string;
  message: string;
  image_url: string | null;
  product_id: string | null;
  inventory_item_id: string | null;
  action_url: string | null;
  read: boolean;
  read_at: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
}

// ============================================
// 스마트 추천
// ============================================

export type MatchReasonType =
  | 'color_match'
  | 'skin_match'
  | 'body_match'
  | 'nutrition_match'
  | 'price'
  | 'rating';

export interface MatchReason {
  type: MatchReasonType;
  score: number;
  description: string;
}

export interface SmartRecommendation {
  productId: string;
  matchScore: number;
  matchReasons: MatchReason[];
  sizeRecommendation?: SizeRecommendation;
  purchaseOptions: PurchaseOption[];
  alreadyOwned: boolean;
  alternatives: { productId: string; matchScore: number; reason: string }[];
}

// ============================================
// 변환 함수
// ============================================

export function mapBarcodeRow(row: ProductBarcodeDB): ProductBarcode {
  return {
    id: row.id,
    barcode: row.barcode,
    barcodeType: row.barcode_type as BarcodeType,
    productId: row.product_id ?? undefined,
    productName: row.product_name ?? undefined,
    brand: row.brand ?? undefined,
    category: row.category ?? undefined,
    imageUrl: row.image_url ?? undefined,
    source: row.source ?? undefined,
    verified: row.verified,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapPreferencesRow(row: UserPreferencesDB): UserPreferences {
  return {
    clerkUserId: row.clerk_user_id,
    budget: row.budget,
    favoriteBrands: row.favorite_brands,
    blockedBrands: row.blocked_brands,
    preferredPlatforms: row.preferred_platforms,
    prioritizeFreeDelivery: row.prioritize_free_delivery,
    prioritizeFastDelivery: row.prioritize_fast_delivery,
    prioritizePoints: row.prioritize_points,
    showAlternatives: row.show_alternatives,
    showPriceComparison: row.show_price_comparison,
    notifyPriceDrop: row.notify_price_drop,
    notifyRestock: row.notify_restock,
    notificationEmail: row.notification_email,
    notificationPush: row.notification_push,
    notificationFrequency: row.notification_frequency as NotificationFrequency,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapMeasurementsRow(row: UserBodyMeasurementsDB): UserBodyMeasurements {
  return {
    clerkUserId: row.clerk_user_id,
    height: row.height ?? undefined,
    weight: row.weight ?? undefined,
    bodyType: row.body_type ?? undefined,
    chest: row.chest ?? undefined,
    waist: row.waist ?? undefined,
    hip: row.hip ?? undefined,
    shoulder: row.shoulder ?? undefined,
    armLength: row.arm_length ?? undefined,
    inseam: row.inseam ?? undefined,
    footLength: row.foot_length ?? undefined,
    preferredFit: (row.preferred_fit || 'regular') as PreferredFit,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapSizeHistoryRow(row: UserSizeHistoryDB): UserSizeHistory {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    brandId: row.brand_id,
    brandName: row.brand_name,
    category: row.category,
    size: row.size,
    fit: row.fit as SizeFit | undefined,
    productId: row.product_id ?? undefined,
    purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
    createdAt: new Date(row.created_at),
  };
}

export function mapPriceWatchRow(row: PriceWatchDB): PriceWatch {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    productId: row.product_id,
    targetPrice: row.target_price ?? undefined,
    percentDrop: row.percent_drop ?? undefined,
    platforms: row.platforms,
    currentLowestPrice: row.current_lowest_price ?? undefined,
    lowestPlatform: row.lowest_platform ?? undefined,
    notified: row.notified,
    notifiedAt: row.notified_at ? new Date(row.notified_at) : undefined,
    createdAt: new Date(row.created_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  };
}

export function mapFeedbackRow(row: UserFeedbackDB): UserFeedback {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    feedbackType: row.feedback_type as FeedbackType,
    productId: row.product_id ?? undefined,
    recommendationId: row.recommendation_id ?? undefined,
    rating: row.rating ?? undefined,
    sizeFit: row.size_fit as SizeFit | undefined,
    colorAccuracy: row.color_accuracy as ColorAccuracy | undefined,
    wouldRecommend: row.would_recommend ?? undefined,
    comment: row.comment ?? undefined,
    pros: row.pros ?? undefined,
    cons: row.cons ?? undefined,
    photos: row.photos ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export function mapNotificationRow(row: SmartNotificationDB): SmartNotification {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    notificationType: row.notification_type as NotificationType,
    title: row.title,
    message: row.message,
    imageUrl: row.image_url ?? undefined,
    productId: row.product_id ?? undefined,
    inventoryItemId: row.inventory_item_id ?? undefined,
    actionUrl: row.action_url ?? undefined,
    read: row.read,
    readAt: row.read_at ? new Date(row.read_at) : undefined,
    scheduledFor: row.scheduled_for ? new Date(row.scheduled_for) : undefined,
    sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}
