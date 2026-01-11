/**
 * Phase J: AI 스타일링 타입 정의
 */

import type { SeasonType } from '@/lib/mock/personal-color';

/** 색상 정보 */
export interface ColorInfo {
  name: string; // "코랄 핑크"
  hex: string; // "#FF7F7F"
  nameEn?: string; // "Coral Pink"
}

/** 코디 스타일 */
export type OutfitStyle = 'casual' | 'formal' | 'sporty' | 'elegant' | 'romantic';

/** 착용 상황 */
export type Occasion =
  | 'daily'
  | 'work'
  | 'date'
  | 'shopping'
  | 'gym'
  | 'outdoor'
  | 'yoga'
  | 'running'
  | 'party';

/** 색상 조합 */
export interface ColorCombination {
  id: string;
  name: string; // "코랄 + 베이지"
  description: string; // "따뜻하고 부드러운 인상"
  colors: {
    top: ColorInfo; // 상의 색상
    bottom: ColorInfo; // 하의 색상
    accent?: ColorInfo; // 악센트 색상 (선택)
  };
  style: OutfitStyle;
  occasions: Occasion[];
  seasonTypes: SeasonType[];
  tip?: string; // 스타일링 팁
}

/** 운동복 색상 조합 */
export interface WorkoutCombination extends ColorCombination {
  category: 'gym' | 'outdoor' | 'yoga' | 'running';
  shoes?: ColorInfo; // 신발 색상
}

/** 코디 추천 결과 */
export interface OutfitRecommendation {
  combination: ColorCombination;
  matchScore: number; // 매칭 점수 (0-100)
  products?: {
    id: string;
    name: string;
    affiliateUrl?: string;
    imageUrl?: string;
  }[];
  reason: string; // 추천 이유
}

/** 스타일링 카테고리 */
export type StylingCategory = 'daily' | 'workout' | 'accessory' | 'makeup';

/** 스타일링 결과 페이지 Props */
export interface StylingPageProps {
  seasonType: SeasonType;
  category?: StylingCategory;
}

/** 색상 조합 카드 Props */
export interface ColorCombinationCardProps {
  combination: ColorCombination;
  onProductClick?: (productId: string) => void;
  onSave?: (combinationId: string) => void;
  showProducts?: boolean;
}

/** 운동복 스타일링 Props */
export interface WorkoutStylingProps {
  seasonType: SeasonType;
  workoutType?: 'gym' | 'outdoor' | 'yoga' | 'running';
  onProductClick?: (productId: string) => void;
}

/** 색상 스와치 Props */
export interface ColorSwatchProps {
  color: ColorInfo;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

/** 코디 미리보기 Props */
export interface OutfitPreviewProps {
  top: ColorInfo;
  bottom: ColorInfo;
  accent?: ColorInfo;
  size?: 'sm' | 'md' | 'lg';
}

// ============================================
// Phase J P2: 악세서리 & 메이크업 타입
// ============================================

/** 금속 톤 */
export type MetalTone = 'gold' | 'silver' | 'rose_gold' | 'bronze';

/** 악세서리 종류 */
export type AccessoryType = 'earring' | 'necklace' | 'ring' | 'bracelet' | 'watch';

/** 금속 톤 추천 */
export interface AccessoryRecommendation {
  metalTone: MetalTone;
  isRecommended: boolean;
  description: string;
}

/** 악세서리 아이템 */
export interface AccessoryItem {
  type: AccessoryType;
  name: string;
  metalTone: MetalTone;
  gemstone?: {
    name: string;
    hex: string;
  };
  tip?: string;
}

/** 시즌별 악세서리 스타일링 */
export interface AccessoryStyling {
  seasonType: SeasonType;
  metalTones: AccessoryRecommendation[];
  items: AccessoryItem[];
  generalTip: string;
}

/** 메이크업 카테고리 */
export type MakeupCategory = 'lipstick' | 'eyeshadow' | 'blusher' | 'foundation';

/** 메이크업 색상 */
export interface MakeupColor {
  name: string;
  hex: string;
  finish?: 'matte' | 'glossy' | 'shimmer' | 'satin';
}

/** 메이크업 팔레트 */
export interface MakeupPalette {
  category: MakeupCategory;
  colors: MakeupColor[];
  tip: string;
}

/** 시즌별 메이크업 스타일링 */
export interface MakeupStyling {
  seasonType: SeasonType;
  lipstick: MakeupPalette;
  eyeshadow: MakeupPalette;
  blusher: MakeupPalette;
  generalTip: string;
}

/** 금속 톤 한글 라벨 */
export const METAL_TONE_LABELS: Record<MetalTone, string> = {
  gold: '골드',
  silver: '실버',
  rose_gold: '로즈골드',
  bronze: '브론즈',
};

/** 악세서리 타입 한글 라벨 */
export const ACCESSORY_TYPE_LABELS: Record<AccessoryType, string> = {
  earring: '귀걸이',
  necklace: '목걸이',
  ring: '반지',
  bracelet: '팔찌',
  watch: '시계',
};

/** 메이크업 카테고리 한글 라벨 */
export const MAKEUP_CATEGORY_LABELS: Record<MakeupCategory, string> = {
  lipstick: '립스틱',
  eyeshadow: '아이섀도',
  blusher: '블러셔',
  foundation: '파운데이션',
};

/** Occasion 한글 라벨 */
export const OCCASION_LABELS: Record<Occasion, string> = {
  daily: '데일리',
  work: '출근',
  date: '데이트',
  shopping: '쇼핑',
  gym: '헬스장',
  outdoor: '야외 운동',
  yoga: '요가/필라테스',
  running: '러닝',
  party: '파티',
};

/** Style 한글 라벨 */
export const STYLE_LABELS: Record<OutfitStyle, string> = {
  casual: '캐주얼',
  formal: '포멀',
  sporty: '스포티',
  elegant: '엘레강스',
  romantic: '로맨틱',
};

// ============================================
// Phase J P3: 전체 코디 타입
// ============================================

/** 전체 코디 상황 */
export type OutfitOccasion = 'daily' | 'work' | 'date' | 'party';

/** 전체 코디 */
export interface FullOutfit {
  id: string;
  seasonType: SeasonType;
  occasion: OutfitOccasion;
  clothing: ColorCombination;
  accessory: {
    metalTone: MetalTone;
    items: AccessoryItem[];
  };
  makeup: {
    lipstick: MakeupColor;
    eyeshadow: MakeupColor[];
    blusher: MakeupColor;
  };
  tip: string;
}

/** 상황별 코디 프리셋 */
export interface OutfitPreset {
  occasion: OutfitOccasion;
  name: string;
  description: string;
  outfits: FullOutfit[];
}

/** 전체 코디 상황 한글 라벨 */
export const OUTFIT_OCCASION_LABELS: Record<OutfitOccasion, string> = {
  daily: '데일리',
  work: '출근',
  date: '데이트',
  party: '파티',
};

/** 전체 코디 상황 아이콘 */
export const OUTFIT_OCCASION_ICONS: Record<OutfitOccasion, string> = {
  daily: '☀️',
  work: '💼',
  date: '💕',
  party: '🎉',
};
