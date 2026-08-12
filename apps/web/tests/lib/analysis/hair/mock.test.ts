/**
 * H-1: hair mock 모듈 테스트
 *
 * @description 헤어 분석 Mock 데이터 생성 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockFaceShapeAnalysis,
  generateMockHairColorAnalysis,
  generateMockHairAnalysisResult,
} from '@/lib/analysis/hair/mock';
import type { FaceShapeType } from '@/lib/analysis/hair/types';

// =============================================================================
// generateMockFaceShapeAnalysis 테스트
// =============================================================================

describe('generateMockFaceShapeAnalysis', () => {
  it('should generate valid face shape analysis', () => {
    const result = generateMockFaceShapeAnalysis();

    expect(result).toHaveProperty('faceShape');
    expect(result).toHaveProperty('faceShapeLabel');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('ratios');
  });

  it('should include all required ratio fields', () => {
    const result = generateMockFaceShapeAnalysis();

    expect(result.ratios).toHaveProperty('faceLength');
    expect(result.ratios).toHaveProperty('faceWidth');
    expect(result.ratios).toHaveProperty('foreheadWidth');
    expect(result.ratios).toHaveProperty('cheekboneWidth');
    expect(result.ratios).toHaveProperty('jawWidth');
    expect(result.ratios).toHaveProperty('lengthToWidthRatio');
  });

  it('should return valid confidence value (65-90)', () => {
    // 여러 번 실행하여 범위 확인
    for (let i = 0; i < 10; i++) {
      const result = generateMockFaceShapeAnalysis();
      expect(result.confidence).toBeGreaterThanOrEqual(65);
      expect(result.confidence).toBeLessThanOrEqual(90);
    }
  });

  it('should use provided face shape when specified', () => {
    const faceShapes: FaceShapeType[] = [
      'oval',
      'round',
      'square',
      'heart',
      'oblong',
      'diamond',
      'rectangle',
    ];

    faceShapes.forEach((shape) => {
      const result = generateMockFaceShapeAnalysis(shape);
      expect(result.faceShape).toBe(shape);
    });
  });

  it('should generate consistent ratios for each face shape', () => {
    // 타원형: 비율 약 1.3-1.5
    const ovalResult = generateMockFaceShapeAnalysis('oval');
    expect(ovalResult.ratios.lengthToWidthRatio).toBeGreaterThan(1.2);
    expect(ovalResult.ratios.lengthToWidthRatio).toBeLessThan(1.6);

    // 둥근형: 비율 약 1.0-1.1
    const roundResult = generateMockFaceShapeAnalysis('round');
    expect(roundResult.ratios.lengthToWidthRatio).toBeGreaterThan(0.9);
    expect(roundResult.ratios.lengthToWidthRatio).toBeLessThan(1.2);

    // 긴형: 비율 약 1.5-1.8
    const oblongResult = generateMockFaceShapeAnalysis('oblong');
    expect(oblongResult.ratios.lengthToWidthRatio).toBeGreaterThan(1.4);
    expect(oblongResult.ratios.lengthToWidthRatio).toBeLessThan(2.0);
  });

  it('should include Korean label for face shape', () => {
    const labelMap: Record<FaceShapeType, string> = {
      oval: '타원형',
      round: '둥근형',
      square: '사각형',
      heart: '하트형',
      oblong: '긴 형',
      diamond: '다이아몬드형',
      rectangle: '직사각형',
    };

    Object.entries(labelMap).forEach(([shape, expectedLabel]) => {
      const result = generateMockFaceShapeAnalysis(shape as FaceShapeType);
      expect(result.faceShapeLabel).toBe(expectedLabel);
    });
  });

  it('should apply seed-based variance to base ratios', () => {
    // 서로 다른 시드는 서로 다른 variance를 적용해야 함 (결정론적 다양성)
    const results = ['s1', 's2', 's3', 's4', 's5'].map((seed) =>
      generateMockFaceShapeAnalysis('oval', seed)
    );

    const lengths = results.map((r) => r.ratios.faceLength);
    const uniqueLengths = new Set(lengths);
    expect(uniqueLengths.size).toBeGreaterThan(1);
  });

  it('should be deterministic for the same seed (재현성)', () => {
    const a = generateMockFaceShapeAnalysis(undefined, 'user-42:image-abc');
    const b = generateMockFaceShapeAnalysis(undefined, 'user-42:image-abc');
    expect(a).toEqual(b);
    // 시드가 얼굴형 선택까지 결정 — 같은 시드면 얼굴형도 동일
    expect(a.faceShape).toBe(b.faceShape);
  });

  it('should not use Math.random (default seed is stable)', () => {
    const a = generateMockFaceShapeAnalysis();
    const b = generateMockFaceShapeAnalysis();
    expect(a).toEqual(b);
  });

  it('should return valid ratio ranges (0-1 normalized)', () => {
    const result = generateMockFaceShapeAnalysis();

    expect(result.ratios.faceLength).toBeGreaterThan(0);
    expect(result.ratios.faceLength).toBeLessThan(1);
    expect(result.ratios.faceWidth).toBeGreaterThan(0);
    expect(result.ratios.faceWidth).toBeLessThan(1);
    expect(result.ratios.foreheadWidth).toBeGreaterThan(0);
    expect(result.ratios.foreheadWidth).toBeLessThan(1);
    expect(result.ratios.cheekboneWidth).toBeGreaterThan(0);
    expect(result.ratios.cheekboneWidth).toBeLessThan(1);
    expect(result.ratios.jawWidth).toBeGreaterThan(0);
    expect(result.ratios.jawWidth).toBeLessThan(1);
  });
});

// =============================================================================
// generateMockHairColorAnalysis 테스트
// =============================================================================

describe('generateMockHairColorAnalysis', () => {
  it('should generate valid hair color analysis', () => {
    const result = generateMockHairColorAnalysis();

    expect(result).toHaveProperty('currentColor');
    expect(result).toHaveProperty('skinToneMatch');
    expect(result).toHaveProperty('recommendedColors');
  });

  it('should include current color details', () => {
    const result = generateMockHairColorAnalysis();

    expect(result.currentColor).toBeDefined();
    expect(result.currentColor).toHaveProperty('name');
    expect(result.currentColor).toHaveProperty('hexColor');
    expect(result.currentColor).toHaveProperty('labColor');

    // Lab 색상 검증
    const { currentColor } = result;
    expect(currentColor).toBeDefined();
    if (currentColor && currentColor.labColor) {
      expect(currentColor.labColor).toHaveProperty('L');
      expect(currentColor.labColor).toHaveProperty('a');
      expect(currentColor.labColor).toHaveProperty('b');
    }
  });

  it('should return valid skin tone match score (60-90)', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateMockHairColorAnalysis();
      expect(result.skinToneMatch).toBeGreaterThanOrEqual(60);
      expect(result.skinToneMatch).toBeLessThanOrEqual(90);
    }
  });

  it('should return season-specific colors when season provided', () => {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];

    seasons.forEach((season) => {
      const result = generateMockHairColorAnalysis(season);
      expect(result.recommendedColors.length).toBeGreaterThan(0);
      expect(result.recommendedColors[0].seasonMatch).toBe(season);
    });
  });

  it('should return default colors when season not provided', () => {
    const result = generateMockHairColorAnalysis();
    expect(result.recommendedColors.length).toBeGreaterThan(0);
  });

  it('should return up to 4 recommended colors', () => {
    const result = generateMockHairColorAnalysis('spring');
    expect(result.recommendedColors.length).toBeLessThanOrEqual(4);
  });

  it('should include valid hex colors', () => {
    const result = generateMockHairColorAnalysis('autumn');

    expect(result.currentColor).toBeDefined();
    if (result.currentColor) {
      expect(result.currentColor.hexColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
    result.recommendedColors.forEach((color) => {
      expect(color.hexColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should include valid Lab color values', () => {
    const result = generateMockHairColorAnalysis();

    // L: 0-100, a: -128 to 127, b: -128 to 127 (simplified range for mock)
    expect(result.currentColor).toBeDefined();
    if (result.currentColor && result.currentColor.labColor) {
      expect(result.currentColor.labColor.L).toBeGreaterThanOrEqual(0);
      expect(result.currentColor.labColor.L).toBeLessThanOrEqual(100);
    }
  });
});

// =============================================================================
// generateMockHairAnalysisResult 테스트
// =============================================================================

describe('generateMockHairAnalysisResult', () => {
  it('should generate complete hair analysis result', () => {
    const result = generateMockHairAnalysisResult();

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('faceShapeAnalysis');
    expect(result).toHaveProperty('hairColorAnalysis');
    expect(result).toHaveProperty('currentHairInfo');
    expect(result).toHaveProperty('styleRecommendations');
    expect(result).toHaveProperty('careTips');
    expect(result).toHaveProperty('analyzedAt');
    expect(result).toHaveProperty('usedFallback');
  });

  it('should mark result as fallback', () => {
    const result = generateMockHairAnalysisResult();
    expect(result.usedFallback).toBe(true);
  });

  it('should generate unique IDs', () => {
    const results = Array.from({ length: 5 }, () => generateMockHairAnalysisResult());

    const ids = results.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });

  it('should include valid current hair info', () => {
    const result = generateMockHairAnalysisResult();

    expect(result.currentHairInfo).toBeDefined();
    expect(result.currentHairInfo).toHaveProperty('length');
    expect(result.currentHairInfo).toHaveProperty('texture');
    expect(result.currentHairInfo).toHaveProperty('thickness');
    expect(result.currentHairInfo).toHaveProperty('density');
    expect(result.currentHairInfo).toHaveProperty('scalpCondition');

    // 유효한 값인지 확인
    const { currentHairInfo } = result;
    if (currentHairInfo) {
      expect(['short', 'medium', 'long']).toContain(currentHairInfo.length);
      expect(['straight', 'wavy', 'curly']).toContain(currentHairInfo.texture);
      expect(['fine', 'medium', 'thick']).toContain(currentHairInfo.thickness);
      expect(['thin', 'normal', 'dense']).toContain(currentHairInfo.density);
      expect(['dry', 'normal', 'oily', 'sensitive']).toContain(currentHairInfo.scalpCondition);
    }
  });

  it('should include style recommendations', () => {
    const result = generateMockHairAnalysisResult();

    expect(result.styleRecommendations).toBeInstanceOf(Array);
    expect(result.styleRecommendations.length).toBeGreaterThan(0);

    result.styleRecommendations.forEach((style) => {
      expect(style).toHaveProperty('name');
      expect(style).toHaveProperty('description');
      expect(style).toHaveProperty('length');
      expect(style).toHaveProperty('suitability');
      expect(style).toHaveProperty('tags');
    });
  });

  it('should include care tips', () => {
    const result = generateMockHairAnalysisResult();

    expect(result.careTips).toBeInstanceOf(Array);
    expect(result.careTips.length).toBeGreaterThan(0);
    result.careTips.forEach((tip) => {
      expect(typeof tip).toBe('string');
    });
  });

  it('should use provided face shape option', () => {
    const result = generateMockHairAnalysisResult({ faceShape: 'heart' });
    expect(result.faceShapeAnalysis.faceShape).toBe('heart');
  });

  it('should use provided personal color season option', () => {
    const result = generateMockHairAnalysisResult({ personalColorSeason: 'winter' });
    expect(result.hairColorAnalysis).toBeDefined();
    if (result.hairColorAnalysis) {
      expect(result.hairColorAnalysis.recommendedColors[0].seasonMatch).toBe('winter');
    }
  });

  it('should include valid ISO date string for analyzedAt', () => {
    const result = generateMockHairAnalysisResult();

    expect(result.analyzedAt).toBeDefined();
    expect(() => new Date(result.analyzedAt)).not.toThrow();
    expect(new Date(result.analyzedAt).toISOString()).toBe(result.analyzedAt);
  });

  it('should generate face shape analysis matching provided type', () => {
    const faceShapes: FaceShapeType[] = ['oval', 'round', 'square', 'heart'];

    faceShapes.forEach((shape) => {
      const result = generateMockHairAnalysisResult({ faceShape: shape });
      expect(result.faceShapeAnalysis.faceShape).toBe(shape);
    });
  });

  it('should generate style recommendations based on face shape', () => {
    const ovalResult = generateMockHairAnalysisResult({ faceShape: 'oval' });
    const roundResult = generateMockHairAnalysisResult({ faceShape: 'round' });

    // 타원형과 둥근형의 추천 스타일이 다를 수 있음
    expect(ovalResult.styleRecommendations.length).toBeGreaterThan(0);
    expect(roundResult.styleRecommendations.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Hair Mock Edge Cases', () => {
  it('should handle undefined face shape gracefully', () => {
    const result = generateMockFaceShapeAnalysis(undefined);
    expect(result.faceShape).toBeDefined();
    expect(['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'rectangle']).toContain(
      result.faceShape
    );
  });

  it('should handle undefined personal color season gracefully', () => {
    const result = generateMockHairColorAnalysis(undefined);
    expect(result.recommendedColors).toBeDefined();
    expect(result.recommendedColors.length).toBeGreaterThan(0);
  });

  it('should handle undefined options gracefully', () => {
    const result = generateMockHairAnalysisResult(undefined);
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('should handle empty options object gracefully', () => {
    const result = generateMockHairAnalysisResult({});
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('should be deterministic for the same seed but keep unique record ids', () => {
    const a = generateMockHairAnalysisResult({ seed: 'user-7:image-xyz' });
    const b = generateMockHairAnalysisResult({ seed: 'user-7:image-xyz' });

    // 재현성: 같은 시드 → 정체성/분석 내용 동일
    expect(a.faceShapeAnalysis).toEqual(b.faceShapeAnalysis);
    expect(a.currentHairInfo).toEqual(b.currentHairInfo);
    expect(a.hairColorAnalysis).toEqual(b.hairColorAnalysis);

    // 레코드 ID는 재현 대상이 아니라 레코드마다 고유
    expect(a.id).not.toBe(b.id);
  });

  it('should produce different identities for different seeds', () => {
    const seeds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const faceShapes = seeds.map(
      (seed) => generateMockHairAnalysisResult({ seed }).faceShapeAnalysis.faceShape
    );
    // 서로 다른 시드는 얼굴형 분포가 하나로 고정되지 않아야 함
    expect(new Set(faceShapes).size).toBeGreaterThan(1);
  });
});
