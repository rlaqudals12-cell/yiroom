import { describe, it, expect } from 'vitest';
import { rgbDistance } from '@/lib/color-classification/color-utils';

describe('rgbDistance', () => {
  it('같은 색상이면 거리가 0이다', () => {
    const color = { r: 128, g: 64, b: 200 };
    expect(rgbDistance(color, color)).toBe(0);
  });

  it('흑백 거리를 정확히 계산한다', () => {
    const black = { r: 0, g: 0, b: 0 };
    const white = { r: 255, g: 255, b: 255 };
    const expected = Math.sqrt(255 * 255 * 3);
    expect(rgbDistance(black, white)).toBeCloseTo(expected, 5);
  });

  it('단일 채널 차이를 계산한다', () => {
    const a = { r: 100, g: 0, b: 0 };
    const b = { r: 200, g: 0, b: 0 };
    expect(rgbDistance(a, b)).toBe(100);
  });

  it('거리는 항상 양수이다', () => {
    const a = { r: 50, g: 100, b: 150 };
    const b = { r: 200, g: 50, b: 80 };
    expect(rgbDistance(a, b)).toBeGreaterThan(0);
  });

  it('교환 법칙이 성립한다', () => {
    const a = { r: 30, g: 60, b: 90 };
    const b = { r: 120, g: 180, b: 240 };
    expect(rgbDistance(a, b)).toBe(rgbDistance(b, a));
  });
});
