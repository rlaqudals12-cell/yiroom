/**
 * CIE-1 선명도 분석 테스트
 *
 * @module tests/lib/image-engine/cie-1/sharpness
 * @see lib/image-engine/cie-1/sharpness.ts
 */
import { describe, it, expect } from 'vitest';
import {
  applyLaplacianFilter,
  calculateLaplacianVariance,
  normalizeSharpnessScore,
  getSharpnessVerdict,
  getSharpnessFeedback,
  analyzeSharpness,
  analyzeSharpnessFromGray,
} from '@/lib/image-engine/cie-1/sharpness';
import type { RGBImageData, GrayscaleImageData } from '@/lib/image-engine/types';

// 테스트용 RGB 이미지 데이터 생성 헬퍼
function createTestRGBImageData(
  width: number,
  height: number,
  fillColor: { r: number; g: number; b: number }
): RGBImageData {
  const data = new Uint8Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    data[i * 3] = fillColor.r;
    data[i * 3 + 1] = fillColor.g;
    data[i * 3 + 2] = fillColor.b;
  }

  return { data, width, height, channels: 3 };
}

// 테스트용 그레이스케일 이미지 데이터 생성 헬퍼
function createTestGrayscaleData(
  width: number,
  height: number,
  fillValue: number
): GrayscaleImageData {
  const data = new Uint8Array(width * height);
  data.fill(fillValue);
  return { data, width, height };
}

// 테스트용 에지 이미지 생성 (수직선)
function createEdgeImage(
  width: number,
  height: number
): GrayscaleImageData {
  const data = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 수직 에지: 왼쪽 절반은 0, 오른쪽 절반은 255
      data[y * width + x] = x < width / 2 ? 0 : 255;
    }
  }

  return { data, width, height };
}

// 테스트용 노이즈 이미지 생성
function createNoisyImage(
  width: number,
  height: number
): GrayscaleImageData {
  const data = new Uint8Array(width * height);

  // 체커보드 패턴 (높은 variance 유발)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = (x + y) % 2 === 0 ? 0 : 255;
    }
  }

  return { data, width, height };
}

describe('applyLaplacianFilter', () => {
  it('균일한 이미지는 0 응답', () => {
    const grayData = createTestGrayscaleData(5, 5, 128);
    const result = applyLaplacianFilter(grayData);

    // 중앙 픽셀 확인 (경계 제외)
    expect(result[1 * 5 + 1]).toBe(0);
    expect(result[2 * 5 + 2]).toBe(0);
    expect(result[3 * 5 + 3]).toBe(0);
  });

  it('에지 이미지는 높은 응답', () => {
    const grayData = createEdgeImage(10, 10);
    const result = applyLaplacianFilter(grayData);

    // 에지 근처에서 높은 값
    const centerIdx = 5 * 10 + 5;
    expect(Math.abs(result[centerIdx])).toBeGreaterThan(0);
  });

  it('결과 크기는 입력과 동일', () => {
    const grayData = createTestGrayscaleData(10, 8, 128);
    const result = applyLaplacianFilter(grayData);

    expect(result.length).toBe(10 * 8);
  });

  it('경계 픽셀은 0', () => {
    const grayData = createTestGrayscaleData(5, 5, 128);
    const result = applyLaplacianFilter(grayData);

    // 첫 번째 행
    for (let x = 0; x < 5; x++) {
      expect(result[x]).toBe(0);
    }

    // 마지막 행
    for (let x = 0; x < 5; x++) {
      expect(result[4 * 5 + x]).toBe(0);
    }

    // 첫 번째 열
    for (let y = 0; y < 5; y++) {
      expect(result[y * 5]).toBe(0);
    }

    // 마지막 열
    for (let y = 0; y < 5; y++) {
      expect(result[y * 5 + 4]).toBe(0);
    }
  });
});

