/**
 * CIE-1 색온도(CCT) 분석 테스트
 *
 * @module tests/lib/image-engine/cie-1/color-temperature
 * @see lib/image-engine/cie-1/color-temperature.ts
 */
import { describe, it, expect } from 'vitest';
import {
  getCCTVerdict,
  calculateCCTConfidence,
  getCCTFeedback,
  calculateImageAverageRGB,
  calculateBrightRegionAverageRGB,
  analyzeColorTemperature,
  analyzeColorTemperatureFromRGB,
} from '@/lib/image-engine/cie-1/color-temperature';
import type { RGBImageData, RGB } from '@/lib/image-engine/types';

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

// 테스트용 혼합 밝기 이미지 생성
function createMixedBrightnessImage(
  width: number,
  height: number,
  brightColor: RGB,
  darkColor: RGB,
  brightRatio: number
): RGBImageData {
  const data = new Uint8Array(width * height * 3);
  const brightPixelCount = Math.floor(width * height * brightRatio);

  for (let i = 0; i < width * height; i++) {
    const color = i < brightPixelCount ? brightColor : darkColor;
    data[i * 3] = color.r;
    data[i * 3 + 1] = color.g;
    data[i * 3 + 2] = color.b;
  }

  return { data, width, height, channels: 3 };
}

describe('getCCTVerdict', () => {
  it('kelvin < 4000은 too_warm', () => {
    expect(getCCTVerdict(2700)).toBe('too_warm');
    expect(getCCTVerdict(3000)).toBe('too_warm');
    expect(getCCTVerdict(3999)).toBe('too_warm');
  });

  it('4000 <= kelvin < 5500은 warm', () => {
    expect(getCCTVerdict(4000)).toBe('warm');
    expect(getCCTVerdict(4500)).toBe('warm');
    expect(getCCTVerdict(5499)).toBe('warm');
  });

  it('5500 <= kelvin < 6500은 neutral', () => {
    expect(getCCTVerdict(5500)).toBe('neutral');
    expect(getCCTVerdict(6000)).toBe('neutral');
    expect(getCCTVerdict(6499)).toBe('neutral');
  });

  it('6500 <= kelvin < 7500은 cool', () => {
    expect(getCCTVerdict(6500)).toBe('cool');
    expect(getCCTVerdict(7000)).toBe('cool');
    expect(getCCTVerdict(7499)).toBe('cool');
  });

  it('kelvin >= 7500은 too_cool', () => {
    expect(getCCTVerdict(7500)).toBe('too_cool');
    expect(getCCTVerdict(10000)).toBe('too_cool');
    expect(getCCTVerdict(15000)).toBe('too_cool');
  });
});

describe('calculateCCTConfidence', () => {
  it('D65(6500K)에서 최고 신뢰도', () => {
    const confidence = calculateCCTConfidence(6500);
    expect(confidence).toBeCloseTo(1.0, 1);
  });

  it('적정 범위(4000-7500) 내에서 0.7 이상', () => {
    expect(calculateCCTConfidence(4000)).toBeGreaterThanOrEqual(0.7);
    expect(calculateCCTConfidence(5000)).toBeGreaterThanOrEqual(0.7);
    expect(calculateCCTConfidence(7500)).toBeGreaterThanOrEqual(0.7);
  });

  it('적정 범위 외에서 0.7 미만', () => {
    expect(calculateCCTConfidence(3000)).toBeLessThan(0.7);
    expect(calculateCCTConfidence(9000)).toBeLessThan(0.7);
  });

  it('극단적 값에서도 최소 0.1', () => {
    expect(calculateCCTConfidence(1000)).toBeGreaterThanOrEqual(0.1);
    expect(calculateCCTConfidence(20000)).toBeGreaterThanOrEqual(0.1);
  });

  it('신뢰도는 0-1 범위', () => {
    for (const kelvin of [2000, 4000, 6500, 8000, 15000]) {
      const confidence = calculateCCTConfidence(kelvin);
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    }
  });

  it('D65에서 멀어질수록 신뢰도 감소', () => {
    const conf6500 = calculateCCTConfidence(6500);
    const conf5500 = calculateCCTConfidence(5500);
    const conf4500 = calculateCCTConfidence(4500);

    expect(conf6500).toBeGreaterThan(conf5500);
    expect(conf5500).toBeGreaterThan(conf4500);
  });
});

describe('getCCTFeedback', () => {
  it('각 등급에 맞는 피드백 반환', () => {
    expect(getCCTFeedback('too_warm')).toContain('따뜻');
    expect(getCCTFeedback('warm')).toContain('따뜻');
    expect(getCCTFeedback('neutral')).toContain('적절');
    expect(getCCTFeedback('cool')).toContain('차갑');
    expect(getCCTFeedback('too_cool')).toContain('차갑');
  });

  it('피드백은 비어있지 않음', () => {
    expect(getCCTFeedback('too_warm').length).toBeGreaterThan(0);
    expect(getCCTFeedback('warm').length).toBeGreaterThan(0);
    expect(getCCTFeedback('neutral').length).toBeGreaterThan(0);
    expect(getCCTFeedback('cool').length).toBeGreaterThan(0);
    expect(getCCTFeedback('too_cool').length).toBeGreaterThan(0);
  });
});

