/**
 * H-1 헤어분석 모듈 배럴 익스포트 테스트
 *
 * @module tests/lib/analysis/hair/index
 * @description 얼굴형 기반 헤어스타일 추천 시스템
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */

import { describe, it, expect } from 'vitest';
import * as HairModule from '@/lib/analysis/hair';

describe('lib/analysis/hair 배럴 익스포트', () => {
  // ==========================================================================
  // 타입 및 상수 익스포트
  // ==========================================================================
  describe('상수 익스포트', () => {
    it('FACE_SHAPE_LABELS가 export된다', () => {
      expect(HairModule.FACE_SHAPE_LABELS).toBeDefined();
      expect(typeof HairModule.FACE_SHAPE_LABELS).toBe('object');
    });

    it('FACE_SHAPE_DESCRIPTIONS가 export된다', () => {
      expect(HairModule.FACE_SHAPE_DESCRIPTIONS).toBeDefined();
      expect(typeof HairModule.FACE_SHAPE_DESCRIPTIONS).toBe('object');
    });

    it('FACE_SHAPE_STYLE_MAPPING이 export된다', () => {
      expect(HairModule.FACE_SHAPE_STYLE_MAPPING).toBeDefined();
      expect(typeof HairModule.FACE_SHAPE_STYLE_MAPPING).toBe('object');
    });

    it('HAIR_THICKNESS_LABELS가 export된다', () => {
      expect(HairModule.HAIR_THICKNESS_LABELS).toBeDefined();
      expect(typeof HairModule.HAIR_THICKNESS_LABELS).toBe('object');
    });

    it('HAIR_TEXTURE_LABELS가 export된다', () => {
      expect(HairModule.HAIR_TEXTURE_LABELS).toBeDefined();
      expect(typeof HairModule.HAIR_TEXTURE_LABELS).toBe('object');
    });

    it('SCALP_CONDITION_LABELS가 export된다', () => {
      expect(HairModule.SCALP_CONDITION_LABELS).toBeDefined();
      expect(typeof HairModule.SCALP_CONDITION_LABELS).toBe('object');
    });
  });

  // ==========================================================================
  // 얼굴형 분석
  // ==========================================================================
  describe('얼굴형 분석', () => {
    it('analyzeFaceShape가 export된다', () => {
      expect(HairModule.analyzeFaceShape).toBeDefined();
      expect(typeof HairModule.analyzeFaceShape).toBe('function');
    });

    it('estimateFaceShapeFromPose가 export된다', () => {
      expect(HairModule.estimateFaceShapeFromPose).toBeDefined();
      expect(typeof HairModule.estimateFaceShapeFromPose).toBe('function');
    });

    it('getFaceShapeDescription이 export된다', () => {
      expect(HairModule.getFaceShapeDescription).toBeDefined();
      expect(typeof HairModule.getFaceShapeDescription).toBe('function');
    });

    it('getFaceShapeConfidenceGrade가 export된다', () => {
      expect(HairModule.getFaceShapeConfidenceGrade).toBeDefined();
      expect(typeof HairModule.getFaceShapeConfidenceGrade).toBe('function');
    });

    it('getFaceShapeDescription이 얼굴형 설명을 반환한다', () => {
      const description = HairModule.getFaceShapeDescription('oval');
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });

    it('getFaceShapeConfidenceGrade가 등급 객체를 반환한다', () => {
      // 높은 신뢰도 (85+)
      const highGrade = HairModule.getFaceShapeConfidenceGrade(90);
      expect(highGrade).toHaveProperty('label');
      expect(highGrade).toHaveProperty('color');
      expect(highGrade.label).toBe('매우 높음');
      expect(highGrade.color).toBe('emerald');

      // 중간 신뢰도 (70-84)
      const midGrade = HairModule.getFaceShapeConfidenceGrade(75);
      expect(midGrade.label).toBe('높음');
      expect(midGrade.color).toBe('blue');

      // 낮은 신뢰도 (55 미만)
      const lowGrade = HairModule.getFaceShapeConfidenceGrade(50);
      expect(lowGrade.label).toBe('낮음');
      expect(lowGrade.color).toBe('red');
    });
  });

  // ==========================================================================
  // 헤어스타일 추천
  // ==========================================================================
  describe('헤어스타일 추천', () => {
    it('recommendHairstyles가 export된다', () => {
      expect(HairModule.recommendHairstyles).toBeDefined();
      expect(typeof HairModule.recommendHairstyles).toBe('function');
    });

    it('recommendHairColors가 export된다', () => {
      expect(HairModule.recommendHairColors).toBeDefined();
      expect(typeof HairModule.recommendHairColors).toBe('function');
    });

    it('generateCareTips가 export된다', () => {
      expect(HairModule.generateCareTips).toBeDefined();
      expect(typeof HairModule.generateCareTips).toBe('function');
    });

    it('getStylesToAvoid가 export된다', () => {
      expect(HairModule.getStylesToAvoid).toBeDefined();
      expect(typeof HairModule.getStylesToAvoid).toBe('function');
    });

    it('recommendHairstyles가 추천 목록을 반환한다', () => {
      const recommendations = HairModule.recommendHairstyles('oval');
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('getStylesToAvoid가 피해야 할 스타일을 반환한다', () => {
      const stylesToAvoid = HairModule.getStylesToAvoid('round');
      expect(stylesToAvoid).toBeDefined();
      expect(Array.isArray(stylesToAvoid)).toBe(true);
    });
  });

  // ==========================================================================
  // Mock 데이터
  // ==========================================================================
  describe('Mock 데이터', () => {
    it('generateMockFaceShapeAnalysis가 export된다', () => {
      expect(HairModule.generateMockFaceShapeAnalysis).toBeDefined();
      expect(typeof HairModule.generateMockFaceShapeAnalysis).toBe('function');
    });

    it('generateMockHairColorAnalysis가 export된다', () => {
      expect(HairModule.generateMockHairColorAnalysis).toBeDefined();
      expect(typeof HairModule.generateMockHairColorAnalysis).toBe('function');
    });

    it('generateMockHairAnalysisResult가 export된다', () => {
      expect(HairModule.generateMockHairAnalysisResult).toBeDefined();
      expect(typeof HairModule.generateMockHairAnalysisResult).toBe('function');
    });

    it('generateMockFaceShapeAnalysis가 유효한 결과를 반환한다', () => {
      const mockResult = HairModule.generateMockFaceShapeAnalysis();
      expect(mockResult).toHaveProperty('faceShape');
      expect(mockResult).toHaveProperty('confidence');
      expect(mockResult.confidence).toBeGreaterThanOrEqual(0);
      expect(mockResult.confidence).toBeLessThanOrEqual(100);
    });

    it('generateMockHairAnalysisResult가 유효한 결과를 반환한다', () => {
      const mockResult = HairModule.generateMockHairAnalysisResult();
      expect(mockResult).toHaveProperty('id');
      expect(mockResult).toHaveProperty('faceShapeAnalysis');
      expect(mockResult).toHaveProperty('hairColorAnalysis');
      expect(mockResult).toHaveProperty('styleRecommendations');
      expect(mockResult).toHaveProperty('careTips');
      expect(mockResult.faceShapeAnalysis).toHaveProperty('faceShape');
      expect(mockResult.faceShapeAnalysis).toHaveProperty('confidence');
    });
  });

  // ==========================================================================
  // 통합 테스트
  // ==========================================================================
  describe('통합 테스트', () => {
    it('얼굴형 분석 -> 스타일 추천 파이프라인이 동작한다', () => {
      // Mock 얼굴형 분석 결과
      const faceShapeAnalysis = HairModule.generateMockFaceShapeAnalysis();
      expect(faceShapeAnalysis.faceShape).toBeDefined();

      // 얼굴형에 따른 스타일 추천
      const recommendations = HairModule.recommendHairstyles(faceShapeAnalysis.faceShape);
      expect(Array.isArray(recommendations)).toBe(true);

      // 피해야 할 스타일
      const stylesToAvoid = HairModule.getStylesToAvoid(faceShapeAnalysis.faceShape);
      expect(Array.isArray(stylesToAvoid)).toBe(true);
    });

    it('FACE_SHAPE_LABELS에 모든 얼굴형이 포함된다', () => {
      const faceShapes: HairModule.FaceShapeType[] = [
        'oval',
        'round',
        'oblong',
        'square',
        'heart',
        'diamond',
      ];

      for (const shape of faceShapes) {
        expect(HairModule.FACE_SHAPE_LABELS[shape]).toBeDefined();
        expect(typeof HairModule.FACE_SHAPE_LABELS[shape]).toBe('string');
      }
    });
  });

  // ==========================================================================
  // 모듈 구조 검증
  // ==========================================================================
  describe('모듈 구조', () => {
    it('필수 export가 모두 존재한다', () => {
      const exports = Object.keys(HairModule);

      // 상수
      expect(exports).toContain('FACE_SHAPE_LABELS');
      expect(exports).toContain('FACE_SHAPE_DESCRIPTIONS');
      expect(exports).toContain('FACE_SHAPE_STYLE_MAPPING');
      expect(exports).toContain('HAIR_THICKNESS_LABELS');
      expect(exports).toContain('HAIR_TEXTURE_LABELS');
      expect(exports).toContain('SCALP_CONDITION_LABELS');

      // 얼굴형 분석
      expect(exports).toContain('analyzeFaceShape');
      expect(exports).toContain('estimateFaceShapeFromPose');
      expect(exports).toContain('getFaceShapeDescription');
      expect(exports).toContain('getFaceShapeConfidenceGrade');

      // 헤어스타일 추천
      expect(exports).toContain('recommendHairstyles');
      expect(exports).toContain('recommendHairColors');
      expect(exports).toContain('generateCareTips');
      expect(exports).toContain('getStylesToAvoid');

      // Mock
      expect(exports).toContain('generateMockFaceShapeAnalysis');
      expect(exports).toContain('generateMockHairColorAnalysis');
      expect(exports).toContain('generateMockHairAnalysisResult');
    });

    it('최소 15개 이상의 export가 존재한다', () => {
      const exports = Object.keys(HairModule);
      expect(exports.length).toBeGreaterThanOrEqual(15);
    });

    it('내부 함수가 노출되지 않는다', () => {
      const exports = Object.keys(HairModule);

      expect(exports).not.toContain('_internal');
      expect(exports).not.toContain('private');
    });
  });
});
