/**
 * S-2 6존 영역 추출기 테스트
 * 얼굴 랜드마크 기반 피부 존 분리 검증
 *
 * @module tests/lib/analysis/skin-v2/zone-extractor
 */
import { describe, it, expect } from 'vitest';
import {
  extractZoneRegions,
  calculateTUZoneDifference,
  calculateGroupAverages,
  combineSixZoneAnalysis,
  analyzeZoneConcerns,
  generateZoneRecommendations,
  calculateZoneScore,
  type FaceLandmarks,
  type ZoneRegion,
} from '@/lib/analysis/skin-v2/zone-extractor';
import type {
  SkinZoneType,
  ZoneGroup,
  ZoneMetricsV2,
  ZoneAnalysisV2,
  TextureAnalysis,
  GLCMResult,
  LBPResult,
} from '@/lib/analysis/skin-v2/types';
import { ZONE_GROUP_MAPPING } from '@/lib/analysis/skin-v2/types';

// =============================================================================
// 테스트 헬퍼 함수
// =============================================================================

/**
 * 기본 얼굴 랜드마크 생성 (정면 얼굴 기준)
 */
function createMockLandmarks(overrides: Partial<FaceLandmarks> = {}): FaceLandmarks {
  return {
    foreheadCenter: { x: 200, y: 80 },
    noseTip: { x: 200, y: 180 },
    leftCheekCenter: { x: 120, y: 200 },
    rightCheekCenter: { x: 280, y: 200 },
    chinCenter: { x: 200, y: 300 },
    leftEye: { x: 150, y: 120 },
    rightEye: { x: 250, y: 120 },
    mouthCenter: { x: 200, y: 260 },
    faceBoundingBox: {
      x: 50,
      y: 30,
      width: 300,
      height: 350,
    },
    ...overrides,
  };
}

/**
 * 기본 ZoneMetricsV2 생성
 */
function createMockMetrics(overrides: Partial<ZoneMetricsV2> = {}): ZoneMetricsV2 {
  return {
    hydration: 60,
    oiliness: 50,
    pores: 60,
    texture: 60,
    pigmentation: 60,
    sensitivity: 30,
    elasticity: 60,
    ...overrides,
  };
}

/**
 * 기본 TextureAnalysis 생성
 */
function createMockTextureAnalysis(): TextureAnalysis {
  const glcm: GLCMResult = {
    contrast: 50,
    homogeneity: 0.7,
    energy: 0.5,
    correlation: 0.6,
    entropy: 4,
  };
  const lbp: LBPResult = {
    histogram: new Array(256).fill(1 / 256),
    uniformPatternRatio: 0.7,
    roughnessScore: 60,
  };
  return { glcm, lbp, poreScore: 60, wrinkleScore: 60, textureScore: 60 };
}

/**
 * 기본 ZoneAnalysisV2 생성
 */
function createMockZoneAnalysis(
  zone: SkinZoneType,
  overrides: Partial<ZoneAnalysisV2> = {}
): ZoneAnalysisV2 {
  const group = ZONE_GROUP_MAPPING[zone];
  return {
    zone,
    group,
    score: 60,
    metrics: createMockMetrics(),
    textureAnalysis: createMockTextureAnalysis(),
    concerns: [],
    recommendations: [],
    ...overrides,
  };
}

/**
 * 모든 존에 대한 ZoneAnalysisV2 생성
 */
function createMockZones(
  overrides: Partial<Record<SkinZoneType, Partial<ZoneAnalysisV2>>> = {}
): Record<SkinZoneType, ZoneAnalysisV2> {
  const zoneTypes: SkinZoneType[] = [
    'forehead', 'nose', 'leftCheek', 'rightCheek', 'chin', 'eyeArea', 'lipArea'
  ];

  const zones: Record<SkinZoneType, ZoneAnalysisV2> = {} as Record<SkinZoneType, ZoneAnalysisV2>;

  for (const zoneType of zoneTypes) {
    zones[zoneType] = createMockZoneAnalysis(zoneType, overrides[zoneType]);
  }

  return zones;
}

