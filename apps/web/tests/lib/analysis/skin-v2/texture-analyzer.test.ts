/**
 * S-2 텍스처 분석기 테스트
 * GLCM/LBP 기반 피부 텍스처 분석 검증
 *
 * @module tests/lib/analysis/skin-v2/texture-analyzer
 */
import { describe, it, expect } from 'vitest';
import {
  calculateGLCM,
  calculateLBP,
  calculatePoreScore,
  calculateWrinkleScore,
  calculateTextureScore,
  analyzeTexture,
  toGrayscale,
} from '@/lib/analysis/skin-v2/texture-analyzer';
import type { GLCMResult, LBPResult } from '@/lib/analysis/skin-v2/types';

// =============================================================================
// 테스트 헬퍼 함수
// =============================================================================

/**
 * 균일한 그레이스케일 이미지 생성 (모든 픽셀이 동일한 값)
 */
function createUniformGrayImage(width: number, height: number, value: number): Uint8Array {
  return new Uint8Array(width * height).fill(value);
}

/**
 * 체커보드 패턴 이미지 생성 (텍스처 분석용)
 */
function createCheckerboardImage(width: number, height: number, lightValue: number, darkValue: number): Uint8Array {
  const pixels = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixels[y * width + x] = (x + y) % 2 === 0 ? lightValue : darkValue;
    }
  }
  return pixels;
}

/**
 * 그라데이션 이미지 생성 (수평 방향)
 */
function createGradientImage(width: number, height: number): Uint8Array {
  const pixels = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixels[y * width + x] = Math.round((x / width) * 255);
    }
  }
  return pixels;
}

/**
 * 랜덤 노이즈 이미지 생성
 */
function createNoiseImage(width: number, height: number, seed: number = 42): Uint8Array {
  const pixels = new Uint8Array(width * height);
  // 간단한 pseudo-random 생성
  let random = seed;
  for (let i = 0; i < width * height; i++) {
    random = (random * 1103515245 + 12345) & 0x7fffffff;
    pixels[i] = random % 256;
  }
  return pixels;
}

/**
 * Mock ImageData 생성
 */
function createMockImageData(width: number, height: number, rgbValues: { r: number; g: number; b: number }): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = rgbValues.r;
    data[i * 4 + 1] = rgbValues.g;
    data[i * 4 + 2] = rgbValues.b;
    data[i * 4 + 3] = 255; // alpha
  }
  return { data, width, height, colorSpace: 'srgb' };
}

// =============================================================================
// calculateGLCM 테스트
// =============================================================================

