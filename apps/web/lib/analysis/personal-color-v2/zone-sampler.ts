/**
 * PC-1 6존 Lab 색상 샘플링 모듈
 *
 * @module lib/analysis/personal-color-v2/zone-sampler
 * @description 얼굴 랜드마크 기반 6개 존에서 Lab 색상값 추출
 * @see docs/principles/color-science.md
 *
 * 6존 정의:
 * 1. forehead - 이마 (랜드마크 10, 151 기반)
 * 2. leftCheek - 왼쪽 볼 (랜드마크 234 기반)
 * 3. rightCheek - 오른쪽 볼 (랜드마크 454 기반)
 * 4. nose - 코 (랜드마크 1, 6 기반)
 * 5. chin - 턱 (랜드마크 152 기반)
 * 6. jawline - 턱선 (랜드마크 172, 397 기반)
 */

import type { LabColor } from '@/lib/color';
import { rgbToLab, calculateChroma, calculateHue, calculateITA } from '@/lib/color';
import type { Point3D } from '@/lib/image-engine/types';

// ============================================
// 타입 정의
// ============================================

/** 색상 샘플링 존 타입 */
export type ColorZoneType = 'forehead' | 'leftCheek' | 'rightCheek' | 'nose' | 'chin' | 'jawline';

/** 존별 Lab 샘플 결과 */
export interface ZoneLabSample {
  zone: ColorZoneType;
  /** 평균 Lab 색상 */
  avgLab: LabColor;
  /** Lab 표준편차 (균일성 지표) */
  stdDev: { L: number; a: number; b: number };
  /** 샘플 픽셀 수 */
  sampleCount: number;
  /** 유효 샘플 비율 (피부색 필터 통과율) */
  validRatio: number;
  /** 파생 지표 */
  chroma: number;
  hue: number;
  ita: number;
}

/** 6존 Lab 샘플링 결과 */
export interface ZoneLabSamplingResult {
  zones: Record<ColorZoneType, ZoneLabSample>;
  /** 6존 가중 평균 Lab (PC-1 분류용) */
  weightedAvgLab: LabColor;
  /** 존 간 색상 일관성 (0-100, 높을수록 일관) */
  consistencyScore: number;
  /** 신뢰도 (유효 존 수 / 6) */
  reliability: number;
}

/** 존 정의 (랜드마크 인덱스 기반) */
interface ZoneDefinition {
  zone: ColorZoneType;
  /** 중심 랜드마크 인덱스 */
  centerIndex: number;
  /** 얼굴 너비 대비 반경 비율 */
  radiusRatio: number;
  /** 가중치 (PC-1 분류 시 기여도) */
  weight: number;
}

// ============================================
// 존 정의 상수
// ============================================

/** 6존 정의: 랜드마크 인덱스 + 반경 + 가중치 */
const ZONE_DEFINITIONS: ZoneDefinition[] = [
  { zone: 'forehead', centerIndex: 151, radiusRatio: 0.12, weight: 0.15 },
  { zone: 'leftCheek', centerIndex: 234, radiusRatio: 0.1, weight: 0.25 },
  { zone: 'rightCheek', centerIndex: 454, radiusRatio: 0.1, weight: 0.25 },
  { zone: 'nose', centerIndex: 6, radiusRatio: 0.06, weight: 0.1 },
  { zone: 'chin', centerIndex: 152, radiusRatio: 0.08, weight: 0.1 },
  { zone: 'jawline', centerIndex: 172, radiusRatio: 0.08, weight: 0.15 },
];

/** 피부색 판별 YCbCr 범위 */
const SKIN_YCBCR_RANGE = {
  yMin: 80,
  cbMin: 85,
  cbMax: 135,
  crMin: 135,
  crMax: 180,
};

// ============================================
// 피부색 필터 유틸리티
// ============================================

/** RGB → YCbCr 피부색 판별 */
function isSkinPixel(r: number, g: number, b: number): boolean {
  // ITU-R BT.601
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.169 * r - 0.331 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.419 * g - 0.081 * b;

  return (
    y >= SKIN_YCBCR_RANGE.yMin &&
    cb >= SKIN_YCBCR_RANGE.cbMin &&
    cb <= SKIN_YCBCR_RANGE.cbMax &&
    cr >= SKIN_YCBCR_RANGE.crMin &&
    cr <= SKIN_YCBCR_RANGE.crMax
  );
}

// ============================================
// 존 샘플링 핵심 함수
// ============================================

/**
 * 단일 존에서 Lab 색상 샘플 추출
 *
 * @param pixels - RGBA 픽셀 배열 (ImageData.data)
 * @param width - 이미지 너비
 * @param height - 이미지 높이
 * @param centerX - 존 중심 X (px)
 * @param centerY - 존 중심 Y (px)
 * @param radius - 존 반경 (px)
 * @param zone - 존 타입
 */