describe('calculateLaplacianVariance', () => {
  it('균일한 Laplacian 출력의 분산은 0', () => {
    const laplacianData = new Float32Array(25).fill(0);
    const variance = calculateLaplacianVariance(laplacianData, 5, 5);

    expect(variance).toBe(0);
  });

  it('변동이 있으면 분산이 양수', () => {
    const laplacianData = new Float32Array(25);
    // 중앙에 변동 추가
    laplacianData[1 * 5 + 1] = 100;
    laplacianData[1 * 5 + 2] = -100;
    laplacianData[2 * 5 + 1] = 50;
    laplacianData[2 * 5 + 2] = -50;

    const variance = calculateLaplacianVariance(laplacianData, 5, 5);

    expect(variance).toBeGreaterThan(0);
  });

  it('이미지가 너무 작으면 0 반환', () => {
    const laplacianData = new Float32Array(4); // 2x2
    const variance = calculateLaplacianVariance(laplacianData, 2, 2);

    expect(variance).toBe(0);
  });

  it('경계 제외한 유효 픽셀만 계산', () => {
    // 5x5 이미지에서 유효 픽셀은 3x3 = 9개
    const laplacianData = new Float32Array(25).fill(0);

    // 유효 영역(1,1)에만 값 설정
    laplacianData[1 * 5 + 1] = 9;

    const variance = calculateLaplacianVariance(laplacianData, 5, 5);
    // 평균 = 9 / 9 = 1
    // 분산 = ((9-1)² + 8*(0-1)²) / 9 = (64 + 8) / 9 = 8
    expect(variance).toBeCloseTo(8, 1);
  });
});

describe('normalizeSharpnessScore', () => {
  it('variance 0은 0점', () => {
    expect(normalizeSharpnessScore(0)).toBe(0);
  });

  it('variance 80은 30점 (rejected 경계)', () => {
    expect(normalizeSharpnessScore(80)).toBe(30);
  });

  it('variance 120은 50점 (warning 경계)', () => {
    expect(normalizeSharpnessScore(120)).toBe(50);
  });

  it('variance 500은 90점 (acceptable 경계)', () => {
    expect(normalizeSharpnessScore(500)).toBe(90);
  });

  it('variance 1000은 100점 (optimal 범위)', () => {
    expect(normalizeSharpnessScore(1000)).toBe(100);
  });

  it('rejected 범위 (0-80) 점수는 0-30', () => {
    expect(normalizeSharpnessScore(40)).toBeCloseTo(15, 0);
    expect(normalizeSharpnessScore(60)).toBeCloseTo(22.5, 0);
  });

  it('warning 범위 (80-120) 점수는 30-50', () => {
    expect(normalizeSharpnessScore(100)).toBeCloseTo(40, 0);
  });

  it('acceptable 범위 (120-500) 점수는 50-90', () => {
    expect(normalizeSharpnessScore(310)).toBeCloseTo(70, 0);
  });

  it('점수는 0-100 범위 (양수 입력)', () => {
    // 음수 입력은 정상적인 케이스가 아니므로 양수만 테스트
    expect(normalizeSharpnessScore(0)).toBe(0);
    expect(normalizeSharpnessScore(10000)).toBeLessThanOrEqual(100);
  });

  it('매우 높은 variance는 100점', () => {
    expect(normalizeSharpnessScore(10000)).toBe(100);
  });
});

describe('getSharpnessVerdict', () => {
  it('variance < 80은 rejected', () => {
    expect(getSharpnessVerdict(0)).toBe('rejected');
    expect(getSharpnessVerdict(50)).toBe('rejected');
    expect(getSharpnessVerdict(79)).toBe('rejected');
  });

  it('80 <= variance < 120은 warning', () => {
    expect(getSharpnessVerdict(80)).toBe('warning');
    expect(getSharpnessVerdict(100)).toBe('warning');
    expect(getSharpnessVerdict(119)).toBe('warning');
  });

  it('120 <= variance < 500은 acceptable', () => {
    expect(getSharpnessVerdict(120)).toBe('acceptable');
    expect(getSharpnessVerdict(300)).toBe('acceptable');
    expect(getSharpnessVerdict(499)).toBe('acceptable');
  });

  it('variance >= 500은 optimal', () => {
    expect(getSharpnessVerdict(500)).toBe('optimal');
    expect(getSharpnessVerdict(1000)).toBe('optimal');
    expect(getSharpnessVerdict(10000)).toBe('optimal');
  });
});

