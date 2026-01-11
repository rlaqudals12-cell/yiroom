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
