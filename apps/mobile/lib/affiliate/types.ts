/**
 * 어필리에이트 타입 정의
 * @description 모바일 앱용 어필리에이트 타입 (웹과 호환)
 */

export type AffiliatePartnerName = 'coupang' | 'iherb' | 'musinsa';

// 분석 결과 기반 매칭용 타입
export type AffiliateSkinType =
  | 'dry'
  | 'oily'
  | 'combination'
  | 'sensitive'
  | 'normal';
export type AffiliateSkinConcern =
  | 'acne'
  | 'wrinkles'
  | 'pigmentation'
  | 'pores'
  | 'dryness'
  | 'redness';
export type AffiliatePersonalColor =
  | 'spring_warm'
  | 'summer_cool'
  | 'autumn_warm'
  | 'winter_cool';
export type AffiliateBodyType = 'straight' | 'wave' | 'natural';

export interface AffiliateProduct {
  id: string;
  partnerId: string;
  partnerName?: AffiliatePartnerName;
  externalId: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  imageUrl?: string;
  productUrl: string;
  affiliateUrl?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  // 분석 결과 기반 매칭용 필드
  skinTypes?: AffiliateSkinType[];
  skinConcerns?: AffiliateSkinConcern[];
  personalColors?: AffiliatePersonalColor[];
  bodyTypes?: AffiliateBodyType[];
  tags?: string[];
  keywords?: string[];
}

// 제품 필터 옵션
export interface AffiliateProductFilter {
  partnerId?: string;
  partnerName?: AffiliatePartnerName;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  skinTypes?: AffiliateSkinType[];
  skinConcerns?: AffiliateSkinConcern[];
  personalColors?: AffiliatePersonalColor[];
  bodyTypes?: AffiliateBodyType[];
  keywords?: string[];
}

// 정렬 옵션
export type AffiliateProductSortBy =
  | 'rating'
  | 'price_asc'
  | 'price_desc'
  | 'popular'
  | 'newest';

// DB Row 타입 (snake_case)
export interface AffiliateProductRow {
  id: string;
  partner_id: string;
  external_product_id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  subcategory?: string | null;
  description?: string | null;
  image_url?: string | null;
  price_krw?: number | null;
  price_original_krw?: number | null;
  currency: string;
  affiliate_url: string;
  direct_url?: string | null;
  rating?: number | null;
  review_count?: number | null;
  skin_types?: string[] | null;
  skin_concerns?: string[] | null;
  personal_colors?: string[] | null;
  body_types?: string[] | null;
  keywords?: string[] | null;
  tags?: string[] | null;
  is_in_stock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AffiliateClickInput {
  productId: string;
  clerkUserId?: string;
  sourcePage: string;
  sourceComponent?: string;
  recommendationType?: 'skin' | 'color' | 'body' | 'general';
}

export interface DeeplinkOptions {
  productUrl: string;
  partner: AffiliatePartnerName;
  productId?: string;
  subId?: string;
}

export interface DeeplinkResult {
  url: string;
  partner: AffiliatePartnerName;
  success: boolean;
  error?: string;
}
