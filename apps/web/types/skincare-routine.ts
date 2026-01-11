/**
 * 스킨케어 루틴 타입 정의
 * @description 피부 Phase B: 아침/저녁 스킨케어 루틴 제안 시스템
 * @version 1.0
 * @date 2026-01-10
 */

import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';
import type { AffiliateProduct } from './affiliate';

// ================================================
// 제품 카테고리
// ================================================

/** 스킨케어 제품 카테고리 */
export type ProductCategory =
  | 'cleanser' // 클렌저
  | 'toner' // 토너
  | 'essence' // 에센스
  | 'serum' // 세럼
  | 'ampoule' // 앰플
  | 'cream' // 크림
  | 'sunscreen' // 선크림 (아침)
  | 'mask' // 마스크팩 (저녁, 주 2-3회)
  | 'eye_cream' // 아이크림
  | 'oil' // 페이스 오일
  | 'spot_treatment'; // 스팟 케어

/** 카테고리 정보 */
export interface ProductCategoryInfo {
  id: ProductCategory;
  name: string;
  emoji: string;
  description: string;
}

// ================================================
// 루틴 스텝
// ================================================

/** 루틴 개별 단계 */
export interface RoutineStep {
  order: number;
  category: ProductCategory;
  name: string; // "클렌저", "토너" 등
  purpose: string; // "노폐물 제거", "수분 공급" 등
  duration?: string; // "1분", "30초" 등
  tips: string[]; // 사용 팁
  recommendedProducts?: AffiliateProduct[];
  isOptional: boolean;
  // 조건부 루틴 확장 필드
  conditionalBadge?: string; // "건조할 때 2회" 등 조건부 뱃지
  shelfProductId?: string; // 제품함 연동 시 제품 ID
}

/** 시간대 */
export type TimeOfDay = 'morning' | 'evening';

// ================================================
// 스킨케어 루틴
// ================================================

/** 스킨케어 루틴 */
export interface SkincareRoutine {
  id: string;
  userId: string;
  timeOfDay: TimeOfDay;
  steps: RoutineStep[];
  skinType: SkinTypeId;
  concerns: SkinConcernId[];
  createdAt: Date;
  updatedAt: Date;
}

/** 루틴 수정자 (피부 타입별 커스터마이징) */
export interface RoutineModifier {
  addCategories: ProductCategory[];
  removeCategories: ProductCategory[];
  adjustTips: Record<ProductCategory, string[]>;
  warnings: string[];
}

// ================================================
// 루틴 생성 입력/출력
// ================================================

/** 루틴 생성 입력 */
export interface RoutineGenerationInput {
  skinType: SkinTypeId;
  concerns: SkinConcernId[];
  timeOfDay: TimeOfDay;
  includeOptional?: boolean;
}

/** 루틴 생성 결과 */
export interface RoutineGenerationResult {
  routine: RoutineStep[];
  estimatedTime: number; // 분 단위
  personalizationNote: string;
}

// ================================================
// UI 컴포넌트 Props
// ================================================

/** RoutineCard Props */
export interface RoutineCardProps {
  timeOfDay: TimeOfDay;
  steps: RoutineStep[];
  estimatedTime: number;
  isActive?: boolean;
  onSelect?: () => void;
  className?: string;
}

/** RoutineStepList Props */
export interface RoutineStepListProps {
  steps: RoutineStep[];
  showProducts?: boolean;
  onProductClick?: (product: AffiliateProduct) => void;
  className?: string;
}

/** RoutineStepItem Props */
export interface RoutineStepItemProps {
  step: RoutineStep;
  showProducts?: boolean;
  onProductClick?: (product: AffiliateProduct) => void;
  className?: string;
}

/** RoutineTimeline Props */
export interface RoutineTimelineProps {
  steps: RoutineStep[];
  currentStep?: number;
  onStepClick?: (step: RoutineStep) => void;
  className?: string;
}

/** ProductRecommendation Props */
export interface ProductRecommendationProps {
  products: AffiliateProduct[];
  category: ProductCategory;
  onProductClick?: (product: AffiliateProduct) => void;
  className?: string;
}

/** RoutineToggle Props */
export interface RoutineToggleProps {
  activeTime: TimeOfDay;
  onToggle: (time: TimeOfDay) => void;
  morningStepCount: number;
  eveningStepCount: number;
  className?: string;
}

// ================================================
// 유틸리티 함수 타입
// ================================================

/** 피부 타입 라벨 가져오기 */
export type GetSkinTypeLabelFn = (skinType: SkinTypeId) => string;

/** 카테고리 정보 가져오기 */
export type GetCategoryInfoFn = (category: ProductCategory) => ProductCategoryInfo;

/** 소요 시간 계산 */
export type CalculateEstimatedTimeFn = (steps: RoutineStep[]) => number;
