/**
 * S-2 피부 점수 계산 테스트
 *
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 */

import { describe, it, expect } from 'vitest';
import {
  calculateZoneScore,
  extractTextureMetrics,
  calculateGroupAverages,
  calculateTUZoneDifference,
  calculateVitalityScore,
  calculateVitalityGrade,
  determineSkinType,
  extractPrimaryConcerns,
} from '@/lib/analysis/skin-v2';
import type {
  ZoneMetricsV2,
  ZoneAnalysisV2,
  TextureAnalysis,
  SkinZoneType,
  ZoneGroup,
} from '@/lib/analysis/skin-v2';

// ==========================================================================
// 테스트 헬퍼 함수
// ==========================================================================

/**
 * ZoneMetricsV2 테스트 데이터 생성
 */
function createTestMetrics(overrides: Partial<ZoneMetricsV2> = {}): ZoneMetricsV2 {
  return {
    hydration: 60,
    elasticity: 60,
    texture: 60,
    pigmentation: 60,
    pores: 60,
    sensitivity: 30,
    oiliness: 50,
    ...overrides,
  };
}

/**
 * TextureAnalysis 테스트 데이터 생성
 */
function createTestTextureAnalysis(overrides: Partial<TextureAnalysis> = {}): TextureAnalysis {
  return {
    glcm: {
      contrast: 0.5,
      energy: 0.3,
      homogeneity: 0.7,
      correlation: 0.8,
      entropy: 0.6,
    },
    lbp: {
      histogram: new Array(256).fill(0),
      uniformPatternRatio: 0.65,
      roughnessScore: 35,
    },
    poreScore: 70,
    wrinkleScore: 60,
    textureScore: 65,
    ...overrides,
  };
}

/**
 * ZoneAnalysisV2 테스트 데이터 생성
 */
function createTestZoneAnalysis(
  zone: SkinZoneType,
  group: ZoneGroup,
  overrides: Partial<Omit<ZoneAnalysisV2, 'zone' | 'group'>> = {}
): ZoneAnalysisV2 {
  const metrics = overrides.metrics ?? createTestMetrics();
  return {
    zone,
    group,
    score: overrides.score ?? 60,
    metrics,
    textureAnalysis: overrides.textureAnalysis ?? createTestTextureAnalysis(),
    concerns: overrides.concerns ?? [],
    recommendations: overrides.recommendations ?? [],
  };
}

/**
 * 전체 zones Record 생성
 */
function createTestZones(
  overrides: Partial<Record<SkinZoneType, Partial<Omit<ZoneAnalysisV2, 'zone' | 'group'>>>> = {}
): Record<SkinZoneType, ZoneAnalysisV2> {
  return {
    forehead: createTestZoneAnalysis('forehead', 'tZone', overrides.forehead),
    nose: createTestZoneAnalysis('nose', 'tZone', overrides.nose),
    leftCheek: createTestZoneAnalysis('leftCheek', 'uZone', overrides.leftCheek),
    rightCheek: createTestZoneAnalysis('rightCheek', 'uZone', overrides.rightCheek),
    chin: createTestZoneAnalysis('chin', 'uZone', overrides.chin),
    eyeArea: createTestZoneAnalysis('eyeArea', 'eyeZone', overrides.eyeArea),
    lipArea: createTestZoneAnalysis('lipArea', 'lipZone', overrides.lipArea),
  };
}

// ==========================================================================
// 테스트
// ==========================================================================

