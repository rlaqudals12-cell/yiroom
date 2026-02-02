/**
 * PC-2: 퍼스널컬러 v2 모듈 배럴 익스포트 테스트
 *
 * @module tests/lib/analysis/personal-color-v2/index
 * @description Lab 색공간 기반 12톤 퍼스널컬러 분석 시스템
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 */

import { describe, it, expect } from 'vitest';
import * as PCv2Module from '@/lib/analysis/personal-color-v2';

describe('lib/analysis/personal-color-v2 배럴 익스포트', () => {
  // ==========================================================================
  // 타입 및 상수 익스포트
  // ==========================================================================
  describe('타입 및 상수', () => {
    it('KOREAN_ADJUSTMENTS가 export된다', () => {
      expect(PCv2Module.KOREAN_ADJUSTMENTS).toBeDefined();
      expect(typeof PCv2Module.KOREAN_ADJUSTMENTS).toBe('object');
    });

    it('TWELVE_TONE_REFERENCE_LAB가 export된다', () => {
      expect(PCv2Module.TWELVE_TONE_REFERENCE_LAB).toBeDefined();
      expect(typeof PCv2Module.TWELVE_TONE_REFERENCE_LAB).toBe('object');
    });

    it('SEASON_DESCRIPTIONS가 export된다', () => {
      expect(PCv2Module.SEASON_DESCRIPTIONS).toBeDefined();
      expect(typeof PCv2Module.SEASON_DESCRIPTIONS).toBe('object');
    });

    it('TWELVE_TONE_LABELS가 export된다', () => {
      expect(PCv2Module.TWELVE_TONE_LABELS).toBeDefined();
      expect(typeof PCv2Module.TWELVE_TONE_LABELS).toBe('object');
    });
  });

  // ==========================================================================
  // Lab 유틸리티
  // ==========================================================================
  describe('Lab 유틸리티', () => {
    describe('RGB <-> Lab 변환', () => {
      it('rgbToLab이 export된다', () => {
        expect(PCv2Module.rgbToLab).toBeDefined();
        expect(typeof PCv2Module.rgbToLab).toBe('function');
      });

      it('labToRgb이 export된다', () => {
        expect(PCv2Module.labToRgb).toBeDefined();
        expect(typeof PCv2Module.labToRgb).toBe('function');
      });

      it('rgbToLab이 올바르게 동작한다', () => {
        // 흰색 테스트
        const whiteLab = PCv2Module.rgbToLab(255, 255, 255);
        expect(whiteLab.L).toBeCloseTo(100, 0);
      });
    });

    describe('HEX <-> Lab 변환', () => {
      it('hexToLab이 export된다', () => {
        expect(PCv2Module.hexToLab).toBeDefined();
        expect(typeof PCv2Module.hexToLab).toBe('function');
      });

      it('labToHex가 export된다', () => {
        expect(PCv2Module.labToHex).toBeDefined();
        expect(typeof PCv2Module.labToHex).toBe('function');
      });

      it('hexToLab이 올바르게 동작한다', () => {
        const whiteLab = PCv2Module.hexToLab('#FFFFFF');
        expect(whiteLab.L).toBeCloseTo(100, 0);
      });
    });

    describe('Lab 파생 지표', () => {
      it('calculateChroma가 export된다', () => {
        expect(PCv2Module.calculateChroma).toBeDefined();
        expect(typeof PCv2Module.calculateChroma).toBe('function');
      });

      it('calculateHue가 export된다', () => {
        expect(PCv2Module.calculateHue).toBeDefined();
        expect(typeof PCv2Module.calculateHue).toBe('function');
      });

      it('calculateITA가 export된다', () => {
        expect(PCv2Module.calculateITA).toBeDefined();
        expect(typeof PCv2Module.calculateITA).toBe('function');
      });
    });

    describe('색차 계산', () => {
      it('calculateLabDistance가 export된다', () => {
        expect(PCv2Module.calculateLabDistance).toBeDefined();
        expect(typeof PCv2Module.calculateLabDistance).toBe('function');
      });

      it('calculateCIEDE2000이 export된다', () => {
        expect(PCv2Module.calculateCIEDE2000).toBeDefined();
        expect(typeof PCv2Module.calculateCIEDE2000).toBe('function');
      });

      it('calculateLabDistance가 동일 색상에 0을 반환한다', () => {
        const lab = { L: 50, a: 10, b: 20 };
        const distance = PCv2Module.calculateLabDistance(lab, lab);
        expect(distance).toBe(0);
      });
    });
  });

  // ==========================================================================
  // 12톤 분류
  // ==========================================================================
  describe('12톤 분류', () => {
    describe('메인 분류 함수', () => {
      it('classifyTone이 export된다', () => {
        expect(PCv2Module.classifyTone).toBeDefined();
        expect(typeof PCv2Module.classifyTone).toBe('function');
      });
    });

    describe('단계별 판정 함수', () => {
      it('determineUndertone이 export된다', () => {
        expect(PCv2Module.determineUndertone).toBeDefined();
        expect(typeof PCv2Module.determineUndertone).toBe('function');
      });

      it('determineSeason이 export된다', () => {
        expect(PCv2Module.determineSeason).toBeDefined();
        expect(typeof PCv2Module.determineSeason).toBe('function');
      });

      it('determineSubtype이 export된다', () => {
        expect(PCv2Module.determineSubtype).toBeDefined();
        expect(typeof PCv2Module.determineSubtype).toBe('function');
      });
    });

    describe('톤 조합/분해', () => {
      it('composeTwelveTone이 export된다', () => {
        expect(PCv2Module.composeTwelveTone).toBeDefined();
        expect(typeof PCv2Module.composeTwelveTone).toBe('function');
      });

      it('parseTwelveTone이 export된다', () => {
        expect(PCv2Module.parseTwelveTone).toBeDefined();
        expect(typeof PCv2Module.parseTwelveTone).toBe('function');
      });

      it('composeTwelveTone과 parseTwelveTone이 서로 역함수이다', () => {
        const tone = PCv2Module.composeTwelveTone('spring', 'light');
        expect(tone).toBe('light-spring');

        const parsed = PCv2Module.parseTwelveTone('light-spring');
        expect(parsed.season).toBe('spring');
        expect(parsed.subtype).toBe('light');
      });
    });

    describe('점수 계산', () => {
      it('calculateToneScores가 export된다', () => {
        expect(PCv2Module.calculateToneScores).toBeDefined();
        expect(typeof PCv2Module.calculateToneScores).toBe('function');
      });
    });

    describe('보조 함수', () => {
      it('getReferenceLab이 export된다', () => {
        expect(PCv2Module.getReferenceLab).toBeDefined();
        expect(typeof PCv2Module.getReferenceLab).toBe('function');
      });

      it('classifySkinBrightness가 export된다', () => {
        expect(PCv2Module.classifySkinBrightness).toBeDefined();
        expect(typeof PCv2Module.classifySkinBrightness).toBe('function');
      });

      it('calculateToneSimilarity가 export된다', () => {
        expect(PCv2Module.calculateToneSimilarity).toBeDefined();
        expect(typeof PCv2Module.calculateToneSimilarity).toBe('function');
      });

      it('getAdjacentTones가 export된다', () => {
        expect(PCv2Module.getAdjacentTones).toBeDefined();
        expect(typeof PCv2Module.getAdjacentTones).toBe('function');
      });
    });
  });

  // ==========================================================================
  // Mock 데이터
  // ==========================================================================
  describe('Mock 데이터', () => {
    it('generateMockResult가 export된다', () => {
      expect(PCv2Module.generateMockResult).toBeDefined();
      expect(typeof PCv2Module.generateMockResult).toBe('function');
    });

    it('generateMockClassification이 export된다', () => {
      expect(PCv2Module.generateMockClassification).toBeDefined();
      expect(typeof PCv2Module.generateMockClassification).toBe('function');
    });

    it('getTonePalette가 export된다', () => {
      expect(PCv2Module.getTonePalette).toBeDefined();
      expect(typeof PCv2Module.getTonePalette).toBe('function');
    });

    it('getToneLabel이 export된다', () => {
      expect(PCv2Module.getToneLabel).toBeDefined();
      expect(typeof PCv2Module.getToneLabel).toBe('function');
    });

    it('TONE_PALETTES가 export된다', () => {
      expect(PCv2Module.TONE_PALETTES).toBeDefined();
      expect(typeof PCv2Module.TONE_PALETTES).toBe('object');
    });

    it('generateMockResult가 유효한 결과를 반환한다', () => {
      const mockResult = PCv2Module.generateMockResult();
      // PersonalColorV2Result 타입의 필드 확인
      expect(mockResult).toHaveProperty('id');
      expect(mockResult).toHaveProperty('classification');
      expect(mockResult).toHaveProperty('palette');
      expect(mockResult.classification).toHaveProperty('tone');
      expect(mockResult.classification).toHaveProperty('confidence');
      expect(mockResult.classification.confidence).toBeGreaterThanOrEqual(0);
      expect(mockResult.classification.confidence).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // Gemini 프롬프트
  // ==========================================================================
  describe('Gemini 프롬프트', () => {
    describe('시스템 프롬프트', () => {
      it('PERSONAL_COLOR_SYSTEM_PROMPT가 export된다', () => {
        expect(PCv2Module.PERSONAL_COLOR_SYSTEM_PROMPT).toBeDefined();
        expect(typeof PCv2Module.PERSONAL_COLOR_SYSTEM_PROMPT).toBe('string');
      });
    });

    describe('프롬프트 생성 함수', () => {
      it('generateAnalysisPrompt가 export된다', () => {
        expect(PCv2Module.generateAnalysisPrompt).toBeDefined();
        expect(typeof PCv2Module.generateAnalysisPrompt).toBe('function');
      });

      it('generateDrapingPrompt가 export된다', () => {
        expect(PCv2Module.generateDrapingPrompt).toBeDefined();
        expect(typeof PCv2Module.generateDrapingPrompt).toBe('function');
      });

      it('generateMakeupRecommendationPrompt가 export된다', () => {
        expect(PCv2Module.generateMakeupRecommendationPrompt).toBeDefined();
        expect(typeof PCv2Module.generateMakeupRecommendationPrompt).toBe('function');
      });

      it('generateStylingRecommendationPrompt가 export된다', () => {
        expect(PCv2Module.generateStylingRecommendationPrompt).toBeDefined();
        expect(typeof PCv2Module.generateStylingRecommendationPrompt).toBe('function');
      });
    });

    describe('JSON 유틸리티', () => {
      it('extractJsonFromResponse가 export된다', () => {
        expect(PCv2Module.extractJsonFromResponse).toBeDefined();
        expect(typeof PCv2Module.extractJsonFromResponse).toBe('function');
      });

      it('validateToneValue가 export된다', () => {
        expect(PCv2Module.validateToneValue).toBeDefined();
        expect(typeof PCv2Module.validateToneValue).toBe('function');
      });

      it('validateLabRange가 export된다', () => {
        expect(PCv2Module.validateLabRange).toBeDefined();
        expect(typeof PCv2Module.validateLabRange).toBe('function');
      });

      it('validateAnalysisResult가 export된다', () => {
        expect(PCv2Module.validateAnalysisResult).toBeDefined();
        expect(typeof PCv2Module.validateAnalysisResult).toBe('function');
      });
    });
  });

  // ==========================================================================
  // 통합 테스트
  // ==========================================================================
  describe('통합 테스트', () => {
    it('RGB -> Lab -> 톤 분류 파이프라인이 동작한다', () => {
      // 한국인 평균 피부톤 (웜톤 계열)
      const skinLab = PCv2Module.rgbToLab(230, 195, 170);

      // Lab 값 범위 확인
      expect(skinLab.L).toBeGreaterThan(70);
      expect(skinLab.L).toBeLessThan(90);

      // 톤 분류
      const classification = PCv2Module.classifyTone(skinLab);
      expect(classification).toHaveProperty('tone');
      expect(classification).toHaveProperty('confidence');
      expect(classification).toHaveProperty('toneScores');
    });

    it('HEX -> 톤 팔레트 조회 파이프라인이 동작한다', () => {
      const skinLab = PCv2Module.hexToLab('#E6C3AA');
      const classification = PCv2Module.classifyTone(skinLab);

      // 톤에 해당하는 팔레트 조회 (TonePalette 객체 반환)
      const palette = PCv2Module.getTonePalette(classification.tone);
      expect(palette).toBeDefined();
      expect(palette).toHaveProperty('mainColors');
      expect(Array.isArray(palette.mainColors)).toBe(true);
      expect(palette.mainColors.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 모듈 구조 검증
  // ==========================================================================
  describe('모듈 구조', () => {
    it('필수 export가 모두 존재한다', () => {
      const exports = Object.keys(PCv2Module);

      // Lab 유틸리티
      expect(exports).toContain('rgbToLab');
      expect(exports).toContain('labToRgb');
      expect(exports).toContain('hexToLab');
      expect(exports).toContain('labToHex');
      expect(exports).toContain('calculateChroma');
      expect(exports).toContain('calculateHue');
      expect(exports).toContain('calculateITA');
      expect(exports).toContain('calculateLabDistance');
      expect(exports).toContain('calculateCIEDE2000');

      // 톤 분류
      expect(exports).toContain('classifyTone');
      expect(exports).toContain('determineUndertone');
      expect(exports).toContain('determineSeason');
      expect(exports).toContain('determineSubtype');

      // Mock
      expect(exports).toContain('generateMockResult');
      expect(exports).toContain('getTonePalette');

      // 프롬프트
      expect(exports).toContain('PERSONAL_COLOR_SYSTEM_PROMPT');
      expect(exports).toContain('generateAnalysisPrompt');
    });

    it('내부 함수가 노출되지 않는다', () => {
      const exports = Object.keys(PCv2Module);

      // 내부 헬퍼 함수는 노출되지 않아야 함
      expect(exports).not.toContain('_internal');
      expect(exports).not.toContain('private');
    });
  });
});
