/**
 * S-1 존별 피부 텍스처 분석 테스트
 *
 * @module tests/lib/analysis/skin-v2/zone-texture
 */

import { describe, it, expect } from 'vitest';
import {
  rgbaToGrayscale,
  cropZoneGrayscale,
  analyzeZoneTexture,
  analyzeAllZonesTexture,
} from '@/lib/analysis/skin-v2';
import type { ZoneRegion } from '@/lib/analysis/skin-v2/zone-extractor';
import type { SkinZoneType } from '@/lib/analysis/skin-v2';

// ============================================================================
// 헬퍼
// ============================================================================

/** 단색 RGBA 이미지 */
function createSolidRGBA(
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

/** 그래디언트 그레이스케일 (좌→우 밝기 변화) */
function createGradientGray(width: number, height: number): Uint8Array {
  const gray = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      gray[y * width + x] = Math.round((x / (width - 1)) * 255);
    }
  }
  return gray;
}

/** 노이즈 그레이스케일 */
function createNoisyGray(width: number, height: number, seed: number = 42): Uint8Array {
  const gray = new Uint8Array(width * height);
  let state = seed;
  for (let i = 0; i < width * height; i++) {
    // 간단한 PRNG
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    gray[i] = state % 256;
  }
  return gray;
}

/** 중앙 존 영역 생성 */
function createCenterZone(
  zone: SkinZoneType,
  imgWidth: number,
  imgHeight: number,
  radiusRatio: number = 0.2
): ZoneRegion {
  const cx = Math.round(imgWidth / 2);
  const cy = Math.round(imgHeight / 2);
  const r = Math.round(Math.min(imgWidth, imgHeight) * radiusRatio);
  return {
    zone,
    center: { x: cx, y: cy },
    radius: r,
    boundingBox: { x: cx - r, y: cy - r, width: r * 2, height: r * 2 },
  };
}

// ============================================================================
// rgbaToGrayscale
// ============================================================================

describe('rgbaToGrayscale', () => {
  it('단색 이미지를 올바른 밝기로 변환한다', () => {
    const rgba = createSolidRGBA(10, 10, 200, 100, 50);
    const gray = rgbaToGrayscale(rgba, 10, 10);

    expect(gray.length).toBe(100);
    // ITU-R BT.601: 0.299*200 + 0.587*100 + 0.114*50 = 59.8 + 58.7 + 5.7 = 124.2
    const expected = Math.round(0.299 * 200 + 0.587 * 100 + 0.114 * 50);
    expect(gray[0]).toBe(expected);
  });

  it('검은색은 0, 흰색은 255', () => {
    const black = rgbaToGrayscale(createSolidRGBA(5, 5, 0, 0, 0), 5, 5);
    const white = rgbaToGrayscale(createSolidRGBA(5, 5, 255, 255, 255), 5, 5);

    expect(black[0]).toBe(0);
    expect(white[0]).toBe(255);
  });
});

// ============================================================================
// cropZoneGrayscale
// ============================================================================

describe('cropZoneGrayscale', () => {
  it('중앙 존 영역을 올바르게 크롭한다', () => {
    const gray = new Uint8Array(100 * 100).fill(128);
    const zone = createCenterZone('forehead', 100, 100, 0.15);

    const result = cropZoneGrayscale(gray, 100, 100, zone);

    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.pixelCount).toBeGreaterThan(0);
  });

  it('원형 마스크가 적용된다 (사각형보다 적은 픽셀)', () => {
    const gray = new Uint8Array(100 * 100).fill(128);
    const zone = createCenterZone('nose', 100, 100, 0.2);

    const result = cropZoneGrayscale(gray, 100, 100, zone);
    const totalCropPixels = result.width * result.height;

    // 원형 마스크: 실제 픽셀 < 전체 크롭 영역 (π/4 ≈ 0.785)
    expect(result.pixelCount).toBeLessThan(totalCropPixels);
    expect(result.pixelCount).toBeGreaterThan(totalCropPixels * 0.5);
  });

  it('이미지 경계를 초과하지 않는다', () => {
    const gray = new Uint8Array(50 * 50).fill(128);
    // 코너 근처 존
    const zone: ZoneRegion = {
      zone: 'chin',
      center: { x: 5, y: 5 },
      radius: 20,
      boundingBox: { x: -15, y: -15, width: 40, height: 40 },
    };

    const result = cropZoneGrayscale(gray, 50, 50, zone);

    expect(result.width).toBeLessThanOrEqual(50);
    expect(result.height).toBeLessThanOrEqual(50);
    expect(result.pixelCount).toBeGreaterThanOrEqual(0);
  });

  it('존이 완전히 이미지 밖이면 0픽셀', () => {
    const gray = new Uint8Array(50 * 50).fill(128);
    const zone: ZoneRegion = {
      zone: 'forehead',
      center: { x: -100, y: -100 },
      radius: 10,
      boundingBox: { x: -110, y: -110, width: 20, height: 20 },
    };

    const result = cropZoneGrayscale(gray, 50, 50, zone);

    expect(result.pixelCount).toBe(0);
  });
});

