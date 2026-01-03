/**
 * Visual Analysis Mock 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateMockLandmarks,
  generateMockPigmentAnalysis,
  generateMockDrapingResults,
  generateMockDrapeResults,
  generateMockSynergyInsight,
  generateMockVisualAnalysis,
  FACE_OVAL_INDICES,
  LEFT_EYE_INDICES,
  RIGHT_EYE_INDICES,
  LIPS_INDICES,
} from '@/lib/mock/visual-analysis';

describe('Visual Analysis Mock', () => {
  describe('generateMockLandmarks', () => {
    it('468개의 랜드마크를 생성한다', () => {
      const result = generateMockLandmarks();
      expect(result.landmarks).toHaveLength(468);
    });

    it('각 랜드마크는 x, y, z 좌표를 가진다', () => {
      const result = generateMockLandmarks();

      result.landmarks.forEach((landmark) => {
        expect(landmark).toHaveProperty('x');
        expect(landmark).toHaveProperty('y');
        expect(landmark).toHaveProperty('z');
        expect(typeof landmark.x).toBe('number');
        expect(typeof landmark.y).toBe('number');
        expect(typeof landmark.z).toBe('number');
      });
    });

    it('좌표값은 0~1 범위 내에 있다', () => {
      const result = generateMockLandmarks();

      result.landmarks.forEach((landmark) => {
        expect(landmark.x).toBeGreaterThanOrEqual(0);
        expect(landmark.x).toBeLessThanOrEqual(1);
        expect(landmark.y).toBeGreaterThanOrEqual(0);
        expect(landmark.y).toBeLessThanOrEqual(1);
      });
    });

    it('얼굴 윤곽 인덱스를 포함한다', () => {
      const result = generateMockLandmarks();
      expect(result.faceOval).toEqual(FACE_OVAL_INDICES);
      expect(result.faceOval).toHaveLength(36);
    });

    it('눈 인덱스를 포함한다', () => {
      const result = generateMockLandmarks();
      expect(result.leftEye).toEqual(LEFT_EYE_INDICES);
      expect(result.rightEye).toEqual(RIGHT_EYE_INDICES);
      expect(result.leftEye).toHaveLength(16);
      expect(result.rightEye).toHaveLength(16);
    });

    it('입술 인덱스를 포함한다', () => {
      const result = generateMockLandmarks();
      expect(result.lips).toEqual(LIPS_INDICES);
      expect(result.lips).toHaveLength(20);
    });
  });

  describe('generateMockPigmentAnalysis', () => {
    it('색소 분석 결과를 반환한다', () => {
      const result = generateMockPigmentAnalysis();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('melanin_avg');
      expect(result).toHaveProperty('hemoglobin_avg');
      expect(result).toHaveProperty('distribution');
    });

    it('멜라닌 평균값은 0.35~0.55 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockPigmentAnalysis();
        expect(result.melanin_avg).toBeGreaterThanOrEqual(0.35);
        expect(result.melanin_avg).toBeLessThanOrEqual(0.55);
      }
    });

    it('헤모글로빈 평균값은 0.25~0.40 범위이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockPigmentAnalysis();
        expect(result.hemoglobin_avg).toBeGreaterThanOrEqual(0.25);
        expect(result.hemoglobin_avg).toBeLessThanOrEqual(0.4);
      }
    });

    it('분포 배열은 10개 구간이다', () => {
      const result = generateMockPigmentAnalysis();
      expect(result.distribution).toHaveLength(10);
    });

    it('분포 합계는 약 1이다', () => {
      const result = generateMockPigmentAnalysis();
      const sum = result.distribution.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 1);
    });
  });

  describe('generateMockDrapingResults', () => {
    it('드레이핑 결과를 반환한다', () => {
      const result = generateMockDrapingResults();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('best_colors');
      expect(result).toHaveProperty('uniformity_scores');
      expect(result).toHaveProperty('metal_test');
    });

    it('베스트 컬러 5개를 반환한다', () => {
      const result = generateMockDrapingResults();
      expect(result.best_colors).toHaveLength(5);
    });

    it('베스트 컬러는 HEX 형식이다', () => {
      const result = generateMockDrapingResults();
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;

      result.best_colors.forEach((color) => {
        expect(color).toMatch(hexPattern);
      });
    });

    it('균일도 점수가 각 색상별로 존재한다', () => {
      const result = generateMockDrapingResults();

      result.best_colors.forEach((color) => {
        expect(result.uniformity_scores[color]).toBeDefined();
        expect(typeof result.uniformity_scores[color]).toBe('number');
      });
    });

    it('금속 테스트는 gold 또는 silver이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockDrapingResults();
        expect(['gold', 'silver']).toContain(result.metal_test);
      }
    });
  });

  describe('generateMockDrapeResults', () => {
    it('드레이프 순위 결과를 반환한다', () => {
      const result = generateMockDrapeResults();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });

    it('각 결과는 color, uniformity, rank를 가진다', () => {
      const result = generateMockDrapeResults();

      result.forEach((item) => {
        expect(item).toHaveProperty('color');
        expect(item).toHaveProperty('uniformity');
        expect(item).toHaveProperty('rank');
      });
    });

    it('순위는 1부터 5까지이다', () => {
      const result = generateMockDrapeResults();
      const ranks = result.map((r) => r.rank);
      expect(ranks).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('generateMockSynergyInsight', () => {
    it('시너지 인사이트를 반환한다', () => {
      const result = generateMockSynergyInsight();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('colorAdjustment');
      expect(result).toHaveProperty('reason');
    });

    it('colorAdjustment는 neutral, bright, muted 중 하나이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockSynergyInsight();
        expect(['neutral', 'bright', 'muted']).toContain(result.colorAdjustment);
      }
    });

    it('reason은 4가지 상태 중 하나이다', () => {
      for (let i = 0; i < 20; i++) {
        const result = generateMockSynergyInsight();
        expect(['high_redness', 'low_hydration', 'high_oiliness', 'normal']).toContain(
          result.reason
        );
      }
    });

    it('색소 분석 결과를 기반으로 인사이트를 생성한다', () => {
      // 높은 헤모글로빈 (붉은기)
      const highRedness = generateMockSynergyInsight({
        melanin_avg: 0.4,
        hemoglobin_avg: 0.4,
        distribution: [],
      });
      expect(highRedness.reason).toBe('high_redness');
      expect(highRedness.colorAdjustment).toBe('muted');

      // 낮은 멜라닌 (건조함)
      const lowHydration = generateMockSynergyInsight({
        melanin_avg: 0.25,
        hemoglobin_avg: 0.3,
        distribution: [],
      });
      expect(lowHydration.reason).toBe('low_hydration');
      expect(lowHydration.colorAdjustment).toBe('bright');

      // 높은 멜라닌 (유분)
      const highOiliness = generateMockSynergyInsight({
        melanin_avg: 0.55,
        hemoglobin_avg: 0.3,
        distribution: [],
      });
      expect(highOiliness.reason).toBe('high_oiliness');
      expect(highOiliness.colorAdjustment).toBe('muted');
    });
  });

  describe('generateMockVisualAnalysis', () => {
    it('전체 시각 분석 결과를 반환한다', () => {
      const result = generateMockVisualAnalysis();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('landmarks');
      expect(result).toHaveProperty('pigmentAnalysis');
      expect(result).toHaveProperty('drapingResults');
      expect(result).toHaveProperty('synergyInsight');
      expect(result).toHaveProperty('isMock');
    });

    it('isMock 플래그가 true이다', () => {
      const result = generateMockVisualAnalysis();
      expect(result.isMock).toBe(true);
    });

    it('모든 하위 데이터가 유효하다', () => {
      const result = generateMockVisualAnalysis();

      expect(result.landmarks.landmarks).toHaveLength(468);
      expect(result.pigmentAnalysis.distribution).toHaveLength(10);
      expect(result.drapingResults.best_colors).toHaveLength(5);
      expect(result.synergyInsight.message).toBeDefined();
    });
  });

  describe('상수 데이터 검증', () => {
    it('FACE_OVAL_INDICES에 36개 인덱스가 있다', () => {
      expect(FACE_OVAL_INDICES).toHaveLength(36);
      FACE_OVAL_INDICES.forEach((idx) => {
        expect(typeof idx).toBe('number');
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(468);
      });
    });

    it('LEFT_EYE_INDICES에 16개 인덱스가 있다', () => {
      expect(LEFT_EYE_INDICES).toHaveLength(16);
    });

    it('RIGHT_EYE_INDICES에 16개 인덱스가 있다', () => {
      expect(RIGHT_EYE_INDICES).toHaveLength(16);
    });

    it('LIPS_INDICES에 20개 인덱스가 있다', () => {
      expect(LIPS_INDICES).toHaveLength(20);
    });
  });
});