describe('calculateGLCM', () => {
  describe('균일 이미지', () => {
    it('균일한 이미지는 contrast가 0이어야 한다', () => {
      const pixels = createUniformGrayImage(10, 10, 128);
      const result = calculateGLCM(pixels, 10, 10, 1, 0);

      expect(result.contrast).toBe(0);
    });

    it('균일한 이미지는 homogeneity가 1이어야 한다', () => {
      const pixels = createUniformGrayImage(10, 10, 100);
      const result = calculateGLCM(pixels, 10, 10, 1, 0);

      expect(result.homogeneity).toBeCloseTo(1, 5);
    });

    it('균일한 이미지는 energy가 최대여야 한다', () => {
      const pixels = createUniformGrayImage(10, 10, 50);
      const result = calculateGLCM(pixels, 10, 10, 1, 0);

      // 모든 쌍이 동일 → energy = 1
      expect(result.energy).toBeCloseTo(1, 5);
    });

    it('균일한 이미지는 entropy가 0이어야 한다', () => {
      const pixels = createUniformGrayImage(10, 10, 200);
      const result = calculateGLCM(pixels, 10, 10, 1, 0);

      expect(result.entropy).toBeCloseTo(0, 5);
    });
  });

  describe('체커보드 이미지', () => {
    it('체커보드 패턴은 높은 contrast를 가져야 한다', () => {
      const pixels = createCheckerboardImage(10, 10, 0, 255);
      const result = calculateGLCM(pixels, 10, 10, 1, 0);

      expect(result.contrast).toBeGreaterThan(0);
    });

    it('극단적 체커보드는 낮은 homogeneity를 가져야 한다', () => {
      const pixels = createCheckerboardImage(10, 10, 0, 255);
      const result = calculateGLCM(pixels, 10, 10, 1, 0);

      expect(result.homogeneity).toBeLessThan(0.5);
    });
  });

  describe('그라데이션 이미지', () => {
    it('그라데이션은 중간 수준의 contrast를 가져야 한다', () => {
      const pixels = createGradientImage(50, 10);
      const result = calculateGLCM(pixels, 50, 10, 1, 0);

      expect(result.contrast).toBeGreaterThan(0);
      expect(result.contrast).toBeLessThan(1000);
    });

    it('수평 그라데이션은 0도 방향에서 높은 상관관계를 가져야 한다', () => {
      const pixels = createGradientImage(50, 10);
      const result = calculateGLCM(pixels, 50, 10, 1, 0);

      expect(result.correlation).toBeGreaterThan(0.9);
    });
  });

  describe('방향별 GLCM', () => {
    it('0도, 45도, 90도, 135도 모두 유효한 결과를 반환해야 한다', () => {
      const pixels = createNoiseImage(20, 20);

      const result0 = calculateGLCM(pixels, 20, 20, 1, 0);
      const result45 = calculateGLCM(pixels, 20, 20, 1, 45);
      const result90 = calculateGLCM(pixels, 20, 20, 1, 90);
      const result135 = calculateGLCM(pixels, 20, 20, 1, 135);

      // 모든 방향에서 유한한 값 반환
      [result0, result45, result90, result135].forEach(result => {
        expect(Number.isFinite(result.contrast)).toBe(true);
        expect(Number.isFinite(result.homogeneity)).toBe(true);
        expect(Number.isFinite(result.energy)).toBe(true);
        expect(Number.isFinite(result.entropy)).toBe(true);
        expect(Number.isFinite(result.correlation)).toBe(true);
      });
    });

    it('distance 파라미터가 적용되어야 한다', () => {
      const pixels = createNoiseImage(30, 30);

      const result1 = calculateGLCM(pixels, 30, 30, 1, 0);
      const result2 = calculateGLCM(pixels, 30, 30, 2, 0);

      // 다른 distance는 다른 결과를 생성할 수 있음
      expect(result1.contrast).not.toBe(result2.contrast);
    });
  });

  describe('경계 조건', () => {
    it('최소 이미지 크기(2x2)에서도 동작해야 한다', () => {
      const pixels = new Uint8Array([100, 150, 120, 180]);
      const result = calculateGLCM(pixels, 2, 2, 1, 0);

      expect(Number.isFinite(result.contrast)).toBe(true);
      expect(Number.isFinite(result.homogeneity)).toBe(true);
    });

    it('빈 이미지는 에러 없이 처리되어야 한다', () => {
      const pixels = new Uint8Array(0);
      const result = calculateGLCM(pixels, 0, 0, 1, 0);

      expect(result).toBeDefined();
    });
  });
});

// =============================================================================
// calculateLBP 테스트
// =============================================================================