describe('S-2 Skin Scorer', () => {
  // ==========================================================================
  // calculateZoneScore
  // ==========================================================================
  describe('calculateZoneScore', () => {
    it('should calculate weighted zone score correctly', () => {
      const metrics: ZoneMetricsV2 = createTestMetrics({
        hydration: 70,
        elasticity: 65,
        texture: 60,
        pigmentation: 75,
        pores: 80,
        sensitivity: 30,
        oiliness: 50,
      });

      const score = calculateZoneScore(metrics);

      // 가중치 적용: hydration(0.25) + elasticity(0.20) + texture(0.20) +
      // pigmentation(0.15) + pores(0.10) + (100-sensitivity)(0.10)
      expect(score).toBeGreaterThanOrEqual(65);
      expect(score).toBeLessThanOrEqual(75);
    });

    it('should clamp score between 0 and 100', () => {
      const highMetrics: ZoneMetricsV2 = createTestMetrics({
        hydration: 100,
        elasticity: 100,
        texture: 100,
        pigmentation: 100,
        pores: 100,
        sensitivity: 0,
        oiliness: 0,
      });

      const lowMetrics: ZoneMetricsV2 = createTestMetrics({
        hydration: 0,
        elasticity: 0,
        texture: 0,
        pigmentation: 0,
        pores: 0,
        sensitivity: 100,
        oiliness: 100,
      });

      expect(calculateZoneScore(highMetrics)).toBe(100);
      expect(calculateZoneScore(lowMetrics)).toBe(0);
    });

    it('should invert sensitivity score (lower is better)', () => {
      const highSensitivity: ZoneMetricsV2 = createTestMetrics({
        hydration: 50,
        elasticity: 50,
        texture: 50,
        pigmentation: 50,
        pores: 50,
        sensitivity: 90, // 높은 민감도 = 나쁨
        oiliness: 50,
      });

      const lowSensitivity: ZoneMetricsV2 = createTestMetrics({
        hydration: 50,
        elasticity: 50,
        texture: 50,
        pigmentation: 50,
        pores: 50,
        sensitivity: 10, // 낮은 민감도 = 좋음
        oiliness: 50,
      });

      const highSensScore = calculateZoneScore(highSensitivity);
      const lowSensScore = calculateZoneScore(lowSensitivity);

      expect(lowSensScore).toBeGreaterThan(highSensScore);
    });
  });

  // ==========================================================================
  // extractTextureMetrics
  // ==========================================================================
  describe('extractTextureMetrics', () => {
    it('should extract pore and texture scores from texture analysis', () => {
      const texture: TextureAnalysis = createTestTextureAnalysis({
        poreScore: 75,
        textureScore: 70,
      });

      const metrics = extractTextureMetrics(texture);

      expect(metrics.pores).toBe(75);
      expect(metrics.texture).toBe(70);
    });
  });

  // ==========================================================================
  // calculateVitalityScore & Grade
  // ==========================================================================
  describe('calculateVitalityScore', () => {
    it('should calculate weighted vitality score from all zones', () => {
      const zones = createTestZones({
        forehead: { score: 80 },
        nose: { score: 70 },
        leftCheek: { score: 75 },
        rightCheek: { score: 75 },
        chin: { score: 70 },
        eyeArea: { score: 65 },
        lipArea: { score: 60 },
      });

      const score = calculateVitalityScore(zones);

      // 가중치 적용된 평균 점수
      expect(score).toBeGreaterThan(60);
      expect(score).toBeLessThan(85);
    });

    it('should return 0 for empty zones', () => {
      const emptyZones = {} as Record<SkinZoneType, ZoneAnalysisV2>;
      const score = calculateVitalityScore(emptyZones);
      expect(score).toBe(0);
    });
  });

  describe('calculateVitalityGrade', () => {
    it('should return grade based on vitality score', () => {
      expect(calculateVitalityGrade(95)).toBe('S');
      expect(calculateVitalityGrade(90)).toBe('S');
      expect(calculateVitalityGrade(80)).toBe('A');
      expect(calculateVitalityGrade(75)).toBe('A');
      expect(calculateVitalityGrade(65)).toBe('B');
      expect(calculateVitalityGrade(60)).toBe('B');
      expect(calculateVitalityGrade(50)).toBe('C');
      expect(calculateVitalityGrade(40)).toBe('C');
      expect(calculateVitalityGrade(30)).toBe('D');
    });
  });

  // ==========================================================================
  // determineSkinType
  // ==========================================================================
  describe('determineSkinType', () => {
    it('should identify oily skin from high T-zone oiliness', () => {
      const zones = createTestZones({
        forehead: { metrics: createTestMetrics({ oiliness: 80, sensitivity: 20 }) },
        nose: { metrics: createTestMetrics({ oiliness: 75, sensitivity: 20 }) },
        leftCheek: { metrics: createTestMetrics({ oiliness: 65, sensitivity: 20 }) },
        rightCheek: { metrics: createTestMetrics({ oiliness: 65, sensitivity: 20 }) },
        chin: { metrics: createTestMetrics({ oiliness: 60, sensitivity: 20 }) },
        eyeArea: { metrics: createTestMetrics({ oiliness: 50, sensitivity: 20 }) },
        lipArea: { metrics: createTestMetrics({ oiliness: 50, sensitivity: 20 }) },
      });

      const result = determineSkinType(zones);
      expect(result).toBe('oily');
    });

    it('should identify dry skin from low hydration', () => {
      const zones = createTestZones({
        forehead: { metrics: createTestMetrics({ hydration: 30, oiliness: 25, sensitivity: 20 }) },
        nose: { metrics: createTestMetrics({ hydration: 35, oiliness: 30, sensitivity: 20 }) },
        leftCheek: { metrics: createTestMetrics({ hydration: 35, oiliness: 25, sensitivity: 20 }) },
        rightCheek: { metrics: createTestMetrics({ hydration: 35, oiliness: 25, sensitivity: 20 }) },
        chin: { metrics: createTestMetrics({ hydration: 30, oiliness: 30, sensitivity: 20 }) },
        eyeArea: { metrics: createTestMetrics({ hydration: 30, oiliness: 25, sensitivity: 20 }) },
        lipArea: { metrics: createTestMetrics({ hydration: 30, oiliness: 25, sensitivity: 20 }) },
      });

      const result = determineSkinType(zones);
      expect(result).toBe('dry');
    });

    it('should identify combination skin from T-U zone difference', () => {
      const zones = createTestZones({
        forehead: { metrics: createTestMetrics({ oiliness: 75, hydration: 60, sensitivity: 20 }) },
        nose: { metrics: createTestMetrics({ oiliness: 80, hydration: 60, sensitivity: 20 }) },
        leftCheek: { metrics: createTestMetrics({ oiliness: 35, hydration: 60, sensitivity: 20 }) },
        rightCheek: { metrics: createTestMetrics({ oiliness: 35, hydration: 60, sensitivity: 20 }) },
        chin: { metrics: createTestMetrics({ oiliness: 40, hydration: 60, sensitivity: 20 }) },
        eyeArea: { metrics: createTestMetrics({ oiliness: 30, hydration: 60, sensitivity: 20 }) },
        lipArea: { metrics: createTestMetrics({ oiliness: 30, hydration: 60, sensitivity: 20 }) },
      });

      const result = determineSkinType(zones);
      expect(result).toBe('combination');
    });

    it('should identify sensitive skin from high sensitivity', () => {
      const zones = createTestZones({
        forehead: { metrics: createTestMetrics({ sensitivity: 75, oiliness: 45 }) },
        nose: { metrics: createTestMetrics({ sensitivity: 70, oiliness: 50 }) },
        leftCheek: { metrics: createTestMetrics({ sensitivity: 70, oiliness: 40 }) },
        rightCheek: { metrics: createTestMetrics({ sensitivity: 70, oiliness: 40 }) },
        chin: { metrics: createTestMetrics({ sensitivity: 65, oiliness: 45 }) },
        eyeArea: { metrics: createTestMetrics({ sensitivity: 60, oiliness: 40 }) },
        lipArea: { metrics: createTestMetrics({ sensitivity: 60, oiliness: 40 }) },
      });

      const result = determineSkinType(zones);
      expect(result).toBe('sensitive');
    });

    it('should identify normal skin when balanced', () => {
      const zones = createTestZones({
        forehead: { metrics: createTestMetrics({ oiliness: 50, hydration: 60, sensitivity: 25 }) },
        nose: { metrics: createTestMetrics({ oiliness: 50, hydration: 60, sensitivity: 25 }) },
        leftCheek: { metrics: createTestMetrics({ oiliness: 45, hydration: 60, sensitivity: 25 }) },
        rightCheek: { metrics: createTestMetrics({ oiliness: 45, hydration: 60, sensitivity: 25 }) },
        chin: { metrics: createTestMetrics({ oiliness: 45, hydration: 60, sensitivity: 25 }) },
        eyeArea: { metrics: createTestMetrics({ oiliness: 40, hydration: 60, sensitivity: 25 }) },
        lipArea: { metrics: createTestMetrics({ oiliness: 40, hydration: 60, sensitivity: 25 }) },
      });

      const result = determineSkinType(zones);
      expect(result).toBe('normal');
    });
  });

  // ==========================================================================
  // extractPrimaryConcerns
  // ==========================================================================
  describe('extractPrimaryConcerns', () => {
    it('should extract concerns from all zones', () => {
      const zones = createTestZones({
        forehead: { concerns: ['hydration', 'pores'] },
        nose: { concerns: ['pores', 'oiliness'] },
        leftCheek: { concerns: ['hydration'] },
        rightCheek: { concerns: ['hydration'] },
        chin: { concerns: ['pores'] },
        eyeArea: { concerns: ['wrinkles'] },
        lipArea: { concerns: [] },
      });

      const concerns = extractPrimaryConcerns(zones);

      // 가장 빈번한 고민 추출
      expect(concerns).toContain('hydration');
      expect(concerns).toContain('pores');
    });

    it('should limit to top 3 concerns', () => {
      const zones = createTestZones({
        forehead: { concerns: ['hydration', 'pores', 'texture', 'pigmentation'] },
        nose: { concerns: ['oiliness', 'pores', 'texture', 'sensitivity'] },
        leftCheek: { concerns: ['hydration', 'elasticity'] },
        rightCheek: { concerns: ['hydration', 'elasticity'] },
        chin: { concerns: ['pores', 'oiliness'] },
        eyeArea: { concerns: ['wrinkles', 'elasticity'] },
        lipArea: { concerns: ['hydration'] },
      });

      const concerns = extractPrimaryConcerns(zones);

      expect(concerns.length).toBeLessThanOrEqual(3);
    });
  });

  // ==========================================================================
  // calculateGroupAverages
  // ==========================================================================
  describe('calculateGroupAverages', () => {
    it('should calculate T-zone and U-zone averages', () => {
      const zones = createTestZones({
        forehead: { score: 60 },
        nose: { score: 50 },
        leftCheek: { score: 70 },
        rightCheek: { score: 70 },
        chin: { score: 70 },
        eyeArea: { score: 65 },
        lipArea: { score: 60 },
      });

      const averages = calculateGroupAverages(zones);

      expect(averages.tZone).toBeCloseTo(55, 0); // (60+50)/2
      expect(averages.uZone).toBeCloseTo(70, 0); // (70+70+70)/3
      expect(averages.eyeZone).toBe(65);
      expect(averages.lipZone).toBe(60);
    });
  });

  // ==========================================================================
  // calculateTUZoneDifference
  // ==========================================================================
  describe('calculateTUZoneDifference', () => {
    it('should calculate oiliness and hydration differences', () => {
      const zones = createTestZones({
        forehead: { metrics: createTestMetrics({ oiliness: 80, hydration: 50 }) },
        nose: { metrics: createTestMetrics({ oiliness: 70, hydration: 55 }) },
        leftCheek: { metrics: createTestMetrics({ oiliness: 40, hydration: 65 }) },
        rightCheek: { metrics: createTestMetrics({ oiliness: 40, hydration: 65 }) },
        chin: { metrics: createTestMetrics({ oiliness: 50, hydration: 60 }) },
        eyeArea: { metrics: createTestMetrics({ oiliness: 30, hydration: 60 }) },
        lipArea: { metrics: createTestMetrics({ oiliness: 30, hydration: 60 }) },
      });

      const diff = calculateTUZoneDifference(zones);

      // T존 유분 평균: (80+70)/2 = 75
      // U존 유분 평균: (40+40+50)/3 = 43.3
      // 차이: 약 32
      expect(diff.oilinessDiff).toBeGreaterThan(25);
      expect(diff.isCombiSkin).toBe(true); // 유분 차이 20 이상
    });

    it('should identify non-combination skin when difference is small', () => {
      const zones = createTestZones({
        forehead: { metrics: createTestMetrics({ oiliness: 50, hydration: 60 }) },
        nose: { metrics: createTestMetrics({ oiliness: 55, hydration: 60 }) },
        leftCheek: { metrics: createTestMetrics({ oiliness: 45, hydration: 60 }) },
        rightCheek: { metrics: createTestMetrics({ oiliness: 45, hydration: 60 }) },
        chin: { metrics: createTestMetrics({ oiliness: 50, hydration: 60 }) },
        eyeArea: { metrics: createTestMetrics({ oiliness: 40, hydration: 60 }) },
        lipArea: { metrics: createTestMetrics({ oiliness: 40, hydration: 60 }) },
      });

      const diff = calculateTUZoneDifference(zones);

      expect(diff.oilinessDiff).toBeLessThan(20);
      expect(diff.isCombiSkin).toBe(false);
    });
  });
});
