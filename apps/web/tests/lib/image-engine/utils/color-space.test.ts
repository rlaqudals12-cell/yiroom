/**
 * 색공간 변환 유틸리티 테스트
 *
 * @module tests/lib/image-engine/utils/color-space
 * @see lib/image-engine/utils/color-space.ts
 */
import { describe, it, expect } from 'vitest';
import {
  srgbToLinear,
  linearToSrgb,
  normalizeRGB,
  denormalizeRGB,
  rgbToXYZ,
  xyzToRGB,
  xyzToChromaticity,
  rgbToChromaticity,
  xyzToLMS,
  lmsToXYZ,
  rgbToYCbCr,
  ycbcrToRGB,
  estimateCCT,
  estimateCCTFromRGB,
  calculateColorDifference,
  calculateAverageRGB,
} from '@/lib/image-engine/utils/color-space';

describe('sRGB ↔ Linear RGB', () => {
  describe('srgbToLinear', () => {
    it('검은색(0)은 0 유지', () => {
      expect(srgbToLinear(0)).toBeCloseTo(0, 5);
    });

    it('흰색(255)은 1로 변환', () => {
      expect(srgbToLinear(255)).toBeCloseTo(1, 5);
    });

    it('중간값(128)은 약 0.215로 변환', () => {
      // sRGB 128 ≈ linear 0.215
      expect(srgbToLinear(128)).toBeCloseTo(0.2158, 2);
    });

    it('낮은 값(10)은 선형 구간', () => {
      // 0.04045 임계값 이하: v / 12.92
      expect(srgbToLinear(10)).toBeCloseTo((10 / 255) / 12.92, 5);
    });
  });

  describe('linearToSrgb', () => {
    it('0은 0 유지', () => {
      expect(linearToSrgb(0)).toBe(0);
    });

    it('1은 255로 변환', () => {
      expect(linearToSrgb(1)).toBe(255);
    });

    it('0.5는 약 188로 변환', () => {
      // linear 0.5 ≈ sRGB 188
      expect(linearToSrgb(0.5)).toBeCloseTo(188, 0);
    });

    it('범위 초과 값은 클리핑', () => {
      expect(linearToSrgb(-0.1)).toBe(0);
      expect(linearToSrgb(1.5)).toBe(255);
    });
  });

  it('srgbToLinear와 linearToSrgb는 역함수', () => {
    for (const value of [0, 50, 128, 200, 255]) {
      const linear = srgbToLinear(value);
      const back = linearToSrgb(linear);
      expect(back).toBeCloseTo(value, 0);
    }
  });
});

describe('RGB 정규화', () => {
  describe('normalizeRGB', () => {
    it('0-255를 0-1로 정규화', () => {
      const result = normalizeRGB({ r: 255, g: 128, b: 0 });
      expect(result.r).toBeCloseTo(1, 5);
      expect(result.g).toBeCloseTo(0.502, 2);
      expect(result.b).toBeCloseTo(0, 5);
    });
  });

  describe('denormalizeRGB', () => {
    it('0-1을 0-255로 역정규화', () => {
      const result = denormalizeRGB({ r: 1, g: 0.5, b: 0 });
      expect(result.r).toBe(255);
      expect(result.g).toBe(128);
      expect(result.b).toBe(0);
    });

    it('범위 초과 값은 클리핑', () => {
      const result = denormalizeRGB({ r: 1.5, g: -0.1, b: 0.5 });
      expect(result.r).toBe(255);
      expect(result.g).toBe(0);
      expect(result.b).toBe(128);
    });
  });

  it('normalizeRGB와 denormalizeRGB는 역함수', () => {
    const original = { r: 100, g: 150, b: 200 };
    const normalized = normalizeRGB(original);
    const back = denormalizeRGB(normalized);
    expect(back.r).toBe(original.r);
    expect(back.g).toBe(original.g);
    expect(back.b).toBe(original.b);
  });
});

