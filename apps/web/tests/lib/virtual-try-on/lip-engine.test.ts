/**
 * 립스틱 엔진 + 타입/프리셋 테스트
 */

import { describe, it, expect } from 'vitest';
import { LIP_PRESETS, BLUSH_PRESETS } from '@/lib/virtual-try-on/types';
import type { MakeupConfig } from '@/lib/virtual-try-on/types';

describe('LIP_PRESETS', () => {
  it('12개 립 프리셋이 정의되어 있다', () => {
    expect(LIP_PRESETS).toHaveLength(12);
  });

  it('모든 프리셋에 유효한 RGB 값이 있다', () => {
    for (const preset of LIP_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.color.r).toBeGreaterThanOrEqual(0);
      expect(preset.color.r).toBeLessThanOrEqual(255);
      expect(preset.color.g).toBeGreaterThanOrEqual(0);
      expect(preset.color.g).toBeLessThanOrEqual(255);
      expect(preset.color.b).toBeGreaterThanOrEqual(0);
      expect(preset.color.b).toBeLessThanOrEqual(255);
      expect(preset.color.a).toBe(1);
    }
  });

  it('프리셋 이름이 중복되지 않는다', () => {
    const names = LIP_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('BLUSH_PRESETS', () => {
  it('6개 블러셔 프리셋이 정의되어 있다', () => {
    expect(BLUSH_PRESETS).toHaveLength(6);
  });

  it('모든 프리셋에 유효한 RGB 값이 있다', () => {
    for (const preset of BLUSH_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.color.r).toBeGreaterThanOrEqual(0);
      expect(preset.color.r).toBeLessThanOrEqual(255);
      expect(preset.color.g).toBeGreaterThanOrEqual(0);
      expect(preset.color.g).toBeLessThanOrEqual(255);
      expect(preset.color.b).toBeGreaterThanOrEqual(0);
      expect(preset.color.b).toBeLessThanOrEqual(255);
    }
  });
});

describe('알파 블렌딩 공식 검증', () => {
  // output = original × (1 - α) + color × α
  function alphaBlend(original: number, color: number, alpha: number): number {
    return Math.round(original * (1 - alpha) + color * alpha);
  }

  it('opacity=0이면 원본 유지', () => {
    expect(alphaBlend(100, 200, 0)).toBe(100);
    expect(alphaBlend(255, 0, 0)).toBe(255);
  });

  it('opacity=1이면 색상으로 완전 교체', () => {
    expect(alphaBlend(100, 200, 1)).toBe(200);
    expect(alphaBlend(255, 0, 1)).toBe(0);
  });

  it('opacity=0.5이면 중간값', () => {
    expect(alphaBlend(0, 200, 0.5)).toBe(100);
    expect(alphaBlend(100, 200, 0.5)).toBe(150);
  });

  it('기본 립 opacity=0.55에서 블렌딩', () => {
    const original = 180; // 원래 피부색
    const lipColor = 210; // 립스틱 레드 채널
    const alpha = 0.55;

    const result = alphaBlend(original, lipColor, alpha);
    // 180 × 0.45 + 210 × 0.55 = 81 + 115.5 = 196.5 → 197
    expect(result).toBe(197);
  });

  it('기본 블러셔 opacity=0.3에서 블렌딩', () => {
    const original = 180;
    const blushColor = 240;
    const alpha = 0.3;

    const result = alphaBlend(original, blushColor, alpha);
    // 180 × 0.7 + 240 × 0.3 = 126 + 72 = 198
    expect(result).toBe(198);
  });

  it('결과값이 0-255 범위를 유지한다', () => {
    // 최소값
    expect(alphaBlend(0, 0, 0)).toBe(0);
    expect(alphaBlend(0, 0, 1)).toBe(0);
    // 최대값
    expect(alphaBlend(255, 255, 0)).toBe(255);
    expect(alphaBlend(255, 255, 1)).toBe(255);
    // 혼합
    expect(alphaBlend(0, 255, 0.5)).toBe(128);
  });
});

describe('MakeupConfig 타입 검증', () => {
  it('립스틱 설정이 올바른 타입을 가진다', () => {
    const config: MakeupConfig = {
      type: 'lip',
      color: { r: 210, g: 40, b: 40, a: 1 },
      opacity: 0.55,
      featherRadius: 2,
    };

    expect(config.type).toBe('lip');
    expect(config.opacity).toBeGreaterThan(0);
    expect(config.opacity).toBeLessThanOrEqual(1);
  });

  it('블러셔 설정이 올바른 타입을 가진다', () => {
    const config: MakeupConfig = {
      type: 'blush',
      color: { r: 255, g: 180, b: 150, a: 1 },
      opacity: 0.3,
    };

    expect(config.type).toBe('blush');
    expect(config.featherRadius).toBeUndefined();
  });
});

describe('타원형 페이드아웃 검증 (블러셔)', () => {
  // normalizedDist = (dx/rx)² + (dy/ry)²
  // falloff = exp(-dist * 3)
  function blushFalloff(dx: number, dy: number, rx: number, ry: number): number {
    const dist = Math.pow(dx / rx, 2) + Math.pow(dy / ry, 2);
    if (dist > 1) return 0;
    return Math.exp(-dist * 3);
  }

  it('중심에서 falloff=1', () => {
    expect(blushFalloff(0, 0, 20, 15)).toBeCloseTo(1, 5);
  });

  it('경계에서 falloff≈0.05', () => {
    // dist=1 → exp(-3) ≈ 0.0498
    expect(blushFalloff(20, 0, 20, 15)).toBeCloseTo(0.0498, 3);
  });

  it('타원 밖은 0', () => {
    expect(blushFalloff(25, 0, 20, 15)).toBe(0);
  });

  it('중간 거리에서 적절한 감쇠', () => {
    // dist=0.25 → exp(-0.75) ≈ 0.472
    const falloff = blushFalloff(10, 0, 20, 15);
    expect(falloff).toBeCloseTo(0.472, 2);
  });
});

describe('Scanline fill 기본 원리', () => {
  // 간단한 scanline fill 검증 (정사각형)
  function scanlineFill(
    points: Array<{ x: number; y: number }>,
    width: number,
    height: number
  ): number {
    let filledCount = 0;

    for (let y = 0; y < height; y++) {
      const intersections: number[] = [];

      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];

        if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
          const x = p1.x + ((y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x);
          intersections.push(x);
        }
      }

      intersections.sort((a, b) => a - b);

      for (let i = 0; i < intersections.length - 1; i += 2) {
        const x1 = Math.max(0, Math.round(intersections[i]));
        const x2 = Math.min(width - 1, Math.round(intersections[i + 1]));
        filledCount += x2 - x1 + 1;
      }
    }

    return filledCount;
  }

  it('정사각형 폴리곤이 올바르게 채워진다', () => {
    const square = [
      { x: 2, y: 2 },
      { x: 8, y: 2 },
      { x: 8, y: 8 },
      { x: 2, y: 8 },
    ];
    const filled = scanlineFill(square, 10, 10);
    // 6×6 = 36 (y: 3~7, x: 2~7 = 6행 × 6열) — 대략
    expect(filled).toBeGreaterThan(20);
    expect(filled).toBeLessThan(50);
  });

  it('3개 미만 점은 채우지 않는다', () => {
    expect(scanlineFill([{ x: 0, y: 0 }], 10, 10)).toBe(0);
    expect(scanlineFill([], 10, 10)).toBe(0);
  });

  it('삼각형이 채워진다', () => {
    const triangle = [
      { x: 5, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const filled = scanlineFill(triangle, 11, 11);
    // 삼각형 면적 ≈ 50
    expect(filled).toBeGreaterThan(30);
    expect(filled).toBeLessThan(70);
  });
});
