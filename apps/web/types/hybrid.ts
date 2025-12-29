/**
 * 하이브리드 UX/UI 기능 관련 타입 정의
 * Beauty/Style 도메인 공통 타입
 */

import type { SkinType, SkinConcern, PersonalColorSeason } from './product';

// 도메인 타입
export type HybridDomain = 'beauty' | 'style';

// 연령대 타입
export type AgeGroup = '10s' | '20s' | '30s' | '40s' | '50plus';

// 연령대 라벨
export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  '10s': '10대',
  '20s': '20대',
  '30s': '30대',
  '40s': '40대',
  '50plus': '50대+',
};

// 소재 타입 (Style 도메인)
export type FabricMaterial =
  | 'cotton'
  | 'linen'
  | 'silk'
  | 'wool'
  | 'denim'
  | 'leather'
  | 'synthetic'
  | 'cashmere'
  | 'polyester'
  | 'nylon';

export const FABRIC_MATERIAL_LABELS: Record<FabricMaterial, string> = {
  cotton: '면',
  linen: '린넨',
  silk: '실크',
  wool: '울',
  denim: '데님',
  leather: '가죽',
  synthetic: '합성섬유',
  cashmere: '캐시미어',
  polyester: '폴리에스터',
  nylon: '나일론',
};

// 메이크업 스타일 타입 (Beauty 도메인)
export type MakeupStyle = 'natural' | 'glam' | 'cute' | 'chic' | 'trendy';

export const MAKEUP_STYLE_LABELS: Record<MakeupStyle, string> = {
  natural: '내추럴',
  glam: '글램',
  cute: '큐트',
  chic: '시크',
  trendy: '트렌디',
};

// 패션 스타일 타입 (Style 도메인)
export type FashionStyle = 'casual' | 'minimal' | 'street' | 'romantic' | 'classic' | 'sporty';

export const FASHION_STYLE_LABELS: Record<FashionStyle, string> = {
  casual: '캐주얼',
  minimal: '미니멀',
  street: '스트릿',
  romantic: '로맨틱',
  classic: '클래식',
  sporty: '스포티',
};

// 즐겨찾기 아이템 (성분/소재)
export interface FavoriteItem {
  id: string;
  clerkUserId: string;
  domain: HybridDomain;
  itemType: 'ingredient' | 'material';
  itemName: string;
  itemNameEn?: string;
  /** true = 즐겨찾기(좋아함), false = 기피 */
  isFavorite: boolean;
  createdAt: string;
}

// 변화 추적 데이터 포인트
export interface ChangeTrackingPoint {
  date: string;
  metrics: Record<string, number>;
  note?: string;
}

// 피부 변화 히스토리
export interface SkinChangeHistory {
  date: string;
  hydration: number; // 수분
  oil: number; // 유분
  pores: number; // 모공
  wrinkles: number; // 주름
  elasticity: number; // 탄력
  pigmentation: number; // 색소침착
  trouble: number; // 트러블
  overallScore: number; // 종합 점수
}

// 체형 변화 히스토리
export interface BodyChangeHistory {
  date: string;
  shoulder: number; // 어깨 너비
  waist: number; // 허리 둘레
  hip: number; // 엉덩이 둘레
  weight?: number; // 체중
  bodyType?: 'S' | 'W' | 'N'; // 체형 타입
}

// 루틴 아이템
export interface RoutineItem {
  order: number;
  category: string;
  productId?: string;
  productName?: string;
  note?: string;
  timing?: 'morning' | 'evening' | 'both';
  duration?: string;
}

// 사용자 루틴
export interface UserRoutine {
  id: string;
  clerkUserId: string;
  domain: HybridDomain;
  routineType: string; // 예: 'skincare_morning', 'skincare_evening', 'outfit_daily'
  items: RoutineItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 비포/애프터 리뷰 확장
export interface BeforeAfterReview {
  reviewId: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  usagePeriod?: string; // 예: '3개월'
  // Beauty 관련
  skinType?: SkinType;
  skinConcerns?: SkinConcern[];
  // Style 관련
  height?: number;
  weight?: number;
  bodyType?: 'S' | 'W' | 'N';
  fitComment?: string;
}

// AI 요약 결과
export interface AISummaryResult {
  summary: string;
  keyPoints: string[];
  warnings?: string[];
  recommendations?: string[];
  confidence: number;
}

// 점수 계산 결과
export interface ScoreResult {
  score: number;
  maxScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: Array<{
    name: string;
    value: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
}

// 피부나이 계산 결과
export interface SkinAgeResult extends ScoreResult {
  actualAge: number;
  skinAge: number;
  difference: number;
}

// 체형점수 계산 결과
export interface BodyScoreResult extends ScoreResult {
  proportionScore: number;
  balanceScore: number;
  strengths: string[];
  improvementAreas: string[];
}

// 룩북 포스트
export interface LookbookPost {
  id: string;
  clerkUserId: string;
  imageUrl: string;
  caption?: string;
  bodyType?: 'S' | 'W' | 'N';
  personalColor?: PersonalColorSeason;
  outfitItems: Array<{
    category: string;
    productId?: string;
    description: string;
    color?: string;
    colorHex?: string;
  }>;
  likesCount: number;
  commentsCount: number;
  isPublic: boolean;
  createdAt: string;
}

// 룩북 좋아요
export interface LookbookLike {
  id: string;
  postId: string;
  clerkUserId: string;
  createdAt: string;
}

// 스타일 랭킹 아이템
export interface StyleRankingItem<T> {
  styleId: string;
  styleName: string;
  products: T[];
  totalCount: number;
}

// API 응답 타입
export interface FavoritesResponse {
  favorites: FavoriteItem[];
  avoids: FavoriteItem[];
}

export interface RoutinesResponse {
  routines: UserRoutine[];
}

export interface LookbookFeedResponse {
  posts: LookbookPost[];
  hasMore: boolean;
  nextCursor?: string;
}
