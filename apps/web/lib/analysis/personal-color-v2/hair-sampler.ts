/**
 * 퍼스널 대비 — 모발 L* 샘플러 + 대비 판정 (ADR-116)
 *
 * @module lib/analysis/personal-color-v2/hair-sampler
 * @description 얼굴 상단 외곽(헤어라인 위) 영역에서 비피부·저채도 픽셀을 샘플링해
 * 모발의 평균 Lab(L*)을 실측한다. 피부 L*(zone-sampler)과의 명도 격차로 개인 대비를 산출.
 *
 * @see docs/adr/ADR-116-personal-contrast.md
 * @see docs/principles/personal-contrast.md
 *
 * 정직성 원칙(ADR-116 결정 2): 샘플 픽셀 수·분산이 신뢰 기준에 미달하면 **null 반환**(추정 금지).
 * zone-sampler.ts의 존 샘플링 패턴을 복제하되 필터를 "비피부 + 저채도"로 바꾼 것.
 */

import type { LabColor } from '@/lib/color';
import { rgbToLab, calculateChroma } from '@/lib/color';
import type { Point3D } from '@/lib/image-engine/types';

// ============================================
// 상수 (신뢰도 기준 · 대비 임계 — 격리해 재보정 여지 확보)
// ============================================

/**
 * 대비 판정 임계 (|L*hair − L*skin|).
 *
 * 0-10 value scale 3/6 경계의 L* 환산(리서치 §2.2). **한국인은 흑발 지배 분포**라
 * 모발-피부 대비가 구조적으로 높게 나오는 경향 → 데이터 축적 후 백분위 재보정 여지.
 * 지금은 고정 임계 + 상수 격리(원리 문서 §2.1).
 */
export const CONTRAST_THRESHOLDS = {
  /** medium 하한 (미만은 low) */
  medium: 25,
  /** high 하한 */
  high: 45,
} as const;

/** 모발 샘플러 신뢰도/필터 기준 (미달 시 미판정) */
export const HAIR_SAMPLER_CONFIG = {
  /** 유효 모발 픽셀 최소 개수 (미만이면 null) */
  minSampleCount: 40,
  /** L* 표준편차 상한 (초과 = 배경/피부 혼입 의심 → null) */
  maxStdDevL: 22,
  /** 저채도 필터 상한 (초과 = 배경/의상 등 → 제외). 흑발~진갈색·회색은 통과 */
  maxChroma: 26,
} as const;

export type ContrastLevel = 'low' | 'medium' | 'high';

/** 모발 Lab 샘플 결과 */
export interface HairLabSample {
  /** 평균 Lab */
  avgLab: LabColor;
  /** 유효 샘플 픽셀 수 */
  sampleCount: number;
  /** L* 표준편차 (균일성 지표) */
  stdDevL: number;
}

// ============================================
// 픽셀 필터 (비피부 판별)
// ============================================

/** 피부색 판별 YCbCr 범위 (zone-sampler와 동일 기준 — 모발은 이 범위 '밖') */
const SKIN_YCBCR_RANGE = {
  yMin: 80,
  cbMin: 85,
  cbMax: 135,
  crMin: 135,
  crMax: 180,
};

/** RGB → YCbCr 피부색 판별 (ITU-R BT.601) */
function isSkinPixel(r: number, g: number, b: number): boolean {
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
// 모발 샘플 존 정의 (헤어라인 위)
// ============================================

/** 모발 샘플 존 (얼굴 너비 비율 기반 — px 좌표계) */
interface HairSampleCenter {
  x: number;
  y: number;
  radius: number;
}

/**
 * 468 랜드마크(px)에서 헤어라인 위 3개 샘플 존을 도출.
 * - 상단중앙: 이마 최상단(10) 위쪽
 * - 좌/우: 관자놀이(127/356) 위쪽 바깥
 *
 * y가 위로 갈수록 작아지는 이미지 좌표계를 가정(표준). 오프셋을 음수로 적용.
 */
function deriveHairCenters(landmarks: Point3D[], faceWidth: number): HairSampleCenter[] {
  const top = landmarks[10];
  const leftTemple = landmarks[127];
  const rightTemple = landmarks[356];

  const up = faceWidth * 0.35;
  const radius = faceWidth * 0.16;

  return [
    { x: top.x, y: top.y - up, radius },
    { x: leftTemple.x, y: leftTemple.y - up * 0.5, radius: radius * 0.9 },
    { x: rightTemple.x, y: rightTemple.y - up * 0.5, radius: radius * 0.9 },
  ];
}

/** 모발 픽셀 누적기 (L 배열 + Lab 합) */
interface HairAccumulator {
  lValues: number[];
  sumL: number;
  sumA: number;
  sumB: number;
}

/**
 * 단일 원형 존에서 모발 픽셀(비피부 + 저채도)을 누적기에 모은다.
 * (sampleHairLab의 인지 복잡도 분리 — 순수 누적)
 */
function collectHairPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  center: HairSampleCenter,
  acc: HairAccumulator
): void {
  const radiusSq = center.radius * center.radius;
  const minX = Math.max(0, Math.floor(center.x - center.radius));
  const maxX = Math.min(width - 1, Math.ceil(center.x + center.radius));
  const minY = Math.max(0, Math.floor(center.y - center.radius));
  const maxY = Math.min(height - 1, Math.ceil(center.y + center.radius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - center.x;
      const dy = y - center.y;
      if (dx * dx + dy * dy > radiusSq) continue;

      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // 필터: 비피부 + 저채도 (배경/의상/피부 제외 → 모발만)
      if (isSkinPixel(r, g, b)) continue;
      const lab = rgbToLab(r, g, b);
      if (calculateChroma(lab) > HAIR_SAMPLER_CONFIG.maxChroma) continue;

      acc.lValues.push(lab.L);
      acc.sumL += lab.L;
      acc.sumA += lab.a;
      acc.sumB += lab.b;
    }
  }
}

