/**
 * 6-Zone 피부 분석 테스트
 *
 * @see docs/principles/skin-physiology.md 6-Zone 정의
 */

import { describe, it, expect } from 'vitest';
import {
  extractZoneRegion,
  analyzeZone,
  analyzeSixZones,
  determineSkinTypeFrom6Zones,
  ZONE_OILINESS_THRESHOLDS,
  ZONE_SENSITIVITY_THRESHOLDS,
  type SixZoneFaceRegion,
  type SkinZone,
  type ZoneMetrics,
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

// Mock SixZoneFaceRegion 생성 헬퍼
function createMockSixZoneFaceRegion(): SixZoneFaceRegion {
  return {
    forehead: { x: 50, y: 10, width: 100, height: 40 },
    nose: { x: 80, y: 50, width: 40, height: 60 },
    leftCheek: { x: 10, y: 70, width: 50, height: 50 },
    rightCheek: { x: 140, y: 70, width: 50, height: 50 },
    chin: { x: 70, y: 140, width: 60, height: 40 },
    eyeArea: { x: 40, y: 40, width: 120, height: 30 },
  };
}

describe('ZONE_THRESHOLDS', () => {
  it('should have thresholds for all 6 zones', () => {
    const zones: SkinZone[] = [
      'forehead',
      'nose',
      'leftCheek',
      'rightCheek',
      'chin',
      'eyeArea',
    ];

    for (const zone of zones) {
      expect(ZONE_OILINESS_THRESHOLDS[zone]).toBeDefined();
      expect(ZONE_OILINESS_THRESHOLDS[zone].dry).toBeDefined();
      expect(ZONE_OILINESS_THRESHOLDS[zone].oily).toBeDefined();
      expect(ZONE_SENSITIVITY_THRESHOLDS[zone]).toBeDefined();
    }
  });

  it('T-zone (forehead, nose) should have higher thresholds than U-zone', () => {
    expect(ZONE_OILINESS_THRESHOLDS.forehead.oily).toBeGreaterThan(
      ZONE_OILINESS_THRESHOLDS.leftCheek.oily
    );
    expect(ZONE_OILINESS_THRESHOLDS.nose.oily).toBeGreaterThan(
      ZONE_OILINESS_THRESHOLDS.rightCheek.oily
    );
  });
});
describe('extractZoneRegion', () => {
  it('should extract region as ImageData', () => {
    const imageData = createMockImageData(200, 200, [220, 200, 180]);
    const faceRegion = createMockSixZoneFaceRegion();

    const foreheadData = extractZoneRegion(imageData, faceRegion, 'forehead');

    expect(foreheadData.width).toBe(faceRegion.forehead.width);
    expect(foreheadData.height).toBe(faceRegion.forehead.height);
    expect(foreheadData.data.length).toBe(
      faceRegion.forehead.width * faceRegion.forehead.height * 4
    );
  });

  it('should handle boundary safely', () => {
    const imageData = createMockImageData(100, 100, [200, 180, 160]);
    const faceRegion: SixZoneFaceRegion = {
      forehead: { x: 80, y: 80, width: 50, height: 50 }, // 경계 초과
      nose: { x: 40, y: 40, width: 20, height: 20 },
      leftCheek: { x: 10, y: 60, width: 20, height: 20 },
      rightCheek: { x: 70, y: 60, width: 20, height: 20 },
      chin: { x: 40, y: 80, width: 20, height: 20 },
      eyeArea: { x: 30, y: 30, width: 40, height: 20 },
    };

    const result = extractZoneRegion(imageData, faceRegion, 'forehead');

    // 경계를 초과해도 에러 없이 안전하게 추출
    expect(result.data.length).toBeGreaterThan(0);
  });
});

describe('analyzeZone', () => {
  it('should return ZoneMetrics for forehead', () => {
    // 밝은 피부색 (유분 많은 느낌)
    const zoneData = createMockImageData(100, 40, [220, 200, 180]);

    const result = analyzeZone(zoneData, 'forehead');

    expect(result.zone).toBe('forehead');
    expect(result.oiliness).toBeGreaterThanOrEqual(0);
    expect(result.oiliness).toBeLessThanOrEqual(100);
    expect(result.hydration).toBeGreaterThanOrEqual(0);
    expect(result.hydration).toBeLessThanOrEqual(100);
    expect(result.sensitivity).toBeGreaterThanOrEqual(0);
    expect(['small', 'medium', 'large']).toContain(result.poreSize);
    expect(Array.isArray(result.concerns)).toBe(true);
    expect(result.avgLabColor).toHaveProperty("L");
    expect(result.avgLabColor).toHaveProperty("a");
    expect(result.avgLabColor).toHaveProperty("b");
    expect(result.sampleCount).toBe(100 * 40);
  });

  it('should identify dryness concern when hydration is low', () => {
    // 어두운 피부색 (건조한 느낌)
    const zoneData = createMockImageData(50, 50, [120, 100, 90]);

    const result = analyzeZone(zoneData, 'leftCheek');

    // 건조한 조건에서 dryness concern 포함
    if (result.hydration < 40) {
      expect(result.concerns).toContain('dryness');
    }
  });

  it('should identify oiliness and blackheads for T-zone', () => {
    // 매우 밝은 피부색 (번들거리는 느낌)
    const zoneData = createMockImageData(40, 60, [250, 240, 230]);

    const result = analyzeZone(zoneData, 'nose');

    // T-zone에서 높은 유분도
    if (result.oiliness > ZONE_OILINESS_THRESHOLDS.nose.oily) {
      expect(result.concerns).toContain('oiliness');
      expect(result.concerns).toContain('blackheads');
    }
  });
});
describe('analyzeSixZones', () => {
  it('should return complete SixZoneAnalysis', () => {
    const imageData = createMockImageData(200, 200, [200, 180, 160]);
    const faceRegion = createMockSixZoneFaceRegion();

    const result = analyzeSixZones(imageData, faceRegion);

    // 6개 존 모두 포함
    expect(result.zones.forehead).toBeDefined();
    expect(result.zones.nose).toBeDefined();
    expect(result.zones.leftCheek).toBeDefined();
    expect(result.zones.rightCheek).toBeDefined();
    expect(result.zones.chin).toBeDefined();
    expect(result.zones.eyeArea).toBeDefined();

    // T-zone, U-zone 평균
    expect(result.tZoneAverage).toBeDefined();
    expect(result.tZoneAverage.oiliness).toBeGreaterThanOrEqual(0);
    expect(result.uZoneAverage).toBeDefined();
    expect(result.uZoneAverage.oiliness).toBeGreaterThanOrEqual(0);

    // 피부 타입
    expect(['dry', 'normal', 'oily', 'combination', 'sensitive']).toContain(
      result.overallSkinType
    );
    expect(result.skinTypeRationale.length).toBeGreaterThan(0);

    // 신뢰도 및 시각
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.analyzedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should calculate T-zone average from forehead and nose', () => {
    const imageData = createMockImageData(200, 200, [210, 190, 170]);
    const faceRegion = createMockSixZoneFaceRegion();

    const result = analyzeSixZones(imageData, faceRegion);

    // T-zone 평균은 이마와 코의 평균
    const expectedOiliness = Math.round(
      (result.zones.forehead.oiliness + result.zones.nose.oiliness) / 2
    );
    expect(result.tZoneAverage.oiliness).toBe(expectedOiliness);
  });

  it('should calculate U-zone average from cheeks and chin', () => {
    const imageData = createMockImageData(200, 200, [210, 190, 170]);
    const faceRegion = createMockSixZoneFaceRegion();

    const result = analyzeSixZones(imageData, faceRegion);

    // U-zone 평균은 볼과 턱의 평균
    const expectedOiliness = Math.round(
      (result.zones.leftCheek.oiliness +
        result.zones.rightCheek.oiliness +
        result.zones.chin.oiliness) / 3
    );
    expect(result.uZoneAverage.oiliness).toBe(expectedOiliness);
  });
});
describe('determineSkinTypeFrom6Zones', () => {
  function createMockZoneMetrics(
    zone: SkinZone,
    overrides: Partial<ZoneMetrics> = {}
  ): ZoneMetrics {
    return {
      zone,
      oiliness: 50,
      hydration: 60,
      sensitivity: 30,
      poreSize: 'medium',
      concerns: [],
      avgLabColor: { L: 70, a: 10, b: 15 },
      sampleCount: 1000,
      ...overrides,
    };
  }

  it('should classify as dry when both zones have low oiliness', () => {
    const zones: Record<SkinZone, ZoneMetrics> = {
      forehead: createMockZoneMetrics('forehead', { oiliness: 25 }),
      nose: createMockZoneMetrics('nose', { oiliness: 30 }),
      leftCheek: createMockZoneMetrics('leftCheek', { oiliness: 20 }),
      rightCheek: createMockZoneMetrics('rightCheek', { oiliness: 22 }),
      chin: createMockZoneMetrics('chin', { oiliness: 28 }),
      eyeArea: createMockZoneMetrics('eyeArea', { oiliness: 20 }),
    };

    const result = determineSkinTypeFrom6Zones({
      zones,
      tZoneAverage: { oiliness: 27, hydration: 50, sensitivity: 30 },
      uZoneAverage: { oiliness: 23, hydration: 50, sensitivity: 30 },
    });

    expect(result.skinType).toBe('dry');
    expect(result.rationale).toContain('건성');
  });

  it('should classify as oily when both zones have high oiliness', () => {
    const zones: Record<SkinZone, ZoneMetrics> = {
      forehead: createMockZoneMetrics('forehead', { oiliness: 75 }),
      nose: createMockZoneMetrics('nose', { oiliness: 80 }),
      leftCheek: createMockZoneMetrics('leftCheek', { oiliness: 65 }),
      rightCheek: createMockZoneMetrics('rightCheek', { oiliness: 60 }),
      chin: createMockZoneMetrics('chin', { oiliness: 70 }),
      eyeArea: createMockZoneMetrics('eyeArea', { oiliness: 55 }),
    };

    const result = determineSkinTypeFrom6Zones({
      zones,
      tZoneAverage: { oiliness: 77, hydration: 50, sensitivity: 30 },
      uZoneAverage: { oiliness: 65, hydration: 50, sensitivity: 30 },
    });

    expect(result.skinType).toBe('oily');
    expect(result.rationale).toContain('지성');
  });

  it('should classify as combination when T-zone oily, U-zone normal/dry', () => {
    const zones: Record<SkinZone, ZoneMetrics> = {
      forehead: createMockZoneMetrics('forehead', { oiliness: 70 }),
      nose: createMockZoneMetrics('nose', { oiliness: 75 }),
      leftCheek: createMockZoneMetrics('leftCheek', { oiliness: 35 }),
      rightCheek: createMockZoneMetrics('rightCheek', { oiliness: 40 }),
      chin: createMockZoneMetrics('chin', { oiliness: 45 }),
      eyeArea: createMockZoneMetrics('eyeArea', { oiliness: 30 }),
    };

    const result = determineSkinTypeFrom6Zones({
      zones,
      tZoneAverage: { oiliness: 72, hydration: 50, sensitivity: 30 },
      uZoneAverage: { oiliness: 40, hydration: 50, sensitivity: 30 },
    });

    expect(result.skinType).toBe('combination');
    expect(result.rationale).toContain('복합성');
  });

  it('should classify as sensitive when average sensitivity >= 50', () => {
    const zones: Record<SkinZone, ZoneMetrics> = {
      forehead: createMockZoneMetrics('forehead', { sensitivity: 55 }),
      nose: createMockZoneMetrics('nose', { sensitivity: 50 }),
      leftCheek: createMockZoneMetrics('leftCheek', { sensitivity: 60 }),
      rightCheek: createMockZoneMetrics('rightCheek', { sensitivity: 55 }),
      chin: createMockZoneMetrics('chin', { sensitivity: 45 }),
      eyeArea: createMockZoneMetrics('eyeArea', { sensitivity: 65 }),
    };

    const result = determineSkinTypeFrom6Zones({
      zones,
      tZoneAverage: { oiliness: 50, hydration: 50, sensitivity: 52 },
      uZoneAverage: { oiliness: 45, hydration: 50, sensitivity: 53 },
    });

    expect(result.skinType).toBe('sensitive');
    expect(result.rationale).toContain('민감성');
  });

  it('should classify as normal when balanced', () => {
    const zones: Record<SkinZone, ZoneMetrics> = {
      forehead: createMockZoneMetrics('forehead', { oiliness: 45 }),
      nose: createMockZoneMetrics('nose', { oiliness: 50 }),
      leftCheek: createMockZoneMetrics('leftCheek', { oiliness: 40 }),
      rightCheek: createMockZoneMetrics('rightCheek', { oiliness: 42 }),
      chin: createMockZoneMetrics('chin', { oiliness: 45 }),
      eyeArea: createMockZoneMetrics('eyeArea', { oiliness: 35 }),
    };

    const result = determineSkinTypeFrom6Zones({
      zones,
      tZoneAverage: { oiliness: 47, hydration: 60, sensitivity: 25 },
      uZoneAverage: { oiliness: 42, hydration: 60, sensitivity: 25 },
    });

    expect(result.skinType).toBe('normal');
    expect(result.rationale).toContain('중성');
  });
});