// =============================================================================
// extractZoneRegions 테스트
// =============================================================================

describe('extractZoneRegions', () => {
  describe('기본 동작', () => {
    it('7개 존 영역을 모두 반환해야 한다', () => {
      const landmarks = createMockLandmarks();
      const result = extractZoneRegions(landmarks, 400, 400);

      const expectedZones: SkinZoneType[] = [
        'forehead', 'nose', 'leftCheek', 'rightCheek', 'chin', 'eyeArea', 'lipArea'
      ];

      expectedZones.forEach(zone => {
        expect(result.zones[zone]).toBeDefined();
        expect(result.zones[zone].zone).toBe(zone);
      });
    });

    it('각 존에 center, radius, boundingBox가 있어야 한다', () => {
      const landmarks = createMockLandmarks();
      const result = extractZoneRegions(landmarks, 400, 400);

      Object.values(result.zones).forEach(zone => {
        expect(zone.center).toHaveProperty('x');
        expect(zone.center).toHaveProperty('y');
        expect(zone.radius).toBeGreaterThan(0);
        expect(zone.boundingBox).toHaveProperty('x');
        expect(zone.boundingBox).toHaveProperty('y');
        expect(zone.boundingBox).toHaveProperty('width');
        expect(zone.boundingBox).toHaveProperty('height');
      });
    });

    it('원본 랜드마크를 반환해야 한다', () => {
      const landmarks = createMockLandmarks();
      const result = extractZoneRegions(landmarks, 400, 400);

      expect(result.landmarks).toEqual(landmarks);
    });

    it('이미지 크기를 반환해야 한다', () => {
      const landmarks = createMockLandmarks();
      const result = extractZoneRegions(landmarks, 640, 480);

      expect(result.imageWidth).toBe(640);
      expect(result.imageHeight).toBe(480);
    });
  });

  describe('존 위치', () => {
    it('이마 존은 foreheadCenter를 중심으로 해야 한다', () => {
      const landmarks = createMockLandmarks();
      const result = extractZoneRegions(landmarks, 400, 400);

      expect(result.zones.forehead.center).toEqual(landmarks.foreheadCenter);
    });

    it('코 존은 noseTip을 중심으로 해야 한다', () => {
      const landmarks = createMockLandmarks();
      const result = extractZoneRegions(landmarks, 400, 400);

      expect(result.zones.nose.center).toEqual(landmarks.noseTip);
    });

    it('양 볼은 각각 leftCheekCenter, rightCheekCenter를 중심으로 해야 한다', () => {
      const landmarks = createMockLandmarks();
      const result = extractZoneRegions(landmarks, 400, 400);

      expect(result.zones.leftCheek.center).toEqual(landmarks.leftCheekCenter);
      expect(result.zones.rightCheek.center).toEqual(landmarks.rightCheekCenter);
    });

    it('눈가 존은 양 눈 사이 중심이어야 한다', () => {
      const landmarks = createMockLandmarks();
      const result = extractZoneRegions(landmarks, 400, 400);

      const expectedCenter = {
        x: (landmarks.leftEye.x + landmarks.rightEye.x) / 2,
        y: (landmarks.leftEye.y + landmarks.rightEye.y) / 2,
      };
      expect(result.zones.eyeArea.center).toEqual(expectedCenter);
    });
  });

  describe('존 크기', () => {
    it('이마는 가장 큰 radius를 가져야 한다', () => {
      const landmarks = createMockLandmarks();
      const result = extractZoneRegions(landmarks, 400, 400);

      const radii = Object.values(result.zones).map(z => z.radius);
      const maxRadius = Math.max(...radii);

      expect(result.zones.forehead.radius).toBe(maxRadius);
    });

    it('눈가는 가장 작은 radius를 가져야 한다', () => {
      const landmarks = createMockLandmarks();
      const result = extractZoneRegions(landmarks, 400, 400);

      const radii = Object.values(result.zones).map(z => z.radius);
      const minRadius = Math.min(...radii);

      expect(result.zones.eyeArea.radius).toBe(minRadius);
    });

    it('얼굴 크기에 비례하여 존 크기가 결정되어야 한다', () => {
      const smallFaceLandmarks = createMockLandmarks({
        faceBoundingBox: { x: 100, y: 100, width: 100, height: 120 },
      });
      const largeFaceLandmarks = createMockLandmarks({
        faceBoundingBox: { x: 50, y: 50, width: 300, height: 360 },
      });

      const smallResult = extractZoneRegions(smallFaceLandmarks, 400, 400);
      const largeResult = extractZoneRegions(largeFaceLandmarks, 400, 400);

      // 큰 얼굴의 존이 작은 얼굴보다 커야 함
      expect(largeResult.zones.forehead.radius).toBeGreaterThan(
        smallResult.zones.forehead.radius
      );
    });
  });
});

