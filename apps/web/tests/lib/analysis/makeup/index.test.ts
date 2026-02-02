/**
 * M-1: 메이크업 분석 모듈 테스트
 *
 * @description 메이크업 분석 Mock 데이터 및 타입 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockMakeupAnalysisResult,
  UNDERTONES,
  EYE_SHAPES,
  LIP_SHAPES,
  FACE_SHAPES,
  MAKEUP_STYLES,
  MAKEUP_CONCERNS,
  UNDERTONE_LABELS,
  EYE_SHAPE_LABELS,
  LIP_SHAPE_LABELS,
  FACE_SHAPE_LABELS,
  MAKEUP_STYLE_LABELS,
  MAKEUP_CONCERN_LABELS,
  MAKEUP_CATEGORY_LABELS,
} from '@/lib/analysis/makeup';
import type {
  UndertoneType,
  EyeShapeType,
  LipShapeType,
  FaceShapeType,
  MakeupStyleType,
  MakeupConcernType,
  MakeupCategoryType,
  ColorRecommendation,
  MakeupTip,
} from '@/lib/analysis/makeup';

// =============================================================================
// generateMockMakeupAnalysisResult 테스트
// =============================================================================

describe('generateMockMakeupAnalysisResult', () => {
  it('필수 필드를 모두 포함해야 한다', () => {
    const result = generateMockMakeupAnalysisResult();

    expect(result).toHaveProperty('undertone');
    expect(result).toHaveProperty('undertoneLabel');
    expect(result).toHaveProperty('eyeShape');
    expect(result).toHaveProperty('eyeShapeLabel');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('concerns');
    expect(result).toHaveProperty('insight');
    expect(result).toHaveProperty('recommendedStyles');
    expect(result).toHaveProperty('colorRecommendations');
    expect(result).toHaveProperty('makeupTips');
    expect(result).toHaveProperty('analyzedAt');
    expect(result).toHaveProperty('analysisReliability');
  });

  it('유효한 언더톤 타입을 반환해야 한다', () => {
    const result = generateMockMakeupAnalysisResult();
    const validUndertones: UndertoneType[] = ['warm', 'cool', 'neutral'];

    expect(validUndertones).toContain(result.undertone);
    expect(typeof result.undertoneLabel).toBe('string');
  });

  it('유효한 눈 모양 타입을 반환해야 한다', () => {
    const result = generateMockMakeupAnalysisResult();
    const validEyeShapes: EyeShapeType[] = [
      'monolid', 'double', 'hooded', 'round', 'almond', 'downturned',
    ];
    expect(validEyeShapes).toContain(result.eyeShape);
  });

  it('전체 점수가 0-100 범위여야 한다', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateMockMakeupAnalysisResult();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it('메트릭 배열이 올바른 구조여야 한다', () => {
    const result = generateMockMakeupAnalysisResult();

    expect(Array.isArray(result.metrics)).toBe(true);
    expect(result.metrics.length).toBeGreaterThan(0);

    result.metrics.forEach((metric) => {
      expect(metric).toHaveProperty('id');
      expect(metric).toHaveProperty('label');
      expect(metric).toHaveProperty('value');
      expect(metric).toHaveProperty('status');
      expect(['good', 'normal', 'warning']).toContain(metric.status);
    });
  });

  it('색상 추천이 유효한 HEX 형식이어야 한다', () => {
    const result = generateMockMakeupAnalysisResult();

    result.colorRecommendations.forEach((rec: ColorRecommendation) => {
      rec.colors.forEach((color) => {
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  it('메이크업 팁이 올바른 구조여야 한다', () => {
    const result = generateMockMakeupAnalysisResult();

    expect(Array.isArray(result.makeupTips)).toBe(true);
    result.makeupTips.forEach((tip: MakeupTip) => {
      expect(tip).toHaveProperty('category');
      expect(tip).toHaveProperty('tips');
      expect(Array.isArray(tip.tips)).toBe(true);
    });
  });

  it('분석 시간이 유효한 Date 객체여야 한다', () => {
    const result = generateMockMakeupAnalysisResult();
    expect(result.analyzedAt).toBeInstanceOf(Date);
  });
});

// =============================================================================
// 상수 데이터 테스트
// =============================================================================

describe('Makeup Constants', () => {
  it('UNDERTONES에 3가지 언더톤이 정의되어야 한다', () => {
    expect(UNDERTONES).toHaveLength(3);
    const ids = UNDERTONES.map((u) => u.id);
    expect(ids).toContain('warm');
    expect(ids).toContain('cool');
    expect(ids).toContain('neutral');
  });

  it('EYE_SHAPES에 6가지 눈 모양이 정의되어야 한다', () => {
    expect(EYE_SHAPES).toHaveLength(6);
  });

  it('LIP_SHAPES에 6가지 입술 모양이 정의되어야 한다', () => {
    expect(LIP_SHAPES).toHaveLength(6);
  });

  it('FACE_SHAPES에 6가지 얼굴형이 정의되어야 한다', () => {
    expect(FACE_SHAPES).toHaveLength(6);
  });

  it('MAKEUP_STYLES에 6가지 스타일이 정의되어야 한다', () => {
    expect(MAKEUP_STYLES).toHaveLength(6);
  });

  it('MAKEUP_CONCERNS에 8가지 고민이 정의되어야 한다', () => {
    expect(MAKEUP_CONCERNS).toHaveLength(8);
  });
});

// =============================================================================
// 라벨 상수 테스트
// =============================================================================

describe('Makeup Label Constants', () => {
  it('UNDERTONE_LABELS에 한국어 라벨이 있어야 한다', () => {
    expect(UNDERTONE_LABELS.warm).toBe('웜톤');
    expect(UNDERTONE_LABELS.cool).toBe('쿨톤');
    expect(UNDERTONE_LABELS.neutral).toBe('뉴트럴');
  });

  it('EYE_SHAPE_LABELS에 모든 눈 모양 라벨이 있어야 한다', () => {
    expect(EYE_SHAPE_LABELS.monolid).toBe('무쌍');
    expect(EYE_SHAPE_LABELS.double).toBe('유쌍');
  });

  it('FACE_SHAPE_LABELS에 한국어 라벨이 있어야 한다', () => {
    expect(FACE_SHAPE_LABELS.oval).toBe('계란형');
    expect(FACE_SHAPE_LABELS.round).toBe('둥근형');
  });

  it('MAKEUP_CATEGORY_LABELS에 한국어 라벨이 있어야 한다', () => {
    expect(MAKEUP_CATEGORY_LABELS.foundation).toBe('파운데이션');
    expect(MAKEUP_CATEGORY_LABELS.lip).toBe('립');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('여러 번 호출해도 항상 유효한 결과를 반환해야 한다', () => {
    for (let i = 0; i < 20; i++) {
      const result = generateMockMakeupAnalysisResult();
      expect(result).toBeDefined();
      expect(result.undertone).toBeDefined();
      expect(result.metrics).toBeDefined();
    }
  });

  it('메트릭 상태가 값에 따라 올바르게 설정되어야 한다', () => {
    for (let i = 0; i < 10; i++) {
      const result = generateMockMakeupAnalysisResult();
      result.metrics.forEach((metric) => {
        if (metric.value >= 70) {
          expect(metric.status).toBe('good');
        } else if (metric.value >= 40) {
          expect(metric.status).toBe('normal');
        } else {
          expect(metric.status).toBe('warning');
        }
      });
    }
  });
});
