/**
 * PC-2: 12-Tone Personal Color Type Definitions
 *
 * @module lib/analysis/personal-color/types
 * @description Lab 색공간 기반 12-Tone 퍼스널컬러 타입 정의
 * @see {@link docs/principles/color-science.md} 12-Tone 분류 기준
 */

// ============================================
// Lab 색공간 타입
// ============================================

/**
 * Lab 색공간 색상값
 * @see docs/principles/color-science.md#lab-색공간-정의
 */
export interface LabColor {
  /** L* (Lightness): 0-100, 검정~흰색 */
  L: number;
  /** a* (Green-Red): -128 ~ +127, 초록~빨강 */
  a: number;
  /** b* (Blue-Yellow): -128 ~ +127, 파랑~노랑 */
  b: number;
}

/**
 * Lab 색공간 파생 지표
 */
export interface LabDerivedMetrics {
  /** Chroma (채도): √(a*² + b*²) */
  chroma: number;
  /** Hue Angle (색상각): atan2(b*, a*) × (180/π) */
  hue: number;
}

// ============================================
// 4계절 시스템 타입
// ============================================

/** 4계절 타입 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** 언더톤 타입 */
export type Undertone = 'warm' | 'cool' | 'neutral';

// ============================================
// 12-Tone 시스템 타입
// ============================================

/**
 * 12-Tone 서브타입
 * @description 각 계절을 3가지 세부 톤으로 분류
 *
 * | 계절 | 서브타입 |
 * |------|---------|
 * | Spring | Light, True, Bright |
 * | Summer | Light, True, Muted |
 * | Autumn | Muted, True, Deep |
 * | Winter | True, Bright, Deep |
 */
export type Subtype = 'light' | 'true' | 'bright' | 'muted' | 'deep';

/**
 * 12-Tone 전체 타입 (계절 + 서브타입 조합)
 */
export type TwelveTone =
  // Spring (웜톤, 밝음)
  | 'light-spring'
  | 'true-spring'
  | 'bright-spring'
  // Summer (쿨톤, 밝음)
  | 'light-summer'
  | 'true-summer'
  | 'muted-summer'
  // Autumn (웜톤, 어두움)
  | 'true-autumn'
  | 'deep-autumn'
  | 'muted-autumn'
  // Winter (쿨톤, 어두움)
  | 'true-winter'
  | 'bright-winter'
  | 'deep-winter';

/**
 * 계절별 허용 서브타입 매핑
 */
export const SEASON_SUBTYPES: Record<Season, Subtype[]> = {
  spring: ['light', 'true', 'bright'],
  summer: ['light', 'true', 'muted'],
  autumn: ['muted', 'true', 'deep'],
  winter: ['true', 'bright', 'deep'],
};

// ============================================
// 12-Tone 분류 결과 타입
// ============================================

/**
 * 12-Tone 분류 결과
 */
export interface TwelveToneResult {
  /** 계절 타입 */
  season: Season;
  /** 서브타입 */
  subtype: Subtype;
  /** 12-Tone 전체 이름 (영문) */
  tone: TwelveTone;
  /** 12-Tone 전체 이름 (한국어) */
  koreanName: string;
  /** 신뢰도 (0-100) */
  confidence: number;
  /** 대표 Lab 값과의 거리 */
  labDistance: number;
  /** 경계 영역 경고 메시지 */
  warnings: string[];
}

/**
 * 언더톤 판정 결과
 */
export interface UndertoneResult {
  /** 언더톤 */
  undertone: Undertone;
  /** 신뢰도 (0-100) */
  confidence: number;
  /** Hue Angle (색상각) */
  hue: number;
  /** 판정 상세 정보 */
  details: string;
}

/**
 * 서브타입 특성 정보
 */
export interface SubtypeCharacteristics {
  /** 12-Tone 이름 */
  tone: TwelveTone;
  /** 계절 */
  season: Season;
  /** 서브타입 */
  subtype: Subtype;
  /** 한국어 이름 */
  koreanName: string;
  /** 영문 표시 이름 */
  displayName: string;
  /** 설명 */
  description: string;
  /** 특징 키워드 */
  keywords: string[];
  /** Lab 범위 */
  labRange: {
    L: { min: number; max: number };
    a: { min: number; max: number };
    b: { min: number; max: number };
  };
  /** 대표 Lab 값 */
  referenceLab: LabColor;
}

// ============================================
// 색상 팔레트 타입
// ============================================

/**
 * 색상 정보
 */
export interface ColorInfo {
  /** HEX 색상 코드 */
  hex: string;
  /** 색상 이름 (한국어) */
  name: string;
  /** Lab 색공간 값 (선택) */
  lab?: LabColor;
}

/**
 * 12-Tone별 색상 팔레트
 */
export interface TonePalette {
  /** 12-Tone */
  tone: TwelveTone;
  /** 베스트 컬러 (10색) */
  bestColors: ColorInfo[];
  /** 피해야 할 컬러 (5색) */
  worstColors: ColorInfo[];
  /** 립 컬러 추천 */
  lipColors: ColorInfo[];
  /** 아이섀도 추천 */
  eyeColors: ColorInfo[];
  /** 블러셔 추천 */
  blushColors: ColorInfo[];
}

/**
 * 색상 호환성 결과
 */
export interface ColorCompatibility {
  /** 테스트 색상 */
  color: ColorInfo;
  /** 호환성 점수 (0-100) */
  score: number;
  /** 호환성 등급 */
  grade: 'perfect' | 'good' | 'neutral' | 'poor' | 'avoid';
  /** 설명 */
  description: string;
}

// ============================================
// 피부 메트릭 타입
// ============================================

/**
 * 피부 측정값 (분류에 사용)
 */
export interface SkinMetrics {
  /** 피부 Lab 평균값 */
  lab: LabColor;
  /** ITA (Individual Typology Angle) */
  ita?: number;
  /** 혈관색 (선택) */
  veinColor?: 'blue' | 'green' | 'mixed';
  /** 홍조 정도 (0-1) */
  redness?: number;
}

// ============================================
// 한국인 특화 조정 상수
// ============================================

/**
 * 한국인 피부 특성 조정값
 * @see docs/principles/color-science.md#한국인-특화-조정
 */
export const KOREAN_ADJUSTMENTS = {
  /** 웜/쿨 기준 b* 임계값 (표준 17 → 한국인 19) */
  warmCoolThresholdB: 19,
  /** 웜/쿨 기준 Hue Angle (표준 58° → 한국인 60°) */
  warmCoolThresholdHue: 60,
  /** 봄/가을 경계 L* (표준 62 → 한국인 64) */
  springAutumnBoundaryL: 64,
  /** 여름/겨울 경계 L* (표준 58 → 한국인 60) */
  summerWinterBoundaryL: 60,
  /** Muted/True 채도 경계 (표준 16 → 한국인 14) */
  mutedTrueChroma: 14,
  /** True/Bright 채도 경계 (표준 22 → 한국인 20) */
  trueBrightChroma: 20,
} as const;
