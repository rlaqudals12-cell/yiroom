/**
 * 어필리에이트 타입 정의
 * @description 모바일 앱용 어필리에이트 타입
 */

export type AffiliatePartnerName = 'coupang' | 'iherb' | 'musinsa';

export interface AffiliateProduct {
  id: string;
  partnerId: string;
  partnerName: AffiliatePartnerName;
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
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
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