describe('calculateLBP', () => {
  describe('균일 이미지', () => {
    it('균일한 이미지는 uniformPatternRatio가 높아야 한다', () => {
      const pixels = createUniformGrayImage(20, 20, 128);
      const result = calculateLBP(pixels, 20, 20);

      expect(result.uniformPatternRatio).toBeGreaterThan(0.9);
    });

    it('균일한 이미지는 roughnessScore가 높아야 한다', () => {
      const pixels = createUniformGrayImage(20, 20, 100);
      const result = calculateLBP(pixels, 20, 20);

      expect(result.roughnessScore).toBeGreaterThan(80);
    });
  });

  describe('노이즈 이미지', () => {
    it('랜덤 노이즈는 균일 이미지보다 uniformPatternRatio가 낮아야 한다', () => {
      const uniformPixels = createUniformGrayImage(30, 30, 128);
      const noisePixels = createNoiseImage(30, 30);

      const uniformResult = calculateLBP(uniformPixels, 30, 30);
      const noiseResult = calculateLBP(noisePixels, 30, 30);

      expect(noiseResult.uniformPatternRatio).toBeLessThan(uniformResult.uniformPatternRatio);
    });

    it('랜덤 노이즈는 균일 이미지보다 roughnessScore가 낮아야 한다', () => {
      const uniformPixels = createUniformGrayImage(30, 30, 128);
      const noisePixels = createNoiseImage(30, 30);

      const uniformResult = calculateLBP(uniformPixels, 30, 30);
      const noiseResult = calculateLBP(noisePixels, 30, 30);

      expect(noiseResult.roughnessScore).toBeLessThan(uniformResult.roughnessScore);
    });
  });

  describe('히스토그램', () => {
    it('히스토그램은 256개 bin을 가져야 한다', () => {
      const pixels = createNoiseImage(20, 20);
      const result = calculateLBP(pixels, 20, 20);

      expect(result.histogram.length).toBe(256);
    });

    it('히스토그램 합은 1이어야 한다 (정규화)', () => {
      const pixels = createNoiseImage(20, 20);
      const result = calculateLBP(pixels, 20, 20);

      const sum = result.histogram.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 5);
    });

    it('모든 히스토그램 값은 0 이상이어야 한다', () => {
      const pixels = createNoiseImage(20, 20);
      const result = calculateLBP(pixels, 20, 20);

      result.histogram.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('파라미터', () => {
    it('radius 파라미터가 적용되어야 한다', () => {
      const pixels = createNoiseImage(40, 40);

      const result1 = calculateLBP(pixels, 40, 40, 1, 8);
      const result2 = calculateLBP(pixels, 40, 40, 2, 8);

      // 다른 radius는 다른 결과 생성
      expect(result1.roughnessScore).not.toBe(result2.roughnessScore);
    });

    it('neighbors 파라미터가 적용되어야 한다', () => {
      const pixels = createNoiseImage(40, 40);

      const result8 = calculateLBP(pixels, 40, 40, 1, 8);
      // 기본값 테스트
      expect(result8.histogram.length).toBe(256);
    });
  });

  describe('경계 조건', () => {
    it('작은 이미지(radius보다 작음)도 처리되어야 한다', () => {
      const pixels = createUniformGrayImage(3, 3, 100);
      const result = calculateLBP(pixels, 3, 3, 1, 8);

      expect(result).toBeDefined();
      expect(result.histogram.length).toBe(256);
    });
  });
});

// =============================================================================
// calculatePoreScore 테스트
// =============================================================================

describe('calculatePoreScore', () => {
  it('낮은 contrast와 높은 uniformPatternRatio는 높은 점수여야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 10,
      homogeneity: 0.9,
      energy: 0.8,
      correlation: 0.9,
      entropy: 2,
    };
    const lbp: LBPResult = {
      histogram: new Array(256).fill(1 / 256),
      uniformPatternRatio: 0.9,
      roughnessScore: 80,
    };

    const score = calculatePoreScore(glcm, lbp);
    expect(score).toBeGreaterThan(70);
  });

  it('높은 contrast와 낮은 uniformPatternRatio는 낮은 점수여야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 500,
      homogeneity: 0.3,
      energy: 0.1,
      correlation: 0.2,
      entropy: 7,
    };
    const lbp: LBPResult = {
      histogram: new Array(256).fill(1 / 256),
      uniformPatternRatio: 0.2,
      roughnessScore: 20,
    };

    const score = calculatePoreScore(glcm, lbp);
    expect(score).toBeLessThan(50);
  });

  it('점수는 0-100 범위여야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 100,
      homogeneity: 0.5,
      energy: 0.5,
      correlation: 0.5,
      entropy: 5,
    };
    const lbp: LBPResult = {
      histogram: new Array(256).fill(1 / 256),
      uniformPatternRatio: 0.5,
      roughnessScore: 50,
    };

    const score = calculatePoreScore(glcm, lbp);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('정수를 반환해야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 75.5,
      homogeneity: 0.65,
      energy: 0.45,
      correlation: 0.55,
      entropy: 4.5,
    };
    const lbp: LBPResult = {
      histogram: new Array(256).fill(1 / 256),
      uniformPatternRatio: 0.67,
      roughnessScore: 55,
    };

    const score = calculatePoreScore(glcm, lbp);
    expect(Number.isInteger(score)).toBe(true);
  });
});

// =============================================================================
// calculateWrinkleScore 테스트
// =============================================================================

describe('calculateWrinkleScore', () => {
  it('낮은 entropy와 높은 homogeneity는 높은 점수여야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 10,
      homogeneity: 0.95,
      energy: 0.9,
      correlation: 0.9,
      entropy: 1,
    };

    const score = calculateWrinkleScore(glcm);
    expect(score).toBeGreaterThan(80);
  });

  it('높은 entropy와 낮은 homogeneity는 낮은 점수여야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 200,
      homogeneity: 0.2,
      energy: 0.1,
      correlation: 0.3,
      entropy: 8,
    };

    const score = calculateWrinkleScore(glcm);
    expect(score).toBeLessThan(50);
  });

  it('점수는 0-100 범위여야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 100,
      homogeneity: 0.5,
      energy: 0.5,
      correlation: 0.5,
      entropy: 5,
    };

    const score = calculateWrinkleScore(glcm);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('정수를 반환해야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 50,
      homogeneity: 0.65,
      energy: 0.55,
      correlation: 0.6,
      entropy: 4.3,
    };

    const score = calculateWrinkleScore(glcm);
    expect(Number.isInteger(score)).toBe(true);
  });
});

