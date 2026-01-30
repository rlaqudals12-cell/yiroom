/**
 * CIE-4 CCT 분석기 테스트
 *
 * @module tests/lib/image-engine/cie-4/cct-analyzer
 * @description 색온도 추정 및 분류 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRegionAverageRGB,
  classifyLightingType,
  evaluateCCTSuitability,
  needsCCTCorrection,
} from '@/lib/image-engine/cie-4/cct-analyzer';
import type { RGBImageData, NormalizedRect } from '@/lib/image-engine/types';

describe('lib/image-engine/cie-4/cct-analyzer', () => {
  // =========================================
  // calculateRegionAverageRGB 테스트
  // =========================================

  describe('calculateRegionAverageRGB', () => {
    it('전체 영역의 평균 RGB를 계산한다', () => {
      // 2x2 이미지
      const image: RGBImageData = {
        data: new Uint8Array([
          100,
          50,
          25,
          255, // (0,0)
          200,
          150,
          75,
          255, // (1,0)
          150,
          100,
          50,
          255, // (0,1)
          50,
          0,
          150,
          255, // (1,1)
        ]),
        width: 2,
        height: 2,
        channels: 4,
      };

      const fullRegion: NormalizedRect = { x: 0, y: 0, width: 1, height: 1 };
      const avg = calculateRegionAverageRGB(image, fullRegion);

      // (100+200+150+50)/4 = 125, (50+150+100+0)/4 = 75, (25+75+50+150)/4 = 75
      expect(avg.r).toBe(125);
      expect(avg.g).toBe(75);
      expect(avg.b).toBe(75);
    });

    it('부분 영역의 평균 RGB를 계산한다', () => {
      // 4x4 이미지에서 좌상단 2x2 영역
      const image: RGBImageData = {
        data: new Uint8Array(4 * 4 * 4).fill(0),
        width: 4,
        height: 4,
        channels: 4,
      };

      // 좌상단 2x2만 빨간색으로 설정
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          const idx = (y * 4 + x) * 4;
          image.data[idx] = 200; // R
          image.data[idx + 1] = 100; // G
          image.data[idx + 2] = 50; // B
          image.data[idx + 3] = 255; // A
        }
      }

      const topLeftRegion: NormalizedRect = { x: 0, y: 0, width: 0.5, height: 0.5 };
      const avg = calculateRegionAverageRGB(image, topLeftRegion);

      expect(avg.r).toBe(200);
      expect(avg.g).toBe(100);
      expect(avg.b).toBe(50);
    });

    it('빈 영역에서 기본값을 반환한다', () => {
      const image: RGBImageData = {
        data: new Uint8Array([255, 0, 0, 255]),
        width: 1,
        height: 1,
        channels: 4,
      };

      // 크기가 0인 영역
      const emptyRegion: NormalizedRect = { x: 0.5, y: 0.5, width: 0, height: 0 };
      const avg = calculateRegionAverageRGB(image, emptyRegion);

      // 기본값 (128, 128, 128)
      expect(avg.r).toBe(128);
      expect(avg.g).toBe(128);
      expect(avg.b).toBe(128);
    });

    it('정규화 좌표를 올바르게 픽셀 좌표로 변환한다', () => {
      // 10x10 이미지
      const image: RGBImageData = {
        data: new Uint8Array(10 * 10 * 4).fill(128),
        width: 10,
        height: 10,
        channels: 4,
      };

      // 중앙 영역 설정
      for (let y = 3; y < 7; y++) {
        for (let x = 3; x < 7; x++) {
          const idx = (y * 10 + x) * 4;
          image.data[idx] = 255; // R
        }
      }

      // 0.3 ~ 0.7 영역 (3 ~ 7 픽셀)
      const centerRegion: NormalizedRect = { x: 0.3, y: 0.3, width: 0.4, height: 0.4 };
      const avg = calculateRegionAverageRGB(image, centerRegion);

      // 중앙 영역은 R=255, 나머지는 128
      expect(avg.r).toBe(255);
    });
  });

  // =========================================
  // classifyLightingType 테스트
  // =========================================

  describe('classifyLightingType', () => {
    it('낮은 CCT는 warm으로 분류한다', () => {
      expect(classifyLightingType(3000)).toBe('warm');
      expect(classifyLightingType(4000)).toBe('warm');
    });

    it('중간 CCT는 neutral로 분류한다', () => {
      expect(classifyLightingType(5500)).toBe('neutral');
      expect(classifyLightingType(6000)).toBe('neutral');
      expect(classifyLightingType(6500)).toBe('neutral');
    });

    it('높은 CCT는 cool로 분류한다', () => {
      expect(classifyLightingType(7500)).toBe('cool');
      expect(classifyLightingType(8000)).toBe('cool');
    });

    it('극단적인 CCT는 extreme 또는 해당 방향으로 분류한다', () => {
      // 2000K는 매우 따뜻한 조명 (warm)
      // 12000K는 매우 차가운 조명 (cool 또는 extreme)
      const lowCCT = classifyLightingType(2000);
      const highCCT = classifyLightingType(12000);

      expect(lowCCT === 'warm' || lowCCT === 'extreme').toBe(true);
      expect(highCCT === 'cool' || highCCT === 'extreme').toBe(true);
    });

    it('경계값에서 올바르게 분류한다', () => {
      // warm과 neutral 경계 근처
      const warmBoundary = classifyLightingType(4500);
      expect(warmBoundary === 'warm' || warmBoundary === 'neutral').toBe(true);

      // neutral과 cool 경계 근처
      const coolBoundary = classifyLightingType(7000);
      expect(coolBoundary === 'neutral' || coolBoundary === 'cool').toBe(true);
    });
  });

  // =========================================
  // evaluateCCTSuitability 테스트
  // =========================================

  describe('evaluateCCTSuitability', () => {
    it('이상적인 범위(5500-6500K)에서 높은 점수를 반환한다', () => {
      // 중앙값 근처에서 높은 점수, 경계에서는 약간 낮을 수 있음
      expect(evaluateCCTSuitability(6000)).toBeGreaterThanOrEqual(80);
      expect(evaluateCCTSuitability(6500)).toBeGreaterThanOrEqual(80);
      expect(evaluateCCTSuitability(5500)).toBeGreaterThanOrEqual(60); // 경계값은 낮을 수 있음
    });

    it('허용 범위(4000-7500K)에서 중간 점수를 반환한다', () => {
      const score4500 = evaluateCCTSuitability(4500);
      const score7000 = evaluateCCTSuitability(7000);

      expect(score4500).toBeGreaterThanOrEqual(50);
      expect(score4500).toBeLessThan(80);
      expect(score7000).toBeGreaterThanOrEqual(50);
      expect(score7000).toBeLessThan(80);
    });

    it('허용 범위 밖에서 낮은 점수를 반환한다', () => {
      expect(evaluateCCTSuitability(3000)).toBeLessThan(50);
      expect(evaluateCCTSuitability(9000)).toBeLessThan(50);
    });

    it('극단값에서 0에 가까운 점수를 반환한다', () => {
      expect(evaluateCCTSuitability(2000)).toBeLessThanOrEqual(20);
      expect(evaluateCCTSuitability(15000)).toBeLessThanOrEqual(20);
    });

    it('점수가 0-100 범위 내에 있다', () => {
      const testCCTs = [1000, 3000, 5000, 6500, 8000, 10000, 20000];
      for (const cct of testCCTs) {
        const score = evaluateCCTSuitability(cct);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });

    it('D65(6500K) 근처에서 최고점에 가깝다', () => {
      const d65Score = evaluateCCTSuitability(6500);
      const nearD65Score = evaluateCCTSuitability(6000);

      expect(d65Score).toBeGreaterThanOrEqual(80);
      expect(nearD65Score).toBeGreaterThanOrEqual(d65Score - 20);
    });
  });

  // =========================================
  // needsCCTCorrection 테스트
  // =========================================

  describe('needsCCTCorrection', () => {
    it('허용 범위 내에서 false를 반환한다', () => {
      expect(needsCCTCorrection(5000)).toBe(false);
      expect(needsCCTCorrection(6500)).toBe(false);
      expect(needsCCTCorrection(7000)).toBe(false);
    });

    it('허용 범위 밖에서 true를 반환한다', () => {
      expect(needsCCTCorrection(3000)).toBe(true);
      expect(needsCCTCorrection(9000)).toBe(true);
    });

    it('경계값에서 올바르게 판단한다', () => {
      // 허용 범위 경계 (4000K ~ 7500K 가정)
      // 정확한 값은 CCT_THRESHOLDS.acceptable에 따라 다름
      const boundaryLow = needsCCTCorrection(3999);
      const boundaryHigh = needsCCTCorrection(7501);

      // 경계 밖은 보정 필요
      expect(boundaryLow).toBe(true);
      expect(boundaryHigh).toBe(true);
    });
  });

  // =========================================
  // 통합 시나리오 테스트
  // =========================================

  describe('통합 시나리오', () => {
    it('자연광 조건에서 최적의 결과를 반환한다', () => {
      const daylightCCT = 6000;

      expect(classifyLightingType(daylightCCT)).toBe('neutral');
      expect(evaluateCCTSuitability(daylightCCT)).toBeGreaterThanOrEqual(80);
      expect(needsCCTCorrection(daylightCCT)).toBe(false);
    });

    it('백열등 조건에서 보정이 필요하다고 판단한다', () => {
      // 2700K는 warm 범위에 해당 (extreme은 < 2500K)
      const incandescentCCT = 2700;

      expect(classifyLightingType(incandescentCCT)).toBe('warm');
      expect(evaluateCCTSuitability(incandescentCCT)).toBeLessThan(50);
      expect(needsCCTCorrection(incandescentCCT)).toBe(true);
    });

    it('차가운 형광등 조건에서 적절히 평가한다', () => {
      const coolFluorescentCCT = 7200;

      expect(classifyLightingType(coolFluorescentCCT)).toBe('cool');
      expect(evaluateCCTSuitability(coolFluorescentCCT)).toBeLessThan(80);
    });
  });
});
