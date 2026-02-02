/**
 * S-2 피부분석 v2 모듈 배럴 익스포트 테스트
 *
 * @module tests/lib/analysis/skin-v2/index
 * @description 6존 고도화 피부 분석 시스템
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 */

import { describe, it, expect } from 'vitest';
import * as SkinV2Module from '@/lib/analysis/skin-v2';

describe('lib/analysis/skin-v2 배럴 익스포트', () => {
  // ==========================================================================
  // 타입 및 상수 익스포트
  // ==========================================================================
  describe('타입 및 상수', () => {
    it('ZONE_GROUP_MAPPING이 export된다', () => {
      expect(SkinV2Module.ZONE_GROUP_MAPPING).toBeDefined();
      expect(typeof SkinV2Module.ZONE_GROUP_MAPPING).toBe('object');
    });

    it('ZONE_LABELS가 export된다', () => {
      expect(SkinV2Module.ZONE_LABELS).toBeDefined();
      expect(typeof SkinV2Module.ZONE_LABELS).toBe('object');
    });

    it('SKIN_TYPE_LABELS가 export된다', () => {
      expect(SkinV2Module.SKIN_TYPE_LABELS).toBeDefined();
      expect(typeof SkinV2Module.SKIN_TYPE_LABELS).toBe('object');
    });

    it('VITALITY_GRADE_THRESHOLDS가 export된다', () => {
      expect(SkinV2Module.VITALITY_GRADE_THRESHOLDS).toBeDefined();
      expect(typeof SkinV2Module.VITALITY_GRADE_THRESHOLDS).toBe('object');
    });

    it('RECOMMENDED_INGREDIENTS가 export된다', () => {
      expect(SkinV2Module.RECOMMENDED_INGREDIENTS).toBeDefined();
      expect(typeof SkinV2Module.RECOMMENDED_INGREDIENTS).toBe('object');
    });

    it('AVOID_INGREDIENTS가 export된다', () => {
      expect(SkinV2Module.AVOID_INGREDIENTS).toBeDefined();
      expect(typeof SkinV2Module.AVOID_INGREDIENTS).toBe('object');
    });
  });

  // ==========================================================================
  // Zone Extraction
  // ==========================================================================
  describe('Zone Extraction', () => {
    it('extractZoneRegions가 export된다', () => {
      expect(SkinV2Module.extractZoneRegions).toBeDefined();
      expect(typeof SkinV2Module.extractZoneRegions).toBe('function');
    });

    it('analyzeZoneConcerns가 export된다', () => {
      expect(SkinV2Module.analyzeZoneConcerns).toBeDefined();
      expect(typeof SkinV2Module.analyzeZoneConcerns).toBe('function');
    });

    it('generateZoneRecommendations가 export된다', () => {
      expect(SkinV2Module.generateZoneRecommendations).toBeDefined();
      expect(typeof SkinV2Module.generateZoneRecommendations).toBe('function');
    });
  });

  // ==========================================================================
  // Texture Analysis
  // ==========================================================================
  describe('Texture Analysis', () => {
    it('calculateGLCM이 export된다', () => {
      expect(SkinV2Module.calculateGLCM).toBeDefined();
      expect(typeof SkinV2Module.calculateGLCM).toBe('function');
    });

    it('calculateLBP가 export된다', () => {
      expect(SkinV2Module.calculateLBP).toBeDefined();
      expect(typeof SkinV2Module.calculateLBP).toBe('function');
    });

    it('analyzeTexture가 export된다', () => {
      expect(SkinV2Module.analyzeTexture).toBeDefined();
      expect(typeof SkinV2Module.analyzeTexture).toBe('function');
    });

    it('calculatePoreScore가 export된다', () => {
      expect(SkinV2Module.calculatePoreScore).toBeDefined();
      expect(typeof SkinV2Module.calculatePoreScore).toBe('function');
    });

    it('calculateWrinkleScore가 export된다', () => {
      expect(SkinV2Module.calculateWrinkleScore).toBeDefined();
      expect(typeof SkinV2Module.calculateWrinkleScore).toBe('function');
    });

    it('calculateTextureScore가 export된다', () => {
      expect(SkinV2Module.calculateTextureScore).toBeDefined();
      expect(typeof SkinV2Module.calculateTextureScore).toBe('function');
    });

    it('toGrayscale이 export된다', () => {
      expect(SkinV2Module.toGrayscale).toBeDefined();
      expect(typeof SkinV2Module.toGrayscale).toBe('function');
    });
  });

  // ==========================================================================
  // Scoring
  // ==========================================================================
  describe('Scoring', () => {
    it('calculateZoneScore가 export된다', () => {
      expect(SkinV2Module.calculateZoneScore).toBeDefined();
      expect(typeof SkinV2Module.calculateZoneScore).toBe('function');
    });

    it('extractTextureMetrics가 export된다', () => {
      expect(SkinV2Module.extractTextureMetrics).toBeDefined();
      expect(typeof SkinV2Module.extractTextureMetrics).toBe('function');
    });

    it('calculateGroupAverages가 export된다', () => {
      expect(SkinV2Module.calculateGroupAverages).toBeDefined();
      expect(typeof SkinV2Module.calculateGroupAverages).toBe('function');
    });

    it('calculateTUZoneDifference가 export된다', () => {
      expect(SkinV2Module.calculateTUZoneDifference).toBeDefined();
      expect(typeof SkinV2Module.calculateTUZoneDifference).toBe('function');
    });

    it('calculateVitalityScore가 export된다', () => {
      expect(SkinV2Module.calculateVitalityScore).toBeDefined();
      expect(typeof SkinV2Module.calculateVitalityScore).toBe('function');
    });

    it('calculateVitalityGrade가 export된다', () => {
      expect(SkinV2Module.calculateVitalityGrade).toBeDefined();
      expect(typeof SkinV2Module.calculateVitalityGrade).toBe('function');
    });

    it('calculateScoreBreakdown이 export된다', () => {
      expect(SkinV2Module.calculateScoreBreakdown).toBeDefined();
      expect(typeof SkinV2Module.calculateScoreBreakdown).toBe('function');
    });

    it('determineSkinType이 export된다', () => {
      expect(SkinV2Module.determineSkinType).toBeDefined();
      expect(typeof SkinV2Module.determineSkinType).toBe('function');
    });

    it('extractPrimaryConcerns가 export된다', () => {
      expect(SkinV2Module.extractPrimaryConcerns).toBeDefined();
      expect(typeof SkinV2Module.extractPrimaryConcerns).toBe('function');
    });

    it('calculateChangeFromPrevious가 export된다', () => {
      expect(SkinV2Module.calculateChangeFromPrevious).toBeDefined();
      expect(typeof SkinV2Module.calculateChangeFromPrevious).toBe('function');
    });
  });

  // ==========================================================================
  // Mock Data
  // ==========================================================================
  describe('Mock Data', () => {
    it('generateMockSkinAnalysisV2Result가 export된다', () => {
      expect(SkinV2Module.generateMockSkinAnalysisV2Result).toBeDefined();
      expect(typeof SkinV2Module.generateMockSkinAnalysisV2Result).toBe('function');
    });

    it('generateMockZoneAnalysis가 export된다', () => {
      expect(SkinV2Module.generateMockZoneAnalysis).toBeDefined();
      expect(typeof SkinV2Module.generateMockZoneAnalysis).toBe('function');
    });

    it('generateMockZoneMetrics가 export된다', () => {
      expect(SkinV2Module.generateMockZoneMetrics).toBeDefined();
      expect(typeof SkinV2Module.generateMockZoneMetrics).toBe('function');
    });

    it('generateMockSkinAnalysisV2Result가 유효한 결과를 반환한다', () => {
      const mockResult = SkinV2Module.generateMockSkinAnalysisV2Result();
      expect(mockResult).toHaveProperty('skinType');
      expect(mockResult).toHaveProperty('vitalityScore');
      expect(mockResult).toHaveProperty('vitalityGrade');
      expect(mockResult).toHaveProperty('zoneAnalysis');
      // zoneAnalysis 내부에 zones 존재
      expect(mockResult.zoneAnalysis).toHaveProperty('zones');
    });
  });

  // ==========================================================================
  // 통합 테스트
  // ==========================================================================
  describe('통합 테스트', () => {
    it('Mock 결과의 vitalityScore가 유효한 범위이다', () => {
      const mockResult = SkinV2Module.generateMockSkinAnalysisV2Result();
      expect(mockResult.vitalityScore).toBeGreaterThanOrEqual(0);
      expect(mockResult.vitalityScore).toBeLessThanOrEqual(100);
    });

    it('Mock 결과의 zoneAnalysis가 7개 존을 포함한다', () => {
      const mockResult = SkinV2Module.generateMockSkinAnalysisV2Result();
      expect(mockResult.zoneAnalysis).toBeDefined();
      expect(mockResult.zoneAnalysis.zones).toBeDefined();
      expect(typeof mockResult.zoneAnalysis.zones).toBe('object');
      // 7개 존 확인 (forehead, nose, leftCheek, rightCheek, chin, eyeArea, lipArea)
      const zoneKeys = Object.keys(mockResult.zoneAnalysis.zones);
      expect(zoneKeys.length).toBe(7);
    });

    it('calculateVitalityGrade가 올바른 등급을 반환한다', () => {
      // VITALITY_GRADE_THRESHOLDS 기준: S:90, A:75, B:60, C:40, D:0
      // S 등급 (90 이상)
      expect(SkinV2Module.calculateVitalityGrade(95)).toBe('S');
      expect(SkinV2Module.calculateVitalityGrade(90)).toBe('S');

      // A 등급 (75-89)
      expect(SkinV2Module.calculateVitalityGrade(85)).toBe('A');
      expect(SkinV2Module.calculateVitalityGrade(75)).toBe('A');

      // B 등급 (60-74)
      expect(SkinV2Module.calculateVitalityGrade(65)).toBe('B');
      expect(SkinV2Module.calculateVitalityGrade(60)).toBe('B');

      // C 등급 (40-59)
      expect(SkinV2Module.calculateVitalityGrade(50)).toBe('C');
      expect(SkinV2Module.calculateVitalityGrade(40)).toBe('C');

      // D 등급 (0-39)
      expect(SkinV2Module.calculateVitalityGrade(39)).toBe('D');
      expect(SkinV2Module.calculateVitalityGrade(0)).toBe('D');
    });

    it('calculateChangeFromPrevious가 변화율을 계산한다', () => {
      // 이전 존 분석 데이터와 현재 존 분석 데이터를 비교
      // calculateChangeFromPrevious(currentScore, previousScore, currentZones, previousZones)
      const mockResult = SkinV2Module.generateMockSkinAnalysisV2Result();
      const previousResult = SkinV2Module.generateMockSkinAnalysisV2Result();

      const change = SkinV2Module.calculateChangeFromPrevious(
        mockResult.vitalityScore,
        previousResult.vitalityScore,
        mockResult.zoneAnalysis.zones,
        previousResult.zoneAnalysis.zones
      );
      expect(change).toBeDefined();
      expect(typeof change).toBe('object');
      expect(change).toHaveProperty('vitalityScoreChange');
      expect(change).toHaveProperty('improvedZones');
      expect(change).toHaveProperty('worsenedZones');
      expect(Array.isArray(change.improvedZones)).toBe(true);
      expect(Array.isArray(change.worsenedZones)).toBe(true);
    });
  });

  // ==========================================================================
  // 모듈 구조 검증
  // ==========================================================================
  describe('모듈 구조', () => {
    it('필수 export가 모두 존재한다', () => {
      const exports = Object.keys(SkinV2Module);

      // 상수
      expect(exports).toContain('ZONE_GROUP_MAPPING');
      expect(exports).toContain('ZONE_LABELS');
      expect(exports).toContain('SKIN_TYPE_LABELS');

      // Zone Extraction
      expect(exports).toContain('extractZoneRegions');
      expect(exports).toContain('analyzeZoneConcerns');
      expect(exports).toContain('generateZoneRecommendations');

      // Texture Analysis
      expect(exports).toContain('calculateGLCM');
      expect(exports).toContain('calculateLBP');
      expect(exports).toContain('analyzeTexture');

      // Scoring
      expect(exports).toContain('calculateZoneScore');
      expect(exports).toContain('calculateVitalityScore');
      expect(exports).toContain('calculateVitalityGrade');
      expect(exports).toContain('determineSkinType');

      // Mock
      expect(exports).toContain('generateMockSkinAnalysisV2Result');
    });

    it('최소 20개 이상의 export가 존재한다', () => {
      const exports = Object.keys(SkinV2Module);
      expect(exports.length).toBeGreaterThanOrEqual(20);
    });
  });
});
