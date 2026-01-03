/**
 * 옷장 모듈 타입 정의
 * 기존 inventory 타입을 re-export하고 옷장 전용 타입 추가
 */

// inventory 타입 re-export
export type {
  ClothingCategory,
  ClothingItem,
  ClothingMetadata,
  Season,
  Occasion,
  Pattern,
  Material,
} from '@/types/inventory';

export {
  CLOTHING_SUB_CATEGORIES,
  SEASON_LABELS,
  OCCASION_LABELS,
  PATTERN_LABELS,
  MATERIAL_LABELS,
  toClothingItem,
  toClothingItems,
  getClothingMetadata,
} from '@/types/inventory';

// 옷장 전용 타입

/** 카테고리 라벨 */
export const CLOTHING_CATEGORY_LABELS: Record<string, string> = {
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  dress: '원피스',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
};

/** 필터 옵션 */
export interface ClosetFilterOptions {
  category?: string;
  season?: string[];
  occasion?: string[];
  color?: string;
  isFavorite?: boolean;
  search?: string;
}

/** 정렬 옵션 */
export type ClosetSortOption = 'newest' | 'oldest' | 'name' | 'mostWorn' | 'recentlyWorn';

export const CLOSET_SORT_LABELS: Record<ClosetSortOption, string> = {
  newest: '최신순',
  oldest: '오래된순',
  name: '이름순',
  mostWorn: '많이 입은순',
  recentlyWorn: '최근 착용순',
};

/** 옷장 통계 */
export interface ClosetStats {
  totalItems: number;
  favoriteCount: number;
  categoryCount: Record<string, number>;
  unwornItems: number;
  avgWearCount: number;
}

/** 코디 추천 옵션 */
export interface OutfitRecommendOptions {
  personalColor?: string | null;
  bodyType?: 'S' | 'W' | 'N' | null;
  temperature?: number | null;
  occasion?: string | null;
}