describe('getSharpnessFeedback', () => {
  it('각 등급에 맞는 피드백 반환', () => {
    expect(getSharpnessFeedback('rejected')).toContain('흐립니다');
    expect(getSharpnessFeedback('warning')).toContain('다소');
    expect(getSharpnessFeedback('acceptable')).toContain('적절');
    expect(getSharpnessFeedback('optimal')).toContain('매우');
  });

  it('피드백은 비어있지 않음', () => {
    expect(getSharpnessFeedback('rejected').length).toBeGreaterThan(0);
    expect(getSharpnessFeedback('warning').length).toBeGreaterThan(0);
    expect(getSharpnessFeedback('acceptable').length).toBeGreaterThan(0);
    expect(getSharpnessFeedback('optimal').length).toBeGreaterThan(0);
  });
});

describe('analyzeSharpness', () => {
  it('균일한 이미지는 낮은 선명도', () => {
    const imageData = createTestRGBImageData(20, 20, { r: 128, g: 128, b: 128 });
    const result = analyzeSharpness(imageData);

    expect(result.score).toBeLessThan(30);
    expect(result.verdict).toBe('rejected');
    expect(result.laplacianVariance).toBeCloseTo(0, 1);
  });

  it('결과 구조 검증', () => {
    const imageData = createTestRGBImageData(20, 20, { r: 128, g: 128, b: 128 });
    const result = analyzeSharpness(imageData);

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('laplacianVariance');
    expect(result).toHaveProperty('verdict');
    expect(result).toHaveProperty('feedback');

    expect(typeof result.score).toBe('number');
    expect(typeof result.laplacianVariance).toBe('number');
    expect(typeof result.verdict).toBe('string');
    expect(typeof result.feedback).toBe('string');
  });

  it('점수는 0-100 범위의 정수', () => {
    const imageData = createTestRGBImageData(20, 20, { r: 128, g: 128, b: 128 });
    const result = analyzeSharpness(imageData);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it('verdict와 feedback은 일관성 유지', () => {
    const imageData = createTestRGBImageData(20, 20, { r: 128, g: 128, b: 128 });
    const result = analyzeSharpness(imageData);

    if (result.verdict === 'rejected') {
      expect(result.feedback).toContain('흐립니다');
    }
  });
});

describe('analyzeSharpnessFromGray', () => {
  it('균일한 그레이스케일 이미지는 낮은 선명도', () => {
    const grayData = createTestGrayscaleData(20, 20, 128);
    const result = analyzeSharpnessFromGray(grayData);

    expect(result.score).toBeLessThan(30);
    expect(result.verdict).toBe('rejected');
  });

  it('노이즈 이미지는 높은 선명도', () => {
    const grayData = createNoisyImage(20, 20);
    const result = analyzeSharpnessFromGray(grayData);

    expect(result.laplacianVariance).toBeGreaterThan(100);
    expect(result.score).toBeGreaterThan(30);
  });

  it('에지 이미지는 중간 선명도', () => {
    const grayData = createEdgeImage(20, 20);
    const result = analyzeSharpnessFromGray(grayData);

    expect(result.laplacianVariance).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
  });

  it('RGB 분석과 Gray 분석 결과 일치', () => {
    // 그레이 이미지 (R=G=B=128)
    const rgbData = createTestRGBImageData(20, 20, { r: 128, g: 128, b: 128 });
    const grayData = createTestGrayscaleData(20, 20, 128);

    const rgbResult = analyzeSharpness(rgbData);
    const grayResult = analyzeSharpnessFromGray(grayData);

    expect(rgbResult.score).toBe(grayResult.score);
    expect(rgbResult.verdict).toBe(grayResult.verdict);
  });
});
