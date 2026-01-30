/**
 * 피부 분석 타입 정의
 *
 * @module lib/analysis/skin/types
 * @description 6-Zone 피부 분석 타입 (S-2 고도화)
 * @see {@link docs/principles/skin-physiology.md} 6-Zone 정의
 */

import type { LabColor } from '@/lib/shared/integration-types';

// =============================================================================
// 6-Zone 타입 정의
// =============================================================================

/**
 * 6개 피부 분석 존
 *
 * @see docs/principles/skin-physiology.md Section 1.2 피지선 분포
 *
 * 피지선 밀도 (glands/cm²):
 * - forehead: 400-900 (최다 밀집)
 * - nose: 높음 (변동)
 * - leftCheek/rightCheek: 낮음 (건조 경향)
 * - chin: 중간 (호르몬 영향)
 * - eyeArea: 민감, 얇은 피부
 */
export type SkinZone =
  | 'forehead'     // 이마: 피지선 밀도 높음, T-zone
  | 'nose'         // 코: 피지선 최고 밀도, T-zone
  | 'leftCheek'    // 왼쪽 볼: U-zone, 건조 경향
  | 'rightCheek'   // 오른쪽 볼: U-zone, 건조 경향
  | 'chin'         // 턱: 혼합, 호르몬 영향
  | 'eyeArea';     // 눈가: 민감, 얇은 피부

/**
 * 모공 크기 분류
 *
 * @see docs/principles/skin-physiology.md Section 3.1
 * - small: 직경 <40μm
 * - medium: 직경 40-70μm
 * - large: 직경 >70μm
 */
export type PoreSize = 'small' | 'medium' | 'large';

/**
 * 피부 고민 유형
 */
export type ZoneConcern =
  | 'oiliness'       // 번들거림
  | 'dryness'        // 건조함
  | 'redness'        // 붉은기
  | 'pores'          // 모공
  | 'wrinkles'       // 주름
  | 'sensitivity'    // 민감
  | 'blackheads'     // 블랙헤드
  | 'acne'           // 여드름
  | 'pigmentation';  // 색소침착

/**
 * 존별 분석 메트릭
 *
 * @description 각 존에서 측정되는 피부 상태 지표
 */
export interface ZoneMetrics {
  /** 존 식별자 */
  zone: SkinZone;

  /** 유분도 (0-100) - docs/principles/skin-physiology.md Section 2.3 */
  oiliness: number;

  /** 수분도 (0-100) - Roughness와 역상관 */
  hydration: number;

  /** 민감도 (0-100) - Lab a* 기반 붉은기 */
  sensitivity: number;

  /** 모공 크기 */
  poreSize: PoreSize;

  /** 특이사항/고민 목록 */
  concerns: ZoneConcern[];

  /** 평균 Lab 색상값 */
  avgLabColor: LabColor;

  /** 분석된 픽셀 수 */
  sampleCount: number;
}

/**
 * 6-Zone 통합 분석 결과
 */
export interface SixZoneAnalysis {
  /** 각 존별 분석 결과 */
  zones: Record<SkinZone, ZoneMetrics>;

  /** T-zone 평균 (이마 + 코) */
  tZoneAverage: {
    oiliness: number;
    hydration: number;
    sensitivity: number;
  };

  /** U-zone 평균 (양 볼 + 턱) */
  uZoneAverage: {
    oiliness: number;
    hydration: number;
    sensitivity: number;
  };

  /** 전체 피부 타입 */
  overallSkinType: SkinType;

  /** 피부 타입 판정 근거 */
  skinTypeRationale: string;

  /** 분석 신뢰도 (0-100) */
  confidence: number;

  /** 분석 시각 (ISO 8601) */
  analyzedAt: string;
}

/**
 * 피부 타입 (5가지)
 */
export type SkinType =
  | 'dry'         // 건성
  | 'normal'      // 중성
  | 'oily'        // 지성
  | 'combination' // 복합성
  | 'sensitive';  // 민감성

/**
 * 6-Zone 얼굴 영역 좌표
 *
 * @description 기존 FaceRegion 확장 (eyeArea 추가)
 */
export interface SixZoneFaceRegion {
  /** 이마 영역 */
  forehead: BoundingBox;
  /** 코 영역 */
  nose: BoundingBox;
  /** 왼쪽 볼 영역 */
  leftCheek: BoundingBox;
  /** 오른쪽 볼 영역 */
  rightCheek: BoundingBox;
  /** 턱 영역 */
  chin: BoundingBox;
  /** 눈가 영역 */
  eyeArea: BoundingBox;
}

/**
 * 영역 경계 상자
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// 존별 특성 상수
// =============================================================================

/**
 * 존별 피지선 밀도 (glands/cm²)
 *
 * @see docs/principles/skin-physiology.md Section 1.2
 */
export const ZONE_SEBUM_DENSITY: Record<SkinZone, { min: number; max: number }> = {
  forehead: { min: 400, max: 900 },  // 최다 밀집
  nose: { min: 300, max: 800 },       // 변동 크지만 높음
  leftCheek: { min: 50, max: 200 },   // 낮음
  rightCheek: { min: 50, max: 200 },  // 낮음
  chin: { min: 200, max: 500 },       // 중간
  eyeArea: { min: 20, max: 100 },     // 매우 낮음
};

/**
 * 존별 유분도 임계값 (0-100 스케일)
 *
 * @see docs/principles/skin-physiology.md Section 2.3
 */
export const ZONE_OILINESS_THRESHOLDS: Record<SkinZone, { dry: number; oily: number }> = {
  forehead: { dry: 35, oily: 65 },   // T-zone: 높은 임계값
  nose: { dry: 35, oily: 65 },       // T-zone
  leftCheek: { dry: 25, oily: 55 },  // U-zone: 낮은 임계값
  rightCheek: { dry: 25, oily: 55 }, // U-zone
  chin: { dry: 30, oily: 60 },       // 중간
  eyeArea: { dry: 20, oily: 50 },    // 민감 영역
};

/**
 * 존별 민감도 임계값 (Lab a* 기반)
 *
 * @see docs/principles/skin-physiology.md Section 10.1
 */
export const ZONE_SENSITIVITY_THRESHOLDS: Record<SkinZone, { normal: number; high: number }> = {
  forehead: { normal: 12, high: 18 },
  nose: { normal: 13, high: 18 },
  leftCheek: { normal: 12, high: 15 },   // 볼은 민감도 낮은 기준
  rightCheek: { normal: 12, high: 15 },
  chin: { normal: 12, high: 16 },
  eyeArea: { normal: 10, high: 14 },     // 눈가는 더 민감
};