// =============================================================================
// calculateTUZoneDifference 테스트 (zone-extractor 버전)
// =============================================================================

describe('calculateTUZoneDifference (zone-extractor)', () => {
  it('T존이 U존보다 유분 많으면 양수 oilinessDiff를 반환해야 한다', () => {
    const zones = createMockZones({
      forehead: { metrics: createMockMetrics({ oiliness: 70 }) },
      nose: { metrics: createMockMetrics({ oiliness: 80 }) },
      leftCheek: { metrics: createMockMetrics({ oiliness: 40 }) },
      rightCheek: { metrics: createMockMetrics({ oiliness: 40 }) },
      chin: { metrics: createMockMetrics({ oiliness: 40 }) },
    });

    const result = calculateTUZoneDifference(zones);

    // T존 평균: (70+80)/2 = 75
    // U존 평균: (40+40+40)/3 = 40
    // 차이: 75 - 40 = 35
    expect(result.oilinessDiff).toBe(35);
  });

  it('U존이 T존보다 유분 많으면 음수 oilinessDiff를 반환해야 한다', () => {
    const zones = createMockZones({
      forehead: { metrics: createMockMetrics({ oiliness: 30 }) },
      nose: { metrics: createMockMetrics({ oiliness: 30 }) },
      leftCheek: { metrics: createMockMetrics({ oiliness: 60 }) },
      rightCheek: { metrics: createMockMetrics({ oiliness: 60 }) },
      chin: { metrics: createMockMetrics({ oiliness: 60 }) },
    });

    const result = calculateTUZoneDifference(zones);

    // T존 평균: 30
    // U존 평균: 60
    // 차이: 30 - 60 = -30
    expect(result.oilinessDiff).toBe(-30);
  });

  it('유분 차이가 15 초과면 복합성으로 판정해야 한다', () => {
    const zones = createMockZones({
      forehead: { metrics: createMockMetrics({ oiliness: 70 }) },
      nose: { metrics: createMockMetrics({ oiliness: 60 }) },
      leftCheek: { metrics: createMockMetrics({ oiliness: 40 }) },
      rightCheek: { metrics: createMockMetrics({ oiliness: 40 }) },
      chin: { metrics: createMockMetrics({ oiliness: 40 }) },
    });

    const result = calculateTUZoneDifference(zones);

    // T존 평균: (70+60)/2 = 65
    // U존 평균: 40
    // 차이: 25 > 15
    expect(result.isCombiSkin).toBe(true);
  });

  it('유분 차이가 15 이하면 복합성이 아니어야 한다', () => {
    const zones = createMockZones({
      forehead: { metrics: createMockMetrics({ oiliness: 50 }) },
      nose: { metrics: createMockMetrics({ oiliness: 50 }) },
      leftCheek: { metrics: createMockMetrics({ oiliness: 45 }) },
      rightCheek: { metrics: createMockMetrics({ oiliness: 45 }) },
      chin: { metrics: createMockMetrics({ oiliness: 45 }) },
    });

    const result = calculateTUZoneDifference(zones);

    // T존 평균: 50
    // U존 평균: 45
    // 차이: 5 <= 15
    expect(result.isCombiSkin).toBe(false);
  });

  it('수분 차이도 계산해야 한다', () => {
    const zones = createMockZones({
      forehead: { metrics: createMockMetrics({ hydration: 70 }) },
      nose: { metrics: createMockMetrics({ hydration: 60 }) },
      leftCheek: { metrics: createMockMetrics({ hydration: 40 }) },
      rightCheek: { metrics: createMockMetrics({ hydration: 40 }) },
      chin: { metrics: createMockMetrics({ hydration: 40 }) },
    });

    const result = calculateTUZoneDifference(zones);

    // T존 평균: (70+60)/2 = 65
    // U존 평균: 40
    // 차이: 25
    expect(result.hydrationDiff).toBe(25);
  });
});

