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

    it('뉴트럴일 때 다양한 계열 색상이 추천되어야 함', () => {
      let neutralResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.undertone === 'neutral') {
          neutralResult = result;
          break;
        }
      }

      if (neutralResult) {
        const lipColors = neutralResult.colorRecommendations.find((cr) => cr.category === 'lip');
        expect(lipColors).toBeDefined();
        // 뉴트럴은 모브, 로지, 베리 계열 포함
        const hasNeutralColors = lipColors?.colors.some(
          (c) => c.name.includes('모브') || c.name.includes('로지') || c.name.includes('베리')
        );
        expect(hasNeutralColors).toBe(true);
      }
    });
  });

  describe('언더톤-라벨 매핑 일관성', () => {
    it('undertone과 undertoneLabel이 정확히 매핑되어야 함', () => {
      const labelMap: Record<string, string> = {
        warm: '웜톤',
        cool: '쿨톤',
        neutral: '뉴트럴',
      };

      // 여러 번 실행하여 모든 매핑 확인
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        expect(result.undertoneLabel).toBe(labelMap[result.undertone]);
      }
    });

    it('eyeShape과 eyeShapeLabel이 정확히 매핑되어야 함', () => {
      const labelMap: Record<string, string> = {
        monolid: '무쌍',
        double: '유쌍',
        hooded: '속쌍',
        round: '둥근 눈',
        almond: '아몬드형',
        downturned: '처진 눈',
      };

      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        expect(result.eyeShapeLabel).toBe(labelMap[result.eyeShape]);
      }
    });

    it('lipShape과 lipShapeLabel이 정확히 매핑되어야 함', () => {
      const labelMap: Record<string, string> = {
        full: '도톰한 입술',
        thin: '얇은 입술',
        wide: '넓은 입술',
        small: '작은 입술',
        heart: '하트형',
        asymmetric: '비대칭',
      };

      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        expect(result.lipShapeLabel).toBe(labelMap[result.lipShape]);
      }
    });

    it('faceShape과 faceShapeLabel이 정확히 매핑되어야 함', () => {
      const labelMap: Record<string, string> = {
        oval: '계란형',
        round: '둥근형',
        square: '각진형',
        heart: '하트형',
        oblong: '긴 얼굴',
        diamond: '다이아몬드',
      };

      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        expect(result.faceShapeLabel).toBe(labelMap[result.faceShape]);
      }
    });
  });

  describe('얼굴형별 스타일 추천', () => {
    it('계란형은 natural, glam, chic을 추천해야 함', () => {
      let ovalResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 100; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.faceShape === 'oval') {
          ovalResult = result;
          break;
        }
      }

      if (ovalResult) {
        expect(ovalResult.recommendedStyles).toEqual(['natural', 'glam', 'chic']);
      }
    });

    it('둥근형은 chic, glam, edgy를 추천해야 함', () => {
      let roundResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 100; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.faceShape === 'round') {
          roundResult = result;
          break;
        }
      }

      if (roundResult) {
        expect(roundResult.recommendedStyles).toEqual(['chic', 'glam', 'edgy']);
      }
    });

    it('각진형은 natural, glam, vintage를 추천해야 함', () => {
      let squareResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 100; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.faceShape === 'square') {
          squareResult = result;
          break;
        }
      }

      if (squareResult) {
        expect(squareResult.recommendedStyles).toEqual(['natural', 'glam', 'vintage']);
      }
    });

    it('추천 스타일은 항상 3개여야 함', () => {
      for (let i = 0; i < 30; i++) {
        const result = generateMockMakeupAnalysisResult();
        expect(result.recommendedStyles).toHaveLength(3);
      }
    });
  });

  describe('metric status 로직', () => {
    it('70 이상인 metric은 good 상태여야 함', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockMakeupAnalysisResult();
        result.metrics.forEach((metric) => {
          if (metric.value >= 70) {
            expect(metric.status).toBe('good');
          }
        });
      }
    });

    it('40-69인 metric은 normal 상태여야 함', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockMakeupAnalysisResult();
        result.metrics.forEach((metric) => {
          if (metric.value >= 40 && metric.value < 70) {
            expect(metric.status).toBe('normal');
          }
        });
      }
    });

    it('40 미만인 metric은 warning 상태여야 함', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockMakeupAnalysisResult();
        result.metrics.forEach((metric) => {
          if (metric.value < 40) {
            expect(metric.status).toBe('warning');
          }
        });
      }
    });
  });

  describe('overallScore 계산', () => {
    it('overallScore가 metrics의 평균이어야 함', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockMakeupAnalysisResult();
        const expectedAvg = Math.round(
          result.metrics.reduce((sum, m) => sum + m.value, 0) / result.metrics.length
        );
        expect(result.overallScore).toBe(expectedAvg);
      }
    });

    it('overallScore가 정수여야 함', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockMakeupAnalysisResult();
        expect(Number.isInteger(result.overallScore)).toBe(true);
      }
    });
  });

  describe('concerns 생성 로직', () => {
    it('concerns에 유효한 MakeupConcernId만 포함되어야 함', () => {
      const validConcerns = [
        'dark-circles',
        'redness',
        'uneven-tone',
        'large-pores',
        'oily-tzone',
        'dry-patches',
        'acne-scars',
        'fine-lines',
      ];

      for (let i = 0; i < 30; i++) {
        const result = generateMockMakeupAnalysisResult();
        result.concerns.forEach((concern) => {
          expect(validConcerns).toContain(concern);
        });
      }
    });

    it('concerns가 항상 최소 1개 이상이어야 함', () => {
      // 기본 로직: 아무 조건도 안 맞으면 redness를 추가
      for (let i = 0; i < 30; i++) {
        const result = generateMockMakeupAnalysisResult();
        expect(result.concerns.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('concerns에 중복이 없어야 함', () => {
      for (let i = 0; i < 30; i++) {
        const result = generateMockMakeupAnalysisResult();
        const uniqueConcerns = new Set(result.concerns);
        expect(uniqueConcerns.size).toBe(result.concerns.length);
      }
    });
  });

  describe('colorRecommendations 카테고리 완전성', () => {
    it('모든 결과에 5개 카테고리가 포함되어야 함', () => {
      const requiredCategories = ['foundation', 'lip', 'eyeshadow', 'blush', 'contour'];

      for (let i = 0; i < 20; i++) {
        const result = generateMockMakeupAnalysisResult();
        const categories = result.colorRecommendations.map((cr) => cr.category);
        requiredCategories.forEach((cat) => {
          expect(categories).toContain(cat);
        });
      }
    });

    it('categoryLabel이 한국어로 표시되어야 함', () => {
      const result = generateMockMakeupAnalysisResult();
      result.colorRecommendations.forEach((cr) => {
        // 한글 포함 여부 확인
        expect(cr.categoryLabel).toMatch(/[가-힣]/);
      });
    });
  });

  describe('makeupTips 구조', () => {
    it('4개 팁 카테고리가 항상 존재해야 함', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockMakeupAnalysisResult();
        expect(result.makeupTips).toHaveLength(4);

        const categories = result.makeupTips.map((t) => t.category);
        expect(categories).toContain('베이스');
        expect(categories).toContain('아이 메이크업');
        expect(categories).toContain('립 메이크업');
        expect(categories).toContain('컨투어링');
      }
    });

    it('각 팁 카테고리에 최소 2개 팁이 있어야 함', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockMakeupAnalysisResult();
        result.makeupTips.forEach((tipGroup) => {
          expect(tipGroup.tips.length).toBeGreaterThanOrEqual(2);
        });
      }
    });

    it('베이스 팁이 concerns에 따라 변화해야 함', () => {
      // 여러 번 실행하여 다양한 팁 확인 (concerns에 따라 다른 팁)
      const baseTips = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        const baseTipGroup = result.makeupTips.find((t) => t.category === '베이스');
        baseTipGroup?.tips.forEach((tip) => baseTips.add(tip));
      }
      // 최소 3가지 이상 다른 팁이 생성되어야 함
      expect(baseTips.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('personalColorConnection 로직', () => {
    it('뉴트럴 언더톤은 high 호환성이어야 함', () => {
      let neutralResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.undertone === 'neutral') {
          neutralResult = result;
          break;
        }
      }

      if (neutralResult?.personalColorConnection) {
        expect(neutralResult.personalColorConnection.compatibility).toBe('high');
      }
    });

    it('warm/cool 언더톤은 medium 호환성이어야 함', () => {
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.undertone !== 'neutral' && result.personalColorConnection) {
          expect(result.personalColorConnection.compatibility).toBe('medium');
        }
      }
    });

    it('웜톤의 시즌은 봄 웜 또는 가을 웜이어야 함', () => {
      let warmResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.undertone === 'warm') {
          warmResult = result;
          break;
        }
      }

      if (warmResult?.personalColorConnection) {
        expect(warmResult.personalColorConnection.season).toBe('봄 웜 또는 가을 웜');
      }
    });

    it('쿨톤의 시즌은 여름 쿨 또는 겨울 쿨이어야 함', () => {
      let coolResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.undertone === 'cool') {
          coolResult = result;
          break;
        }
      }

      if (coolResult?.personalColorConnection) {
        expect(coolResult.personalColorConnection.season).toBe('여름 쿨 또는 겨울 쿨');
      }
    });
  });

  describe('insight 텍스트 구성', () => {
    it('insight에 언더톤 라벨이 포함되어야 함', () => {
      const result = generateMockMakeupAnalysisResult();
      expect(result.insight).toContain(result.undertoneLabel);
    });

    it('insight에 얼굴형 라벨이 포함되어야 함', () => {
      const result = generateMockMakeupAnalysisResult();
      expect(result.insight).toContain(result.faceShapeLabel);
    });

    it('웜톤 insight에 따뜻한 색상 키워드가 포함되어야 함', () => {
      let warmResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.undertone === 'warm') {
          warmResult = result;
          break;
        }
      }

      if (warmResult) {
        expect(warmResult.insight).toMatch(/코랄|브라운/);
      }
    });

    it('쿨톤 insight에 차가운 색상 키워드가 포함되어야 함', () => {
      let coolResult: MakeupAnalysisResult | null = null;
      for (let i = 0; i < 50; i++) {
        const result = generateMockMakeupAnalysisResult();
        if (result.undertone === 'cool') {
          coolResult = result;
          break;
        }
      }

      if (coolResult) {
        expect(coolResult.insight).toMatch(/로즈|핑크/);
      }
    });
  });

  describe('metric 값 범위', () => {
    it('skinTexture는 40-90 범위여야 함', () => {
      for (let i = 0; i < 30; i++) {
        const result = generateMockMakeupAnalysisResult();
        const metric = result.metrics.find((m) => m.id === 'skinTexture');
        expect(metric?.value).toBeGreaterThanOrEqual(40);
        expect(metric?.value).toBeLessThanOrEqual(90);
      }
    });

    it('skinTone은 45-85 범위여야 함', () => {
      for (let i = 0; i < 30; i++) {
        const result = generateMockMakeupAnalysisResult();
        const metric = result.metrics.find((m) => m.id === 'skinTone');
        expect(metric?.value).toBeGreaterThanOrEqual(45);
        expect(metric?.value).toBeLessThanOrEqual(85);
      }
    });

    it('hydration은 35-88 범위여야 함', () => {
      for (let i = 0; i < 30; i++) {
        const result = generateMockMakeupAnalysisResult();
        const metric = result.metrics.find((m) => m.id === 'hydration');
        expect(metric?.value).toBeGreaterThanOrEqual(35);
        expect(metric?.value).toBeLessThanOrEqual(88);
      }
    });

    it('poreVisibility는 30-80 범위여야 함', () => {
      for (let i = 0; i < 30; i++) {
        const result = generateMockMakeupAnalysisResult();
        const metric = result.metrics.find((m) => m.id === 'poreVisibility');
        expect(metric?.value).toBeGreaterThanOrEqual(30);
        expect(metric?.value).toBeLessThanOrEqual(80);
      }
    });

    it('oilBalance는 40-85 범위여야 함', () => {
      for (let i = 0; i < 30; i++) {
        const result = generateMockMakeupAnalysisResult();
        const metric = result.metrics.find((m) => m.id === 'oilBalance');
        expect(metric?.value).toBeGreaterThanOrEqual(40);
        expect(metric?.value).toBeLessThanOrEqual(85);
      }
    });
  });

  describe('상수 description 필드', () => {
    it('UNDERTONES 각 항목에 description이 있어야 함', () => {
      UNDERTONES.forEach((tone) => {
        expect(tone.description).toBeTruthy();
        expect(typeof tone.description).toBe('string');
      });
    });

    it('EYE_SHAPES 각 항목에 description이 있어야 함', () => {
      EYE_SHAPES.forEach((shape) => {
        expect(shape.description).toBeTruthy();
        expect(typeof shape.description).toBe('string');
      });
    });

    it('LIP_SHAPES 각 항목에 description이 있어야 함', () => {
      LIP_SHAPES.forEach((shape) => {
        expect(shape.description).toBeTruthy();
        expect(typeof shape.description).toBe('string');
      });
    });

    it('FACE_SHAPES 각 항목에 description이 있어야 함', () => {
      FACE_SHAPES.forEach((shape) => {
        expect(shape.description).toBeTruthy();
        expect(typeof shape.description).toBe('string');
      });
    });

    it('MAKEUP_STYLES 각 항목에 description이 있어야 함', () => {
      MAKEUP_STYLES.forEach((style) => {
        expect(style.description).toBeTruthy();
        expect(typeof style.description).toBe('string');
      });
    });

    it('MAKEUP_CONCERNS 각 항목에 description이 있어야 함', () => {
      MAKEUP_CONCERNS.forEach((concern) => {
        expect(concern.description).toBeTruthy();
        expect(typeof concern.description).toBe('string');
      });
    });
  });
});