// ============================================================================
// analyzeZoneTexture
// ============================================================================

describe('analyzeZoneTexture', () => {
  it('단색 존에서 높은 텍스처 점수를 반환한다', () => {
    const gray = new Uint8Array(100 * 100).fill(128);
    const zone = createCenterZone('leftCheek', 100, 100, 0.3);

    const result = analyzeZoneTexture(gray, 100, 100, zone);

    expect(result.zone).toBe('leftCheek');
    expect(result.texture.textureScore).toBeGreaterThanOrEqual(50);
    expect(result.pixelCount).toBeGreaterThan(0);
  });

  it('노이즈 존에서 낮은 텍스처 점수를 반환한다', () => {
    const noisy = createNoisyGray(100, 100);
    const zone = createCenterZone('forehead', 100, 100, 0.3);

    const result = analyzeZoneTexture(noisy, 100, 100, zone);

    // 노이즈 → 높은 contrast/entropy → 낮은 점수
    expect(result.texture.textureScore).toBeLessThan(80);
  });

  it('너무 작은 존은 기본값을 반환한다', () => {
    const gray = new Uint8Array(100 * 100).fill(128);
    const zone: ZoneRegion = {
      zone: 'eyeArea',
      center: { x: 50, y: 50 },
      radius: 1, // 매우 작은 반경
      boundingBox: { x: 49, y: 49, width: 2, height: 2 },
    };

    const result = analyzeZoneTexture(gray, 100, 100, zone);

    expect(result.texture.textureScore).toBe(100); // 기본값
    expect(result.texture.poreScore).toBe(100);
  });

  it('GLCM과 LBP 결과를 모두 포함한다', () => {
    const gray = createGradientGray(100, 100);
    const zone = createCenterZone('rightCheek', 100, 100, 0.3);

    const result = analyzeZoneTexture(gray, 100, 100, zone);

    expect(result.texture.glcm).toBeDefined();
    expect(result.texture.glcm.contrast).toBeGreaterThanOrEqual(0);
    expect(result.texture.glcm.homogeneity).toBeGreaterThanOrEqual(0);
    expect(result.texture.lbp).toBeDefined();
    expect(result.texture.lbp.uniformPatternRatio).toBeGreaterThanOrEqual(0);
  });

  it('모공/주름/결 점수가 0-100 범위', () => {
    const gray = createGradientGray(100, 100);
    const zone = createCenterZone('nose', 100, 100, 0.25);

    const result = analyzeZoneTexture(gray, 100, 100, zone);

    expect(result.texture.poreScore).toBeGreaterThanOrEqual(0);
    expect(result.texture.poreScore).toBeLessThanOrEqual(100);
    expect(result.texture.wrinkleScore).toBeGreaterThanOrEqual(0);
    expect(result.texture.wrinkleScore).toBeLessThanOrEqual(100);
    expect(result.texture.textureScore).toBeGreaterThanOrEqual(0);
    expect(result.texture.textureScore).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// analyzeAllZonesTexture
// ============================================================================

describe('analyzeAllZonesTexture', () => {
  it('여러 존을 한 번에 분석한다', () => {
    const gray = new Uint8Array(200 * 200).fill(128);
    const zones: Partial<Record<SkinZoneType, ZoneRegion>> = {
      forehead: createCenterZone('forehead', 200, 200, 0.1),
      leftCheek: {
        zone: 'leftCheek',
        center: { x: 60, y: 100 },
        radius: 20,
        boundingBox: { x: 40, y: 80, width: 40, height: 40 },
      },
      rightCheek: {
        zone: 'rightCheek',
        center: { x: 140, y: 100 },
        radius: 20,
        boundingBox: { x: 120, y: 80, width: 40, height: 40 },
      },
    };

    const result = analyzeAllZonesTexture(gray, 200, 200, zones);

    expect(result.analyzedCount).toBe(3);
    expect(result.zones.forehead).toBeDefined();
    expect(result.zones.leftCheek).toBeDefined();
    expect(result.zones.rightCheek).toBeDefined();
  });

  it('단색 이미지에서 낮은 텍스처 편차', () => {
    const gray = new Uint8Array(200 * 200).fill(128);
    const zones: Partial<Record<SkinZoneType, ZoneRegion>> = {
      forehead: createCenterZone('forehead', 200, 200, 0.1),
      nose: {
        zone: 'nose',
        center: { x: 100, y: 120 },
        radius: 15,
        boundingBox: { x: 85, y: 105, width: 30, height: 30 },
      },
    };

    const result = analyzeAllZonesTexture(gray, 200, 200, zones);

    // 동일한 색 → 텍스처 편차 매우 낮음 (원형 마스크 edge 효과로 미세 차이 가능)
    expect(result.textureVariance).toBeLessThanOrEqual(5);
  });

  it('빈 존 맵은 0개 분석', () => {
    const gray = new Uint8Array(100 * 100).fill(128);

    const result = analyzeAllZonesTexture(gray, 100, 100, {});

    expect(result.analyzedCount).toBe(0);
    expect(result.textureVariance).toBe(0);
  });

  it('7존 전체 분석 가능', () => {
    const gray = new Uint8Array(300 * 300).fill(100);
    const allZones: Partial<Record<SkinZoneType, ZoneRegion>> = {
      forehead: {
        zone: 'forehead',
        center: { x: 150, y: 60 },
        radius: 30,
        boundingBox: { x: 120, y: 30, width: 60, height: 60 },
      },
      nose: {
        zone: 'nose',
        center: { x: 150, y: 120 },
        radius: 15,
        boundingBox: { x: 135, y: 105, width: 30, height: 30 },
      },
      leftCheek: {
        zone: 'leftCheek',
        center: { x: 90, y: 130 },
        radius: 25,
        boundingBox: { x: 65, y: 105, width: 50, height: 50 },
      },
      rightCheek: {
        zone: 'rightCheek',
        center: { x: 210, y: 130 },
        radius: 25,
        boundingBox: { x: 185, y: 105, width: 50, height: 50 },
      },
      chin: {
        zone: 'chin',
        center: { x: 150, y: 200 },
        radius: 20,
        boundingBox: { x: 130, y: 180, width: 40, height: 40 },
      },
      eyeArea: {
        zone: 'eyeArea',
        center: { x: 150, y: 90 },
        radius: 12,
        boundingBox: { x: 138, y: 78, width: 24, height: 24 },
      },
      lipArea: {
        zone: 'lipArea',
        center: { x: 150, y: 170 },
        radius: 15,
        boundingBox: { x: 135, y: 155, width: 30, height: 30 },
      },
    };

    const result = analyzeAllZonesTexture(gray, 300, 300, allZones);

    expect(result.analyzedCount).toBe(7);
    for (const zoneResult of Object.values(result.zones)) {
      expect(zoneResult!.texture.textureScore).toBeGreaterThanOrEqual(0);
      expect(zoneResult!.texture.textureScore).toBeLessThanOrEqual(100);
    }
  });

  it('textureVariance가 0-100 범위', () => {
    const noisy = createNoisyGray(200, 200, 123);
    const zones: Partial<Record<SkinZoneType, ZoneRegion>> = {
      forehead: {
        zone: 'forehead',
        center: { x: 100, y: 40 },
        radius: 25,
        boundingBox: { x: 75, y: 15, width: 50, height: 50 },
      },
      chin: {
        zone: 'chin',
        center: { x: 100, y: 160 },
        radius: 25,
        boundingBox: { x: 75, y: 135, width: 50, height: 50 },
      },
    };

    const result = analyzeAllZonesTexture(noisy, 200, 200, zones);

    expect(result.textureVariance).toBeGreaterThanOrEqual(0);
    expect(result.textureVariance).toBeLessThanOrEqual(100);
  });
});