// =============================================================================
// calculateGroupAverages 테스트 (zone-extractor 버전)
// =============================================================================

describe('calculateGroupAverages (zone-extractor)', () => {
  it('T존 평균을 계산해야 한다 (이마, 코)', () => {
    const zones = createMockZones({
      forehead: { score: 80 },
      nose: { score: 60 },
    });

    const result = calculateGroupAverages(zones);

    expect(result.tZone).toBe(70); // (80 + 60) / 2
  });

  it('U존 평균을 계산해야 한다 (양볼, 턱)', () => {
    const zones = createMockZones({
      leftCheek: { score: 60 },
      rightCheek: { score: 70 },
      chin: { score: 80 },
    });

    const result = calculateGroupAverages(zones);

    expect(result.uZone).toBe(70); // (60 + 70 + 80) / 3
  });

  it('눈가 존 평균을 계산해야 한다', () => {
    const zones = createMockZones({
      eyeArea: { score: 75 },
    });

    const result = calculateGroupAverages(zones);

    expect(result.eyeZone).toBe(75);
  });

  it('입술 존 평균을 계산해야 한다', () => {
    const zones = createMockZones({
      lipArea: { score: 85 },
    });

    const result = calculateGroupAverages(zones);

    expect(result.lipZone).toBe(85);
  });

  it('모든 그룹 평균을 반환해야 한다', () => {
    const zones = createMockZones();
    const result = calculateGroupAverages(zones);

    expect(result).toHaveProperty('tZone');
    expect(result).toHaveProperty('uZone');
    expect(result).toHaveProperty('eyeZone');
    expect(result).toHaveProperty('lipZone');
  });
});

// =============================================================================
// combineSixZoneAnalysis 테스트
// =============================================================================

describe('combineSixZoneAnalysis', () => {
  it('SixZoneAnalysisV2 형식을 반환해야 한다', () => {
    const zones = createMockZones();
    const result = combineSixZoneAnalysis(zones);

    expect(result).toHaveProperty('zones');
    expect(result).toHaveProperty('groupAverages');
    expect(result).toHaveProperty('tUzoneDifference');
  });

  it('원본 zones를 포함해야 한다', () => {
    const zones = createMockZones();
    const result = combineSixZoneAnalysis(zones);

    expect(result.zones).toEqual(zones);
  });

  it('그룹 평균을 계산해야 한다', () => {
    const zones = createMockZones({
      forehead: { score: 80 },
      nose: { score: 80 },
    });

    const result = combineSixZoneAnalysis(zones);

    expect(result.groupAverages.tZone).toBe(80);
  });

  it('T-U존 차이를 계산해야 한다', () => {
    const zones = createMockZones({
      forehead: { metrics: createMockMetrics({ oiliness: 70 }) },
      nose: { metrics: createMockMetrics({ oiliness: 70 }) },
      leftCheek: { metrics: createMockMetrics({ oiliness: 30 }) },
      rightCheek: { metrics: createMockMetrics({ oiliness: 30 }) },
      chin: { metrics: createMockMetrics({ oiliness: 30 }) },
    });

    const result = combineSixZoneAnalysis(zones);

    expect(result.tUzoneDifference.oilinessDiff).toBe(40);
    expect(result.tUzoneDifference.isCombiSkin).toBe(true);
  });
});