describe('sRGB ↔ XYZ', () => {
  describe('rgbToXYZ', () => {
    it('흰색 (255,255,255)은 D65 백색점 근처', () => {
      const xyz = rgbToXYZ({ r: 255, g: 255, b: 255 });
      // D65 백색점: X=95.047, Y=100, Z=108.883
      expect(xyz.x).toBeCloseTo(95.047, 0);
      expect(xyz.y).toBeCloseTo(100, 0);
      expect(xyz.z).toBeCloseTo(108.883, 0);
    });

    it('검은색 (0,0,0)은 원점', () => {
      const xyz = rgbToXYZ({ r: 0, g: 0, b: 0 });
      expect(xyz.x).toBeCloseTo(0, 5);
      expect(xyz.y).toBeCloseTo(0, 5);
      expect(xyz.z).toBeCloseTo(0, 5);
    });

    it('순수 빨강 (255,0,0)은 X 높음', () => {
      const xyz = rgbToXYZ({ r: 255, g: 0, b: 0 });
      expect(xyz.x).toBeGreaterThan(xyz.y);
      expect(xyz.x).toBeGreaterThan(xyz.z);
    });
  });

  describe('xyzToRGB', () => {
    it('D65 백색점은 흰색 (255,255,255)', () => {
      const rgb = xyzToRGB({ x: 95.047, y: 100, z: 108.883 });
      expect(rgb.r).toBeCloseTo(255, 0);
      expect(rgb.g).toBeCloseTo(255, 0);
      expect(rgb.b).toBeCloseTo(255, 0);
    });

    it('원점은 검은색 (0,0,0)', () => {
      const rgb = xyzToRGB({ x: 0, y: 0, z: 0 });
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });
  });

  it('rgbToXYZ와 xyzToRGB는 역함수', () => {
    const testColors = [
      { r: 128, g: 128, b: 128 },
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 100, g: 150, b: 200 },
    ];

    for (const color of testColors) {
      const xyz = rgbToXYZ(color);
      const back = xyzToRGB(xyz);
      expect(back.r).toBeCloseTo(color.r, 0);
      expect(back.g).toBeCloseTo(color.g, 0);
      expect(back.b).toBeCloseTo(color.b, 0);
    }
  });
});

describe('XYZ → 색도 좌표', () => {
  describe('xyzToChromaticity', () => {
    it('D65 백색점의 색도 좌표', () => {
      const chroma = xyzToChromaticity({ x: 95.047, y: 100, z: 108.883 });
      // D65 색도: x ≈ 0.3127, y ≈ 0.3290
      expect(chroma.x).toBeCloseTo(0.3127, 2);
      expect(chroma.y).toBeCloseTo(0.3290, 2);
    });

    it('원점은 (0, 0)', () => {
      const chroma = xyzToChromaticity({ x: 0, y: 0, z: 0 });
      expect(chroma.x).toBe(0);
      expect(chroma.y).toBe(0);
    });
  });

  describe('rgbToChromaticity', () => {
    it('회색은 D65 근처', () => {
      const chroma = rgbToChromaticity({ r: 128, g: 128, b: 128 });
      expect(chroma.x).toBeCloseTo(0.3127, 2);
      expect(chroma.y).toBeCloseTo(0.3290, 2);
    });
  });
});

describe('XYZ ↔ LMS', () => {
  it('xyzToLMS와 lmsToXYZ는 역함수', () => {
    const testXYZ = { x: 50, y: 50, z: 50 };
    const lms = xyzToLMS(testXYZ);
    const back = lmsToXYZ(lms);

    expect(back.x).toBeCloseTo(testXYZ.x, 2);
    expect(back.y).toBeCloseTo(testXYZ.y, 2);
    expect(back.z).toBeCloseTo(testXYZ.z, 2);
  });

  it('LMS 값은 모두 양수', () => {
    const lms = xyzToLMS({ x: 50, y: 50, z: 50 });
    expect(lms.l).toBeGreaterThanOrEqual(0);
    expect(lms.m).toBeGreaterThanOrEqual(0);
    expect(lms.s).toBeGreaterThanOrEqual(0);
  });
});

describe('RGB ↔ YCbCr', () => {
  describe('rgbToYCbCr', () => {
    it('흰색의 Y는 255', () => {
      const ycbcr = rgbToYCbCr({ r: 255, g: 255, b: 255 });
      expect(ycbcr.y).toBeCloseTo(255, 0);
      expect(ycbcr.cb).toBeCloseTo(128, 0);
      expect(ycbcr.cr).toBeCloseTo(128, 0);
    });

    it('검은색의 Y는 0', () => {
      const ycbcr = rgbToYCbCr({ r: 0, g: 0, b: 0 });
      expect(ycbcr.y).toBeCloseTo(0, 0);
      expect(ycbcr.cb).toBeCloseTo(128, 0);
      expect(ycbcr.cr).toBeCloseTo(128, 0);
    });

    it('빨강은 Cr 높음', () => {
      const ycbcr = rgbToYCbCr({ r: 255, g: 0, b: 0 });
      expect(ycbcr.cr).toBeGreaterThan(128);
    });

    it('파랑은 Cb 높음', () => {
      const ycbcr = rgbToYCbCr({ r: 0, g: 0, b: 255 });
      expect(ycbcr.cb).toBeGreaterThan(128);
    });
  });

  it('rgbToYCbCr와 ycbcrToRGB는 역함수', () => {
    const testColors = [
      { r: 128, g: 128, b: 128 },
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
    ];

    for (const color of testColors) {
      const ycbcr = rgbToYCbCr(color);
      const back = ycbcrToRGB(ycbcr);
      expect(back.r).toBeCloseTo(color.r, 0);
      expect(back.g).toBeCloseTo(color.g, 0);
      expect(back.b).toBeCloseTo(color.b, 0);
    }
  });
});

