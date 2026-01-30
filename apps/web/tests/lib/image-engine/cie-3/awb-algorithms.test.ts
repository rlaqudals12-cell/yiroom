/**
 * CIE-3 AWB 알고리즘 테스트
 *
 * @module tests/lib/image-engine/cie-3/awb-algorithms
 * @see lib/image-engine/cie-3/awb-algorithms.ts
 */
import { describe, it, expect } from 'vitest';
import {
  calculateGrayWorldGains,
  applyGains,
  isValidGains,
} from '@/lib/image-engine/cie-3/awb-algorithms';
import type { RGBImageData, AWBGains } from '@/lib/image-engine/types';

// 테스트용 이미지 데이터 생성 헬퍼
function createTestImageData(
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

describe('calculateGrayWorldGains', () => {
  it('그레이(회색) 평균 RGB는 게인 1.0', () => {
    // calculateGrayWorldGains는 평균 RGB 값을 입력으로 받음
    const avgRGB = { r: 128, g: 128, b: 128 };
    const gains = calculateGrayWorldGains(avgRGB);

    expect(gains.r).toBeCloseTo(1.0, 2);
    expect(gains.g).toBeCloseTo(1.0, 2);
    expect(gains.b).toBeCloseTo(1.0, 2);
  });

  it('노란색 편향 평균은 B 게인 증가', () => {
    // 노란색 = R높음, G높음, B낮음
    const avgRGB = { r: 200, g: 200, b: 100 };
    const gains = calculateGrayWorldGains(avgRGB);

    // B 채널이 낮으므로 B 게인이 높아야 함
    expect(gains.b).toBeGreaterThan(gains.r);
    expect(gains.b).toBeGreaterThan(gains.g);
  });

  it('파란색 편향 평균은 R, G 게인 증가', () => {
    const avgRGB = { r: 100, g: 100, b: 200 };
    const gains = calculateGrayWorldGains(avgRGB);

    // R, G 채널이 낮으므로 R, G 게인이 높아야 함
    expect(gains.r).toBeGreaterThan(gains.b);
    expect(gains.g).toBeGreaterThan(gains.b);
  });

  it('게인은 양수', () => {
    const avgRGB = { r: 10, g: 50, b: 200 };
    const gains = calculateGrayWorldGains(avgRGB);

    expect(gains.r).toBeGreaterThan(0);
    expect(gains.g).toBeGreaterThan(0);
    expect(gains.b).toBeGreaterThan(0);
  });
});

describe('applyGains', () => {
  it('게인 1.0은 이미지 변경 없음', () => {
    const imageData = createTestImageData(2, 2, { r: 128, g: 128, b: 128 });
    const gains: AWBGains = { r: 1.0, g: 1.0, b: 1.0 };

    const result = applyGains(imageData, gains);

    expect(result.data[0]).toBe(128);
    expect(result.data[1]).toBe(128);
    expect(result.data[2]).toBe(128);
  });

  it('게인 적용 후 값 증가', () => {
    const imageData = createTestImageData(1, 1, { r: 100, g: 100, b: 100 });
    const gains: AWBGains = { r: 1.2, g: 1.0, b: 1.5 };

    const result = applyGains(imageData, gains);

    expect(result.data[0]).toBe(120); // 100 * 1.2
    expect(result.data[1]).toBe(100); // 100 * 1.0
    expect(result.data[2]).toBe(150); // 100 * 1.5
  });

  it('255 초과 시 클리핑', () => {
    const imageData = createTestImageData(1, 1, { r: 200, g: 200, b: 200 });
    const gains: AWBGains = { r: 2.0, g: 2.0, b: 2.0 };

    const result = applyGains(imageData, gains);

    expect(result.data[0]).toBe(255);
    expect(result.data[1]).toBe(255);
    expect(result.data[2]).toBe(255);
  });

  it('0 미만 시 클리핑', () => {
    const imageData = createTestImageData(1, 1, { r: 100, g: 100, b: 100 });
    const gains: AWBGains = { r: 0.0, g: 0.0, b: 0.0 };

    const result = applyGains(imageData, gains);

    expect(result.data[0]).toBe(0);
    expect(result.data[1]).toBe(0);
    expect(result.data[2]).toBe(0);
  });

  it('원본 이미지 데이터 변경 없음 (불변성)', () => {
    const imageData = createTestImageData(1, 1, { r: 100, g: 100, b: 100 });
    const originalR = imageData.data[0];
    const gains: AWBGains = { r: 2.0, g: 2.0, b: 2.0 };

    applyGains(imageData, gains);

    expect(imageData.data[0]).toBe(originalR); // 원본 유지
  });
});

describe('isValidGains', () => {
  it('0.7-1.5 범위 내 게인은 유효', () => {
    expect(isValidGains({ r: 1.0, g: 1.0, b: 1.0 })).toBe(true);
    expect(isValidGains({ r: 0.7, g: 0.7, b: 0.7 })).toBe(true);
    expect(isValidGains({ r: 1.5, g: 1.5, b: 1.5 })).toBe(true);
    expect(isValidGains({ r: 1.2, g: 0.8, b: 1.1 })).toBe(true);
  });

  it('0.7 미만 게인은 무효', () => {
    expect(isValidGains({ r: 0.6, g: 1.0, b: 1.0 })).toBe(false);
    expect(isValidGains({ r: 1.0, g: 0.5, b: 1.0 })).toBe(false);
    expect(isValidGains({ r: 1.0, g: 1.0, b: 0.0 })).toBe(false);
  });

  it('1.5 초과 게인은 무효', () => {
    expect(isValidGains({ r: 1.6, g: 1.0, b: 1.0 })).toBe(false);
    expect(isValidGains({ r: 1.0, g: 2.0, b: 1.0 })).toBe(false);
    expect(isValidGains({ r: 1.0, g: 1.0, b: 3.0 })).toBe(false);
  });

  it('커스텀 범위로 검증', () => {
    // minGain=0.5, maxGain=2.0
    expect(isValidGains({ r: 0.5, g: 0.5, b: 0.5 }, 0.5, 2.0)).toBe(true);
    expect(isValidGains({ r: 2.0, g: 2.0, b: 2.0 }, 0.5, 2.0)).toBe(true);
    expect(isValidGains({ r: 0.4, g: 1.0, b: 1.0 }, 0.5, 2.0)).toBe(false);
    expect(isValidGains({ r: 1.0, g: 1.0, b: 2.1 }, 0.5, 2.0)).toBe(false);
  });

  it('모든 채널이 유효해야 true', () => {
    // 하나라도 무효면 false
    expect(isValidGains({ r: 0.6, g: 1.0, b: 1.0 })).toBe(false);
    expect(isValidGains({ r: 1.0, g: 0.6, b: 1.0 })).toBe(false);
    expect(isValidGains({ r: 1.0, g: 1.0, b: 0.6 })).toBe(false);
  });
});