// =============================================================================
// analyzeZoneConcerns 테스트
// =============================================================================

describe('analyzeZoneConcerns', () => {
  it('수분 40 미만이면 "건조함" 반환해야 한다', () => {
    const metrics = createMockMetrics({ hydration: 35 });
    const concerns = analyzeZoneConcerns(metrics);

    expect(concerns).toContain('건조함');
  });

  it('유분 70 초과면 "과다 유분" 반환해야 한다', () => {
    const metrics = createMockMetrics({ oiliness: 75 });
    const concerns = analyzeZoneConcerns(metrics);

    expect(concerns).toContain('과다 유분');
  });

  it('모공 50 미만이면 "모공 확대" 반환해야 한다', () => {
    const metrics = createMockMetrics({ pores: 40 });
    const concerns = analyzeZoneConcerns(metrics);

    expect(concerns).toContain('모공 확대');
  });

  it('피부결 50 미만이면 "피부결 거침" 반환해야 한다', () => {
    const metrics = createMockMetrics({ texture: 45 });
    const concerns = analyzeZoneConcerns(metrics);

    expect(concerns).toContain('피부결 거침');
  });

  it('색소침착 60 미만이면 "색소침착" 반환해야 한다', () => {
    const metrics = createMockMetrics({ pigmentation: 55 });
    const concerns = analyzeZoneConcerns(metrics);

    expect(concerns).toContain('색소침착');
  });

  it('민감도 60 초과면 "민감함" 반환해야 한다', () => {
    const metrics = createMockMetrics({ sensitivity: 65 });
    const concerns = analyzeZoneConcerns(metrics);

    expect(concerns).toContain('민감함');
  });

  it('탄력 50 미만이면 "탄력 저하" 반환해야 한다', () => {
    const metrics = createMockMetrics({ elasticity: 45 });
    const concerns = analyzeZoneConcerns(metrics);

    expect(concerns).toContain('탄력 저하');
  });

  it('문제 없으면 빈 배열 반환해야 한다', () => {
    const metrics = createMockMetrics({
      hydration: 60,
      oiliness: 50,
      pores: 60,
      texture: 60,
      pigmentation: 70,
      sensitivity: 30,
      elasticity: 60,
    });
    const concerns = analyzeZoneConcerns(metrics);

    expect(concerns).toHaveLength(0);
  });

  it('여러 문제가 있으면 모두 반환해야 한다', () => {
    const metrics = createMockMetrics({
      hydration: 30,    // 건조함
      oiliness: 80,     // 과다 유분
      sensitivity: 70,  // 민감함
    });
    const concerns = analyzeZoneConcerns(metrics);

    expect(concerns).toContain('건조함');
    expect(concerns).toContain('과다 유분');
    expect(concerns).toContain('민감함');
    expect(concerns.length).toBeGreaterThanOrEqual(3);
  });
});

// =============================================================================
// generateZoneRecommendations 테스트
// =============================================================================

