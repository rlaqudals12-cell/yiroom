/**
 * 퍼스널 대비 실측 오케스트레이터 (ADR-116)
 *
 * @module lib/analysis/personal-color-v2/contrast-measure
 * @description 픽셀 + 랜드마크(px)에서 피부 L*(zone-sampler)과 모발 L*(hair-sampler)을
 * 각각 실측해 개인 대비(low|medium|high)를 산출한다. **순수 함수** — DOM/MediaPipe 의존 없음
 * (호출자가 픽셀·랜드마크를 준비해 넘긴다). 어느 실측이라도 신뢰 미달이면 null(추측 금지).
 *
 * @see docs/adr/ADR-116-personal-contrast.md
 */

import type { Point3D } from '@/lib/image-engine/types';
import { sampleAllZonesLab } from './zone-sampler';
import { sampleHairLab, computePersonalContrast, type ContrastLevel } from './hair-sampler';

/**
 * 픽셀·랜드마크에서 개인 대비를 실측한다.
 *
 * - skin L* = 6존 가중 평균 Lab의 L (zone-sampler)
 * - hair L* = 헤어라인 위 저채도 비피부 픽셀의 평균 L (hair-sampler)
 * - 둘 다 신뢰 가능할 때만 |Lhair − Lskin| 임계로 판정, 아니면 null
 *
 * @param pixels - RGBA 픽셀 배열 (ImageData.data)
 * @param width - 이미지 너비(px)
 * @param height - 이미지 높이(px)
 * @param landmarks - 468+ 랜드마크 (px 좌표계, 샘플러와 동일 규약)
 * @returns 개인 대비 또는 null (샘플 수·분산·랜드마크 미달 시 미판정)
 */
export function deriveContrastFromPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  landmarks: Point3D[]
): ContrastLevel | null {
  // 방어적 가드 — 대비는 선택적 보조 축이므로 예외 대신 미판정으로 흡수
  if (!pixels || !landmarks || landmarks.length < 468 || width <= 0 || height <= 0) {
    return null;
  }

  try {
    // 피부 L* 실측 (6존 가중 평균). 유효 존이 0이면 weightedAvgLab.L = 0 → 미측정 처리
    const zones = sampleAllZonesLab(pixels, width, height, landmarks);
    const skinL = zones.weightedAvgLab.L;
    if (!Number.isFinite(skinL) || skinL <= 0) return null;

    // 모발 L* 실측 (신뢰 미달 시 null)
    const hair = sampleHairLab(pixels, width, height, landmarks);
    if (!hair) return null;

    return computePersonalContrast(skinL, hair.avgLab.L);
  } catch {
    // sampleAllZonesLab는 랜드마크 부족 시 throw — 미판정으로 흡수 (지어내지 않는다)
    return null;
  }
}
