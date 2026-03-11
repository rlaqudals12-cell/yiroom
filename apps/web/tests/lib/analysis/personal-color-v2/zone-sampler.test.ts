/**
 * PC-1 6존 Lab 색상 샘플링 테스트
 *
 * @module tests/lib/analysis/personal-color-v2/zone-sampler
 */

import { describe, it, expect } from 'vitest';
import { sampleZoneLab, sampleAllZonesLab } from '@/lib/analysis/personal-color-v2';
import type { ColorZoneType } from '@/lib/analysis/personal-color-v2';
import type { Point3D } from '@/lib/image-engine/types';

// ============================================================================
// 테스트 헬퍼
// ============================================================================

/** 단색 RGBA 이미지 생성 */
function createSolidImage(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return data;
}

/** 피부색 이미지 (YCbCr 범위 내) */
function createSkinImage(width: number, height: number): Uint8ClampedArray {
  // R=200, G=160, B=130 → 피부색 범위 내
  return createSolidImage(width, height, 200, 160, 130);
}

/** 비피부색 이미지 (파란색) */
function createNonSkinImage(width: number, height: number): Uint8ClampedArray {
  return createSolidImage(width, height, 0, 0, 255);
}

/** 468+ 포인트 랜드마크 (200x200 기준) */
function createMockLandmarks(): Point3D[] {
  const points: Point3D[] = Array.from({ length: 478 }, () => ({
    x: 100,
    y: 100,
    z: 0,
  }));

  // 주요 랜드마크
  points[127] = { x: 40, y: 80, z: 0 }; // leftTemple
  points[356] = { x: 160, y: 80, z: 0 }; // rightTemple
  points[151] = { x: 100, y: 50, z: 0 }; // foreheadHairline (forehead zone)
  points[234] = { x: 55, y: 100, z: 0 }; // leftCheekbone (leftCheek zone)
  points[454] = { x: 145, y: 100, z: 0 }; // rightCheekbone (rightCheek zone)
  points[6] = { x: 100, y: 95, z: 0 }; // noseBridge (nose zone)
  points[152] = { x: 100, y: 155, z: 0 }; // chin (chin zone)
  points[172] = { x: 60, y: 140, z: 0 }; // jawLeft (jawline zone)

  return points;
}

// ============================================================================
// sampleZoneLab
// ============================================================================

describe('sampleZoneLab', () => {
  it('피부색 이미지에서 유효한 Lab 값을 추출한다', () => {
    const pixels = createSkinImage(200, 200);
    const result = sampleZoneLab(pixels, 200, 200, 100, 100, 20, 'leftCheek');

    expect(result.sampleCount).toBeGreaterThan(0);
    expect(result.avgLab.L).toBeGreaterThan(0);
    expect(result.validRatio).toBeGreaterThan(0);
    expect(result.zone).toBe('leftCheek');
  });

  it('비피부색 이미지에서 sampleCount=0을 반환한다', () => {
    const pixels = createNonSkinImage(200, 200);
    const result = sampleZoneLab(pixels, 200, 200, 100, 100, 20, 'forehead');

    expect(result.sampleCount).toBe(0);
    expect(result.validRatio).toBe(0);
    expect(result.avgLab.L).toBe(0);
  });

  it('반경 내 원형 영역만 샘플링한다', () => {
    const pixels = createSkinImage(200, 200);
    const smallRadius = sampleZoneLab(pixels, 200, 200, 100, 100, 5, 'nose');
    const largeRadius = sampleZoneLab(pixels, 200, 200, 100, 100, 20, 'nose');

    // 큰 반경이 더 많은 샘플
    expect(largeRadius.sampleCount).toBeGreaterThan(smallRadius.sampleCount);
  });

  it('이미지 경계를 초과하지 않는다', () => {
    const pixels = createSkinImage(100, 100);
    // 코너 근처 (0,0)에서 큰 반경
    const result = sampleZoneLab(pixels, 100, 100, 5, 5, 20, 'forehead');

    // 에러 없이 동작하고, 일부 샘플 추출
    expect(result.sampleCount).toBeGreaterThanOrEqual(0);
  });

  it('표준편차를 계산한다', () => {
    const pixels = createSkinImage(200, 200);
    const result = sampleZoneLab(pixels, 200, 200, 100, 100, 20, 'chin');

    // 단색 이미지이므로 표준편차가 매우 작아야 함
    expect(result.stdDev.L).toBeLessThan(1);
    expect(result.stdDev.a).toBeLessThan(1);
    expect(result.stdDev.b).toBeLessThan(1);
  });

  it('chroma, hue, ita 파생 지표를 반환한다', () => {
    const pixels = createSkinImage(200, 200);
    const result = sampleZoneLab(pixels, 200, 200, 100, 100, 20, 'leftCheek');

    expect(result.chroma).toBeGreaterThanOrEqual(0);
    expect(typeof result.hue).toBe('number');
    expect(typeof result.ita).toBe('number');
  });
});

