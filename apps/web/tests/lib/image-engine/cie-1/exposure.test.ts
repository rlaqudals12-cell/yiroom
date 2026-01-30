/**
 * CIE-1 노출 분석 테스트
 *
 * @module tests/lib/image-engine/cie-1/exposure
 * @see lib/image-engine/cie-1/exposure.ts
 */
import { describe, it, expect } from 'vitest';
import {
  analyzeHistogram,
  getExposureVerdict,
  calculateExposureConfidence,
  getExposureFeedback,
} from '@/lib/image-engine/cie-1/exposure';

describe('analyzeHistogram', () => {
  it('빈 히스토그램은 기본값 반환', () => {
    const result = analyzeHistogram([], 0);

    expect(result.clippedDarkRatio).toBe(0);
    expect(result.clippedBrightRatio).toBe(0);
    expect(result.peakBin).toBe(128);
    expect(result.dynamicRange).toBe(0);
  });

  it('pixelCount가 0이면 기본값 반환', () => {
    const histogram = new Array(256).fill(100);
    const result = analyzeHistogram(histogram, 0);

    expect(result.peakBin).toBe(128);
    expect(result.dynamicRange).toBe(0);
  });

  it('히스토그램 길이가 256이 아니면 기본값 반환', () => {
    const shortHistogram = new Array(100).fill(10);
    const result = analyzeHistogram(shortHistogram, 1000);

    expect(result.peakBin).toBe(128);
  });

  it('정상 히스토그램 분석', () => {
    // 중앙(128)에 집중된 히스토그램
    const histogram = new Array(256).fill(0);
    histogram[128] = 1000;
    histogram[127] = 500;
    histogram[129] = 500;

    const result = analyzeHistogram(histogram, 2000);

    expect(result.peakBin).toBe(128);
    expect(result.clippedDarkRatio).toBe(0);
    expect(result.clippedBrightRatio).toBe(0);
  });

  it('어두운 영역 클리핑 감지', () => {
    const histogram = new Array(256).fill(0);
    // 0-5 bin에 픽셀 집중
    histogram[0] = 200;
    histogram[1] = 150;
    histogram[2] = 100;
    histogram[3] = 50;
    histogram[4] = 30;
    histogram[5] = 20;
    histogram[128] = 450; // 나머지

    const pixelCount = 1000;
    const result = analyzeHistogram(histogram, pixelCount);

    // 클리핑 비율 = (200+150+100+50+30+20) / 1000 = 0.55
    expect(result.clippedDarkRatio).toBeCloseTo(0.55, 2);
  });

  it('밝은 영역 클리핑 감지', () => {
    const histogram = new Array(256).fill(0);
    // 250-255 bin에 픽셀 집중
    histogram[250] = 100;
    histogram[251] = 100;
    histogram[252] = 100;
    histogram[253] = 100;
    histogram[254] = 100;
    histogram[255] = 100;
    histogram[128] = 400; // 나머지

    const pixelCount = 1000;
    const result = analyzeHistogram(histogram, pixelCount);

    // 클리핑 비율 = 600 / 1000 = 0.6
    expect(result.clippedBrightRatio).toBeCloseTo(0.6, 2);
  });

  it('동적 범위 계산', () => {
    const histogram = new Array(256).fill(0);
    // 50-200 범위에 분포
    for (let i = 50; i <= 200; i++) {
      histogram[i] = 100;
    }

    const pixelCount = 15100; // 151 bins × 100
    const result = analyzeHistogram(histogram, pixelCount);

    // 5% threshold = 755 픽셀
    // 누적합이 755 이상이 되는 최초 bin이 minBin
    expect(result.dynamicRange).toBeGreaterThan(100);
  });
});

describe('getExposureVerdict', () => {
  it('너무 어두우면 underexposed', () => {
    expect(getExposureVerdict(50)).toBe('underexposed');
    expect(getExposureVerdict(0)).toBe('underexposed');
  });

  it('너무 밝으면 overexposed', () => {
    expect(getExposureVerdict(200)).toBe('overexposed');
    expect(getExposureVerdict(255)).toBe('overexposed');
  });

  it('적정 범위면 normal', () => {
    expect(getExposureVerdict(100)).toBe('normal');
    expect(getExposureVerdict(135)).toBe('normal');
    expect(getExposureVerdict(180)).toBe('normal');
  });

  it('경계값 테스트', () => {
    // 기본 설정: minBrightness=80, maxBrightness=190
    expect(getExposureVerdict(79)).toBe('underexposed');
    expect(getExposureVerdict(80)).toBe('normal');
    expect(getExposureVerdict(190)).toBe('normal');
    expect(getExposureVerdict(191)).toBe('overexposed');
  });
});

describe('calculateExposureConfidence', () => {
  it('중앙값(135)에서 가장 높은 신뢰도', () => {
    const confidence = calculateExposureConfidence(135);

    expect(confidence).toBeGreaterThanOrEqual(0.9);
    expect(confidence).toBeLessThanOrEqual(1.0);
  });

  it('적정 범위 내에서 0.7 이상', () => {
    const confidenceLow = calculateExposureConfidence(80);
    const confidenceHigh = calculateExposureConfidence(190);

    expect(confidenceLow).toBeGreaterThanOrEqual(0.7);
    expect(confidenceHigh).toBeGreaterThanOrEqual(0.7);
  });

  it('적정 범위 밖에서 신뢰도 감소', () => {
    const confidenceDark = calculateExposureConfidence(30);
    const confidenceBright = calculateExposureConfidence(240);

    expect(confidenceDark).toBeLessThan(0.7);
    expect(confidenceBright).toBeLessThan(0.7);
  });

  it('최소 신뢰도는 0.1 이상', () => {
    const extremeDark = calculateExposureConfidence(0);
    const extremeBright = calculateExposureConfidence(255);

    expect(extremeDark).toBeGreaterThanOrEqual(0.1);
    expect(extremeBright).toBeGreaterThanOrEqual(0.1);
  });
});

describe('getExposureFeedback', () => {
  it('underexposed 피드백', () => {
    const feedback = getExposureFeedback('underexposed');

    expect(feedback).toBeTruthy();
    expect(typeof feedback).toBe('string');
  });

  it('overexposed 피드백', () => {
    const feedback = getExposureFeedback('overexposed');

    expect(feedback).toBeTruthy();
    expect(typeof feedback).toBe('string');
  });

  it('normal 피드백', () => {
    const feedback = getExposureFeedback('normal');

    expect(feedback).toBeTruthy();
    expect(typeof feedback).toBe('string');
  });
});
