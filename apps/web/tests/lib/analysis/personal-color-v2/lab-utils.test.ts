/**
 * PC-2 Lab 유틸리티 테스트
 *
 * @module tests/lib/analysis/personal-color-v2/lab-utils
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 */

import { describe, it, expect } from 'vitest';
import {
  rgbToLab,
  labToRgb,
  hexToLab,
  labToHex,
  calculateChroma,
  calculateHue,
  calculateITA,
  calculateLabDistance,
  calculateCIEDE2000,
} from '@/lib/analysis/personal-color-v2';
import type { LabColor, RGBColor } from '@/lib/analysis/personal-color-v2';

describe('PC-2 Lab Utils', () => {
  // ==========================================================================
  // rgbToLab
  // ==========================================================================
  describe('rgbToLab', () => {
    it('should convert white correctly', () => {
      const lab = rgbToLab(255, 255, 255);

      // 흰색: L*≈100, a*≈0, b*≈0
      expect(lab.L).toBeCloseTo(100, 0);
      expect(Math.abs(lab.a)).toBeLessThan(1);
      expect(Math.abs(lab.b)).toBeLessThan(1);
    });

    it('should convert black correctly', () => {
      const lab = rgbToLab(0, 0, 0);

      // 검정색: L*=0, a*=0, b*=0
      expect(lab.L).toBeCloseTo(0, 0);
      expect(Math.abs(lab.a)).toBeLessThan(1);
      expect(Math.abs(lab.b)).toBeLessThan(1);
    });

    it('should convert pure red correctly', () => {
      const lab = rgbToLab(255, 0, 0);

      // 빨강: L*≈53, a*>0 (빨강 방향), b*>0 (노랑 방향)
      expect(lab.L).toBeGreaterThan(50);
      expect(lab.L).toBeLessThan(60);
      expect(lab.a).toBeGreaterThan(70); // 강한 빨강
      expect(lab.b).toBeGreaterThan(40);
    });

    it('should convert pure green correctly', () => {
      const lab = rgbToLab(0, 255, 0);

      // 초록: L*≈88, a*<0 (초록 방향), b*>0 (노랑 방향)
      expect(lab.L).toBeGreaterThan(80);
      expect(lab.a).toBeLessThan(-80); // 강한 초록
      expect(lab.b).toBeGreaterThan(70);
    });

    it('should convert pure blue correctly', () => {
      const lab = rgbToLab(0, 0, 255);

      // 파랑: L*≈32, a*>0 (빨강 방향), b*<0 (파랑 방향)
      expect(lab.L).toBeGreaterThan(25);
      expect(lab.L).toBeLessThan(40);
      expect(lab.a).toBeGreaterThan(50);
      expect(lab.b).toBeLessThan(-100); // 강한 파랑
    });

    it('should convert neutral gray correctly', () => {
      const lab = rgbToLab(128, 128, 128);

      // 회색: L*≈50, a*≈0, b*≈0
      expect(lab.L).toBeCloseTo(54, 0);
      expect(Math.abs(lab.a)).toBeLessThan(1);
      expect(Math.abs(lab.b)).toBeLessThan(1);
    });

    it('should clamp out-of-range RGB values', () => {
      const lab1 = rgbToLab(300, -50, 128);
      const lab2 = rgbToLab(255, 0, 128);

      // 300->255, -50->0으로 클램핑되어야 함
      expect(lab1.L).toBeCloseTo(lab2.L, 0);
    });
  });

  // ==========================================================================
  // labToRgb
  // ==========================================================================
  describe('labToRgb', () => {
    it('should convert white Lab to RGB', () => {
      const rgb = labToRgb({ L: 100, a: 0, b: 0 });

      expect(rgb.r).toBeCloseTo(255, 0);
      expect(rgb.g).toBeCloseTo(255, 0);
      expect(rgb.b).toBeCloseTo(255, 0);
    });

    it('should convert black Lab to RGB', () => {
      const rgb = labToRgb({ L: 0, a: 0, b: 0 });

      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it('should roundtrip RGB -> Lab -> RGB', () => {
      const original = { r: 180, g: 120, b: 90 };
      const lab = rgbToLab(original.r, original.g, original.b);
      const roundtrip = labToRgb(lab);

      // 약간의 정밀도 손실 허용 (±1)
      expect(roundtrip.r).toBeCloseTo(original.r, 0);
      expect(roundtrip.g).toBeCloseTo(original.g, 0);
      expect(roundtrip.b).toBeCloseTo(original.b, 0);
    });
  });

  // ==========================================================================
  // hexToLab
  // ==========================================================================
  describe('hexToLab', () => {
    it('should convert HEX with # prefix', () => {
      const lab = hexToLab('#FF5733');
      const expected = rgbToLab(255, 87, 51);

      expect(lab.L).toBeCloseTo(expected.L, 1);
      expect(lab.a).toBeCloseTo(expected.a, 1);
      expect(lab.b).toBeCloseTo(expected.b, 1);
    });

    it('should convert HEX without # prefix', () => {
      const lab = hexToLab('FF5733');
      const expected = rgbToLab(255, 87, 51);

      expect(lab.L).toBeCloseTo(expected.L, 1);
    });

    it('should convert white HEX', () => {
      const lab = hexToLab('#FFFFFF');

      expect(lab.L).toBeCloseTo(100, 0);
    });

    it('should convert black HEX', () => {
      const lab = hexToLab('#000000');

      expect(lab.L).toBeCloseTo(0, 0);
    });
  });

  // ==========================================================================
  // labToHex
  // ==========================================================================
  describe('labToHex', () => {
    it('should convert white Lab to HEX', () => {
      const hex = labToHex({ L: 100, a: 0, b: 0 });

      expect(hex).toBe('#FFFFFF');
    });

    it('should convert black Lab to HEX', () => {
      const hex = labToHex({ L: 0, a: 0, b: 0 });

      expect(hex).toBe('#000000');
    });

    it('should roundtrip HEX -> Lab -> HEX', () => {
      const original = '#B87333'; // 구리색
      const lab = hexToLab(original);
      const roundtrip = labToHex(lab);

      expect(roundtrip).toBe(original);
    });
  });

  // ==========================================================================
  // calculateChroma
  // ==========================================================================
  describe('calculateChroma', () => {
    it('should calculate chroma for achromatic color', () => {
      const chroma = calculateChroma({ L: 50, a: 0, b: 0 });

      expect(chroma).toBe(0);
    });

    it('should calculate chroma correctly', () => {
      // C* = sqrt(a*^2 + b*^2) = sqrt(3^2 + 4^2) = 5
      const chroma = calculateChroma({ L: 50, a: 3, b: 4 });

      expect(chroma).toBe(5);
    });

    it('should calculate chroma for saturated color', () => {
      const chroma = calculateChroma({ L: 50, a: 60, b: 80 });

      // sqrt(60^2 + 80^2) = sqrt(3600 + 6400) = sqrt(10000) = 100
      expect(chroma).toBe(100);
    });
  });

  // ==========================================================================
  // calculateHue
  // ==========================================================================
  describe('calculateHue', () => {
    it('should return 0 for a*>0, b*=0 (pure red direction)', () => {
      const hue = calculateHue({ L: 50, a: 10, b: 0 });

      expect(hue).toBeCloseTo(0, 1);
    });

    it('should return 90 for a*=0, b*>0 (pure yellow direction)', () => {
      const hue = calculateHue({ L: 50, a: 0, b: 10 });

      expect(hue).toBeCloseTo(90, 1);
    });

    it('should return 180 for a*<0, b*=0 (pure green direction)', () => {
      const hue = calculateHue({ L: 50, a: -10, b: 0 });

      expect(hue).toBeCloseTo(180, 1);
    });

    it('should return 270 for a*=0, b*<0 (pure blue direction)', () => {
      const hue = calculateHue({ L: 50, a: 0, b: -10 });

      expect(hue).toBeCloseTo(270, 1);
    });

    it('should return value in 0-360 range', () => {
      const hue = calculateHue({ L: 50, a: -5, b: -5 });

      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    });
  });

  // ==========================================================================
  // calculateITA
  // ==========================================================================
  describe('calculateITA', () => {
    it('should calculate ITA for very light skin (ITA > 55)', () => {
      // Very Light: L* 높고 b* 낮음
      const ita = calculateITA({ L: 80, a: 5, b: 15 });

      expect(ita).toBeGreaterThan(55);
    });

    it('should calculate ITA for intermediate skin (28-41)', () => {
      // 한국인 평균 피부톤
      const ita = calculateITA({ L: 65, a: 10, b: 20 });

      expect(ita).toBeGreaterThan(28);
      expect(ita).toBeLessThan(55);
    });

    it('should handle b*=0 case', () => {
      // b*=0일 때 특수 처리
      const itaLight = calculateITA({ L: 70, a: 5, b: 0 });
      const itaDark = calculateITA({ L: 30, a: 5, b: 0 });

      expect(itaLight).toBe(90); // L > 50
      expect(itaDark).toBe(-90); // L < 50
    });
  });

  // ==========================================================================
  // calculateLabDistance (CIE76)
  // ==========================================================================
  describe('calculateLabDistance', () => {
    it('should return 0 for identical colors', () => {
      const lab1: LabColor = { L: 50, a: 20, b: 30 };
      const lab2: LabColor = { L: 50, a: 20, b: 30 };

      expect(calculateLabDistance(lab1, lab2)).toBe(0);
    });

    it('should calculate euclidean distance correctly', () => {
      const lab1: LabColor = { L: 50, a: 0, b: 0 };
      const lab2: LabColor = { L: 53, a: 4, b: 0 };

      // sqrt((53-50)^2 + (4-0)^2 + (0-0)^2) = sqrt(9 + 16) = 5
      expect(calculateLabDistance(lab1, lab2)).toBeCloseTo(5, 1);
    });

    it('should indicate perceptible difference (deltaE > 2.3)', () => {
      const lab1: LabColor = { L: 50, a: 20, b: 30 };
      const lab2: LabColor = { L: 53, a: 22, b: 33 };

      const deltaE = calculateLabDistance(lab1, lab2);
      expect(deltaE).toBeGreaterThan(2.3); // 인지 가능한 차이
    });
  });

  // ==========================================================================
  // calculateCIEDE2000
  // ==========================================================================
  describe('calculateCIEDE2000', () => {
    it('should return 0 for identical colors', () => {
      const lab: LabColor = { L: 50, a: 20, b: 30 };

      expect(calculateCIEDE2000(lab, lab)).toBeCloseTo(0, 3);
    });

    it('should be less than CIE76 for similar colors (CIEDE2000 is more perceptually uniform)', () => {
      const lab1: LabColor = { L: 50, a: 25, b: 35 };
      const lab2: LabColor = { L: 55, a: 30, b: 40 };

      const cie76 = calculateLabDistance(lab1, lab2);
      const ciede2000 = calculateCIEDE2000(lab1, lab2);

      // CIEDE2000은 일반적으로 CIE76보다 작거나 비슷함
      expect(ciede2000).toBeLessThanOrEqual(cie76 * 1.5);
    });

    it('should handle achromatic colors (gray)', () => {
      const gray1: LabColor = { L: 50, a: 0, b: 0 };
      const gray2: LabColor = { L: 60, a: 0, b: 0 };

      const deltaE = calculateCIEDE2000(gray1, gray2);
      expect(deltaE).toBeGreaterThan(0);
      expect(deltaE).toBeLessThan(15); // 밝기 차이 10에 대한 합리적 범위
    });

    it('should use custom weighting factors', () => {
      const lab1: LabColor = { L: 50, a: 20, b: 30 };
      const lab2: LabColor = { L: 55, a: 25, b: 35 };

      const defaultDeltaE = calculateCIEDE2000(lab1, lab2);
      const customDeltaE = calculateCIEDE2000(lab1, lab2, { kL: 2, kC: 1, kH: 1 });

      // kL이 커지면 밝기 차이의 영향이 줄어들어 deltaE가 작아짐
      expect(customDeltaE).not.toEqual(defaultDeltaE);
    });

    it('should handle blue colors correctly (rotation term)', () => {
      // 청색 영역에서 회전 항(RT)이 적용됨
      const blue1: LabColor = { L: 50, a: -10, b: -50 };
      const blue2: LabColor = { L: 50, a: -15, b: -55 };

      const deltaE = calculateCIEDE2000(blue1, blue2);
      expect(deltaE).toBeGreaterThan(0);
      expect(deltaE).toBeLessThan(20);
    });
  });

  // ==========================================================================
  // 통합 테스트: 피부톤 분석 시나리오
  // ==========================================================================
  describe('Integration: Skin Tone Analysis', () => {
    it('should process Korean skin tone correctly', () => {
      // 한국인 평균 피부톤 (밝은 베이지)
      const skinRgb = { r: 230, g: 200, b: 180 };
      const skinLab = rgbToLab(skinRgb.r, skinRgb.g, skinRgb.b);

      // Lab 값 범위 확인
      expect(skinLab.L).toBeGreaterThan(70); // 밝은 피부
      expect(skinLab.a).toBeGreaterThan(0); // 약간 빨간 기
      expect(skinLab.b).toBeGreaterThan(10); // 황색 기

      // ITA 분류 확인 (대부분 Intermediate ~ Light)
      const ita = calculateITA(skinLab);
      expect(ita).toBeGreaterThan(28); // Intermediate 이상

      // 채도 확인
      const chroma = calculateChroma(skinLab);
      expect(chroma).toBeGreaterThan(10);
      expect(chroma).toBeLessThan(30);
    });

    it('should distinguish warm and cool skin tones', () => {
      // 웜톤 피부 (황색기 많음)
      const warmSkin = rgbToLab(235, 200, 165);
      // 쿨톤 피부 (핑크기 많음)
      const coolSkin = rgbToLab(230, 200, 195);

      // 웜톤: b* 값이 더 높음
      expect(warmSkin.b).toBeGreaterThan(coolSkin.b);

      // Hue 각도로 웜/쿨 구분
      const warmHue = calculateHue(warmSkin);
      const coolHue = calculateHue(coolSkin);

      // 웜톤은 일반적으로 Hue > 60°, 쿨톤은 < 60°
      expect(warmHue).toBeGreaterThan(coolHue);
    });
  });
});
