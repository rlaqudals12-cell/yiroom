/**
 * 스킨케어 루틴 타입 정의 (모바일)
 * @description 피부 Phase B: 아침/저녁 스킨케어 루틴 제안 시스템
 * @version 1.0
 * @date 2026-01-11
 */

// 피부 타입 ID
export type SkinTypeId =
  | 'dry'
  | 'oily'
  | 'combination'
  | 'normal'
  | 'sensitive';

// 피부 고민 ID
export type SkinConcernId =
  | 'acne'
  | 'wrinkles'
  | 'pigmentation'
  | 'pores'
  | 'dryness'
  | 'redness'
  | 'dullness';

// 제품 카테고리
export type ProductCategory =
  | 'cleanser'
  | 'toner'
  | 'essence'
  | 'serum'
  | 'ampoule'
  | 'cream'
  | 'sunscreen'
  | 'mask'
  | 'eye_cream'
  | 'oil'
  | 'spot_treatment';

// 카테고리 정보
export interface ProductCategoryInfo {
  id: ProductCategory;
  name: string;
  emoji: string;
  description: string;
}

// 시간대
export type TimeOfDay = 'morning' | 'evening';

// 루틴 개별 단계
export interface RoutineStep {
  order: number;
  category: ProductCategory;
  name: string;
  purpose: string;
  duration?: string;
  tips: string[];
  isOptional: boolean;
}

// 루틴 수정자 (피부 타입별 커스터마이징)
export interface RoutineModifier {
  addCategories: ProductCategory[];
  removeCategories: ProductCategory[];
  adjustTips: Partial<Record<ProductCategory, string[]>>;
  warnings: string[];
}

// 루틴 생성 입력
export interface RoutineGenerationInput {
  skinType: SkinTypeId;
  concerns: SkinConcernId[];
  timeOfDay: TimeOfDay;
  includeOptional?: boolean;
}

// 루틴 생성 결과
export interface RoutineGenerationResult {
  routine: RoutineStep[];
  estimatedTime: number;
  personalizationNote: string;
}

// 피부 분석 데이터 (DB에서 가져오는 형태)
export interface SkinAnalysisData {
  id: string;
  skin_type: SkinTypeId;
  concerns: SkinConcernId[];
  created_at: string;
}
