/**
 * 화장품 성분 TypeScript 타입 정의
 * @description EWG 등급, 주의 성분, 피부타입별 분석 타입
 * @version 1.0
 */

// =============================================================================
// EWG 데이터 관련 타입
// =============================================================================

/**
 * EWG 데이터 가용성 수준
 */
export type EWGDataAvailability = 'none' | 'limited' | 'fair' | 'good' | 'robust';

/**
 * EWG 등급 레벨 (점수 기반 분류)
 */
export type EWGLevel = 'low' | 'moderate' | 'high' | 'unknown';

// =============================================================================
// 성분 카테고리 및 기능 타입
// =============================================================================

/**
 * 성분 카테고리
 */
export type IngredientCategory =
  | 'moisturizer' // 보습제
  | 'whitening' // 미백제
  | 'antioxidant' // 항산화제
  | 'soothing' // 진정제
  | 'surfactant' // 계면활성제
  | 'preservative' // 방부제
  | 'sunscreen' // 자외선차단제
  | 'exfoliant' // 각질제거제
  | 'emulsifier' // 유화제
  | 'fragrance' // 향료
  | 'colorant' // 착색제
  | 'other'; // 기타

// =============================================================================
// 피부 타입별 주의 레벨
// =============================================================================

/**
 * 피부타입별 주의 레벨
 */
export type SkinTypeCautionLevel = 'recommended' | 'neutral' | 'caution' | 'avoid';

/**
 * 피부타입별 주의 정보
 */
export interface SkinTypeCaution {
  /** 지성 피부 */
  oily?: SkinTypeCautionLevel;
  /** 건성 피부 */
  dry?: SkinTypeCautionLevel;
  /** 민감성 피부 */
  sensitive?: SkinTypeCautionLevel;
  /** 복합성 피부 */
  combination?: SkinTypeCautionLevel;
  /** 일반 피부 */
  normal?: SkinTypeCautionLevel;
}

// =============================================================================
// 화장품 성분 인터페이스
// =============================================================================

/**
 * 화장품 성분
 */
export interface CosmeticIngredient {
  /** 성분 고유 ID */
  id: string;
  /** 한글 성분명 */
  nameKo: string;
  /** 영문 성분명 */
  nameEn?: string;
  /** INCI 명칭 (국제화장품성분명명법) */
  nameInci?: string;
  /** 별칭/동의어 목록 */
  aliases?: string[];

  /** EWG 점수 (1-10, 낮을수록 안전) */
  ewgScore?: number;
  /** EWG 데이터 가용성 */
  ewgDataAvailability?: EWGDataAvailability;

  /** 성분 카테고리 */
  category: IngredientCategory;
  /** 성분 기능 목록 */
  functions: string[];

  /** 20가지 주의 성분 여부 */
  isCaution20: boolean;
  /** 알레르겐 여부 */
  isAllergen: boolean;
  /** 알레르겐 유형 */
  allergenType?: string;

  /** 피부타입별 주의 정보 */
  skinTypeCaution?: SkinTypeCaution;

  /** 성분 설명 */
  description?: string;
  /** 효능/장점 */
  benefits?: string[];
  /** 우려 사항/단점 */
  concerns?: string[];

  /** 정보 출처 */
  source?: string;
  /** 생성 일시 */
  createdAt: string;
  /** 수정 일시 */
  updatedAt: string;
}

// =============================================================================
// 제품 성분 분석 결과
// =============================================================================

/**
 * EWG 점수 분포
 */
export interface EWGDistribution {
  /** 안전 (1-2점) */
  low: number;
  /** 보통 (3-6점) */
  moderate: number;
  /** 위험 (7-10점) */
  high: number;
  /** 정보 없음 */
  unknown: number;
}

/**
 * 제품 성분 분석 결과
 */
export interface ProductIngredientAnalysis {
  /** 제품 ID */
  productId: string;
  /** 총 성분 개수 */
  totalCount: number;
  /** EWG 점수 분포 */
  ewgDistribution: EWGDistribution;
  /** 주의 성분 목록 */
  cautionIngredients: CosmeticIngredient[];
  /** 알레르겐 성분 목록 */
  allergenIngredients: CosmeticIngredient[];
  /** 기능별 분포 (기능 -> 성분 수) */
  functionBreakdown: Record<string, number>;
  /** 카테고리별 분포 */
  categoryBreakdown: Record<IngredientCategory, number>;
  /** 피부타입별 호환성 ('good' | 'neutral' | 'caution') */
  skinTypeCompatibility: Record<string, 'good' | 'neutral' | 'caution'>;
}

