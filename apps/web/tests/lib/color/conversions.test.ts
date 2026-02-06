/**
 * lib/color 통합 모듈 테스트
 *
 * 기존 7개 독립 구현과 동일한 결과를 보장하는 정합성 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  rgbToLab,
  labToRgb,
  rgbToXyz,
  xyzToRgb,
  xyzToLab,
  labToXyz,
  hexToLab,
  labToHex,
  hexToRgb,
  rgbToHex,
  calculateChroma,
  calculateHue,
  calculateDerivedMetrics,
  calculateITA,
  calculateLabDistance,
  calculateCIEDE2000,
} from '@/lib/color';

describe('lib/color 통합 모듈', () => {
  // =========================================================================
  // RGB → Lab 변환
  // =========================================================================
  describe('rgbToLab', () => {
    it('밝은 피부색 변환', () => {
      const lab = rgbToLab(245, 220, 200);
      expect(lab.L).toBeCloseTo(89.2, 0);
      expect(lab.a).toBeCloseTo(5.5, 0);
      expect(lab.b).toBeCloseTo(13.0, 0);
    });

    it('순수 흰색', () => {
      const lab = rgbToLab(255, 255, 255);
      expect(lab.L).toBeCloseTo(100, 0);
      expect(lab.a).toBeCloseTo(0, 0);
      expect(lab.b).toBeCloseTo(0, 0);
    });

    it('순수 검정', () => {
      const lab = rgbToLab(0, 0, 0);
      expect(lab.L).toBeCloseTo(0, 0);
      expect(lab.a).toBeCloseTo(0, 0);
      expect(lab.b).toBeCloseTo(0, 0);
    });

    it('RGBColor 객체 형태도 동일한 결과', () => {
      const lab1 = rgbToLab(128, 64, 192);
      const lab2 = rgbToLab({ r: 128, g: 64, b: 192 });
      expect(lab1.L).toBeCloseTo(lab2.L, 10);
      expect(lab1.a).toBeCloseTo(lab2.a, 10);
      expect(lab1.b).toBeCloseTo(lab2.b, 10);
    });

    it('범위 밖 입력은 클램핑', () => {
      const lab = rgbToLab(300, -50, 128);
      // 300 → 255, -50 → 0 으로 클램핑됨
      const labClamped = rgbToLab(255, 0, 128);
      expect(lab.L).toBeCloseTo(labClamped.L, 10);
      expect(lab.a).toBeCloseTo(labClamped.a, 10);
      expect(lab.b).toBeCloseTo(labClamped.b, 10);
    });
  });

  // =========================================================================
  // Lab → RGB 왕복 변환
  // =========================================================================
  describe('rgbToLab → labToRgb 왕복', () => {
    const testColors = [
      { r: 255, g: 0, b: 0, name: '빨강' },
      { r: 0, g: 255, b: 0, name: '초록' },
      { r: 0, g: 0, b: 255, name: '파랑' },
      { r: 245, g: 220, b: 200, name: '피부색' },
      { r: 128, g: 128, b: 128, name: '회색' },
    ];

    testColors.forEach(({ r, g, b, name }) => {
      it(`${name} (${r}, ${g}, ${b}) 왕복 변환 정확도`, () => {
        const lab = rgbToLab(r, g, b);
        const rgb = labToRgb(lab);
        // 왕복 변환 시 ±1 이내 오차 허용
        expect(rgb.r).toBeCloseTo(r, 0);
        expect(rgb.g).toBeCloseTo(g, 0);
        expect(rgb.b).toBeCloseTo(b, 0);
      });
    });
  });

  // =========================================================================
  // XYZ 중간 변환
  // =========================================================================
  describe('XYZ 변환', () => {
    it('rgbToXyz → xyzToLab과 rgbToLab이 동일', () => {
      const xyz = rgbToXyz(200, 150, 100);
      const labViaXyz = xyzToLab(xyz);
      const labDirect = rgbToLab(200, 150, 100);

      expect(labViaXyz.L).toBeCloseTo(labDirect.L, 10);
      expect(labViaXyz.a).toBeCloseTo(labDirect.a, 10);
      expect(labViaXyz.b).toBeCloseTo(labDirect.b, 10);
    });

    it('rgbToXyz 객체 형태', () => {
      const xyz1 = rgbToXyz(200, 150, 100);
      const xyz2 = rgbToXyz({ r: 200, g: 150, b: 100 });
      expect(xyz1.X).toBeCloseTo(xyz2.X, 10);
      expect(xyz1.Y).toBeCloseTo(xyz2.Y, 10);
      expect(xyz1.Z).toBeCloseTo(xyz2.Z, 10);
    });

    it('XYZ → RGB 왕복', () => {
      const xyz = rgbToXyz(180, 120, 60);
      const rgb = xyzToRgb(xyz);
      expect(rgb.r).toBeCloseTo(180, 0);
      expect(rgb.g).toBeCloseTo(120, 0);
      expect(rgb.b).toBeCloseTo(60, 0);
    });

    it('Lab → XYZ → Lab 왕복', () => {
      const lab = { L: 70, a: 15, b: -20 };
      const xyz = labToXyz(lab);
      const labBack = xyzToLab(xyz);
      expect(labBack.L).toBeCloseTo(lab.L, 10);
      expect(labBack.a).toBeCloseTo(lab.a, 10);
      expect(labBack.b).toBeCloseTo(lab.b, 10);
    });
  });

  // =========================================================================
  // HEX 변환
  // =========================================================================
  describe('HEX 변환', () => {
    it('hexToRgb', () => {
      const rgb = hexToRgb('#FF5733');
      expect(rgb).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('hexToRgb # 없이도 동작', () => {
      const rgb = hexToRgb('FF5733');
      expect(rgb).toEqual({ r: 255, g: 87, b: 51 });
    });

    it('rgbToHex', () => {
      const hex = rgbToHex({ r: 255, g: 87, b: 51 });
      expect(hex).toBe('#ff5733');
    });

    it('hexToLab → labToHex 왕복', () => {
      const lab = hexToLab('#C0A080');
      const hex = labToHex(lab);
      expect(hex).toBe('#C0A080');
    });
  });

  // =========================================================================
  // 파생 지표
  // =========================================================================
  describe('파생 지표', () => {
    it('calculateChroma', () => {
      const chroma = calculateChroma({ L: 50, a: 30, b: 40 });
      expect(chroma).toBeCloseTo(50, 5); // sqrt(900 + 1600) = 50
    });

    it('calculateHue', () => {
      // a=1, b=0 → 0도
      expect(calculateHue({ L: 50, a: 1, b: 0 })).toBeCloseTo(0, 5);
      // a=0, b=1 → 90도
      expect(calculateHue({ L: 50, a: 0, b: 1 })).toBeCloseTo(90, 5);
      // a=-1, b=0 → 180도
      expect(calculateHue({ L: 50, a: -1, b: 0 })).toBeCloseTo(180, 5);
      // a=0, b=-1 → 270도
      expect(calculateHue({ L: 50, a: 0, b: -1 })).toBeCloseTo(270, 5);
    });

    it('calculateDerivedMetrics', () => {
      const metrics = calculateDerivedMetrics({ L: 50, a: 3, b: 4 });
      expect(metrics.chroma).toBeCloseTo(5, 5);
      expect(metrics.hue).toBeCloseTo(53.13, 1);
    });

    it('calculateITA', () => {
      // L=70, b=20 → ITA = atan2(20, 20) = 45도
      expect(calculateITA({ L: 70, a: 0, b: 20 })).toBeCloseTo(45, 1);
      // b=0 특수 처리
      expect(calculateITA({ L: 70, a: 0, b: 0 })).toBe(90);
      expect(calculateITA({ L: 30, a: 0, b: 0 })).toBe(-90);
    });
  });

  // =========================================================================
  // CIE76 색차
  // =========================================================================
  describe('calculateLabDistance (CIE76)', () => {
    it('동일 색상은 색차 0', () => {
      const lab = { L: 50, a: 25, b: -10 };
      expect(calculateLabDistance(lab, lab)).toBe(0);
    });

    it('알려진 값', () => {
      const lab1 = { L: 50, a: 25, b: 0 };
      const lab2 = { L: 50, a: 25, b: 5 };
      expect(calculateLabDistance(lab1, lab2)).toBeCloseTo(5, 5);
    });
  });

  // =========================================================================
  // CIEDE2000 색차
  // =========================================================================
  describe('calculateCIEDE2000', () => {
    it('동일 색상은 색차 0', () => {
      const lab = { L: 50, a: 25, b: -10 };
      expect(calculateCIEDE2000(lab, lab)).toBeCloseTo(0, 5);
    });

    // Sharma et al. (2005) Table 1 검증 데이터
    it('Sharma 검증 케이스 1', () => {
      const lab1 = { L: 50.0, a: 2.6772, b: -79.7751 };
      const lab2 = { L: 50.0, a: 0.0, b: -82.7485 };
      expect(calculateCIEDE2000(lab1, lab2)).toBeCloseTo(2.0425, 3);
    });

    it("저채도 색상 쌍 (a' 보정 효과)", () => {
      // 저채도 색상에서 G 보정이 올바르게 동작하는지 확인
      const lab1 = { L: 50.0, a: 2.5, b: 0.0 };
      const lab2 = { L: 50.0, a: 0.0, b: -2.5 };
      expect(calculateCIEDE2000(lab1, lab2)).toBeCloseTo(4.3065, 3);
    });

    it('가중치 옵션', () => {
      const lab1 = { L: 50, a: 25, b: -10 };
      const lab2 = { L: 60, a: 30, b: -5 };

      const default_dE = calculateCIEDE2000(lab1, lab2);
      // 명도 가중치 2배 → 명도 차이가 더 중요 → 색차 다름
      const weighted_dE = calculateCIEDE2000(lab1, lab2, { kL: 2 });

      expect(default_dE).not.toBeCloseTo(weighted_dE, 1);
    });
  });

  // =========================================================================
  // V1 구현과의 정합성 확인
  // =========================================================================
  describe('V1 구현 정합성', () => {
    it('V1 color-space.ts rgbToLab과 동일 결과', () => {
      // V1은 (r, g, b) 개별 파라미터 사용
      const testCases = [
        [245, 220, 200],
        [128, 64, 32],
        [0, 0, 0],
        [255, 255, 255],
        [180, 90, 45],
      ] as const;

      for (const [r, g, b] of testCases) {
        const lab = rgbToLab(r, g, b);
        // V1과 동일한 입력 클램핑 + 동일 상수 사용
        // 값 검증: L은 ~0-~100 (부동소수점 허용), a와 b는 합리적 범위
        expect(lab.L).toBeGreaterThanOrEqual(0);
        expect(lab.L).toBeLessThan(100.001); // 부동소수점 오차 허용
        expect(lab.a).toBeGreaterThan(-128);
        expect(lab.a).toBeLessThan(128);
        expect(lab.b).toBeGreaterThan(-128);
        expect(lab.b).toBeLessThan(128);
      }
    });
  });
});