// ============================================================================
// sampleAllZonesLab
// ============================================================================

describe('sampleAllZonesLab', () => {
  it('6존 모두 샘플링 결과를 반환한다', () => {
    const pixels = createSkinImage(200, 200);
    const landmarks = createMockLandmarks();
    const result = sampleAllZonesLab(pixels, 200, 200, landmarks);

    const zones: ColorZoneType[] = [
      'forehead',
      'leftCheek',
      'rightCheek',
      'nose',
      'chin',
      'jawline',
    ];
    for (const zone of zones) {
      expect(result.zones[zone]).toBeDefined();
      expect(result.zones[zone].zone).toBe(zone);
    }
  });

  it('피부색 이미지에서 모든 존에 유효한 샘플이 있다', () => {
    const pixels = createSkinImage(200, 200);
    const landmarks = createMockLandmarks();
    const result = sampleAllZonesLab(pixels, 200, 200, landmarks);

    for (const sample of Object.values(result.zones)) {
      expect(sample.sampleCount).toBeGreaterThan(0);
    }
    expect(result.reliability).toBe(1); // 6/6 유효
  });

  it('비피부색 이미지에서 reliability=0을 반환한다', () => {
    const pixels = createNonSkinImage(200, 200);
    const landmarks = createMockLandmarks();
    const result = sampleAllZonesLab(pixels, 200, 200, landmarks);

    expect(result.reliability).toBe(0);
  });

  it('가중 평균 Lab을 계산한다', () => {
    const pixels = createSkinImage(200, 200);
    const landmarks = createMockLandmarks();
    const result = sampleAllZonesLab(pixels, 200, 200, landmarks);

    // 단색이므로 가중 평균 ≈ 각 존 평균
    expect(result.weightedAvgLab.L).toBeGreaterThan(0);
    expect(typeof result.weightedAvgLab.a).toBe('number');
    expect(typeof result.weightedAvgLab.b).toBe('number');
  });

  it('존 간 일관성 점수를 계산한다', () => {
    const pixels = createSkinImage(200, 200);
    const landmarks = createMockLandmarks();
    const result = sampleAllZonesLab(pixels, 200, 200, landmarks);

    // 단색이므로 일관성 높아야 함
    expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
    expect(result.consistencyScore).toBeLessThanOrEqual(100);
  });

  it('단색 이미지에서 높은 일관성 점수', () => {
    const pixels = createSkinImage(200, 200);
    const landmarks = createMockLandmarks();
    const result = sampleAllZonesLab(pixels, 200, 200, landmarks);

    // 모든 존이 같은 색 → 편차 0 → 일관성 100
    expect(result.consistencyScore).toBeGreaterThanOrEqual(90);
  });

  it('468개 미만 랜드마크면 에러', () => {
    const pixels = createSkinImage(200, 200);
    const short: Point3D[] = Array.from({ length: 100 }, () => ({ x: 0, y: 0, z: 0 }));

    expect(() => sampleAllZonesLab(pixels, 200, 200, short)).toThrow('최소 468개');
  });

  it('reliability = 유효 존 수 / 6', () => {
    const pixels = createSkinImage(200, 200);
    const landmarks = createMockLandmarks();
    const result = sampleAllZonesLab(pixels, 200, 200, landmarks);

    const validCount = Object.values(result.zones).filter((z) => z.sampleCount > 0).length;
    expect(result.reliability).toBeCloseTo(validCount / 6, 5);
  });
});

// ============================================================================
// 피부색 필터 간접 검증
// ============================================================================

describe('피부색 필터', () => {
  it('일반 피부색 (R=200, G=160, B=130)은 통과한다', () => {
    const pixels = createSolidImage(50, 50, 200, 160, 130);
    const result = sampleZoneLab(pixels, 50, 50, 25, 25, 10, 'leftCheek');
    expect(result.sampleCount).toBeGreaterThan(0);
  });

  it('밝은 피부색 (R=240, G=210, B=180)은 통과한다', () => {
    const pixels = createSolidImage(50, 50, 240, 210, 180);
    const result = sampleZoneLab(pixels, 50, 50, 25, 25, 10, 'leftCheek');
    expect(result.sampleCount).toBeGreaterThan(0);
  });

  it('순수 빨강 (R=255, G=0, B=0)은 차단된다', () => {
    const pixels = createSolidImage(50, 50, 255, 0, 0);
    const result = sampleZoneLab(pixels, 50, 50, 25, 25, 10, 'leftCheek');
    expect(result.sampleCount).toBe(0);
  });

  it('순수 녹색 (R=0, G=255, B=0)은 차단된다', () => {
    const pixels = createSolidImage(50, 50, 0, 255, 0);
    const result = sampleZoneLab(pixels, 50, 50, 25, 25, 10, 'leftCheek');
    expect(result.sampleCount).toBe(0);
  });
});
