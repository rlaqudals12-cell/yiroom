/**
 * PC-2 색공간 변환 유틸리티 테스트
 *
 * @module tests/lib/analysis/personal-color-v2/color-space
 * @see docs/principles/color-science.md
 */

import { describe, it, expect } from 'vitest';
import {
  rgbToXyz,
  xyzToRgb,
  xyzToLab,
  labToXyz,
  rgbToLab,
  labToRgb,
  labDistanceCIE76,
  labDistanceCIEDE2000,
  getChroma,
  getHue,
  hexToRgb,
  rgbToHex,
  hexToLab,
  labToHex,
} from '@/lib/analysis/personal-color-v2/color-space';
import type { RGBColor, XYZColor, LabColor } from '@/lib/analysis/personal-color-v2/types';

// ============================================================================
// RGB <-> XYZ 변환
// ============================================================================

describe('RGB <-> XYZ 변환', () => {
  describe('rgbToXyz', () => {
    it('should convert black to XYZ origin', () => {
      const black: RGBColor = { r: 0, g: 0, b: 0 };
      const xyz = rgbToXyz(black);

      expect(xyz.X).toBeCloseTo(0, 1);
      expect(xyz.Y).toBeCloseTo(0, 1);
      expect(xyz.Z).toBeCloseTo(0, 1);
    });

    it('should convert white to D65 white point', () => {
      const white: RGBColor = { r: 255, g: 255, b: 255 };
      const xyz = rgbToXyz(white);

      // D65 white point: X=95.047, Y=100.0, Z=108.883
      expect(xyz.X).toBeCloseTo(95.047, 0);
      expect(xyz.Y).toBeCloseTo(100.0, 0);
      expect(xyz.Z).toBeCloseTo(108.883, 0);
    });

    it('should convert red correctly', () => {
      const red: RGBColor = { r: 255, g: 0, b: 0 };
      const xyz = rgbToXyz(red);

      // sRGB 빨강의 XYZ 값
      expect(xyz.X).toBeCloseTo(41.24, 0);
      expect(xyz.Y).toBeCloseTo(21.27, 0);
      expect(xyz.Z).toBeCloseTo(1.93, 0);
    });

    it('should convert green correctly', () => {
      const green: RGBColor = { r: 0, g: 255, b: 0 };
      const xyz = rgbToXyz(green);

      expect(xyz.X).toBeCloseTo(35.76, 0);
      expect(xyz.Y).toBeCloseTo(71.52, 0);
      expect(xyz.Z).toBeCloseTo(11.92, 0);
    });

    it('should convert blue correctly', () => {
      const blue: RGBColor = { r: 0, g: 0, b: 255 };
      const xyz = rgbToXyz(blue);

      expect(xyz.X).toBeCloseTo(18.05, 0);
      expect(xyz.Y).toBeCloseTo(7.22, 0);
      expect(xyz.Z).toBeCloseTo(95.03, 0);
    });
  });

  describe('xyzToRgb', () => {
    it('should convert D65 white point to white', () => {
      const white: XYZColor = { X: 95.047, Y: 100.0, Z: 108.883 };
      const rgb = xyzToRgb(white);

      expect(rgb.r).toBeCloseTo(255, 0);
      expect(rgb.g).toBeCloseTo(255, 0);
      expect(rgb.b).toBeCloseTo(255, 0);
    });

    it('should convert origin to black', () => {
      const black: XYZColor = { X: 0, Y: 0, Z: 0 };
      const rgb = xyzToRgb(black);

      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it('should clamp values to valid RGB range', () => {
      // 아주 밝은 XYZ 값
      const brightXyz: XYZColor = { X: 150, Y: 150, Z: 150 };
      const rgb = xyzToRgb(brightXyz);

      expect(rgb.r).toBeLessThanOrEqual(255);
      expect(rgb.g).toBeLessThanOrEqual(255);
      expect(rgb.b).toBeLessThanOrEqual(255);
      expect(rgb.r).toBeGreaterThanOrEqual(0);
      expect(rgb.g).toBeGreaterThanOrEqual(0);
      expect(rgb.b).toBeGreaterThanOrEqual(0);
    });
  });

  describe('RGB <-> XYZ 왕복 변환', () => {
    it('should roundtrip RGB values', () => {
      const originalRgb: RGBColor = { r: 128, g: 64, b: 192 };
      const xyz = rgbToXyz(originalRgb);
      const roundtrippedRgb = xyzToRgb(xyz);

      expect(roundtrippedRgb.r).toBeCloseTo(originalRgb.r, 0);
      expect(roundtrippedRgb.g).toBeCloseTo(originalRgb.g, 0);
      expect(roundtrippedRgb.b).toBeCloseTo(originalRgb.b, 0);
    });
  });
});

// ============================================================================
// XYZ <-> Lab 변환
// ============================================================================

describe('XYZ <-> Lab 변환', () => {
  describe('xyzToLab', () => {
    it('should convert D65 white point to L*=100', () => {
      const white: XYZColor = { X: 95.047, Y: 100.0, Z: 108.883 };
      const lab = xyzToLab(white);

      expect(lab.L).toBeCloseTo(100, 0);
      expect(lab.a).toBeCloseTo(0, 0);
      expect(lab.b).toBeCloseTo(0, 0);
    });

    it('should convert black to L*=0', () => {
      const black: XYZColor = { X: 0, Y: 0, Z: 0 };
      const lab = xyzToLab(black);

      expect(lab.L).toBeCloseTo(0, 0);
    });

    it('should convert mid-gray correctly', () => {
      // Y=50 → L* ≈ 76.07
      const midGray: XYZColor = { X: 47.52, Y: 50.0, Z: 54.44 };
      const lab = xyzToLab(midGray);

      expect(lab.L).toBeCloseTo(76, 0);
      expect(lab.a).toBeCloseTo(0, 1);
      expect(lab.b).toBeCloseTo(0, 1);
    });
  });

  describe('labToXyz', () => {
    it('should convert L*=100 to D65 white point', () => {
      const whiteLab: LabColor = { L: 100, a: 0, b: 0 };
      const xyz = labToXyz(whiteLab);

      expect(xyz.X).toBeCloseTo(95.047, 0);
      expect(xyz.Y).toBeCloseTo(100.0, 0);
      expect(xyz.Z).toBeCloseTo(108.883, 0);
    });

    it('should convert L*=0 to black', () => {
      const blackLab: LabColor = { L: 0, a: 0, b: 0 };
      const xyz = labToXyz(blackLab);

      expect(xyz.X).toBeCloseTo(0, 0);
      expect(xyz.Y).toBeCloseTo(0, 0);
      expect(xyz.Z).toBeCloseTo(0, 0);
    });
  });

  describe('XYZ <-> Lab 왕복 변환', () => {
    it('should roundtrip XYZ values', () => {
      const originalXyz: XYZColor = { X: 50, Y: 60, Z: 70 };
      const lab = xyzToLab(originalXyz);
      const roundtrippedXyz = labToXyz(lab);

      expect(roundtrippedXyz.X).toBeCloseTo(originalXyz.X, 1);
      expect(roundtrippedXyz.Y).toBeCloseTo(originalXyz.Y, 1);
      expect(roundtrippedXyz.Z).toBeCloseTo(originalXyz.Z, 1);
    });
  });
});

// ============================================================================
// 단축 함수 (RGB <-> Lab)
// ============================================================================

describe('RGB <-> Lab 단축 함수', () => {
  describe('rgbToLab', () => {
    it('should convert white RGB to L*=100', () => {
      const white: RGBColor = { r: 255, g: 255, b: 255 };
      const lab = rgbToLab(white);

      expect(lab.L).toBeCloseTo(100, 0);
      expect(lab.a).toBeCloseTo(0, 1);
      expect(lab.b).toBeCloseTo(0, 1);
    });

    it('should convert black RGB to L*=0', () => {
      const black: RGBColor = { r: 0, g: 0, b: 0 };
      const lab = rgbToLab(black);

      expect(lab.L).toBeCloseTo(0, 0);
    });

    it('should convert red to positive a*', () => {
      const red: RGBColor = { r: 255, g: 0, b: 0 };
      const lab = rgbToLab(red);

      expect(lab.a).toBeGreaterThan(0); // 빨강 → 양의 a*
    });

    it('should convert yellow to positive b*', () => {
      const yellow: RGBColor = { r: 255, g: 255, b: 0 };
      const lab = rgbToLab(yellow);

      expect(lab.b).toBeGreaterThan(0); // 노랑 → 양의 b*
    });
  });

  describe('labToRgb', () => {
    it('should convert L*=100 to white RGB', () => {
      const whiteLab: LabColor = { L: 100, a: 0, b: 0 };
      const rgb = labToRgb(whiteLab);

      expect(rgb.r).toBeCloseTo(255, 0);
      expect(rgb.g).toBeCloseTo(255, 0);
      expect(rgb.b).toBeCloseTo(255, 0);
    });
  });

  describe('RGB <-> Lab 왕복 변환', () => {
    it('should roundtrip skin tone color', () => {
      // 피부톤 색상
      const skinTone: RGBColor = { r: 210, g: 180, b: 160 };
      const lab = rgbToLab(skinTone);
      const roundtrippedRgb = labToRgb(lab);

      expect(roundtrippedRgb.r).toBeCloseTo(skinTone.r, 0);
      expect(roundtrippedRgb.g).toBeCloseTo(skinTone.g, 0);
      expect(roundtrippedRgb.b).toBeCloseTo(skinTone.b, 0);
    });
  });
});

// ============================================================================
// Lab 색상 거리 계산
// ============================================================================

describe('Lab 색상 거리 계산', () => {
  describe('labDistanceCIE76', () => {
    it('should return 0 for identical colors', () => {
      const lab1: LabColor = { L: 65, a: 10, b: 20 };
      const lab2: LabColor = { L: 65, a: 10, b: 20 };

      expect(labDistanceCIE76(lab1, lab2)).toBe(0);
    });

    it('should calculate Euclidean distance', () => {
      const lab1: LabColor = { L: 0, a: 0, b: 0 };
      const lab2: LabColor = { L: 3, a: 4, b: 0 }; // 3-4-5 삼각형

      expect(labDistanceCIE76(lab1, lab2)).toBeCloseTo(5, 5);
    });

    it('should be symmetric', () => {
      const lab1: LabColor = { L: 65, a: 10, b: 20 };
      const lab2: LabColor = { L: 55, a: 15, b: 25 };

      const d1 = labDistanceCIE76(lab1, lab2);
      const d2 = labDistanceCIE76(lab2, lab1);

      expect(d1).toBe(d2);
    });
  });

  describe('labDistanceCIEDE2000', () => {
    it('should return 0 for identical colors', () => {
      const lab1: LabColor = { L: 65, a: 10, b: 20 };
      const lab2: LabColor = { L: 65, a: 10, b: 20 };

      expect(labDistanceCIEDE2000(lab1, lab2)).toBeCloseTo(0, 5);
    });

    it('should be symmetric', () => {
      const lab1: LabColor = { L: 65, a: 10, b: 20 };
      const lab2: LabColor = { L: 55, a: 15, b: 25 };

      const d1 = labDistanceCIEDE2000(lab1, lab2);
      const d2 = labDistanceCIEDE2000(lab2, lab1);

      expect(d1).toBeCloseTo(d2, 5);
    });

    it('should return non-negative values', () => {
      const lab1: LabColor = { L: 50, a: -20, b: 30 };
      const lab2: LabColor = { L: 70, a: 25, b: -15 };

      expect(labDistanceCIEDE2000(lab1, lab2)).toBeGreaterThanOrEqual(0);
    });

    it('should handle achromatic colors', () => {
      // 무채색 (a=0, b=0)
      const gray1: LabColor = { L: 50, a: 0, b: 0 };
      const gray2: LabColor = { L: 60, a: 0, b: 0 };

      const distance = labDistanceCIEDE2000(gray1, gray2);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('CIE76 vs CIEDE2000 비교', () => {
    it('should give similar results for close colors', () => {
      const lab1: LabColor = { L: 65, a: 10, b: 20 };
      const lab2: LabColor = { L: 66, a: 11, b: 21 };

      const cie76 = labDistanceCIE76(lab1, lab2);
      const ciede2000 = labDistanceCIEDE2000(lab1, lab2);

      // 가까운 색상은 두 방식이 유사한 결과
      expect(Math.abs(cie76 - ciede2000)).toBeLessThan(5);
    });
  });
});

// ============================================================================
// Chroma와 Hue 계산
// ============================================================================

describe('Chroma와 Hue 계산', () => {
  describe('getChroma', () => {
    it('should return 0 for achromatic color', () => {
      const gray: LabColor = { L: 50, a: 0, b: 0 };
      expect(getChroma(gray)).toBe(0);
    });

    it('should calculate correct chroma', () => {
      const lab: LabColor = { L: 50, a: 3, b: 4 }; // 3-4-5 삼각형
      expect(getChroma(lab)).toBeCloseTo(5, 5);
    });

    it('should handle negative a and b values', () => {
      const lab: LabColor = { L: 50, a: -10, b: -10 };
      expect(getChroma(lab)).toBeCloseTo(Math.sqrt(200), 5);
    });
  });

  describe('getHue', () => {
    it('should return 0 for pure red on a-axis', () => {
      const pureA: LabColor = { L: 50, a: 10, b: 0 };
      expect(getHue(pureA)).toBeCloseTo(0, 0);
    });

    it('should return 90 for pure yellow on b-axis', () => {
      const pureB: LabColor = { L: 50, a: 0, b: 10 };
      expect(getHue(pureB)).toBeCloseTo(90, 0);
    });

    it('should return values between 0 and 360', () => {
      const testCases: LabColor[] = [
        { L: 50, a: 10, b: 10 },
        { L: 50, a: -10, b: 10 },
        { L: 50, a: -10, b: -10 },
        { L: 50, a: 10, b: -10 },
      ];

      for (const lab of testCases) {
        const hue = getHue(lab);
        expect(hue).toBeGreaterThanOrEqual(0);
        expect(hue).toBeLessThan(360);
      }
    });

    it('should calculate correct hue angle', () => {
      // 45도 (a=b 양수)
      const lab45: LabColor = { L: 50, a: 10, b: 10 };
      expect(getHue(lab45)).toBeCloseTo(45, 0);

      // 135도 (a 음수, b 양수)
      const lab135: LabColor = { L: 50, a: -10, b: 10 };
      expect(getHue(lab135)).toBeCloseTo(135, 0);
    });
  });
});

// ============================================================================
// Hex 변환
// ============================================================================

describe('Hex 변환', () => {
  describe('hexToRgb', () => {
    it('should convert hex to RGB correctly', () => {
      const rgb = hexToRgb('#FF8040');

      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(128);
      expect(rgb.b).toBe(64);
    });

    it('should handle lowercase hex', () => {
      const rgb = hexToRgb('#ff8040');

      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(128);
      expect(rgb.b).toBe(64);
    });

    it('should handle hex without hash', () => {
      const rgb = hexToRgb('FF8040');

      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(128);
      expect(rgb.b).toBe(64);
    });

    it('should convert black correctly', () => {
      const rgb = hexToRgb('#000000');

      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it('should convert white correctly', () => {
      const rgb = hexToRgb('#FFFFFF');

      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(255);
      expect(rgb.b).toBe(255);
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex correctly', () => {
      const hex = rgbToHex({ r: 255, g: 128, b: 64 });
      expect(hex.toLowerCase()).toBe('#ff8040');
    });

    it('should convert black correctly', () => {
      const hex = rgbToHex({ r: 0, g: 0, b: 0 });
      expect(hex.toLowerCase()).toBe('#000000');
    });

    it('should convert white correctly', () => {
      const hex = rgbToHex({ r: 255, g: 255, b: 255 });
      expect(hex.toLowerCase()).toBe('#ffffff');
    });

    it('should pad single digit values', () => {
      const hex = rgbToHex({ r: 1, g: 2, b: 3 });
      expect(hex.toLowerCase()).toBe('#010203');
    });
  });

  describe('Hex <-> RGB 왕복 변환', () => {
    it('should roundtrip hex values', () => {
      const originalHex = '#C0A080';
      const rgb = hexToRgb(originalHex);
      const roundtrippedHex = rgbToHex(rgb);

      expect(roundtrippedHex.toLowerCase()).toBe(originalHex.toLowerCase());
    });
  });
});

// ============================================================================
// Hex <-> Lab 단축 함수
// ============================================================================

describe('Hex <-> Lab 단축 함수', () => {
  describe('hexToLab', () => {
    it('should convert white hex to L*=100', () => {
      const lab = hexToLab('#FFFFFF');

      expect(lab.L).toBeCloseTo(100, 0);
      expect(lab.a).toBeCloseTo(0, 1);
      expect(lab.b).toBeCloseTo(0, 1);
    });

    it('should convert skin tone hex to expected Lab range', () => {
      // 피부톤 hex
      const lab = hexToLab('#D2B4A0');

      expect(lab.L).toBeGreaterThan(60);
      expect(lab.L).toBeLessThan(80);
      expect(lab.a).toBeGreaterThan(0); // 약간 붉은 기
      expect(lab.b).toBeGreaterThan(0); // 약간 노란 기
    });
  });

  describe('labToHex', () => {
    it('should convert L*=100 to white hex', () => {
      const hex = labToHex({ L: 100, a: 0, b: 0 });
      expect(hex.toLowerCase()).toBe('#ffffff');
    });

    it('should convert L*=0 to black hex', () => {
      const hex = labToHex({ L: 0, a: 0, b: 0 });
      expect(hex.toLowerCase()).toBe('#000000');
    });
  });

  describe('Hex <-> Lab 왕복 변환', () => {
    it('should roundtrip hex values through Lab', () => {
      const originalHex = '#D0A080';
      const lab = hexToLab(originalHex);
      const roundtrippedHex = labToHex(lab);

      // RGB 반올림으로 약간의 차이 허용
      const originalRgb = hexToRgb(originalHex);
      const roundtrippedRgb = hexToRgb(roundtrippedHex);

      expect(roundtrippedRgb.r).toBeCloseTo(originalRgb.r, 0);
      expect(roundtrippedRgb.g).toBeCloseTo(originalRgb.g, 0);
      expect(roundtrippedRgb.b).toBeCloseTo(originalRgb.b, 0);
    });
  });
});

// ============================================================================
// 통합 테스트
// ============================================================================

describe('Integration: 색공간 변환 파이프라인', () => {
  it('should maintain color accuracy through all conversions', () => {
    // 피부톤 색상으로 전체 파이프라인 테스트
    const originalHex = '#E0C0A0';

    // Hex -> RGB -> XYZ -> Lab
    const rgb1 = hexToRgb(originalHex);
    const xyz = rgbToXyz(rgb1);
    const lab = xyzToLab(xyz);

    // Lab -> XYZ -> RGB -> Hex
    const xyz2 = labToXyz(lab);
    const rgb2 = xyzToRgb(xyz2);
    rgbToHex(rgb2); // 왕복 검증

    // 왕복 후 색상이 유지되어야 함
    expect(rgb2.r).toBeCloseTo(rgb1.r, 0);
    expect(rgb2.g).toBeCloseTo(rgb1.g, 0);
    expect(rgb2.b).toBeCloseTo(rgb1.b, 0);
  });

  it('should correctly identify warm vs cool colors by b* value', () => {
    // 웜톤 색상 (노란 기)
    const warmHex = '#E0B080'; // 주황/황금빛
    const warmLab = hexToLab(warmHex);

    // 쿨톤 색상 (푸른 기)
    const coolHex = '#C0B0D0'; // 라벤더
    const coolLab = hexToLab(coolHex);

    // 웜톤은 높은 b*, 쿨톤은 낮은 b*
    expect(warmLab.b).toBeGreaterThan(coolLab.b);
  });

  it('should calculate meaningful distance between skin tones', () => {
    // 밝은 피부톤
    const lightSkin = hexToLab('#F0D0C0');
    // 어두운 피부톤
    const darkSkin = hexToLab('#8B6914');

    const distance = labDistanceCIEDE2000(lightSkin, darkSkin);

    // 피부톤 간 유의미한 차이
    expect(distance).toBeGreaterThan(20);
  });
});