// ============================================
// 모발 L* 샘플링 (핵심)
// ============================================

/**
 * 헤어라인 위 영역에서 모발 Lab(L*)을 실측한다.
 *
 * @param pixels - RGBA 픽셀 배열 (ImageData.data)
 * @param width - 이미지 너비(px)
 * @param height - 이미지 높이(px)
 * @param landmarks - 468+ 랜드마크 (px 좌표계, zone-sampler와 동일 규약)
 * @returns 신뢰 가능한 모발 샘플 또는 null (샘플 수·분산 미달 시 미판정)
 */
export function sampleHairLab(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  landmarks: Point3D[]
): HairLabSample | null {
  // 랜드마크·이미지 기본 가드 (throw 대신 미판정 — 대비는 선택적 보조 축)
  if (!landmarks || landmarks.length < 468 || width <= 0 || height <= 0) {
    return null;
  }

  const leftTemple = landmarks[127];
  const rightTemple = landmarks[356];
  const faceWidth = Math.sqrt(
    (rightTemple.x - leftTemple.x) ** 2 + (rightTemple.y - leftTemple.y) ** 2
  );
  if (!Number.isFinite(faceWidth) || faceWidth <= 0) return null;

  const centers = deriveHairCenters(landmarks, faceWidth);

  const acc: HairAccumulator = { lValues: [], sumL: 0, sumA: 0, sumB: 0 };
  for (const center of centers) {
    collectHairPixels(pixels, width, height, center, acc);
  }

  const n = acc.lValues.length;
  if (n < HAIR_SAMPLER_CONFIG.minSampleCount) return null;

  const avgLab: LabColor = { L: acc.sumL / n, a: acc.sumA / n, b: acc.sumB / n };
  const varL = acc.lValues.reduce((s, v) => s + (v - avgLab.L) ** 2, 0) / n;
  const stdDevL = Math.sqrt(varL);

  // 분산 상한 초과 = 배경/피부 혼입 의심 → 미판정 (추정 금지)
  if (stdDevL > HAIR_SAMPLER_CONFIG.maxStdDevL) return null;

  return { avgLab, sampleCount: n, stdDevL };
}

// ============================================
// 대비 판정 (순수 함수)
// ============================================

/**
 * 피부·모발 명도 격차로 개인 대비를 판정한다.
 *
 * `contrast = |L*hair − L*skin|` → 임계(25/45) → low|medium|high.
 * 어느 한쪽 입력이라도 없으면(미측정) **null 반환** — 지어내지 않는다(ADR-116).
 *
 * @param skinL - 피부 L* (zone-sampler weightedAvgLab.L 등)
 * @param hairL - 모발 L* (sampleHairLab().avgLab.L)
 */
export function computePersonalContrast(
  skinL: number | null | undefined,
  hairL: number | null | undefined
): ContrastLevel | null {
  if (skinL == null || hairL == null) return null;
  if (!Number.isFinite(skinL) || !Number.isFinite(hairL)) return null;

  const diff = Math.abs(hairL - skinL);
  if (diff >= CONTRAST_THRESHOLDS.high) return 'high';
  if (diff >= CONTRAST_THRESHOLDS.medium) return 'medium';
  return 'low';
}
