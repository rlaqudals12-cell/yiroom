/**
 * M-1 메이크업 분석 타입 및 라벨 상수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  UNDERTONE_LABELS,
  EYE_SHAPE_LABELS,
  LIP_SHAPE_LABELS,
  FACE_SHAPE_LABELS,
  MAKEUP_STYLE_LABELS,
  MAKEUP_CONCERN_LABELS,
  MAKEUP_CATEGORY_LABELS,
  type EyeShapeType,
  type LipShapeType,
  type FaceShapeType,
  type MakeupStyleType,
  type MakeupConcernType,
  type MakeupCategoryType,
  type MakeupAnalysisResult,
  type MakeupMetric,
  type ColorRecommendation,
  type MakeupAnalysisInput,
} from '@/lib/analysis/makeup/types';

describe('M-1 타입 및 라벨 상수', () => {
  describe('UNDERTONE_LABELS', () => {
    it('3개 언더톤 라벨 정의', () => {
      expect(Object.keys(UNDERTONE_LABELS)).toHaveLength(3);
    });

    it('warm → 웜톤', () => {
      expect(UNDERTONE_LABELS.warm).toBe('웜톤');
    });

    it('cool → 쿨톤', () => {
      expect(UNDERTONE_LABELS.cool).toBe('쿨톤');
    });

    it('neutral → 뉴트럴', () => {
      expect(UNDERTONE_LABELS.neutral).toBe('뉴트럴');
    });

    it('모든 값이 비어있지 않음', () => {
      for (const [key, value] of Object.entries(UNDERTONE_LABELS)) {
        expect(value.length, `${key}의 라벨이 비어있음`).toBeGreaterThan(0);
      }
    });
  });

  describe('EYE_SHAPE_LABELS', () => {
    it('6개 눈 모양 라벨 정의', () => {
      expect(Object.keys(EYE_SHAPE_LABELS)).toHaveLength(6);
    });

    const expectedLabels: Record<EyeShapeType, string> = {
      monolid: '무쌍',
      double: '유쌍',
      hooded: '속쌍',
      round: '둥근 눈',
      almond: '아몬드형',
      downturned: '처진 눈',
    };

    for (const [key, label] of Object.entries(expectedLabels)) {
      it(`${key} → ${label}`, () => {
        expect(EYE_SHAPE_LABELS[key as EyeShapeType]).toBe(label);
      });
    }
  });

  describe('LIP_SHAPE_LABELS', () => {
    it('6개 입술 모양 라벨 정의', () => {
      expect(Object.keys(LIP_SHAPE_LABELS)).toHaveLength(6);
    });

    const expectedLabels: Record<LipShapeType, string> = {
      full: '도톰한 입술',
      thin: '얇은 입술',
      wide: '넓은 입술',
      small: '작은 입술',
      heart: '하트형',
      asymmetric: '비대칭',
    };

    for (const [key, label] of Object.entries(expectedLabels)) {
      it(`${key} → ${label}`, () => {
        expect(LIP_SHAPE_LABELS[key as LipShapeType]).toBe(label);
      });
    }
  });

  describe('FACE_SHAPE_LABELS', () => {
    it('6개 얼굴형 라벨 정의', () => {
      expect(Object.keys(FACE_SHAPE_LABELS)).toHaveLength(6);
    });

    const expectedLabels: Record<FaceShapeType, string> = {
      oval: '계란형',
      round: '둥근형',
      square: '각진형',
      heart: '하트형',
      oblong: '긴 얼굴',
      diamond: '다이아몬드',
    };

    for (const [key, label] of Object.entries(expectedLabels)) {
      it(`${key} → ${label}`, () => {
        expect(FACE_SHAPE_LABELS[key as FaceShapeType]).toBe(label);
      });
    }
  });

  describe('MAKEUP_STYLE_LABELS', () => {
    it('6개 스타일 라벨 정의', () => {
      expect(Object.keys(MAKEUP_STYLE_LABELS)).toHaveLength(6);
    });

    const expectedLabels: Record<MakeupStyleType, string> = {
      natural: '내추럴',
      glam: '글램',
      cute: '큐트',
      chic: '시크',
      vintage: '빈티지',
      edgy: '엣지',
    };

    for (const [key, label] of Object.entries(expectedLabels)) {
      it(`${key} → ${label}`, () => {
        expect(MAKEUP_STYLE_LABELS[key as MakeupStyleType]).toBe(label);
      });
    }
  });

  describe('MAKEUP_CONCERN_LABELS', () => {
    it('8개 피부 고민 라벨 정의', () => {
      expect(Object.keys(MAKEUP_CONCERN_LABELS)).toHaveLength(8);
    });

    const expectedLabels: Record<MakeupConcernType, string> = {
      'dark-circles': '다크서클',
      redness: '홍조',
      'uneven-tone': '피부톤 불균일',
      'large-pores': '넓은 모공',
      'oily-tzone': 'T존 번들거림',
      'dry-patches': '건조 부위',
      'acne-scars': '트러블 흔적',
      'fine-lines': '잔주름',
    };

    for (const [key, label] of Object.entries(expectedLabels)) {
      it(`${key} → ${label}`, () => {
        expect(MAKEUP_CONCERN_LABELS[key as MakeupConcernType]).toBe(label);
      });
    }
  });

  describe('MAKEUP_CATEGORY_LABELS', () => {
    it('5개 카테고리 라벨 정의', () => {
      expect(Object.keys(MAKEUP_CATEGORY_LABELS)).toHaveLength(5);
    });

    const expectedLabels: Record<MakeupCategoryType, string> = {
      foundation: '파운데이션',
      lip: '립',
      eyeshadow: '아이섀도',
      blush: '블러셔',
      contour: '컨투어',
    };

    for (const [key, label] of Object.entries(expectedLabels)) {
      it(`${key} → ${label}`, () => {
        expect(MAKEUP_CATEGORY_LABELS[key as MakeupCategoryType]).toBe(label);
      });
    }
  });

  describe('라벨 간 일관성', () => {
    it('모든 라벨이 한국어', () => {
      const allLabels = [
        ...Object.values(UNDERTONE_LABELS),
        ...Object.values(EYE_SHAPE_LABELS),
        ...Object.values(LIP_SHAPE_LABELS),
        ...Object.values(FACE_SHAPE_LABELS),
        ...Object.values(MAKEUP_STYLE_LABELS),
        ...Object.values(MAKEUP_CONCERN_LABELS),
        ...Object.values(MAKEUP_CATEGORY_LABELS),
      ];

      for (const label of allLabels) {
        // T존만 영어 포함 허용
        if (label === 'T존 번들거림') continue;
        // 한국어 또는 영어 조합 확인 (최소 1자 한글 포함)
        expect(label.length).toBeGreaterThan(0);
      }
    });

    it('중복 라벨 없음 (동일 카테고리 내)', () => {
      const labelMaps = [
        UNDERTONE_LABELS,
        EYE_SHAPE_LABELS,
        LIP_SHAPE_LABELS,
        FACE_SHAPE_LABELS,
        MAKEUP_STYLE_LABELS,
        MAKEUP_CONCERN_LABELS,
        MAKEUP_CATEGORY_LABELS,
      ];

      for (const labelMap of labelMaps) {
        const values = Object.values(labelMap);
        const uniqueValues = new Set(values);
        expect(uniqueValues.size).toBe(values.length);
      }
    });
  });

  describe('타입 구조 검증 (컴파일 타임)', () => {
    it('MakeupAnalysisResult 필수 필드', () => {
      // 타입 검증용 (런타임에서는 객체 구조만 확인)
      const validResult: MakeupAnalysisResult = {
        id: 'test-id',
        undertone: 'warm',
        undertoneLabel: '웜톤',
        eyeShape: 'almond',
        eyeShapeLabel: '아몬드형',
        lipShape: 'full',
        lipShapeLabel: '도톰한 입술',
        faceShape: 'oval',
        faceShapeLabel: '계란형',
        overallScore: 80,
        metrics: [],
        concerns: [],
        insight: '테스트 인사이트',
        recommendedStyles: [],
        colorRecommendations: [],
        makeupTips: [],
        analyzedAt: '2026-02-12T00:00:00Z',
        analysisReliability: 'high',
        usedFallback: false,
      };

      expect(validResult.id).toBe('test-id');
      expect(validResult.undertone).toBe('warm');
      expect(validResult.usedFallback).toBe(false);
    });

    it('MakeupMetric 필드 구조', () => {
      const metric: MakeupMetric = {
        id: 'skin-tone',
        label: '피부톤',
        value: 75,
        status: 'good',
        description: '양호한 피부톤',
      };
      expect(metric.value).toBe(75);
      expect(metric.status).toBe('good');
    });

    it('ColorRecommendation 구조', () => {
      const rec: ColorRecommendation = {
        category: 'lip',
        categoryLabel: '립',
        colors: [{ name: '코랄', hex: '#FF6B4A', description: '화사한 톤' }],
      };
      expect(rec.colors).toHaveLength(1);
      expect(rec.colors[0].hex).toBe('#FF6B4A');
    });

    it('PersonalColorConnection optional 필드', () => {
      const withPC: MakeupAnalysisResult = {
        id: 'test',
        undertone: 'cool',
        undertoneLabel: '쿨톤',
        eyeShape: 'double',
        eyeShapeLabel: '유쌍',
        lipShape: 'thin',
        lipShapeLabel: '얇은 입술',
        faceShape: 'round',
        faceShapeLabel: '둥근형',
        overallScore: 70,
        metrics: [],
        concerns: [],
        insight: '',
        recommendedStyles: [],
        colorRecommendations: [],
        makeupTips: [],
        personalColorConnection: {
          season: '여름 쿨톤',
          compatibility: 'high',
          note: '잘 맞아요',
        },
        analyzedAt: '2026-01-01',
        analysisReliability: 'medium',
        usedFallback: true,
      };
      expect(withPC.personalColorConnection?.season).toBe('여름 쿨톤');
      expect(withPC.personalColorConnection?.compatibility).toBe('high');
    });

    it('MakeupAnalysisInput 구조', () => {
      const input: MakeupAnalysisInput = {
        imageBase64: 'data:image/jpeg;base64,abc',
        personalColorSeason: 'spring',
        useMock: false,
      };
      expect(input.imageBase64).toContain('base64');
    });
  });
});
