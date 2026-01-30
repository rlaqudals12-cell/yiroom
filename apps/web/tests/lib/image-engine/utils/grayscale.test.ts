/**
 * 그레이스케일 변환 유틸리티 테스트
 *
 * @module tests/lib/image-engine/utils/grayscale
 * @see lib/image-engine/utils/grayscale.ts
 */
import { describe, it, expect } from 'vitest';
import {
  toGrayscale,
  toGrayscaleBT709,
  calculateMeanBrightness,
  calculateStdDev,
  calculateHistogram,
  normalizeHistogram,
  extractRegion,
} from '@/lib/image-engine/utils/grayscale';
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

describe('toGrayscale (BT.601)', () => {
  it('흰색 (255,255,255)은 255', () => {
    const imageData = createTestRGBImageData(2, 2, { r: 255, g: 255, b: 255 });
    const gray = toGrayscale(imageData);

    expect(gray.data[0]).toBe(255);
    expect(gray.width).toBe(2);
    expect(gray.height).toBe(2);
  });

  it('검은색 (0,0,0)은 0', () => {
    const imageData = createTestRGBImageData(2, 2, { r: 0, g: 0, b: 0 });
    const gray = toGrayscale(imageData);

    expect(gray.data[0]).toBe(0);
  });

  it('회색 (128,128,128)은 128', () => {
    const imageData = createTestRGBImageData(2, 2, { r: 128, g: 128, b: 128 });
    const gray = toGrayscale(imageData);

    expect(gray.data[0]).toBe(128);
  });

  it('BT.601 가중치 적용 확인 (순수 빨강)', () => {
    const imageData = createTestRGBImageData(1, 1, { r: 255, g: 0, b: 0 });
    const gray = toGrayscale(imageData);

    // Y = 0.299 * 255 = 76.245 ≈ 76
    expect(gray.data[0]).toBeCloseTo(76, 0);
  });

  it('BT.601 가중치 적용 확인 (순수 녹색)', () => {
    const imageData = createTestRGBImageData(1, 1, { r: 0, g: 255, b: 0 });
    const gray = toGrayscale(imageData);

    // Y = 0.587 * 255 = 149.685 ≈ 150
    expect(gray.data[0]).toBeCloseTo(150, 0);
  });

  it('BT.601 가중치 적용 확인 (순수 파랑)', () => {
    const imageData = createTestRGBImageData(1, 1, { r: 0, g: 0, b: 255 });
    const gray = toGrayscale(imageData);

    // Y = 0.114 * 255 = 29.07 ≈ 29
    expect(gray.data[0]).toBeCloseTo(29, 0);
  });

  it('출력 크기가 입력과 동일', () => {
    const imageData = createTestRGBImageData(100, 50, { r: 128, g: 128, b: 128 });
    const gray = toGrayscale(imageData);

    expect(gray.data.length).toBe(100 * 50);
    expect(gray.width).toBe(100);
    expect(gray.height).toBe(50);
  });
});

describe('toGrayscaleBT709', () => {
  it('흰색 (255,255,255)은 255', () => {
    const imageData = createTestRGBImageData(2, 2, { r: 255, g: 255, b: 255 });
    const gray = toGrayscaleBT709(imageData);

    expect(gray.data[0]).toBe(255);
  });

  it('BT.709 가중치는 BT.601과 다름', () => {
    const imageData = createTestRGBImageData(1, 1, { r: 255, g: 0, b: 0 });

    const grayBT601 = toGrayscale(imageData);
    const grayBT709 = toGrayscaleBT709(imageData);

    // BT.601: Y = 0.299 * 255 ≈ 76
    // BT.709: Y = 0.2126 * 255 ≈ 54
    expect(grayBT601.data[0]).not.toBe(grayBT709.data[0]);
    expect(grayBT709.data[0]).toBeCloseTo(54, 0);
  });
});

describe('calculateMeanBrightness', () => {
  it('균일한 이미지의 평균 밝기', () => {
    const grayData = createTestGrayscaleData(10, 10, 128);
    const mean = calculateMeanBrightness(grayData);

    expect(mean).toBe(128);
  });

  it('흰색 이미지의 평균 밝기는 255', () => {
    const grayData = createTestGrayscaleData(10, 10, 255);
    const mean = calculateMeanBrightness(grayData);

    expect(mean).toBe(255);
  });

  it('검은색 이미지의 평균 밝기는 0', () => {
    const grayData = createTestGrayscaleData(10, 10, 0);
    const mean = calculateMeanBrightness(grayData);

    expect(mean).toBe(0);
  });

  it('혼합된 값의 평균 계산', () => {
    const data = new Uint8Array([0, 100, 200, 100]);
    const grayData: GrayscaleImageData = { data, width: 2, height: 2 };
    const mean = calculateMeanBrightness(grayData);

    expect(mean).toBe(100); // (0+100+200+100)/4 = 100
  });
});