describe('calculateImageAverageRGB', () => {
  it('균일한 이미지의 평균 = 채움 색상', () => {
    const imageData = createTestRGBImageData(10, 10, { r: 100, g: 150, b: 200 });
    const avg = calculateImageAverageRGB(imageData);

    expect(avg.r).toBe(100);
    expect(avg.g).toBe(150);
    expect(avg.b).toBe(200);
  });

  it('흑백 이미지의 평균', () => {
    // 절반 흰색, 절반 검은색
    const imageData = createMixedBrightnessImage(
      10,
      10,
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 },
      0.5
    );
    const avg = calculateImageAverageRGB(imageData);

    expect(avg.r).toBeCloseTo(128, 0);
    expect(avg.g).toBeCloseTo(128, 0);
    expect(avg.b).toBeCloseTo(128, 0);
  });

  it('반올림 처리', () => {
    // 1/3 빨강, 2/3 파랑
    const imageData = createMixedBrightnessImage(
      30,
      10,
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 0, b: 255 },
      1 / 3
    );
    const avg = calculateImageAverageRGB(imageData);

    // 평균 R = 255 * 1/3 = 85
    // 평균 B = 255 * 2/3 = 170
    expect(avg.r).toBeCloseTo(85, 0);
    expect(avg.g).toBe(0);
    expect(avg.b).toBeCloseTo(170, 0);
  });
});

describe('calculateBrightRegionAverageRGB', () => {
  it('밝은 픽셀만 있으면 전체 평균', () => {
    const imageData = createTestRGBImageData(10, 10, { r: 200, g: 200, b: 200 });
    const avg = calculateBrightRegionAverageRGB(imageData, 100);

    expect(avg).not.toBeNull();
    expect(avg!.r).toBe(200);
    expect(avg!.g).toBe(200);
    expect(avg!.b).toBe(200);
  });

  it('밝은 픽셀이 10% 미만이면 null 반환', () => {
    // 모든 픽셀이 어두움
    const imageData = createTestRGBImageData(10, 10, { r: 20, g: 20, b: 20 });
    const avg = calculateBrightRegionAverageRGB(imageData, 100);

    expect(avg).toBeNull();
  });

  it('밝은 영역만 평균 계산', () => {
    // 50% 밝은 픽셀 (r=200), 50% 어두운 픽셀 (r=50)
    const imageData = createMixedBrightnessImage(
      10,
      10,
      { r: 200, g: 200, b: 200 },
      { r: 50, g: 50, b: 50 },
      0.5
    );
    const avg = calculateBrightRegionAverageRGB(imageData, 100);

    expect(avg).not.toBeNull();
    // 밝은 영역만 계산되어야 함
    expect(avg!.r).toBe(200);
    expect(avg!.g).toBe(200);
    expect(avg!.b).toBe(200);
  });

  it('기본 임계값은 100', () => {
    const imageData = createTestRGBImageData(10, 10, { r: 99, g: 99, b: 99 });
    const avg = calculateBrightRegionAverageRGB(imageData);

    // brightness = 99 < 100 이므로 null
    expect(avg).toBeNull();
  });
});