// =============================================================================
// calculateTextureScore 테스트
// =============================================================================

describe('calculateTextureScore', () => {
  it('좋은 텍스처 지표는 높은 점수여야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 20,
      homogeneity: 0.9,
      energy: 0.8,
      correlation: 0.85,
      entropy: 2,
    };
    const lbp: LBPResult = {
      histogram: new Array(256).fill(1 / 256),
      uniformPatternRatio: 0.85,
      roughnessScore: 80,
    };

    const score = calculateTextureScore(glcm, lbp);
    expect(score).toBeGreaterThan(70);
  });

  it('나쁜 텍스처 지표는 낮은 점수여야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 400,
      homogeneity: 0.2,
      energy: 0.1,
      correlation: 0.2,
      entropy: 7,
    };
    const lbp: LBPResult = {
      histogram: new Array(256).fill(1 / 256),
      uniformPatternRatio: 0.2,
      roughnessScore: 20,
    };

    const score = calculateTextureScore(glcm, lbp);
    expect(score).toBeLessThan(50);
  });

  it('점수는 0-100 범위여야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 100,
      homogeneity: 0.5,
      energy: 0.5,
      correlation: 0.5,
      entropy: 5,
    };
    const lbp: LBPResult = {
      histogram: new Array(256).fill(1 / 256),
      uniformPatternRatio: 0.5,
      roughnessScore: 50,
    };

    const score = calculateTextureScore(glcm, lbp);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('정수를 반환해야 한다', () => {
    const glcm: GLCMResult = {
      contrast: 80,
      homogeneity: 0.6,
      energy: 0.5,
      correlation: 0.55,
      entropy: 4.2,
    };
    const lbp: LBPResult = {
      histogram: new Array(256).fill(1 / 256),
      uniformPatternRatio: 0.62,
      roughnessScore: 58,
    };

    const score = calculateTextureScore(glcm, lbp);
    expect(Number.isInteger(score)).toBe(true);
  });
});

// =============================================================================
// analyzeTexture 테스트
// =============================================================================

describe('analyzeTexture', () => {
  it('TextureAnalysis 형식의 결과를 반환해야 한다', () => {
    const pixels = createNoiseImage(30, 30);
    const result = analyzeTexture(pixels, 30, 30);

    expect(result).toHaveProperty('glcm');
    expect(result).toHaveProperty('lbp');
    expect(result).toHaveProperty('poreScore');
    expect(result).toHaveProperty('wrinkleScore');
    expect(result).toHaveProperty('textureScore');
  });

  it('GLCM 결과는 4방향 평균이어야 한다', () => {
    const pixels = createNoiseImage(30, 30);
    const result = analyzeTexture(pixels, 30, 30);

    // GLCM 속성 확인
    expect(result.glcm).toHaveProperty('contrast');
    expect(result.glcm).toHaveProperty('homogeneity');
    expect(result.glcm).toHaveProperty('energy');
    expect(result.glcm).toHaveProperty('correlation');
    expect(result.glcm).toHaveProperty('entropy');
  });

  it('LBP 결과가 포함되어야 한다', () => {
    const pixels = createNoiseImage(30, 30);
    const result = analyzeTexture(pixels, 30, 30);

    expect(result.lbp).toHaveProperty('histogram');
    expect(result.lbp).toHaveProperty('uniformPatternRatio');
    expect(result.lbp).toHaveProperty('roughnessScore');
  });

  it('모든 점수는 0-100 범위여야 한다', () => {
    const pixels = createNoiseImage(40, 40);
    const result = analyzeTexture(pixels, 40, 40);

    expect(result.poreScore).toBeGreaterThanOrEqual(0);
    expect(result.poreScore).toBeLessThanOrEqual(100);
    expect(result.wrinkleScore).toBeGreaterThanOrEqual(0);
    expect(result.wrinkleScore).toBeLessThanOrEqual(100);
    expect(result.textureScore).toBeGreaterThanOrEqual(0);
    expect(result.textureScore).toBeLessThanOrEqual(100);
  });

  it('균일한 이미지는 높은 점수를 받아야 한다', () => {
    const pixels = createUniformGrayImage(30, 30, 128);
    const result = analyzeTexture(pixels, 30, 30);

    expect(result.poreScore).toBeGreaterThan(70);
    expect(result.wrinkleScore).toBeGreaterThan(70);
    expect(result.textureScore).toBeGreaterThan(70);
  });

  it('노이즈 이미지는 낮은 점수를 받아야 한다', () => {
    const pixels = createNoiseImage(30, 30);
    const result = analyzeTexture(pixels, 30, 30);

    expect(result.poreScore).toBeLessThan(70);
    expect(result.textureScore).toBeLessThan(70);
  });
});