describe('CCT 추정 (McCamy 공식)', () => {
  describe('estimateCCT', () => {
    it('D65 색도 좌표는 약 6500K', () => {
      // D65 색도: x ≈ 0.3127, y ≈ 0.3290
      const cct = estimateCCT({ x: 0.3127, y: 0.3290 });
      expect(cct).toBeCloseTo(6500, -2); // 100K 오차 허용
    });

    it('낮은 CCT (따뜻한 색) 추정', () => {
      // 백열등: x ≈ 0.44, y ≈ 0.40
      const cct = estimateCCT({ x: 0.44, y: 0.40 });
      expect(cct).toBeLessThan(3500);
    });

    it('높은 CCT (차가운 색) 추정', () => {
      // 맑은 하늘: x ≈ 0.28, y ≈ 0.28
      const cct = estimateCCT({ x: 0.28, y: 0.28 });
      expect(cct).toBeGreaterThan(8000);
    });

    it('유효 범위 (1000K ~ 25000K) 내로 제한', () => {
      // 극단적 값
      const veryWarm = estimateCCT({ x: 0.6, y: 0.4 });
      const veryCool = estimateCCT({ x: 0.2, y: 0.2 });

      expect(veryWarm).toBeGreaterThanOrEqual(1000);
      expect(veryCool).toBeLessThanOrEqual(25000);
    });
  });

  describe('estimateCCTFromRGB', () => {
    it('중성 회색은 약 6500K', () => {
      const cct = estimateCCTFromRGB({ r: 128, g: 128, b: 128 });
      expect(cct).toBeCloseTo(6500, -2);
    });

    it('따뜻한 색상(노란빛)은 낮은 CCT', () => {
      // R, G가 높고 B가 낮음
      const cct = estimateCCTFromRGB({ r: 255, g: 200, b: 100 });
      expect(cct).toBeLessThan(5000);
    });

    it('차가운 색상(파란빛)은 높은 CCT', () => {
      // B가 높고 R, G가 낮음
      const cct = estimateCCTFromRGB({ r: 100, g: 150, b: 255 });
      expect(cct).toBeGreaterThan(7000);
    });
  });
});

describe('헬퍼 함수', () => {
  describe('calculateColorDifference', () => {
    it('동일한 색상은 0 차이', () => {
      const diff = calculateColorDifference(
        { r: 100, g: 100, b: 100 },
        { r: 100, g: 100, b: 100 }
      );
      expect(diff).toBe(0);
    });

    it('흑백 차이는 약 441', () => {
      // √(255² + 255² + 255²) ≈ 441.67
      const diff = calculateColorDifference(
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 }
      );
      expect(diff).toBeCloseTo(441.67, 0);
    });

    it('단일 채널 차이', () => {
      const diff = calculateColorDifference(
        { r: 100, g: 100, b: 100 },
        { r: 200, g: 100, b: 100 }
      );
      expect(diff).toBe(100);
    });
  });

  describe('calculateAverageRGB', () => {
    it('빈 배열은 (0, 0, 0)', () => {
      const avg = calculateAverageRGB([]);
      expect(avg).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('단일 값은 그대로 반환', () => {
      const avg = calculateAverageRGB([{ r: 100, g: 150, b: 200 }]);
      expect(avg).toEqual({ r: 100, g: 150, b: 200 });
    });

    it('여러 값의 평균 계산', () => {
      const avg = calculateAverageRGB([
        { r: 0, g: 0, b: 0 },
        { r: 100, g: 100, b: 100 },
        { r: 200, g: 200, b: 200 },
      ]);
      expect(avg).toEqual({ r: 100, g: 100, b: 100 });
    });

    it('반올림 처리', () => {
      const avg = calculateAverageRGB([
        { r: 0, g: 0, b: 0 },
        { r: 1, g: 1, b: 1 },
      ]);
      // 평균 0.5 → 반올림 1
      expect(avg).toEqual({ r: 1, g: 1, b: 1 });
    });
  });
});