describe('analyzeColorTemperature', () => {
  it('중성 회색은 약 6500K (D65)', () => {
    const imageData = createTestRGBImageData(10, 10, { r: 128, g: 128, b: 128 });
    const result = analyzeColorTemperature(imageData);

    expect(result.kelvin).toBeCloseTo(6500, -2); // 100K 오차 허용
    // neutral(5500-6500) 또는 cool(6500-7500) 경계에 있을 수 있음
    expect(['neutral', 'cool']).toContain(result.verdict);
  });

  it('따뜻한 색상(노란빛)은 낮은 CCT', () => {
    const imageData = createTestRGBImageData(10, 10, { r: 255, g: 200, b: 100 });
    const result = analyzeColorTemperature(imageData);

    expect(result.kelvin).toBeLessThan(5500);
  });

  it('차가운 색상(파란빛)은 높은 CCT', () => {
    const imageData = createTestRGBImageData(10, 10, { r: 100, g: 150, b: 255 });
    const result = analyzeColorTemperature(imageData);

    expect(result.kelvin).toBeGreaterThan(7000);
  });

  it('결과 구조 검증', () => {
    const imageData = createTestRGBImageData(10, 10, { r: 128, g: 128, b: 128 });
    const result = analyzeColorTemperature(imageData);

    expect(result).toHaveProperty('kelvin');
    expect(result).toHaveProperty('verdict');
    expect(result).toHaveProperty('chromaticity');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('feedback');

    expect(typeof result.kelvin).toBe('number');
    expect(typeof result.verdict).toBe('string');
    expect(result.chromaticity).toHaveProperty('x');
    expect(result.chromaticity).toHaveProperty('y');
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.feedback).toBe('string');
  });

  it('verdict와 feedback은 일관성 유지', () => {
    const imageData = createTestRGBImageData(10, 10, { r: 255, g: 180, b: 50 });
    const result = analyzeColorTemperature(imageData);

    if (result.verdict === 'too_warm') {
      expect(result.feedback).toContain('따뜻');
    } else if (result.verdict === 'too_cool') {
      expect(result.feedback).toContain('차갑');
    }
  });

  it('신뢰도는 0-1 범위', () => {
    const imageData = createTestRGBImageData(10, 10, { r: 128, g: 128, b: 128 });
    const result = analyzeColorTemperature(imageData);

    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('색도 좌표는 유효한 범위', () => {
    const imageData = createTestRGBImageData(10, 10, { r: 128, g: 128, b: 128 });
    const result = analyzeColorTemperature(imageData);

    // xy 색도 좌표는 0-1 범위
    expect(result.chromaticity.x).toBeGreaterThanOrEqual(0);
    expect(result.chromaticity.x).toBeLessThanOrEqual(1);
    expect(result.chromaticity.y).toBeGreaterThanOrEqual(0);
    expect(result.chromaticity.y).toBeLessThanOrEqual(1);
  });
});

describe('analyzeColorTemperatureFromRGB', () => {
  it('RGB 값에서 직접 CCT 분석', () => {
    const result = analyzeColorTemperatureFromRGB({ r: 128, g: 128, b: 128 });

    expect(result.kelvin).toBeCloseTo(6500, -2);
    // neutral(5500-6500) 또는 cool(6500-7500) 경계에 있을 수 있음
    expect(['neutral', 'cool']).toContain(result.verdict);
  });

  it('이미지 분석과 RGB 분석 결과 일치', () => {
    const rgb = { r: 200, g: 180, b: 150 };
    const imageData = createTestRGBImageData(10, 10, rgb);

    const imageResult = analyzeColorTemperature(imageData);
    const rgbResult = analyzeColorTemperatureFromRGB(rgb);

    // 밝은 영역 필터링이 없으면 동일해야 함
    expect(rgbResult.kelvin).toBeCloseTo(imageResult.kelvin, -1);
    expect(rgbResult.verdict).toBe(imageResult.verdict);
  });

  it('결과 구조 검증', () => {
    const result = analyzeColorTemperatureFromRGB({ r: 128, g: 128, b: 128 });

    expect(result).toHaveProperty('kelvin');
    expect(result).toHaveProperty('verdict');
    expect(result).toHaveProperty('chromaticity');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('feedback');
  });
});

describe('CCT 경계 케이스', () => {
  it('순수 빨강은 매우 낮은 CCT', () => {
    const result = analyzeColorTemperatureFromRGB({ r: 255, g: 0, b: 0 });
    expect(result.kelvin).toBeLessThan(4000);
    expect(result.verdict).toBe('too_warm');
  });

  it('순수 파랑은 McCamy 공식의 한계로 예측 불가', () => {
    // McCamy 공식은 Planckian locus 근처에서만 정확함
    // 순수 파랑(0,0,255)은 Planckian locus에서 벗어나 예측 불가
    const result = analyzeColorTemperatureFromRGB({ r: 0, g: 0, b: 255 });
    // 결과는 반환되지만 물리적으로 의미 없는 값일 수 있음
    expect(typeof result.kelvin).toBe('number');
    expect(isFinite(result.kelvin)).toBe(true);
  });

  it('순수 녹색은 중간 CCT', () => {
    const result = analyzeColorTemperatureFromRGB({ r: 0, g: 255, b: 0 });
    // 순수 녹색의 CCT는 복잡하지만 극단적이지 않아야 함
    expect(result.kelvin).toBeGreaterThan(2000);
    expect(result.kelvin).toBeLessThan(15000);
  });

  it('흰색은 약 6500K', () => {
    const result = analyzeColorTemperatureFromRGB({ r: 255, g: 255, b: 255 });
    expect(result.kelvin).toBeCloseTo(6500, -2);
  });

  it('검은색 근처는 불안정할 수 있음', () => {
    const result = analyzeColorTemperatureFromRGB({ r: 10, g: 10, b: 10 });
    // 검은색은 색온도 측정이 불안정하지만 결과는 반환되어야 함
    expect(typeof result.kelvin).toBe('number');
    expect(isFinite(result.kelvin)).toBe(true);
  });
});
