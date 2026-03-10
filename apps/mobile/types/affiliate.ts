/**
 * Affiliate System TypeScript 타입 정의
 * @description 어필리에이트 파트너 연동 및 클릭 트래킹 시스템 타입
 * @version 2.0
 * @date 2025-12-29
 */

import type { ProductType } from './product';

// ================================================
// 파트너 관련 타입 (v2.0 추가)
// ================================================

/** 파트너 식별자 */
export type AffiliatePartnerName = 'iherb' | 'coupang' | 'musinsa';

/** API 타입 */
export type AffiliateApiType = 'csv_feed' | 'rest_api' | 'manual';

/** 동기화 상태 */
export type AffiliateSyncStatus = 'pending' | 'syncing' | 'success' | 'error';

/** 파트너 설정 (DB Row) */
export interface AffiliatePartnerRow {
  id: string;
  name: string;
  display_name: string;
  logo_url: string | null;
  api_type: AffiliateApiType;
  api_endpoint: string | null;
  api_key_encrypted: string | null;
  commission_rate_min: number | null;
  commission_rate_max: number | null;
  cookie_duration_days: number | null;
  sync_frequency_hours: number;
  last_synced_at: string | null;
  sync_status: AffiliateSyncStatus;
  sync_error_message: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** 파트너 설정 (앱용) */
export interface AffiliatePartner {
  id: string;
  name: AffiliatePartnerName;
  displayName: string;
  logoUrl?: string;
  apiType: AffiliateApiType;
  apiEndpoint?: string;
  commissionRateMin?: number;
  commissionRateMax?: number;
  cookieDurationDays?: number;
  syncFrequencyHours: number;
  lastSyncedAt?: Date;
  syncStatus: AffiliateSyncStatus;
  syncErrorMessage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** DB Row → 앱 타입 변환 */
export function toAffiliatePartner(row: AffiliatePartnerRow): AffiliatePartner {
  return {
    id: row.id,
    name: row.name as AffiliatePartnerName,
    displayName: row.display_name,
    logoUrl: row.logo_url ?? undefined,
    apiType: row.api_type,
    apiEndpoint: row.api_endpoint ?? undefined,
    commissionRateMin: row.commission_rate_min ?? undefined,
    commissionRateMax: row.commission_rate_max ?? undefined,
    cookieDurationDays: row.cookie_duration_days ?? undefined,
    syncFrequencyHours: row.sync_frequency_hours,
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : undefined,
    syncStatus: row.sync_status,
    syncErrorMessage: row.sync_error_message ?? undefined,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ================================================
// 어필리에이트 제품 타입 (v2.0 추가)
// ================================================

/** 피부 타입 (매칭용) */
export type AffiliateSkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

/** 피부 고민 (매칭용) */
export type AffiliateSkinConcern =
  | 'acne'
  | 'aging'
  | 'whitening'
  | 'hydration'
  | 'pore'
  | 'redness'
  | 'dark_circles'
  | 'wrinkles';

/** 퍼스널 컬러 (매칭용) */
export type AffiliatePersonalColor = 'spring_warm' | 'summer_cool' | 'autumn_warm' | 'winter_cool';

/** 체형 (매칭용) */
export type AffiliateBodyType = 'straight' | 'wave' | 'natural';

/** 모발 타입 (H-1 매칭용) */
export type AffiliateHairType = 'straight' | 'wavy' | 'curly' | 'coily';

/** 두피 타입 (H-1 매칭용) */
export type AffiliateScalpType = 'dry' | 'oily' | 'sensitive' | 'normal';

/** 언더톤 (M-1 매칭용) */
export type AffiliateUndertone = 'warm' | 'cool' | 'neutral';

/** 어필리에이트 제품 (DB Row) */
export interface AffiliateProductRow {
  id: string;
  partner_id: string;
  external_product_id: string;
  name: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  thumbnail_url: string | null;
  price_krw: number | null;
  price_original_krw: number | null;
  currency: string;
  affiliate_url: string;
  direct_url: string | null;
  rating: number | null;
  review_count: number | null;
  skin_types: string[] | null;
  skin_concerns: string[] | null;
  personal_colors: string[] | null;
  body_types: string[] | null;
  // v2: H-1/M-1 매칭 필드
  hair_types: string[] | null;
  scalp_types: string[] | null;
  face_shapes: string[] | null;
  undertones: string[] | null;
  makeup_subcategory: string | null;
  keywords: string[] | null;
  tags: string[] | null;
  is_in_stock: boolean;
  is_active: boolean;
  last_synced_at: string | null;
  sync_hash: string | null;
  created_at: string;
  updated_at: string;
}

/** 어필리에이트 제품 (앱용) */
export interface AffiliateProduct {
  id: string;
  partnerId: string;
  partnerName?: AffiliatePartnerName;
  externalProductId: string;
  name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
  priceKrw?: number;
  priceOriginalKrw?: number;
  currency: string;
  affiliateUrl: string;
  directUrl?: string;
  rating?: number;
  reviewCount?: number;
  skinTypes?: AffiliateSkinType[];
  skinConcerns?: AffiliateSkinConcern[];
  personalColors?: AffiliatePersonalColor[];
  bodyTypes?: AffiliateBodyType[];
  // v2: H-1/M-1 매칭 필드
  hairTypes?: AffiliateHairType[];
  scalpTypes?: AffiliateScalpType[];
  faceShapes?: string[];
  undertones?: AffiliateUndertone[];
  makeupSubcategory?: string;
  keywords?: string[];
  tags?: string[];
  isInStock: boolean;
  isActive: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** DB Row → 앱 타입 변환 */
export function toAffiliateProduct(row: AffiliateProductRow): AffiliateProduct {
  return {
    id: row.id,
    partnerId: row.partner_id,
    externalProductId: row.external_product_id,
    name: row.name,
    brand: row.brand ?? undefined,
    category: row.category ?? undefined,
    subcategory: row.subcategory ?? undefined,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    imageUrls: row.image_urls ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    priceKrw: row.price_krw ?? undefined,
    priceOriginalKrw: row.price_original_krw ?? undefined,
    currency: row.currency,
    affiliateUrl: row.affiliate_url,
    directUrl: row.direct_url ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    skinTypes: row.skin_types as AffiliateSkinType[] | undefined,
    skinConcerns: row.skin_concerns as AffiliateSkinConcern[] | undefined,
    personalColors: row.personal_colors as AffiliatePersonalColor[] | undefined,
    bodyTypes: row.body_types as AffiliateBodyType[] | undefined,
    hairTypes: row.hair_types as AffiliateHairType[] | undefined,
    scalpTypes: row.scalp_types as AffiliateScalpType[] | undefined,
    faceShapes: row.face_shapes ?? undefined,
    undertones: row.undertones as AffiliateUndertone[] | undefined,
    makeupSubcategory: row.makeup_subcategory ?? undefined,
    keywords: row.keywords ?? undefined,
    tags: row.tags ?? undefined,
    isInStock: row.is_in_stock,
    isActive: row.is_active,
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/** 제품 필터 옵션 */
export interface AffiliateProductFilter {
  partnerId?: string;
  partnerName?: AffiliatePartnerName;
  category?: string;
  brand?: string;
  skinTypes?: AffiliateSkinType[];
  skinConcerns?: AffiliateSkinConcern[];
  personalColors?: AffiliatePersonalColor[];
  bodyTypes?: AffiliateBodyType[];
  // v2: H-1/M-1 필터
  hairTypes?: AffiliateHairType[];
  scalpTypes?: AffiliateScalpType[];
  faceShapes?: string[];
  undertones?: AffiliateUndertone[];
  makeupSubcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  keywords?: string[];
}

/** 제품 정렬 옵션 */
export type AffiliateProductSortBy = 'rating' | 'price_asc' | 'price_desc' | 'popular' | 'newest';

/** 추천 유형 */
export type AffiliateRecommendationType =
  | 'skin_match'
  | 'color_match'
  | 'body_match'
  | 'hair_match'
  | 'makeup_match'
  | 'popular'
  | 'search'
  | 'related';

/** 클릭 생성 입력 */
export interface AffiliateClickCreateInput {
  productId: string;
  clerkUserId?: string;
  sourcePage: string;
  sourceComponent: string;
  recommendationType?: AffiliateRecommendationType;
  userAgent?: string;
  ipHash?: string;
  sessionId?: string;
}

/** 동기화 결과 */
export interface AffiliateSyncResult {
  partnerId: string;
  success: boolean;
  productsAdded: number;
  productsUpdated: number;
  productsRemoved: number;
  errorMessage?: string;
  duration: number;
  syncedAt: Date;
}

// ================================================
// 어필리에이트 타입
// ================================================

/** 어필리에이트 제품 타입 (DB 저장용) */
export type AffiliateProductType = 'cosmetic' | 'supplement' | 'equipment' | 'healthfood';

/** ProductType → AffiliateProductType 변환 */
export function toAffiliateProductType(type: ProductType): AffiliateProductType {
  const mapping: Record<ProductType, AffiliateProductType> = {
    cosmetic: 'cosmetic',
    supplement: 'supplement',
    workout_equipment: 'equipment',
    health_food: 'healthfood',
  };
  return mapping[type];
}

/** 어필리에이트 클릭 기록 */
export interface AffiliateClick {
  id: string;
  clerkUserId?: string;
  productType: AffiliateProductType;
  productId: string;
  referrer?: string;
  userAgent?: string;
  ipHash?: string;
  clickedAt: string;
}

/** 클릭 트래킹 입력 */
export interface TrackClickInput {
  productType: AffiliateProductType;
  productId: string;
  clerkUserId?: string;
  referrer?: string;
  userAgent?: string;
}

/** 일별 통계 */
export interface DailyClickStats {
  date: string;
  productType: AffiliateProductType;
  productId: string;
  clickCount: number;
  uniqueUsers: number;
}

/** 제품별 클릭 통계 */
export interface ProductClickStats {
  productType: AffiliateProductType;
  productId: string;
  productName: string;
  totalClicks: number;
  uniqueUsers: number;
}

/** 어필리에이트 통계 요약 */
export interface AffiliateStats {
  /** 조회 기간 */
  period: {
    startDate: string;
    endDate: string;
  };
  /** 총 클릭 수 */
  totalClicks: number;
  /** 고유 사용자 수 */
  uniqueUsers: number;
  /** 제품별 통계 */
  byProduct: ProductClickStats[];
  /** 일별 통계 */
  byDate: {
    date: string;
    clicks: number;
  }[];
}

// ================================================
// Supabase 테이블 Row 타입
// ================================================

/** affiliate_clicks 테이블 row */
export interface AffiliateClickRow {
  id: string;
  clerk_user_id: string | null;
  product_type: string;
  product_id: string;
  referrer: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  clicked_at: string;
}

/** affiliate_daily_stats 뷰 row */
export interface AffiliateDailyStatsRow {
  date: string;
  product_type: string;
  product_id: string;
  click_count: number;
  unique_users: number;
}

// ================================================
// 변환 함수
// ================================================

/** DB row → 프론트엔드 타입 변환 */
export function toAffiliateClick(row: AffiliateClickRow): AffiliateClick {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id ?? undefined,
    productType: row.product_type as AffiliateProductType,
    productId: row.product_id,
    referrer: row.referrer ?? undefined,
    userAgent: row.user_agent ?? undefined,
    ipHash: row.ip_hash ?? undefined,
    clickedAt: row.clicked_at,
  };
}

/** 일별 통계 row 변환 */
export function toDailyClickStats(row: AffiliateDailyStatsRow): DailyClickStats {
  return {
    date: row.date,
    productType: row.product_type as AffiliateProductType,
    productId: row.product_id,
    clickCount: row.click_count,
    uniqueUsers: row.unique_users,
  };
}
