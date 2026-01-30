/**
 * T-zone / U-zone 분석 테스트
 *
 * @see docs/principles/skin-physiology.md
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeTZone,
  analyzeUZone,
  combineZoneAnalysis,
  SEBUM_THRESHOLDS,
  type FaceRegion,
  type ZoneAnalysis,
} from '@/lib/analysis/skin';

// Mock ImageData 생성 헬퍼
function createMockImageData(
  width: number,
  height: number,
  rgbValues: [number, number, number]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = rgbValues[0];     // R
    data[i * 4 + 1] = rgbValues[1]; // G
    data[i * 4 + 2] = rgbValues[2]; // B
    data[i * 4 + 3] = 255;          // A
  }
  return { data, width, height, colorSpace: 'srgb' };
}

// Mock FaceRegion 생성 헬퍼
function createMockFaceRegion(): FaceRegion {
  return {
    forehead: { x: 50, y: 20, width: 100, height: 40 },
    nose: { x: 80, y: 60, width: 40, height: 60 },
    leftCheek: { x: 20, y: 80, width: 50, height: 50 },
    rightCheek: { x: 130, y: 80, width: 50, height: 50 },
    chin: { x: 70, y: 150, width: 60, height: 40 },
  };
}

describe('SEBUM_THRESHOLDS', () => {
  it('should have correct T-zone thresholds', () => {
    expect(SEBUM_THRESHOLDS.T_ZONE.DRY).toBe(70);
    expect(SEBUM_THRESHOLDS.T_ZONE.NORMAL).toBe(150);
  });

  it('should have correct U-zone thresholds', () => {
    expect(SEBUM_THRESHOLDS.U_ZONE.DRY).toBe(30);
    expect(SEBUM_THRESHOLDS.U_ZONE.NORMAL).toBe(70);
  });
});

describe('analyzeTZone', () => {
  it('should return T-zone analysis result', () => {
    // 밝은 피부색 (R=220, G=200, B=180) -> 높은 L* 값
    const imageData = createMockImageData(200, 200, [220, 200, 180]);
    const faceRegion = createMockFaceRegion();

    const result = analyzeTZone(imageData, faceRegion);

    expect(result.zoneType).toBe('T-zone');
    expect(result.avgLabColor.L).toBeGreaterThan(0);
    expect(result.sampleCount).toBeGreaterThan(0);
    expect(['dry', 'normal', 'oily']).toContain(result.skinCondition);
  });

  it('should analyze forehead + nose regions combined', () => {
    const imageData = createMockImageData(200, 200, [200, 180, 160]);
    const faceRegion = createMockFaceRegion();

    const result = analyzeTZone(imageData, faceRegion);

    // 이마 + 코 영역 픽셀 수 계산
    const expectedSamples =
      faceRegion.forehead.width * faceRegion.forehead.height +
      faceRegion.nose.width * faceRegion.nose.height;

    expect(result.sampleCount).toBe(expectedSamples);
  });
});

describe('analyzeUZone', () => {
  it('should return U-zone analysis result', () => {
    const imageData = createMockImageData(200, 200, [210, 190, 170]);
    const faceRegion = createMockFaceRegion();

    const result = analyzeUZone(imageData, faceRegion);

    expect(result.zoneType).toBe('U-zone');
    expect(result.avgLabColor.L).toBeGreaterThan(0);
    expect(result.sampleCount).toBeGreaterThan(0);
  });

  it('should analyze leftCheek + rightCheek + chin regions combined', () => {
    const imageData = createMockImageData(200, 200, [200, 180, 160]);
    const faceRegion = createMockFaceRegion();

    const result = analyzeUZone(imageData, faceRegion);

    // 왼쪽볼 + 오른쪽볼 + 턱 영역 픽셀 수 계산
    const expectedSamples =
      faceRegion.leftCheek.width * faceRegion.leftCheek.height +
      faceRegion.rightCheek.width * faceRegion.rightCheek.height +
      faceRegion.chin.width * faceRegion.chin.height;

    expect(result.sampleCount).toBe(expectedSamples);
  });
});

describe('combineZoneAnalysis', () => {
  function createMockZoneAnalysis(
    zoneType: 'T-zone' | 'U-zone',
    skinCondition: 'dry' | 'normal' | 'oily'
  ): ZoneAnalysis {
    return {
      zoneType,
      avgSebum: skinCondition === 'dry' ? 50 : skinCondition === 'normal' ? 100 : 180,
      avgHydration: 60,
      avgLabColor: { L: 70, a: 10, b: 15 },
      skinCondition,
      sampleCount: 1000,
    };
  }

  it('should classify as dry when both zones are dry', () => {
    const tZone = createMockZoneAnalysis('T-zone', 'dry');
    const uZone = createMockZoneAnalysis('U-zone', 'dry');

    const result = combineZoneAnalysis(tZone, uZone);

    expect(result.overallSkinType).toBe('dry');
    expect(result.skinTypeRationale).toContain('건조');
  });

  it('should classify as oily when both zones are oily', () => {
    const tZone = createMockZoneAnalysis('T-zone', 'oily');
    const uZone = createMockZoneAnalysis('U-zone', 'oily');

    const result = combineZoneAnalysis(tZone, uZone);

    expect(result.overallSkinType).toBe('oily');
    expect(result.skinTypeRationale).toContain('지성');
  });

  it('should classify as normal when both zones are normal', () => {
    const tZone = createMockZoneAnalysis('T-zone', 'normal');
    const uZone = createMockZoneAnalysis('U-zone', 'normal');

    const result = combineZoneAnalysis(tZone, uZone);

    expect(result.overallSkinType).toBe('normal');
    expect(result.skinTypeRationale).toContain('중성');
  });

  it('should classify as combination when T-zone is oily and U-zone is dry', () => {
    const tZone = createMockZoneAnalysis('T-zone', 'oily');
    const uZone = createMockZoneAnalysis('U-zone', 'dry');

    const result = combineZoneAnalysis(tZone, uZone);

    expect(result.overallSkinType).toBe('combination');
    expect(result.skinTypeRationale).toContain('복합성');
  });

  it('should classify as combination when T-zone is oily and U-zone is normal', () => {
    const tZone = createMockZoneAnalysis('T-zone', 'oily');
    const uZone = createMockZoneAnalysis('U-zone', 'normal');

    const result = combineZoneAnalysis(tZone, uZone);

    expect(result.overallSkinType).toBe('combination');
  });

  it('should include both zone results in output', () => {
    const tZone = createMockZoneAnalysis('T-zone', 'normal');
    const uZone = createMockZoneAnalysis('U-zone', 'normal');

    const result = combineZoneAnalysis(tZone, uZone);

    expect(result.tZone).toBe(tZone);
    expect(result.uZone).toBe(uZone);
  });
});
