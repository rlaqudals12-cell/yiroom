/**
 * S-2: 피부분석 v2 Mock 데이터 테스트
 *
 * @module tests/lib/analysis/skin-v2/mock
 * @description generateMockZoneMetrics, generateMockZoneAnalysis, generateMockSkinAnalysisV2Result 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateMockZoneMetrics,
  generateMockZoneAnalysis,
  generateMockSkinAnalysisV2Result,
} from '@/lib/analysis/skin-v2/mock';
import type {
  SkinZoneType,
  SkinTypeV2,
  ZoneMetricsV2,
  ZoneAnalysisV2,
  SkinAnalysisV2Result,
  ZoneGroup,
} from '@/lib/analysis/skin-v2/types';
import { ZONE_GROUP_MAPPING, VITALITY_GRADE_THRESHOLDS } from '@/lib/analysis/skin-v2/types';

describe('generateMockZoneMetrics', () => {
  const allZones: SkinZoneType[] = [
    'forehead', 'nose', 'leftCheek', 'rightCheek', 'chin', 'eyeArea', 'lipArea'
  ];
  const allSkinTypes: SkinTypeV2[] = ['dry', 'oily', 'combination', 'normal', 'sensitive'];

  describe('기본 동작', () => {
    it('피부 타입 없이 호출해도 메트릭을 반환한다', () => {
      const metrics = generateMockZoneMetrics('forehead');

      expect(metrics).toHaveProperty('hydration');
      expect(metrics).toHaveProperty('oiliness');
      expect(metrics).toHaveProperty('pores');
      expect(metrics).toHaveProperty('texture');
      expect(metrics).toHaveProperty('pigmentation');
      expect(metrics).toHaveProperty('sensitivity');
      expect(metrics).toHaveProperty('elasticity');
    });

    it('모든 존 타입에 대해 메트릭을 생성한다', () => {
      for (const zone of allZones) {
        const metrics = generateMockZoneMetrics(zone);
        expect(metrics).toBeDefined();
        expect(typeof metrics.hydration).toBe('number');
      }
    });

    it('모든 메트릭이 0-100 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const metrics = generateMockZoneMetrics('forehead');

        expect(metrics.hydration).toBeGreaterThanOrEqual(0);
        expect(metrics.hydration).toBeLessThanOrEqual(100);
        expect(metrics.oiliness).toBeGreaterThanOrEqual(0);
        expect(metrics.oiliness).toBeLessThanOrEqual(100);
        expect(metrics.pores).toBeGreaterThanOrEqual(0);
        expect(metrics.pores).toBeLessThanOrEqual(100);
        expect(metrics.texture).toBeGreaterThanOrEqual(0);
        expect(metrics.texture).toBeLessThanOrEqual(100);
        expect(metrics.pigmentation).toBeGreaterThanOrEqual(0);
        expect(metrics.pigmentation).toBeLessThanOrEqual(100);
        expect(metrics.sensitivity).toBeGreaterThanOrEqual(0);
        expect(metrics.sensitivity).toBeLessThanOrEqual(100);
        expect(metrics.elasticity).toBeGreaterThanOrEqual(0);
        expect(metrics.elasticity).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('피부 타입별 특성', () => {
    it('건성 피부는 낮은 수분도와 유분도를 가진다', () => {
      // 여러 번 생성하여 평균 확인
      const samples = Array.from({ length: 10 }, () =>
        generateMockZoneMetrics('leftCheek', 'dry')
      );
      const avgHydration = samples.reduce((sum, m) => sum + m.hydration, 0) / samples.length;
      const avgOiliness = samples.reduce((sum, m) => sum + m.oiliness, 0) / samples.length;

      expect(avgHydration).toBeLessThan(55);
      expect(avgOiliness).toBeLessThan(45);
    });

    it('지성 피부는 높은 유분도를 가진다', () => {
      const samples = Array.from({ length: 10 }, () =>
        generateMockZoneMetrics('forehead', 'oily')
      );
      const avgOiliness = samples.reduce((sum, m) => sum + m.oiliness, 0) / samples.length;

      expect(avgOiliness).toBeGreaterThan(60);
    });

    it('민감성 피부는 높은 민감도를 가진다', () => {
      const samples = Array.from({ length: 10 }, () =>
        generateMockZoneMetrics('leftCheek', 'sensitive')
      );
      const avgSensitivity = samples.reduce((sum, m) => sum + m.sensitivity, 0) / samples.length;

      expect(avgSensitivity).toBeGreaterThan(50);
    });
  });

  describe('T존 특성', () => {
    it('이마는 유분기가 더 높다', () => {
      const foreheadSamples = Array.from({ length: 15 }, () =>
        generateMockZoneMetrics('forehead', 'normal')
      );
      const cheekSamples = Array.from({ length: 15 }, () =>
        generateMockZoneMetrics('leftCheek', 'normal')
      );

      const avgForeheadOil = foreheadSamples.reduce((sum, m) => sum + m.oiliness, 0) / foreheadSamples.length;
      const avgCheekOil = cheekSamples.reduce((sum, m) => sum + m.oiliness, 0) / cheekSamples.length;

      // T존 유분 보너스가 적용됨
      expect(avgForeheadOil).toBeGreaterThan(avgCheekOil);
    });

    it('코는 유분기가 더 높다', () => {
      const noseSamples = Array.from({ length: 15 }, () =>
        generateMockZoneMetrics('nose', 'normal')
      );
      const cheekSamples = Array.from({ length: 15 }, () =>
        generateMockZoneMetrics('leftCheek', 'normal')
      );

      const avgNoseOil = noseSamples.reduce((sum, m) => sum + m.oiliness, 0) / noseSamples.length;
      const avgCheekOil = cheekSamples.reduce((sum, m) => sum + m.oiliness, 0) / cheekSamples.length;

      expect(avgNoseOil).toBeGreaterThan(avgCheekOil);
    });
  });

  describe('눈가 특성', () => {
    it('눈가는 민감도가 더 높다', () => {
      const eyeSamples = Array.from({ length: 15 }, () =>
        generateMockZoneMetrics('eyeArea', 'normal')
      );
      const cheekSamples = Array.from({ length: 15 }, () =>
        generateMockZoneMetrics('leftCheek', 'normal')
      );

      const avgEyeSensitivity = eyeSamples.reduce((sum, m) => sum + m.sensitivity, 0) / eyeSamples.length;
      const avgCheekSensitivity = cheekSamples.reduce((sum, m) => sum + m.sensitivity, 0) / cheekSamples.length;

      expect(avgEyeSensitivity).toBeGreaterThan(avgCheekSensitivity);
    });
  });

  describe('메트릭 정수 확인', () => {
    it('pores, texture, pigmentation은 정수이다', () => {
      for (let i = 0; i < 10; i++) {
        const metrics = generateMockZoneMetrics('forehead');

        expect(Number.isInteger(metrics.pores)).toBe(true);
        expect(Number.isInteger(metrics.texture)).toBe(true);
        expect(Number.isInteger(metrics.pigmentation)).toBe(true);
      }
    });
  });
});

describe('generateMockZoneAnalysis', () => {
  describe('기본 동작', () => {
    it('유효한 ZoneAnalysisV2를 반환한다', () => {
      const analysis = generateMockZoneAnalysis('forehead');

      expect(analysis).toHaveProperty('zone');
      expect(analysis).toHaveProperty('group');
      expect(analysis).toHaveProperty('score');
      expect(analysis).toHaveProperty('metrics');
      expect(analysis).toHaveProperty('textureAnalysis');
      expect(analysis).toHaveProperty('concerns');
      expect(analysis).toHaveProperty('recommendations');
    });

    it('zone이 입력과 일치한다', () => {
      const analysis = generateMockZoneAnalysis('nose');
      expect(analysis.zone).toBe('nose');
    });

    it('group이 올바르게 매핑된다', () => {
      const foreheadAnalysis = generateMockZoneAnalysis('forehead');
      expect(foreheadAnalysis.group).toBe('tZone');

      const cheekAnalysis = generateMockZoneAnalysis('leftCheek');
      expect(cheekAnalysis.group).toBe('uZone');

      const eyeAnalysis = generateMockZoneAnalysis('eyeArea');
      expect(eyeAnalysis.group).toBe('eyeZone');

      const lipAnalysis = generateMockZoneAnalysis('lipArea');
      expect(lipAnalysis.group).toBe('lipZone');
    });
  });

  describe('score 계산', () => {
    it('score가 0-100 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const analysis = generateMockZoneAnalysis('forehead');
        expect(analysis.score).toBeGreaterThanOrEqual(0);
        expect(analysis.score).toBeLessThanOrEqual(100);
      }
    });

    it('score가 정수이다', () => {
      for (let i = 0; i < 10; i++) {
        const analysis = generateMockZoneAnalysis('forehead');
        expect(Number.isInteger(analysis.score)).toBe(true);
      }
    });
  });

  describe('textureAnalysis 검증', () => {
    it('textureAnalysis에 glcm이 포함된다', () => {
      const analysis = generateMockZoneAnalysis('forehead');

      expect(analysis.textureAnalysis.glcm).toBeDefined();
      expect(analysis.textureAnalysis.glcm).toHaveProperty('contrast');
      expect(analysis.textureAnalysis.glcm).toHaveProperty('homogeneity');
      expect(analysis.textureAnalysis.glcm).toHaveProperty('energy');
      expect(analysis.textureAnalysis.glcm).toHaveProperty('correlation');
      expect(analysis.textureAnalysis.glcm).toHaveProperty('entropy');
    });

    it('textureAnalysis에 lbp가 포함된다', () => {
      const analysis = generateMockZoneAnalysis('forehead');

      expect(analysis.textureAnalysis.lbp).toBeDefined();
      expect(analysis.textureAnalysis.lbp.histogram).toHaveLength(256);
      expect(analysis.textureAnalysis.lbp).toHaveProperty('uniformPatternRatio');
      expect(analysis.textureAnalysis.lbp).toHaveProperty('roughnessScore');
    });

    it('textureAnalysis 점수들이 유효하다', () => {
      const analysis = generateMockZoneAnalysis('forehead');

      expect(analysis.textureAnalysis.poreScore).toBeGreaterThanOrEqual(0);
      expect(analysis.textureAnalysis.poreScore).toBeLessThanOrEqual(100);
      expect(analysis.textureAnalysis.wrinkleScore).toBeGreaterThanOrEqual(0);
      expect(analysis.textureAnalysis.wrinkleScore).toBeLessThanOrEqual(100);
      expect(analysis.textureAnalysis.textureScore).toBeGreaterThanOrEqual(0);
      expect(analysis.textureAnalysis.textureScore).toBeLessThanOrEqual(100);
    });
  });

  describe('concerns 검증', () => {
    it('concerns가 배열이다', () => {
      const analysis = generateMockZoneAnalysis('forehead');
      expect(Array.isArray(analysis.concerns)).toBe(true);
    });

    it('concerns는 한국어 문자열을 포함한다', () => {
      // 여러 번 실행하여 concerns가 생성되는 경우 확인
      for (let i = 0; i < 20; i++) {
        const analysis = generateMockZoneAnalysis('forehead', 'dry');
        for (const concern of analysis.concerns) {
          expect(typeof concern).toBe('string');
        }
      }
    });
  });

  describe('recommendations 검증', () => {
    it('recommendations가 배열이다', () => {
      const analysis = generateMockZoneAnalysis('forehead');
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('recommendations는 중복이 제거된다', () => {
      for (let i = 0; i < 10; i++) {
        const analysis = generateMockZoneAnalysis('forehead');
        const uniqueRecs = [...new Set(analysis.recommendations)];
        expect(analysis.recommendations.length).toBe(uniqueRecs.length);
      }
    });
  });

  describe('previousScore 옵션', () => {
    it('previousScore가 지정되면 포함된다', () => {
      const analysis = generateMockZoneAnalysis('forehead', undefined, 75);
      expect(analysis.previousScore).toBe(75);
    });

    it('previousScore가 지정되지 않으면 undefined이다', () => {
      const analysis = generateMockZoneAnalysis('forehead');
      expect(analysis.previousScore).toBeUndefined();
    });
  });

  describe('ZONE_GROUP_MAPPING 활용', () => {
    it('모든 존이 올바른 그룹으로 매핑된다', () => {
      const zoneGroupPairs: Array<[SkinZoneType, ZoneGroup]> = [
        ['forehead', 'tZone'],
        ['nose', 'tZone'],
        ['leftCheek', 'uZone'],
        ['rightCheek', 'uZone'],
        ['chin', 'uZone'],
        ['eyeArea', 'eyeZone'],
        ['lipArea', 'lipZone'],
      ];

      for (const [zone, expectedGroup] of zoneGroupPairs) {
        const analysis = generateMockZoneAnalysis(zone);
        expect(analysis.group).toBe(expectedGroup);
        expect(ZONE_GROUP_MAPPING[zone]).toBe(expectedGroup);
      }
    });
  });
});

describe('generateMockSkinAnalysisV2Result', () => {
  describe('기본 동작', () => {
    it('유효한 SkinAnalysisV2Result를 반환한다', () => {
      const result = generateMockSkinAnalysisV2Result();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('skinType');
      expect(result).toHaveProperty('vitalityScore');
      expect(result).toHaveProperty('vitalityGrade');
      expect(result).toHaveProperty('zoneAnalysis');
      expect(result).toHaveProperty('scoreBreakdown');
      expect(result).toHaveProperty('primaryConcerns');
      expect(result).toHaveProperty('routineRecommendations');
      expect(result).toHaveProperty('analyzedAt');
      expect(result).toHaveProperty('usedFallback');
    });

    it('usedFallback이 true이다 (Mock 데이터이므로)', () => {
      const result = generateMockSkinAnalysisV2Result();
      expect(result.usedFallback).toBe(true);
    });

    it('id가 mock-s2- 접두사로 시작한다', () => {
      const result = generateMockSkinAnalysisV2Result();
      expect(result.id).toMatch(/^mock-s2-\d+-[a-z0-9]+$/);
    });

    it('analyzedAt이 유효한 ISO 날짜 문자열이다', () => {
      const result = generateMockSkinAnalysisV2Result();
      const date = new Date(result.analyzedAt);
      expect(date.toISOString()).toBe(result.analyzedAt);
    });
  });

  describe('skinType 검증', () => {
    it('피부 타입이 지정되면 해당 타입을 사용한다', () => {
      const result = generateMockSkinAnalysisV2Result('oily');
      expect(result.skinType).toBe('oily');
    });

    it('피부 타입이 지정되지 않으면 메트릭 기반으로 결정된다', () => {
      const result = generateMockSkinAnalysisV2Result();
      const validTypes: SkinTypeV2[] = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
      expect(validTypes).toContain(result.skinType);
    });
  });

  describe('vitalityScore 검증', () => {
    it('vitalityScore가 0-100 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockSkinAnalysisV2Result();
        expect(result.vitalityScore).toBeGreaterThanOrEqual(0);
        expect(result.vitalityScore).toBeLessThanOrEqual(100);
      }
    });

    it('vitalityScore가 정수이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockSkinAnalysisV2Result();
        expect(Number.isInteger(result.vitalityScore)).toBe(true);
      }
    });
  });

  describe('vitalityGrade 검증', () => {
    it('vitalityGrade가 점수와 일치한다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockSkinAnalysisV2Result();
        const score = result.vitalityScore;
        const grade = result.vitalityGrade;

        if (score >= VITALITY_GRADE_THRESHOLDS.S) {
          expect(grade).toBe('S');
        } else if (score >= VITALITY_GRADE_THRESHOLDS.A) {
          expect(grade).toBe('A');
        } else if (score >= VITALITY_GRADE_THRESHOLDS.B) {
          expect(grade).toBe('B');
        } else if (score >= VITALITY_GRADE_THRESHOLDS.C) {
          expect(grade).toBe('C');
        } else {
          expect(grade).toBe('D');
        }
      }
    });

    it('유효한 등급만 반환된다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockSkinAnalysisV2Result();
        expect(['S', 'A', 'B', 'C', 'D']).toContain(result.vitalityGrade);
      }
    });
  });

  describe('zoneAnalysis 검증', () => {
    it('7개 존 모두 분석 결과가 포함된다', () => {
      const result = generateMockSkinAnalysisV2Result();
      const zones = result.zoneAnalysis.zones;

      expect(zones.forehead).toBeDefined();
      expect(zones.nose).toBeDefined();
      expect(zones.leftCheek).toBeDefined();
      expect(zones.rightCheek).toBeDefined();
      expect(zones.chin).toBeDefined();
      expect(zones.eyeArea).toBeDefined();
      expect(zones.lipArea).toBeDefined();
    });

    it('groupAverages가 포함된다', () => {
      const result = generateMockSkinAnalysisV2Result();

      expect(result.zoneAnalysis.groupAverages).toHaveProperty('tZone');
      expect(result.zoneAnalysis.groupAverages).toHaveProperty('uZone');
      expect(result.zoneAnalysis.groupAverages).toHaveProperty('eyeZone');
      expect(result.zoneAnalysis.groupAverages).toHaveProperty('lipZone');
    });

    it('tUzoneDifference가 포함된다', () => {
      const result = generateMockSkinAnalysisV2Result();

      expect(result.zoneAnalysis.tUzoneDifference).toHaveProperty('oilinessDiff');
      expect(result.zoneAnalysis.tUzoneDifference).toHaveProperty('hydrationDiff');
      expect(result.zoneAnalysis.tUzoneDifference).toHaveProperty('isCombiSkin');
    });
  });

  describe('scoreBreakdown 검증', () => {
    it('scoreBreakdown에 4개 카테고리가 포함된다', () => {
      const result = generateMockSkinAnalysisV2Result();

      expect(result.scoreBreakdown).toHaveProperty('hydration');
      expect(result.scoreBreakdown).toHaveProperty('elasticity');
      expect(result.scoreBreakdown).toHaveProperty('clarity');
      expect(result.scoreBreakdown).toHaveProperty('tone');
    });

    it('scoreBreakdown 값들이 0-100 범위이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockSkinAnalysisV2Result();

        expect(result.scoreBreakdown.hydration).toBeGreaterThanOrEqual(0);
        expect(result.scoreBreakdown.hydration).toBeLessThanOrEqual(100);
        expect(result.scoreBreakdown.elasticity).toBeGreaterThanOrEqual(0);
        expect(result.scoreBreakdown.elasticity).toBeLessThanOrEqual(100);
        expect(result.scoreBreakdown.clarity).toBeGreaterThanOrEqual(0);
        expect(result.scoreBreakdown.clarity).toBeLessThanOrEqual(100);
        expect(result.scoreBreakdown.tone).toBeGreaterThanOrEqual(0);
        expect(result.scoreBreakdown.tone).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('primaryConcerns 검증', () => {
    it('primaryConcerns가 배열이다', () => {
      const result = generateMockSkinAnalysisV2Result();
      expect(Array.isArray(result.primaryConcerns)).toBe(true);
    });

    it('primaryConcerns는 최대 3개이다', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateMockSkinAnalysisV2Result();
        expect(result.primaryConcerns.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('routineRecommendations 검증', () => {
    it('routineRecommendations가 배열이다', () => {
      const result = generateMockSkinAnalysisV2Result();
      expect(Array.isArray(result.routineRecommendations)).toBe(true);
    });

    it('routineRecommendations에 5단계 루틴이 포함된다', () => {
      const result = generateMockSkinAnalysisV2Result();
      expect(result.routineRecommendations?.length).toBe(5);
    });

    it('각 루틴에 필수 속성이 포함된다', () => {
      const result = generateMockSkinAnalysisV2Result();

      for (const routine of result.routineRecommendations || []) {
        expect(routine).toHaveProperty('step');
        expect(routine).toHaveProperty('category');
        expect(routine).toHaveProperty('reason');
        expect(routine).toHaveProperty('ingredients');
        expect(routine).toHaveProperty('avoidIngredients');
      }
    });

    it('루틴 단계가 1부터 5까지이다', () => {
      const result = generateMockSkinAnalysisV2Result();
      const steps = result.routineRecommendations?.map(r => r.step) || [];

      expect(steps).toEqual([1, 2, 3, 4, 5]);
    });

    it('루틴 카테고리가 유효하다', () => {
      const validCategories = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen'];
      const result = generateMockSkinAnalysisV2Result();

      for (const routine of result.routineRecommendations || []) {
        expect(validCategories).toContain(routine.category);
      }
    });
  });

  describe('피부 타입별 루틴 차이', () => {
    it('지성 피부는 살리실산이 포함된 클렌저를 추천받는다', () => {
      const result = generateMockSkinAnalysisV2Result('oily');
      const cleanser = result.routineRecommendations?.find(r => r.category === 'cleanser');

      expect(cleanser?.ingredients).toContain('살리실산');
    });

    it('건성 피부는 히알루론산 세럼을 추천받는다', () => {
      const result = generateMockSkinAnalysisV2Result('dry');
      const serum = result.routineRecommendations?.find(r => r.category === 'serum');

      expect(serum?.ingredients).toContain('히알루론산');
    });

    it('민감성 피부는 SLS를 피해야 한다', () => {
      const result = generateMockSkinAnalysisV2Result('sensitive');
      const cleanser = result.routineRecommendations?.find(r => r.category === 'cleanser');

      expect(cleanser?.avoidIngredients).toContain('SLS');
    });
  });
});