describe('generateZoneRecommendations', () => {
  it('건조함에 대한 보습 추천을 생성해야 한다', () => {
    const recommendations = generateZoneRecommendations('forehead', ['건조함']);

    expect(recommendations.some(r => r.includes('보습'))).toBe(true);
    expect(recommendations.some(r => r.includes('히알루론산'))).toBe(true);
  });

  it('과다 유분에 대한 유분 조절 추천을 생성해야 한다', () => {
    const recommendations = generateZoneRecommendations('nose', ['과다 유분']);

    expect(recommendations.some(r => r.includes('유분 조절'))).toBe(true);
    expect(recommendations.some(r => r.includes('나이아신아마이드'))).toBe(true);
  });

  it('모공 확대에 대한 모공 관리 추천을 생성해야 한다', () => {
    const recommendations = generateZoneRecommendations('leftCheek', ['모공 확대']);

    expect(recommendations.some(r => r.includes('모공'))).toBe(true);
    expect(recommendations.some(r => r.includes('BHA'))).toBe(true);
  });

  it('색소침착에 대한 브라이트닝 추천을 생성해야 한다', () => {
    const recommendations = generateZoneRecommendations('rightCheek', ['색소침착']);

    expect(recommendations.some(r => r.includes('브라이트닝'))).toBe(true);
    expect(recommendations.some(r => r.includes('비타민C'))).toBe(true);
  });

  it('민감함에 대한 진정 추천을 생성해야 한다', () => {
    const recommendations = generateZoneRecommendations('chin', ['민감함']);

    expect(recommendations.some(r => r.includes('진정'))).toBe(true);
    expect(recommendations.some(r => r.includes('판테놀'))).toBe(true);
  });

  it('존 라벨이 추천에 포함되어야 한다', () => {
    const recommendations = generateZoneRecommendations('forehead', ['건조함']);

    expect(recommendations.some(r => r.includes('이마'))).toBe(true);
  });

  it('문제가 없으면 빈 배열 반환해야 한다', () => {
    const recommendations = generateZoneRecommendations('forehead', []);

    expect(recommendations).toHaveLength(0);
  });

  it('중복 추천을 제거해야 한다', () => {
    const recommendations = generateZoneRecommendations('forehead', ['건조함', '건조함']);

    const uniqueRecs = [...new Set(recommendations)];
    expect(recommendations.length).toBe(uniqueRecs.length);
  });

  it('여러 문제에 대한 추천을 모두 생성해야 한다', () => {
    const recommendations = generateZoneRecommendations('forehead', ['건조함', '민감함']);

    expect(recommendations.some(r => r.includes('보습'))).toBe(true);
    expect(recommendations.some(r => r.includes('진정'))).toBe(true);
  });
});

// =============================================================================
// calculateZoneScore 테스트
// =============================================================================

describe('calculateZoneScore', () => {
  it('좋은 메트릭은 높은 점수를 반환해야 한다', () => {
    const metrics = createMockMetrics({
      hydration: 80,
      oiliness: 50,  // 균형
      pores: 80,
      texture: 80,
      pigmentation: 80,
      sensitivity: 10,  // 낮을수록 좋음
      elasticity: 80,
    });

    const score = calculateZoneScore(metrics);
    expect(score).toBeGreaterThan(70);
  });

  it('나쁜 메트릭은 낮은 점수를 반환해야 한다', () => {
    const metrics = createMockMetrics({
      hydration: 20,
      oiliness: 90,  // 불균형
      pores: 30,
      texture: 30,
      pigmentation: 30,
      sensitivity: 80,  // 높으면 나쁨
      elasticity: 30,
    });

    const score = calculateZoneScore(metrics);
    expect(score).toBeLessThan(50);
  });

  it('유분은 50에 가까울수록 좋은 점수여야 한다', () => {
    const balancedOiliness = createMockMetrics({ oiliness: 50 });
    const highOiliness = createMockMetrics({ oiliness: 90 });
    const lowOiliness = createMockMetrics({ oiliness: 10 });

    const balancedScore = calculateZoneScore(balancedOiliness);
    const highScore = calculateZoneScore(highOiliness);
    const lowScore = calculateZoneScore(lowOiliness);

    expect(balancedScore).toBeGreaterThan(highScore);
    expect(balancedScore).toBeGreaterThan(lowScore);
  });

  it('민감도는 낮을수록 좋은 점수여야 한다', () => {
    const lowSensitivity = createMockMetrics({ sensitivity: 10 });
    const highSensitivity = createMockMetrics({ sensitivity: 90 });

    const lowScore = calculateZoneScore(lowSensitivity);
    const highScore = calculateZoneScore(highSensitivity);

    expect(lowScore).toBeGreaterThan(highScore);
  });

  it('점수는 0-100 범위여야 한다', () => {
    const extremeGood = createMockMetrics({
      hydration: 100,
      oiliness: 50,
      pores: 100,
      texture: 100,
      pigmentation: 100,
      sensitivity: 0,
      elasticity: 100,
    });
    const extremeBad = createMockMetrics({
      hydration: 0,
      oiliness: 100,
      pores: 0,
      texture: 0,
      pigmentation: 0,
      sensitivity: 100,
      elasticity: 0,
    });

    const goodScore = calculateZoneScore(extremeGood);
    const badScore = calculateZoneScore(extremeBad);

    expect(goodScore).toBeGreaterThanOrEqual(0);
    expect(goodScore).toBeLessThanOrEqual(100);
    expect(badScore).toBeGreaterThanOrEqual(0);
    expect(badScore).toBeLessThanOrEqual(100);
  });

  it('정수를 반환해야 한다', () => {
    const metrics = createMockMetrics({
      hydration: 57.5,
      oiliness: 48.3,
    });

    const score = calculateZoneScore(metrics);
    expect(Number.isInteger(score)).toBe(true);
  });
});

