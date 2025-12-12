/**
 * 공통 타입 정의
 * 웹과 모바일 앱에서 공유
 */

// 퍼스널 컬러 타입
export type PersonalColorSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter';
export type PersonalColorTone =
  | 'Spring Light' | 'Spring Bright' | 'Spring True' | 'Spring Warm'
  | 'Summer Light' | 'Summer Bright' | 'Summer True' | 'Summer Muted'
  | 'Autumn True' | 'Autumn Deep' | 'Autumn Warm' | 'Autumn Muted'
  | 'Winter True' | 'Winter Deep' | 'Winter Bright' | 'Winter Clear';

// 피부 타입
export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

// 피부 고민
export type SkinConcern = 'acne' | 'aging' | 'whitening' | 'hydration' | 'pore' | 'redness';

// 체형 타입
export type BodyType =
  | 'Rectangle' | 'Triangle' | 'InvertedTriangle' | 'Hourglass'
  | 'Oval' | 'Diamond' | 'Pear' | 'Athletic';

// 운동 타입
export type WorkoutType = 'toner' | 'builder' | 'burner' | 'mover' | 'flexer';

// 영양제 카테고리
export type SupplementCategory = 'vitamin' | 'mineral' | 'protein' | 'omega' | 'probiotic' | 'collagen' | 'other';

// 화장품 카테고리
export type CosmeticCategory = 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'mask' | 'makeup';

// 가격대
export type PriceRange = 'budget' | 'mid' | 'premium';

// 사용자 기본 정보
export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email?: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
