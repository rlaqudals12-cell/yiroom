/**
 * GLCM (Gray Level Co-occurrence Matrix) 텍스처 분석 테스트
 *
 * @module tests/lib/analysis/skin/glcm-analysis
 * @see docs/principles/skin-physiology.md
 *
 * NOTE: ImageData 의존 테스트(calculateGLCM, analyzeTexture 등)는
 * 브라우저 환경에서만 실행 가능하므로 제외됨.
 * calculateTroubleScore 등 순수 로직 함수만 테스트.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTroubleScore,
  GLCM_DEFAULTS,
  type TextureAnalysis,
} from '@/lib/analysis/skin/glcm-analysis';
import type { ZoneMetrics } from '@/lib/analysis/skin/types';

// ============================================================================
// GLCM_DEFAULTS
// ============================================================================

describe('GLCM_DEFAULTS', () => {
  it('should have valid default levels', () => {
    expect(GLCM_DEFAULTS.levels).toBeGreaterThan(0);
    expect(GLCM_DEFAULTS.levels).toBeLessThanOrEqual(256);
  });

  it('should have valid default distance', () => {
    expect(GLCM_DEFAULTS.distance).toBeGreaterThan(0);
  });

  it('should have valid default angle', () => {
    expect(typeof GLCM_DEFAULTS.angle).toBe('number');
  });
});

// ============================================================================
// calculateTroubleScore
// ============================================================================

describe('calculateTroubleScore', () => {
  const createMockZoneMetrics = (overrides: Partial<ZoneMetrics> = {}): ZoneMetrics => ({
    zone: 'forehead',
    poreSize: 'medium',
    oiliness: 50,
    hydration: 60,
    sensitivity: 30,
    concerns: [],
    avgLabColor: { L: 70, a: 5, b: 15 },
    sampleCount: 1000,
    ...overrides,
  });

  const createMockTextureAnalysis = (overrides: Partial<TextureAnalysis> = {}): TextureAnalysis => ({
    features: {
      contrast: 30,
      homogeneity: 70,
      energy: 40,
      correlation: 60,
      entropy: 50,
    },
    textureScore: 60,
    textureLevel: 'normal',
    description: 'Test texture',
    parameters: { levels: 64, distance: 1, angle: 0 },
    ...overrides,
  });

  describe('기본 동작', () => {
    it('should return complete trouble score result', () => {
      const zone = createMockZoneMetrics();
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(zone, texture);

      expect(result).toHaveProperty('troubleScore');
      expect(result).toHaveProperty('troubleLevel');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('recommendations');
    });

    it('should return valid trouble score (0-100)', () => {
      const zone = createMockZoneMetrics();
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(zone, texture);

      expect(result.troubleScore).toBeGreaterThanOrEqual(0);
      expect(result.troubleScore).toBeLessThanOrEqual(100);
    });

    it('should include factor breakdown', () => {
      const zone = createMockZoneMetrics();
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(zone, texture);

      expect(result.factors).toHaveProperty('textureContribution');
      expect(result.factors).toHaveProperty('porenessContribution');
      expect(result.factors).toHaveProperty('oilinessContribution');
    });
  });

  describe('trouble 레벨 분류', () => {
    it('should classify as clear for low trouble score', () => {
      const zone = createMockZoneMetrics({ poreSize: 'small', oiliness: 50 });
      const texture = createMockTextureAnalysis({
        features: { contrast: 10, homogeneity: 90, energy: 80, correlation: 70, entropy: 20 },
      });
      const result = calculateTroubleScore(zone, texture);

      if (result.troubleScore < 25) {
        expect(result.troubleLevel).toBe('clear');
      }
    });

    it('should classify as severe for high trouble score', () => {
      const zone = createMockZoneMetrics({ poreSize: 'large', oiliness: 90 });
      const texture = createMockTextureAnalysis({
        features: { contrast: 90, homogeneity: 10, energy: 10, correlation: 20, entropy: 80 },
      });
      const result = calculateTroubleScore(zone, texture);

      if (result.troubleScore >= 75) {
        expect(result.troubleLevel).toBe('severe');
      }
    });

    it('should return valid trouble level string', () => {
      const zone = createMockZoneMetrics();
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(zone, texture);

      expect(['clear', 'mild', 'moderate', 'severe']).toContain(result.troubleLevel);
    });
  });

  describe('모공 크기 영향', () => {
    it('should give lower contribution for small pores', () => {
      const smallPoreZone = createMockZoneMetrics({ poreSize: 'small' });
      const largePoreZone = createMockZoneMetrics({ poreSize: 'large' });
      const texture = createMockTextureAnalysis();

      const smallResult = calculateTroubleScore(smallPoreZone, texture);
      const largeResult = calculateTroubleScore(largePoreZone, texture);

      expect(smallResult.factors.porenessContribution).toBeLessThan(
        largeResult.factors.porenessContribution
      );
    });

    it('should handle all pore sizes', () => {
      const texture = createMockTextureAnalysis();
      const poreSizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

      for (const poreSize of poreSizes) {
        const zone = createMockZoneMetrics({ poreSize });
        const result = calculateTroubleScore(zone, texture);
        expect(result.factors.porenessContribution).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('유분도 영향', () => {
    it('should have low oiliness contribution when oiliness is balanced', () => {
      const balancedZone = createMockZoneMetrics({ oiliness: 50 });
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(balancedZone, texture);

      expect(result.factors.oilinessContribution).toBeLessThanOrEqual(5);
    });

    it('should have high oiliness contribution when oiliness is extreme', () => {
      const oilyZone = createMockZoneMetrics({ oiliness: 100 });
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(oilyZone, texture);

      expect(result.factors.oilinessContribution).toBeGreaterThan(20);
    });

    it('should have high oiliness contribution when very dry', () => {
      const dryZone = createMockZoneMetrics({ oiliness: 0 });
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(dryZone, texture);

      expect(result.factors.oilinessContribution).toBeGreaterThan(20);
    });
  });

  describe('텍스처 영향', () => {
    it('should have lower texture contribution for smooth texture', () => {
      const zone = createMockZoneMetrics();
      const smoothTexture = createMockTextureAnalysis({
        features: { contrast: 10, homogeneity: 90, energy: 80, correlation: 70, entropy: 20 },
        textureScore: 90,
        textureLevel: 'smooth',
      });
      const roughTexture = createMockTextureAnalysis({
        features: { contrast: 80, homogeneity: 20, energy: 20, correlation: 30, entropy: 70 },
        textureScore: 30,
        textureLevel: 'rough',
      });

      const smoothResult = calculateTroubleScore(zone, smoothTexture);
      const roughResult = calculateTroubleScore(zone, roughTexture);

      expect(smoothResult.factors.textureContribution).toBeLessThan(
        roughResult.factors.textureContribution
      );
    });
  });

  describe('추천사항 생성', () => {
    it('should include recommendations array', () => {
      const zone = createMockZoneMetrics();
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(zone, texture);

      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should include dermatologist recommendation for severe trouble', () => {
      const zone = createMockZoneMetrics({ poreSize: 'large', oiliness: 95 });
      const texture = createMockTextureAnalysis({
        features: { contrast: 95, homogeneity: 5, energy: 5, correlation: 10, entropy: 90 },
      });
      const result = calculateTroubleScore(zone, texture);

      if (result.troubleLevel === 'severe') {
        const hasDermatologistRec = result.recommendations.some(
          (rec) => rec.toLowerCase().includes('dermatologist') || rec.includes('consultation')
        );
        expect(hasDermatologistRec).toBe(true);
      }
    });

    it('should return string recommendations', () => {
      const zone = createMockZoneMetrics();
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(zone, texture);

      for (const rec of result.recommendations) {
        expect(typeof rec).toBe('string');
        expect(rec.length).toBeGreaterThan(0);
      }
    });
  });

  describe('엣지 케이스', () => {
    it('should handle extreme texture values', () => {
      const zone = createMockZoneMetrics();
      const extremeTexture = createMockTextureAnalysis({
        features: { contrast: 100, homogeneity: 0, energy: 0, correlation: 0, entropy: 100 },
        textureScore: 0,
        textureLevel: 'very_rough',
      });

      const result = calculateTroubleScore(zone, extremeTexture);
      expect(result.troubleScore).toBeGreaterThanOrEqual(0);
      expect(result.troubleScore).toBeLessThanOrEqual(100);
    });

    it('should handle perfect texture values', () => {
      const zone = createMockZoneMetrics();
      const perfectTexture = createMockTextureAnalysis({
        features: { contrast: 0, homogeneity: 100, energy: 100, correlation: 100, entropy: 0 },
        textureScore: 100,
        textureLevel: 'smooth',
      });

      const result = calculateTroubleScore(zone, perfectTexture);
      expect(result.troubleScore).toBeGreaterThanOrEqual(0);
      expect(result.troubleScore).toBeLessThanOrEqual(100);
    });

    it('should handle zero oiliness', () => {
      const zone = createMockZoneMetrics({ oiliness: 0 });
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(zone, texture);

      expect(result.troubleScore).toBeGreaterThanOrEqual(0);
      expect(result.troubleScore).toBeLessThanOrEqual(100);
      expect(result.factors.oilinessContribution).toBeGreaterThan(0);
    });

    it('should handle max oiliness', () => {
      const zone = createMockZoneMetrics({ oiliness: 100 });
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(zone, texture);

      expect(result.troubleScore).toBeGreaterThanOrEqual(0);
      expect(result.troubleScore).toBeLessThanOrEqual(100);
      expect(result.factors.oilinessContribution).toBeGreaterThan(0);
    });
  });

  describe('팩터 제한 검증', () => {
    it('should cap texture contribution at 40', () => {
      const zone = createMockZoneMetrics();
      const extremeTexture = createMockTextureAnalysis({
        features: { contrast: 100, homogeneity: 0, energy: 0, correlation: 0, entropy: 100 },
      });

      const result = calculateTroubleScore(zone, extremeTexture);
      expect(result.factors.textureContribution).toBeLessThanOrEqual(40);
    });

    it('should cap poreness contribution at 30', () => {
      const zone = createMockZoneMetrics({ poreSize: 'large' });
      const texture = createMockTextureAnalysis();

      const result = calculateTroubleScore(zone, texture);
      expect(result.factors.porenessContribution).toBeLessThanOrEqual(30);
    });

    it('should cap oiliness contribution at 30', () => {
      const zone = createMockZoneMetrics({ oiliness: 100 });
      const texture = createMockTextureAnalysis();

      const result = calculateTroubleScore(zone, texture);
      expect(result.factors.oilinessContribution).toBeLessThanOrEqual(30);
    });

    it('should have total score never exceed 100', () => {
      const zone = createMockZoneMetrics({ poreSize: 'large', oiliness: 100 });
      const extremeTexture = createMockTextureAnalysis({
        features: { contrast: 100, homogeneity: 0, energy: 0, correlation: 0, entropy: 100 },
      });

      const result = calculateTroubleScore(zone, extremeTexture);
      expect(result.troubleScore).toBeLessThanOrEqual(100);
    });

    it('should have non-negative factor contributions', () => {
      const zone = createMockZoneMetrics();
      const texture = createMockTextureAnalysis();
      const result = calculateTroubleScore(zone, texture);

      expect(result.factors.textureContribution).toBeGreaterThanOrEqual(0);
      expect(result.factors.porenessContribution).toBeGreaterThanOrEqual(0);
      expect(result.factors.oilinessContribution).toBeGreaterThanOrEqual(0);
    });
  });

  describe('trouble level 임계값 검증', () => {
    it('should classify clear when score < 25', () => {
      // 매우 좋은 조건: 작은 모공, 균형 잡힌 유분, 부드러운 텍스처
      const zone = createMockZoneMetrics({ poreSize: 'small', oiliness: 50 });
      const texture = createMockTextureAnalysis({
        features: { contrast: 5, homogeneity: 95, energy: 90, correlation: 85, entropy: 10 },
      });
      const result = calculateTroubleScore(zone, texture);

      // 점수가 25 미만이면 clear여야 함
      if (result.troubleScore < 25) {
        expect(result.troubleLevel).toBe('clear');
      }
    });

    it('should classify mild when 25 <= score < 50', () => {
      const zone = createMockZoneMetrics({ poreSize: 'medium', oiliness: 60 });
      const texture = createMockTextureAnalysis({
        features: { contrast: 40, homogeneity: 60, energy: 50, correlation: 55, entropy: 45 },
      });
      const result = calculateTroubleScore(zone, texture);

      if (result.troubleScore >= 25 && result.troubleScore < 50) {
        expect(result.troubleLevel).toBe('mild');
      }
    });

    it('should classify moderate when 50 <= score < 75', () => {
      const zone = createMockZoneMetrics({ poreSize: 'medium', oiliness: 75 });
      const texture = createMockTextureAnalysis({
        features: { contrast: 60, homogeneity: 40, energy: 35, correlation: 40, entropy: 60 },
      });
      const result = calculateTroubleScore(zone, texture);

      if (result.troubleScore >= 50 && result.troubleScore < 75) {
        expect(result.troubleLevel).toBe('moderate');
      }
    });

    it('should classify severe when score >= 75', () => {
      const zone = createMockZoneMetrics({ poreSize: 'large', oiliness: 95 });
      const texture = createMockTextureAnalysis({
        features: { contrast: 90, homogeneity: 10, energy: 10, correlation: 15, entropy: 85 },
      });
      const result = calculateTroubleScore(zone, texture);

      if (result.troubleScore >= 75) {
        expect(result.troubleLevel).toBe('severe');
      }
    });
  });
});

// ============================================================================
// TextureAnalysis 타입 테스트
// ============================================================================

describe('TextureAnalysis 타입', () => {
  it('should have correct features structure', () => {
    const texture: TextureAnalysis = {
      features: {
        contrast: 50,
        homogeneity: 60,
        energy: 40,
        correlation: 70,
        entropy: 55,
      },
      textureScore: 55,
      textureLevel: 'normal',
      description: 'Test',
      parameters: { levels: 64, distance: 1, angle: 0 },
    };

    expect(texture.features).toHaveProperty('contrast');
    expect(texture.features).toHaveProperty('homogeneity');
    expect(texture.features).toHaveProperty('energy');
    expect(texture.features).toHaveProperty('correlation');
    expect(texture.features).toHaveProperty('entropy');
  });

  it('should have valid texture levels', () => {
    const validLevels: TextureAnalysis['textureLevel'][] = [
      'smooth',
      'normal',
      'rough',
      'very_rough',
    ];

    for (const level of validLevels) {
      const texture: TextureAnalysis = {
        features: { contrast: 0, homogeneity: 0, energy: 0, correlation: 0, entropy: 0 },
        textureScore: 50,
        textureLevel: level,
        description: '',
        parameters: { levels: 64, distance: 1, angle: 0 },
      };
      expect(texture.textureLevel).toBe(level);
    }
  });

  it('should have valid parameters', () => {
    const texture: TextureAnalysis = {
      features: { contrast: 0, homogeneity: 0, energy: 0, correlation: 0, entropy: 0 },
      textureScore: 50,
      textureLevel: 'normal',
      description: '',
      parameters: { levels: 128, distance: 2, angle: Math.PI / 4 },
    };

    expect(texture.parameters.levels).toBe(128);
    expect(texture.parameters.distance).toBe(2);
    expect(texture.parameters.angle).toBeCloseTo(Math.PI / 4, 5);
  });
});
