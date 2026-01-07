/**
 * M-1 메이크업 분석 Mock 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockMakeupAnalysisResult,
  UNDERTONES,
  EYE_SHAPES,
  LIP_SHAPES,
  FACE_SHAPES,
  MAKEUP_CONCERNS,
  MAKEUP_STYLES,
  type MakeupAnalysisResult,
} from '@/lib/mock/makeup-analysis';

describe('M-1 메이크업 분석 Mock', () => {
  describe('generateMockMakeupAnalysisResult', () => {
    it('유효한 분석 결과를 반환해야 함', () => {
      const result = generateMockMakeupAnalysisResult();

      expect(result).toBeDefined();
      expect(result.undertone).toBeDefined();
      expect(result.eyeShape).toBeDefined();
      expect(result.lipShape).toBeDefined();
      expect(result.faceShape).toBeDefined();
    });

    it('언더톤이 유효한 값이어야 함', () => {
      const result = generateMockMakeupAnalysisResult();
      const validUndertones = ['warm', 'cool', 'neutral'];

      expect(validUndertones).toContain(result.undertone);
      expect(result.undertoneLabel).toBeTruthy();
    });

    it('눈 모양이 유효한 값이어야 함', () => {
      const result = generateMockMakeupAnalysisResult();
      const validEyeShapes = ['monolid', 'double', 'hooded', 'round', 'almond', 'downturned'];

      expect(validEyeShapes).toContain(result.eyeShape);
      expect(result.eyeShapeLabel).toBeTruthy();
    });

    it('입술 모양이 유효한 값이어야 함', () => {
      const result = generateMockMakeupAnalysisResult();
      const validLipShapes = ['full', 'thin', 'wide', 'small', 'heart', 'asymmetric'];

      expect(validLipShapes).toContain(result.lipShape);
      expect(result.lipShapeLabel).toBeTruthy();
    });

    it('얼굴형이 유효한 값이어야 함', () => {
      const result = generateMockMakeupAnalysisResult();
      const validFaceShapes = ['oval', 'round', 'square', 'heart', 'oblong', 'diamond'];

      expect(validFaceShapes).toContain(result.faceShape);
      expect(result.faceShapeLabel).toBeTruthy();
    });

    it('점수가 0-100 범위여야 함', () => {
      const result = generateMockMakeupAnalysisResult();

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('metrics가 필수 지표를 포함해야 함', () => {
      const result = generateMockMakeupAnalysisResult();
      const metricIds = result.metrics.map((m) => m.id);

      expect(metricIds).toContain('skinTexture');
      expect(metricIds).toContain('skinTone');
      expect(metricIds).toContain('hydration');
      expect(metricIds).toContain('poreVisibility');
      expect(metricIds).toContain('oilBalance');
    });

    it('각 metric이 유효한 구조여야 함', () => {
      const result = generateMockMakeupAnalysisResult();

      result.metrics.forEach((metric) => {
        expect(metric.id).toBeTruthy();
        expect(metric.label).toBeTruthy();
        expect(metric.value).toBeGreaterThanOrEqual(0);
        expect(metric.value).toBeLessThanOrEqual(100);
        expect(['good', 'normal', 'warning']).toContain(metric.status);
        expect(metric.description).toBeTruthy();
      });
    });

    it('concerns가 배열이어야 함', () => {
      const result = generateMockMakeupAnalysisResult();

      expect(Array.isArray(result.concerns)).toBe(true);
      expect(result.concerns.length).toBeGreaterThan(0);
    });

    it('insight가 있어야 함', () => {
      const result = generateMockMakeupAnalysisResult();

      expect(result.insight).toBeTruthy();
      expect(typeof result.insight).toBe('string');
      expect(result.insight.length).toBeGreaterThan(10);
    });

    it('recommendedStyles가 있어야 함', () => {
      const result = generateMockMakeupAnalysisResult();
      const validStyles = ['natural', 'glam', 'cute', 'chic', 'vintage', 'edgy'];

      expect(Array.isArray(result.recommendedStyles)).toBe(true);
      expect(result.recommendedStyles.length).toBeGreaterThan(0);
      result.recommendedStyles.forEach((style) => {
        expect(validStyles).toContain(style);
      });
    });

    it('colorRecommendations가 카테고리별로 있어야 함', () => {
      const result = generateMockMakeupAnalysisResult();

      expect(Array.isArray(result.colorRecommendations)).toBe(true);
      expect(result.colorRecommendations.length).toBeGreaterThan(0);

      result.colorRecommendations.forEach((cr) => {
        expect(cr.category).toBeTruthy();
        expect(cr.categoryLabel).toBeTruthy();
        expect(Array.isArray(cr.colors)).toBe(true);
        expect(cr.colors.length).toBeGreaterThan(0);

        cr.colors.forEach((color) => {
          expect(color.name).toBeTruthy();
          expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
          expect(color.description).toBeTruthy();
        });
      });
    });

    it('makeupTips가 있어야 함', () => {
      const result = generateMockMakeupAnalysisResult();

      expect(Array.isArray(result.makeupTips)).toBe(true);
      expect(result.makeupTips.length).toBeGreaterThan(0);

      result.makeupTips.forEach((tipGroup) => {
        expect(tipGroup.category).toBeTruthy();
        expect(Array.isArray(tipGroup.tips)).toBe(true);
        expect(tipGroup.tips.length).toBeGreaterThan(0);
      });
    });

    it('personalColorConnection이 있어야 함', () => {
      const result = generateMockMakeupAnalysisResult();

      expect(result.personalColorConnection).toBeDefined();
      if (result.personalColorConnection) {
        expect(result.personalColorConnection.season).toBeTruthy();
        expect(['high', 'medium', 'low']).toContain(result.personalColorConnection.compatibility);
        expect(result.personalColorConnection.note).toBeTruthy();
      }
    });

    it('analysisReliability가 유효한 값이어야 함', () => {
      const result = generateMockMakeupAnalysisResult();

      expect(['high', 'medium', 'low']).toContain(result.analysisReliability);
    });

    it('analyzedAt이 Date 객체여야 함', () => {
      const result = generateMockMakeupAnalysisResult();

      expect(result.analyzedAt).toBeInstanceOf(Date);
    });

    it('여러 번 호출해도 오류 없이 작동해야 함', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockMakeupAnalysisResult();
        expect(result).toBeDefined();
        expect(result.undertone).toBeDefined();
      }
    });
  });

  describe('상수 정의', () => {
    it('UNDERTONES가 올바르게 정의되어야 함', () => {
      expect(UNDERTONES.length).toBe(3);
      UNDERTONES.forEach((tone) => {
        expect(tone.id).toBeTruthy();
        expect(tone.label).toBeTruthy();
        expect(tone.emoji).toBeTruthy();
      });
    });

    it('EYE_SHAPES가 올바르게 정의되어야 함', () => {
      expect(EYE_SHAPES.length).toBe(6);
      EYE_SHAPES.forEach((shape) => {
        expect(shape.id).toBeTruthy();
        expect(shape.label).toBeTruthy();
      });
    });

    it('LIP_SHAPES가 올바르게 정의되어야 함', () => {
      expect(LIP_SHAPES.length).toBe(6);
      LIP_SHAPES.forEach((shape) => {
        expect(shape.id).toBeTruthy();
        expect(shape.label).toBeTruthy();
      });
    });

    it('FACE_SHAPES가 올바르게 정의되어야 함', () => {
      expect(FACE_SHAPES.length).toBe(6);
      FACE_SHAPES.forEach((shape) => {
        expect(shape.id).toBeTruthy();
        expect(shape.label).toBeTruthy();
      });
    });

    it('MAKEUP_CONCERNS가 올바르게 정의되어야 함', () => {
      expect(MAKEUP_CONCERNS.length).toBe(8);
      MAKEUP_CONCERNS.forEach((concern) => {
        expect(concern.id).toBeTruthy();
        expect(concern.label).toBeTruthy();
        expect(concern.emoji).toBeTruthy();
      });
    });

    it('MAKEUP_STYLES가 올바르게 정의되어야 함', () => {
      expect(MAKEUP_STYLES.length).toBe(6);
      MAKEUP_STYLES.forEach((style) => {
        expect(style.id).toBeTruthy();
        expect(style.label).toBeTruthy();
        expect(style.emoji).toBeTruthy();
      });
    });
  });

  describe('언더톤별 색상 추천', () => {
    it('웜톤일 때 따뜻한 계열 색상이 추천되어야 함', () => {
      // 여러 번 실행해서 웜톤 케이스 찾기
      let warmResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.undertone === 'warm') {
          warmResult = result;
          break;
        }
      }

      if (warmResult) {
        const lipColors = warmResult.colorRecommendations.find((cr) => cr.category === 'lip');
        expect(lipColors).toBeDefined();
        // 웜톤은 코랄, 오렌지 계열 포함
        const hasWarmColors = lipColors?.colors.some(
          (c) => c.name.includes('코랄') || c.name.includes('브릭') || c.name.includes('피치')
        );
        expect(hasWarmColors).toBe(true);
      }
    });

    it('쿨톤일 때 차가운 계열 색상이 추천되어야 함', () => {
      let coolResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.undertone === 'cool') {
          coolResult = result;
          break;
        }
      }

      if (coolResult) {
        const lipColors = coolResult.colorRecommendations.find((cr) => cr.category === 'lip');
        expect(lipColors).toBeDefined();
        // 쿨톤은 로즈, 버건디 계열 포함
        const hasCoolColors = lipColors?.colors.some(
          (c) => c.name.includes('로즈') || c.name.includes('버건디') || c.name.includes('핑크')
        );
        expect(hasCoolColors).toBe(true);
      }
    });
  });
});
