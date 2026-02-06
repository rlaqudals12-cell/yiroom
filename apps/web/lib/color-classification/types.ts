/**
 * 상품 색상 분류 타입 정의
 *
 * @module lib/color-classification/types
 * @see docs/adr/ADR-034-product-color-classification.md
 * @see docs/principles/color-science.md
 */

// SSOT: 색공간 기본 타입은 @/lib/color에서 가져와 로컬 사용 + re-export
import type { RGBColor as _RGBColor, LabColor as _LabColor } from '@/lib/color';
export type RGBColor = _RGBColor;
export type LabColor = _LabColor;

/** 톤 분류 */
export type Tone = 'warm' | 'cool' | 'neutral';

/** 시즌 타입 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** 추출된 색상 정보 */
export interface ExtractedColor {
  /** RGB 값 */
  rgb: RGBColor;
  /** Lab 값 */
  lab: LabColor;
  /** 픽셀 비율 (0-100) */
  percentage: number;
  /** Hex 문자열 */
  hex: string;
}

/** K-means 클러스터 */
export interface ColorCluster {
  /** 중심점 RGB */
  centroid: RGBColor;
  /** 클러스터에 속한 픽셀 수 */
  count: number;
  /** 전체 대비 비율 (0-100) */
  percentage: number;
}

/** 시즌별 매칭 점수 */
export interface SeasonMatchScores {
  spring: number;
  summer: number;
  autumn: number;
  winter: number;
}

/** 색상 분류 결과 */
export interface ColorClassificationResult {
  /** 대표색 */
  dominantColor: ExtractedColor;
  /** 색상 팔레트 (상위 5개) */
  palette: ExtractedColor[];
  /** 톤 분류 */
  tone: Tone;
  /** 시즌별 매칭 점수 (0-100) */
  seasonMatch: SeasonMatchScores;
  /** 분류 신뢰도 (0-100) */
  confidence: number;
}

/** K-means 옵션 */
export interface KMeansOptions {
  /** 클러스터 수 (기본: 5) */
  k?: number;
  /** 반복 횟수 (기본: 10) */
  iterations?: number;
  /** 수렴 임계값 (기본: 1) */
  convergenceThreshold?: number;
}

/** 색상 추출 옵션 */
export interface ColorExtractionOptions {
  /** 이미지 최대 크기 (기본: 256) */
  maxSize?: number;
  /** 배경 필터링 여부 (기본: true) */
  filterBackground?: boolean;
  /** K-means 옵션 */
  kMeans?: KMeansOptions;
}

/** 배경 필터링 옵션 */
export interface BackgroundFilterOptions {
  /** 흰색 임계값 (기본: 240) */
  whiteThreshold?: number;
  /** 검정색 임계값 (기본: 15) */
  blackThreshold?: number;
  /** 회색 범위 (기본: 10) */
  grayRange?: number;
}

/** 시즌별 Lab 범위 */
export interface SeasonLabRange {
  L: [number, number];
  a: [number, number];
  b: [number, number];
}

/** 시즌 범위 정의 */
export const SEASON_LAB_RANGES: Record<Season, SeasonLabRange> = {
  spring: { L: [62, 75], a: [6, 14], b: [18, 28] },
  summer: { L: [58, 72], a: [5, 12], b: [12, 20] },
  autumn: { L: [52, 65], a: [8, 18], b: [20, 32] },
  winter: { L: [48, 62], a: [4, 14], b: [10, 20] },
};

/** 톤 분류 임계값 */
export const TONE_THRESHOLDS = {
  /** 중립 영역 (a*, b* 절댓값) */
  neutralThreshold: 5,
} as const;