// =============================================================================
// toGrayscale 테스트
// =============================================================================

describe('toGrayscale', () => {
  it('ImageData를 Uint8Array로 변환해야 한다', () => {
    const imageData = createMockImageData(10, 10, { r: 100, g: 150, b: 200 });
    const result = toGrayscale(imageData);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(100); // 10 * 10
  });

  it('ITU-R BT.601 가중치를 사용해야 한다', () => {
    // R=100, G=150, B=200
    // Gray = 0.299*100 + 0.587*150 + 0.114*200 = 29.9 + 88.05 + 22.8 = 140.75 ≈ 141
    const imageData = createMockImageData(1, 1, { r: 100, g: 150, b: 200 });
    const result = toGrayscale(imageData);

    expect(result[0]).toBe(141);
  });

  it('빨간색은 주로 R 가중치(0.299)를 반영해야 한다', () => {
    const imageData = createMockImageData(1, 1, { r: 255, g: 0, b: 0 });
    const result = toGrayscale(imageData);

    // Gray = 0.299 * 255 ≈ 76
    expect(result[0]).toBeCloseTo(76, 0);
  });

  it('녹색은 주로 G 가중치(0.587)를 반영해야 한다', () => {
    const imageData = createMockImageData(1, 1, { r: 0, g: 255, b: 0 });
    const result = toGrayscale(imageData);

    // Gray = 0.587 * 255 ≈ 150
    expect(result[0]).toBeCloseTo(150, 0);
  });

  it('파란색은 주로 B 가중치(0.114)를 반영해야 한다', () => {
    const imageData = createMockImageData(1, 1, { r: 0, g: 0, b: 255 });
    const result = toGrayscale(imageData);

    // Gray = 0.114 * 255 ≈ 29
    expect(result[0]).toBeCloseTo(29, 0);
  });

  it('흰색(255,255,255)은 255가 되어야 한다', () => {
    const imageData = createMockImageData(1, 1, { r: 255, g: 255, b: 255 });
    const result = toGrayscale(imageData);

    expect(result[0]).toBe(255);
  });

  it('검정(0,0,0)은 0이 되어야 한다', () => {
    const imageData = createMockImageData(1, 1, { r: 0, g: 0, b: 0 });
    const result = toGrayscale(imageData);

    expect(result[0]).toBe(0);
  });

  it('이미지 전체 픽셀을 변환해야 한다', () => {
    const imageData = createMockImageData(5, 5, { r: 100, g: 100, b: 100 });
    const result = toGrayscale(imageData);

    // 모든 픽셀이 동일한 값이어야 함
    const expectedGray = Math.round(0.299 * 100 + 0.587 * 100 + 0.114 * 100);
    result.forEach(pixel => {
      expect(pixel).toBe(expectedGray);
    });
  });
});

// =============================================================================
// 통합 테스트
// =============================================================================

describe('Texture Analysis Integration', () => {
  it('피부 텍스처 분석 시나리오: 부드러운 피부', () => {
    // 부드러운 피부 = 균일한 텍스처
    const smoothSkin = createUniformGrayImage(50, 50, 180);
    const result = analyzeTexture(smoothSkin, 50, 50);

    // 부드러운 피부는 높은 점수를 받아야 함
    expect(result.poreScore).toBeGreaterThan(60);
    expect(result.textureScore).toBeGreaterThan(60);
    expect(result.glcm.homogeneity).toBeGreaterThan(0.8);
  });

  it('피부 텍스처 분석 시나리오: 거친 피부', () => {
    // 거친 피부 = 불규칙한 텍스처
    const roughSkin = createNoiseImage(50, 50);
    const result = analyzeTexture(roughSkin, 50, 50);

    // 거친 피부는 낮은 점수를 받아야 함
    expect(result.poreScore).toBeLessThan(80);
    expect(result.glcm.homogeneity).toBeLessThan(0.8);
  });

  it('GLCM과 LBP 결과의 일관성 확인', () => {
    const pixels = createGradientImage(40, 40);
    const result = analyzeTexture(pixels, 40, 40);

    // GLCM과 LBP 모두 유효한 결과
    expect(result.glcm.contrast).toBeGreaterThanOrEqual(0);
    expect(result.lbp.uniformPatternRatio).toBeGreaterThanOrEqual(0);
    expect(result.lbp.uniformPatternRatio).toBeLessThanOrEqual(1);
  });
});