// =============================================================================
// Supabase 테이블 Row 타입
// =============================================================================

/**
 * cosmetic_ingredients 테이블 row
 */
export interface CosmeticIngredientRow {
  id: string;
  name_ko: string;
  name_en: string | null;
  name_inci: string | null;
  aliases: string[] | null;
  ewg_score: number | null;
  ewg_data_availability: string | null;
  category: string;
  functions: string[] | null;
  is_caution_20: boolean;
  is_allergen: boolean;
  allergen_type: string | null;
  skin_type_caution: SkinTypeCaution | null;
  description: string | null;
  benefits: string[] | null;
  concerns: string[] | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * EWG 점수를 등급으로 변환
 * @param score EWG 점수 (1-10)
 * @returns EWG 등급
 */
export function getEWGLevel(score: number | undefined | null): EWGLevel {
  if (score === undefined || score === null) return 'unknown';
  if (score <= 2) return 'low';
  if (score <= 6) return 'moderate';
  return 'high';
}

/**
 * DB row를 프론트엔드 타입으로 변환
 */
export function toCosmeticIngredient(row: CosmeticIngredientRow): CosmeticIngredient {
  return {
    id: row.id,
    nameKo: row.name_ko,
    nameEn: row.name_en ?? undefined,
    nameInci: row.name_inci ?? undefined,
    aliases: row.aliases ?? undefined,
    ewgScore: row.ewg_score ?? undefined,
    ewgDataAvailability: row.ewg_data_availability as EWGDataAvailability | undefined,
    category: row.category as IngredientCategory,
    functions: row.functions ?? [],
    isCaution20: row.is_caution_20,
    isAllergen: row.is_allergen,
    allergenType: row.allergen_type ?? undefined,
    skinTypeCaution: row.skin_type_caution ?? undefined,
    description: row.description ?? undefined,
    benefits: row.benefits ?? undefined,
    concerns: row.concerns ?? undefined,
    source: row.source ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// =============================================================================
// EWG 색상 상수
// =============================================================================

/**
 * EWG 등급별 색상 설정
 */
export const EWG_COLORS = {
  low: {
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-300 dark:border-green-700',
    label: '안전',
  },
  moderate: {
    text: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-300 dark:border-yellow-700',
    label: '보통',
  },
  high: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-700',
    label: '주의',
  },
  unknown: {
    text: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800/30',
    border: 'border-gray-300 dark:border-gray-600',
    label: '미확인',
  },
} as const;

// =============================================================================
// 한글 라벨 상수
// =============================================================================

/**
 * 성분 카테고리 한글 라벨
 */
export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  moisturizer: '보습제',
  whitening: '미백제',
  antioxidant: '항산화제',
  soothing: '진정제',
  surfactant: '계면활성제',
  preservative: '방부제',
  sunscreen: '자외선차단제',
  exfoliant: '각질제거제',
  emulsifier: '유화제',
  fragrance: '향료',
  colorant: '착색제',
  other: '기타',
} as const;

/**
 * EWG 데이터 가용성 한글 라벨
 */
export const EWG_DATA_AVAILABILITY_LABELS: Record<EWGDataAvailability, string> = {
  none: '데이터 없음',
  limited: '제한적',
  fair: '보통',
  good: '양호',
  robust: '충분',
} as const;

/**
 * 피부타입 주의 레벨 한글 라벨
 */
export const SKIN_TYPE_CAUTION_LABELS: Record<SkinTypeCautionLevel, string> = {
  recommended: '추천',
  neutral: '중립',
  caution: '주의',
  avoid: '피하세요',
} as const;

// =============================================================================
// 유틸리티 함수 (라벨/색상 반환)
// =============================================================================

/**
 * EWG 등급 라벨 반환
 */
export function getEWGLevelLabel(level: EWGLevel): string {
  return EWG_COLORS[level].label;
}

/**
 * EWG 등급 색상 클래스 반환
 */
export function getEWGLevelColors(level: EWGLevel) {
  return EWG_COLORS[level];
}

/**
 * 성분 카테고리 라벨 반환
 */
export function getIngredientCategoryLabel(category: IngredientCategory): string {
  return INGREDIENT_CATEGORY_LABELS[category];
}