export function sampleZoneLab(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  zone: ColorZoneType
): ZoneLabSample {
  const radiusSq = radius * radius;
  const labValues: { L: number; a: number; b: number }[] = [];

  // 바운딩 박스 내 원형 영역 스캔
  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(width - 1, Math.ceil(centerX + radius));
  const minY = Math.max(0, Math.floor(centerY - radius));
  const maxY = Math.min(height - 1, Math.ceil(centerY + radius));

  let totalPixels = 0;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      // 원형 마스크
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy > radiusSq) continue;
      totalPixels++;

      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // 피부색 필터
      if (!isSkinPixel(r, g, b)) continue;

      const lab = rgbToLab(r, g, b);
      labValues.push(lab);
    }
  }

  // 유효 샘플이 없으면 기본값
  if (labValues.length === 0) {
    return {
      zone,
      avgLab: { L: 0, a: 0, b: 0 },
      stdDev: { L: 0, a: 0, b: 0 },
      sampleCount: 0,
      validRatio: 0,
      chroma: 0,
      hue: 0,
      ita: 0,
    };
  }

  // 평균 Lab
  const n = labValues.length;
  const sumL = labValues.reduce((s, v) => s + v.L, 0);
  const sumA = labValues.reduce((s, v) => s + v.a, 0);
  const sumB = labValues.reduce((s, v) => s + v.b, 0);
  const avgLab: LabColor = { L: sumL / n, a: sumA / n, b: sumB / n };

  // 표준편차
  const varL = labValues.reduce((s, v) => s + (v.L - avgLab.L) ** 2, 0) / n;
  const varA = labValues.reduce((s, v) => s + (v.a - avgLab.a) ** 2, 0) / n;
  const varB = labValues.reduce((s, v) => s + (v.b - avgLab.b) ** 2, 0) / n;

  return {
    zone,
    avgLab,
    stdDev: { L: Math.sqrt(varL), a: Math.sqrt(varA), b: Math.sqrt(varB) },
    sampleCount: n,
    validRatio: totalPixels > 0 ? n / totalPixels : 0,
    chroma: calculateChroma(avgLab),
    hue: calculateHue(avgLab),
    ita: calculateITA(avgLab),
  };
}

// ============================================
// 6존 통합 샘플링
// ============================================

/**
 * 468-point 랜드마크에서 6존 Lab 색상 샘플링
 *
 * @param pixels - RGBA 픽셀 배열 (ImageData.data)
 * @param width - 이미지 너비
 * @param height - 이미지 높이
 * @param landmarks - 468+ 포인트 랜드마크 배열 (px 좌표)
 * @returns 6존 Lab 샘플링 결과
 */
export function sampleAllZonesLab(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  landmarks: Point3D[]
): ZoneLabSamplingResult {
  if (landmarks.length < 468) {
    throw new Error(`최소 468개 랜드마크가 필요합니다 (현재: ${landmarks.length})`);
  }

  // 얼굴 너비 기준 (temple 간 거리)
  const leftTemple = landmarks[127];
  const rightTemple = landmarks[356];
  const faceWidth = Math.sqrt(
    (rightTemple.x - leftTemple.x) ** 2 + (rightTemple.y - leftTemple.y) ** 2
  );

  // 각 존 샘플링
  const zones = {} as Record<ColorZoneType, ZoneLabSample>;

  for (const def of ZONE_DEFINITIONS) {
    const center = landmarks[def.centerIndex];
    const radius = faceWidth * def.radiusRatio;

    zones[def.zone] = sampleZoneLab(pixels, width, height, center.x, center.y, radius, def.zone);
  }

  // 가중 평균 Lab 계산 (유효 존만)
  const weightedAvgLab = calculateWeightedAvgLab(zones);

  // 존 간 일관성 점수
  const consistencyScore = calculateConsistencyScore(zones);

  // 신뢰도: 유효 존(sampleCount > 0) 비율
  const validZoneCount = Object.values(zones).filter((z) => z.sampleCount > 0).length;
  const reliability = validZoneCount / 6;

  return {
    zones,
    weightedAvgLab,
    consistencyScore,
    reliability,
  };
}

/**
 * 가중 평균 Lab 계산
 * 볼 영역(leftCheek, rightCheek)에 높은 가중치 (메이크업 영향 적음)
 */
function calculateWeightedAvgLab(zones: Record<ColorZoneType, ZoneLabSample>): LabColor {
  let totalWeight = 0;
  let wL = 0;
  let wA = 0;
  let wB = 0;

  for (const def of ZONE_DEFINITIONS) {
    const sample = zones[def.zone];
    if (sample.sampleCount === 0) continue;

    // 유효 비율로 가중치 보정
    const effectiveWeight = def.weight * sample.validRatio;
    totalWeight += effectiveWeight;
    wL += sample.avgLab.L * effectiveWeight;
    wA += sample.avgLab.a * effectiveWeight;
    wB += sample.avgLab.b * effectiveWeight;
  }

  if (totalWeight === 0) {
    return { L: 0, a: 0, b: 0 };
  }

  return { L: wL / totalWeight, a: wA / totalWeight, b: wB / totalWeight };
}

/**
 * 존 간 색상 일관성 점수 (0-100)
 * 6존 Lab 값의 표준편차가 작을수록 높은 점수
 */
function calculateConsistencyScore(zones: Record<ColorZoneType, ZoneLabSample>): number {
  const validZones = Object.values(zones).filter((z) => z.sampleCount > 0);
  if (validZones.length < 2) return 0;

  const avgL = validZones.reduce((s, z) => s + z.avgLab.L, 0) / validZones.length;
  const avgA = validZones.reduce((s, z) => s + z.avgLab.a, 0) / validZones.length;
  const avgB = validZones.reduce((s, z) => s + z.avgLab.b, 0) / validZones.length;

  // 존 간 Lab 편차
  const varL = validZones.reduce((s, z) => s + (z.avgLab.L - avgL) ** 2, 0) / validZones.length;
  const varA = validZones.reduce((s, z) => s + (z.avgLab.a - avgA) ** 2, 0) / validZones.length;
  const varB = validZones.reduce((s, z) => s + (z.avgLab.b - avgB) ** 2, 0) / validZones.length;

  // 총 편차 (Lab 공간 유클리드 거리)
  const totalStdDev = Math.sqrt(varL + varA + varB);

  // 편차 10 이하면 100점, 30 이상이면 0점 (선형 보간)
  const score = Math.max(0, Math.min(100, Math.round((1 - totalStdDev / 30) * 100)));
  return score;
}
