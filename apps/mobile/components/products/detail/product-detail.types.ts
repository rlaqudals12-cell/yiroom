import type { ClothingCategory } from '@/lib/smart-matching';

export interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  brandId: string;
  category: string;
  clothingCategory?: ClothingCategory;
  price: number;
  rating: number;
  reviewCount: number;
  /** 사용자 분석 기반 매칭률 — 계산된 경우에만 표시 (지어내기 금지) */
  matchScore?: number;
  description: string;
  ingredients: string[];
  benefits: string[];
  howToUse: string;
  images: string[];
  purchaseUrl: string;
  isFavorite: boolean;
  hasSize?: boolean;
}

export interface ProductReview {
  id: string;
  userName: string;
  rating: number;
  date: string;
  content: string;
  helpful: number;
}