describe('calculateStdDev', () => {
  it('균일한 이미지의 표준편차는 0', () => {
    const grayData = createTestGrayscaleData(10, 10, 128);
    const stdDev = calculateStdDev(grayData);

    expect(stdDev).toBe(0);
  });

  it('변동이 있는 이미지의 표준편차', () => {
    // 0, 100의 교대 → 평균 50, 편차 50
    const data = new Uint8Array(100);
    for (let i = 0; i < 100; i++) {
      data[i] = i % 2 === 0 ? 0 : 100;
    }
    const grayData: GrayscaleImageData = { data, width: 10, height: 10 };
    const stdDev = calculateStdDev(grayData);

    expect(stdDev).toBe(50);
  });

  it('미리 계산된 평균을 사용', () => {
    const grayData = createTestGrayscaleData(10, 10, 128);
    const stdDev = calculateStdDev(grayData, 128);

    expect(stdDev).toBe(0);
  });
});

describe('calculateHistogram', () => {
  it('256개 bin 반환', () => {
    const grayData = createTestGrayscaleData(10, 10, 128);
    const histogram = calculateHistogram(grayData);

    expect(histogram.length).toBe(256);
  });

  it('균일한 이미지는 단일 bin에 집중', () => {
    const grayData = createTestGrayscaleData(10, 10, 128);
    const histogram = calculateHistogram(grayData);

    expect(histogram[128]).toBe(100); // 10*10 = 100 픽셀
    expect(histogram[0]).toBe(0);
    expect(histogram[255]).toBe(0);
  });

  it('빈도수 합계는 픽셀 수와 일치', () => {
    const grayData = createTestGrayscaleData(10, 10, 128);
    const histogram = calculateHistogram(grayData);
    const sum = histogram.reduce((a, b) => a + b, 0);

    expect(sum).toBe(100);
  });

  it('다양한 값의 분포', () => {
    const data = new Uint8Array([0, 0, 128, 128, 128, 255]);
    const grayData: GrayscaleImageData = { data, width: 3, height: 2 };
    const histogram = calculateHistogram(grayData);

    expect(histogram[0]).toBe(2);
    expect(histogram[128]).toBe(3);
    expect(histogram[255]).toBe(1);
  });
});

describe('normalizeHistogram', () => {
  it('0-1 범위로 정규화', () => {
    const histogram = new Array(256).fill(0);
    histogram[128] = 100;

    const normalized = normalizeHistogram(histogram, 100);

    expect(normalized[128]).toBe(1);
    expect(normalized[0]).toBe(0);
  });

  it('합계가 1', () => {
    const histogram = new Array(256).fill(0);
    histogram[0] = 50;
    histogram[255] = 50;

    const normalized = normalizeHistogram(histogram, 100);
    const sum = normalized.reduce((a, b) => a + b, 0);

    expect(sum).toBeCloseTo(1, 5);
  });

  it('비율 계산 정확성', () => {
    const histogram = new Array(256).fill(0);
    histogram[0] = 25;
    histogram[100] = 25;
    histogram[200] = 50;

    const normalized = normalizeHistogram(histogram, 100);

    expect(normalized[0]).toBe(0.25);
    expect(normalized[100]).toBe(0.25);
    expect(normalized[200]).toBe(0.5);
  });
});

describe('extractRegion', () => {
  it('영역 추출 성공', () => {
    // 5x5 이미지, 값 0-24
    const data = new Uint8Array(25);
    for (let i = 0; i < 25; i++) {
      data[i] = i;
    }
    const grayData: GrayscaleImageData = { data, width: 5, height: 5 };

    // 1,1에서 3x3 영역 추출
    const region = extractRegion(grayData, 1, 1, 3, 3);

    expect(region.width).toBe(3);
    expect(region.height).toBe(3);
    expect(region.data.length).toBe(9);

    // 첫 번째 행: 6, 7, 8 (row 1의 col 1,2,3)
    expect(region.data[0]).toBe(6);
    expect(region.data[1]).toBe(7);
    expect(region.data[2]).toBe(8);
  });

  it('경계 클리핑', () => {
    const grayData = createTestGrayscaleData(5, 5, 100);

    // 3,3에서 5x5 영역 추출 시도 → 실제로는 2x2
    const region = extractRegion(grayData, 3, 3, 5, 5);

    expect(region.width).toBe(2);
    expect(region.height).toBe(2);
  });

  it('음수 좌표는 0으로 클램핑', () => {
    const grayData = createTestGrayscaleData(5, 5, 100);

    const region = extractRegion(grayData, -1, -1, 3, 3);

    // 실제로 0,0에서 시작
    expect(region.width).toBe(3);
    expect(region.height).toBe(3);
  });

  it('추출된 영역의 값 유지', () => {
    const grayData = createTestGrayscaleData(10, 10, 200);

    const region = extractRegion(grayData, 2, 2, 5, 5);

    // 모든 값이 200이어야 함
    for (let i = 0; i < region.data.length; i++) {
      expect(region.data[i]).toBe(200);
    }
  });

  it('전체 이미지 추출', () => {
    const grayData = createTestGrayscaleData(5, 5, 128);

    const region = extractRegion(grayData, 0, 0, 5, 5);

    expect(region.width).toBe(5);
    expect(region.height).toBe(5);
    expect(region.data.length).toBe(25);
  });
});