// =============================================================================
// 통합 테스트
// =============================================================================

describe('Zone Extraction Integration', () => {
  it('전체 파이프라인: 랜드마크 → 존 영역 → 분석', () => {
    // 1. 랜드마크에서 존 영역 추출
    const landmarks = createMockLandmarks();
    const zoneRegions = extractZoneRegions(landmarks, 400, 400);

    expect(Object.keys(zoneRegions.zones)).toHaveLength(7);

    // 2. 각 존에 대한 메트릭 분석 (시뮬레이션)
    const zones = createMockZones();

    // 3. 6존 분석 조합
    const sixZoneAnalysis = combineSixZoneAnalysis(zones);

    expect(sixZoneAnalysis.zones).toBeDefined();
    expect(sixZoneAnalysis.groupAverages).toBeDefined();
    expect(sixZoneAnalysis.tUzoneDifference).toBeDefined();
  });

  it('복합성 피부 시나리오', () => {
    // T존: 지성, U존: 건성
    const zones = createMockZones({
      forehead: { metrics: createMockMetrics({ oiliness: 80, hydration: 40 }) },
      nose: { metrics: createMockMetrics({ oiliness: 85, hydration: 35 }) },
      leftCheek: { metrics: createMockMetrics({ oiliness: 30, hydration: 70 }) },
      rightCheek: { metrics: createMockMetrics({ oiliness: 25, hydration: 75 }) },
      chin: { metrics: createMockMetrics({ oiliness: 35, hydration: 65 }) },
    });

    const result = combineSixZoneAnalysis(zones);

    // 복합성 피부로 판정되어야 함
    expect(result.tUzoneDifference.isCombiSkin).toBe(true);
    expect(result.tUzoneDifference.oilinessDiff).toBeGreaterThan(15);
  });

  it('건조 피부 시나리오', () => {
    const dryMetrics = createMockMetrics({ hydration: 25 });
    const concerns = analyzeZoneConcerns(dryMetrics);
    const recommendations = generateZoneRecommendations('leftCheek', concerns);

    expect(concerns).toContain('건조함');
    expect(recommendations.some(r => r.includes('보습'))).toBe(true);
  });

  it('민감성 피부 시나리오', () => {
    const sensitiveMetrics = createMockMetrics({ sensitivity: 75 });
    const concerns = analyzeZoneConcerns(sensitiveMetrics);
    const recommendations = generateZoneRecommendations('forehead', concerns);

    expect(concerns).toContain('민감함');
    expect(recommendations.some(r => r.includes('진정'))).toBe(true);
    expect(recommendations.some(r => r.includes('판테놀'))).toBe(true);
  });
});
