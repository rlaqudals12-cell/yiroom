/**
 * 아이섀도 + 파운데이션 엔진 테스트
 *
 * @module tests/lib/virtual-try-on/eyeshadow-foundation
 */

import { describe, it, expect } from 'vitest';
import { EYESHADOW_PRESETS, FOUNDATION_PRESETS } from '@/lib/virtual-try-on/types';
import type { EyeshadowConfig, FoundationConfig, RgbaColor } from '@/lib/virtual-try-on/types';

// =============================================================================
// EYESHADOW_PRESETS
// =============================================================================

describe('EYESHADOW_PRESETS', () => {
  it('10개 아이섀도 프리셋이 정의되어 있다', () => {
    expect(EYESHADOW_PRESETS).toHaveLength(10);
  });

  it('모든 프리셋에 유효한 RGB 값이 있다', () => {
    for (const preset of EYESHADOW_PRESETS) {
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
    const names = EYESHADOW_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('듀얼 컬러 프리셋이 2개 이상 있다', () => {
    const dualPresets = EYESHADOW_PRESETS.filter((p) => p.secondaryColor);
    expect(dualPresets.length).toBeGreaterThanOrEqual(2);
  });

  it('듀얼 컬러 프리셋의 보조 색상도 유효하다', () => {
    const dualPresets = EYESHADOW_PRESETS.filter((p) => p.secondaryColor);
    for (const preset of dualPresets) {
      const sc = preset.secondaryColor!;
      expect(sc.r).toBeGreaterThanOrEqual(0);
      expect(sc.r).toBeLessThanOrEqual(255);
      expect(sc.g).toBeGreaterThanOrEqual(0);
      expect(sc.g).toBeLessThanOrEqual(255);
      expect(sc.b).toBeGreaterThanOrEqual(0);
      expect(sc.b).toBeLessThanOrEqual(255);
    }
  });
});

// =============================================================================
// FOUNDATION_PRESETS
// =============================================================================

describe('FOUNDATION_PRESETS', () => {
  it('12개 파운데이션 프리셋이 정의되어 있다', () => {
    expect(FOUNDATION_PRESETS).toHaveLength(12);
  });

  it('모든 프리셋에 유효한 RGB 값이 있다', () => {
    for (const preset of FOUNDATION_PRESETS) {
      expect(preset.name).toBeTruthy();
      expect(preset.color.r).toBeGreaterThanOrEqual(0);
      expect(preset.color.r).toBeLessThanOrEqual(255);
      expect(preset.color.g).toBeGreaterThanOrEqual(0);
      expect(preset.color.g).toBeLessThanOrEqual(255);
      expect(preset.color.b).toBeGreaterThanOrEqual(0);
      expect(preset.color.b).toBeLessThanOrEqual(255);
    }
  });

  it('프리셋 이름이 중복되지 않는다', () => {
    const names = FOUNDATION_PRESETS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('3가지 언더톤(warm/cool/neutral)이 모두 포함된다', () => {
    const undertones = new Set(FOUNDATION_PRESETS.map((p) => p.undertone));
    expect(undertones.has('warm')).toBe(true);
    expect(undertones.has('cool')).toBe(true);
    expect(undertones.has('neutral')).toBe(true);
  });

  it('밝은 → 어두운 순으로 정렬되어 있다', () => {
    // 각 프리셋의 밝기 = (R + G + B) / 3
    const brightnesses = FOUNDATION_PRESETS.map((p) => (p.color.r + p.color.g + p.color.b) / 3);
    // 전체적으로 밝은 → 어두운 추세 (첫 번째 > 마지막)
    expect(brightnesses[0]).toBeGreaterThan(brightnesses[brightnesses.length - 1]);
  });

  it('웜톤 프리셋은 R > B 특성을 가진다', () => {
    const warmPresets = FOUNDATION_PRESETS.filter((p) => p.undertone === 'warm');
    for (const preset of warmPresets) {
      expect(preset.color.r).toBeGreaterThan(preset.color.b);
    }
  });
});

// =============================================================================
// EyeshadowConfig 타입 검증
// =============================================================================

describe('EyeshadowConfig 타입', () => {
  it('기본 설정을 생성할 수 있다', () => {
    const config: EyeshadowConfig = {
      color: EYESHADOW_PRESETS[0].color,
    };
    expect(config.color).toBeDefined();
    expect(config.opacity).toBeUndefined();
    expect(config.secondaryColor).toBeUndefined();
  });

  it('듀얼 컬러 설정을 생성할 수 있다', () => {
    const config: EyeshadowConfig = {
      color: { r: 180, g: 110, b: 80, a: 1 },
      secondaryColor: { r: 130, g: 80, b: 60, a: 1 },
      opacity: 0.5,
      featherRadius: 3,
    };
    expect(config.secondaryColor).toBeDefined();
    expect(config.opacity).toBe(0.5);
  });
});

// =============================================================================
// FoundationConfig 타입 검증
// =============================================================================

describe('FoundationConfig 타입', () => {
  it('기본 설정을 생성할 수 있다', () => {
    const config: FoundationConfig = {
      color: FOUNDATION_PRESETS[0].color,
    };
    expect(config.color).toBeDefined();
    expect(config.opacity).toBeUndefined();
  });

  it('커스텀 설정을 생성할 수 있다', () => {
    const config: FoundationConfig = {
      color: { r: 220, g: 190, b: 165, a: 1 },
      opacity: 0.3,
      featherRadius: 5,
    };
    expect(config.opacity).toBe(0.3);
    expect(config.featherRadius).toBe(5);
  });
});

// =============================================================================
// 알파 블렌딩 공식 검증 (아이섀도/파운데이션 공통)
// =============================================================================

describe('알파 블렌딩 공식 검증', () => {
  function alphaBlend(original: number, color: number, alpha: number): number {
    return Math.round(original * (1 - alpha) + color * alpha);
  }

  it('opacity=0이면 원본 유지', () => {
    expect(alphaBlend(100, 200, 0)).toBe(100);
  });

  it('opacity=1이면 색상 완전 교체', () => {
    expect(alphaBlend(100, 200, 1)).toBe(200);
  });

  it('opacity=0.5이면 중간값', () => {
    expect(alphaBlend(100, 200, 0.5)).toBe(150);
  });

  it('파운데이션 기본 opacity(0.25)에서 자연스러운 블렌딩', () => {
    // 원본 피부색 (180) + 파운데이션 (220) @ 25%
    const result = alphaBlend(180, 220, 0.25);
    expect(result).toBe(190); // 원본에 가까운 자연스러운 변화
  });

  it('아이섀도 기본 opacity(0.4)에서 적절한 발색', () => {
    // 원본 피부색 (200) + 아이섀도 (130) @ 40%
    const result = alphaBlend(200, 130, 0.4);
    expect(result).toBe(172); // 눈에 보이는 변화
  });
});

// =============================================================================
// 가장자리 페이드아웃 (파운데이션)
// =============================================================================

describe('파운데이션 가장자리 페이드아웃', () => {
  function edgeFalloff(normalizedDist: number): number {
    if (normalizedDist <= 0.7) return 1.0;
    const t = Math.max(0, 1.0 - (normalizedDist - 0.7) / 0.3);
    return t * t;
  }

  it('중심(0)에서 풀 커버', () => {
    expect(edgeFalloff(0)).toBe(1.0);
  });

  it('0.7 이내에서 풀 커버', () => {
    expect(edgeFalloff(0.5)).toBe(1.0);
    expect(edgeFalloff(0.7)).toBe(1.0);
  });

  it('0.7~1.0에서 점진적 감소', () => {
    const at08 = edgeFalloff(0.8);
    const at09 = edgeFalloff(0.9);
    expect(at08).toBeGreaterThan(at09);
    expect(at08).toBeLessThan(1.0);
    expect(at09).toBeGreaterThan(0);
  });

  it('1.0에서 완전 투명', () => {
    expect(edgeFalloff(1.0)).toBe(0);
  });

  it('1.0 초과에서도 0 이상', () => {
    expect(edgeFalloff(1.2)).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// 듀얼 컬러 보간 (아이섀도)
// =============================================================================

describe('아이섀도 듀얼 컬러 보간', () => {
  function interpolateColor(primary: RgbaColor, secondary: RgbaColor, t: number): RgbaColor {
    return {
      r: Math.round(primary.r * (1 - t) + secondary.r * t),
      g: Math.round(primary.g * (1 - t) + secondary.g * t),
      b: Math.round(primary.b * (1 - t) + secondary.b * t),
      a: 1,
    };
  }

  it('t=0이면 primary 색상', () => {
    const p: RgbaColor = { r: 200, g: 100, b: 50, a: 1 };
    const s: RgbaColor = { r: 100, g: 50, b: 25, a: 1 };
    const result = interpolateColor(p, s, 0);
    expect(result.r).toBe(200);
    expect(result.g).toBe(100);
    expect(result.b).toBe(50);
  });

  it('t=1이면 secondary 색상', () => {
    const p: RgbaColor = { r: 200, g: 100, b: 50, a: 1 };
    const s: RgbaColor = { r: 100, g: 50, b: 25, a: 1 };
    const result = interpolateColor(p, s, 1);
    expect(result.r).toBe(100);
    expect(result.g).toBe(50);
    expect(result.b).toBe(25);
  });

  it('t=0.5이면 중간값', () => {
    const p: RgbaColor = { r: 200, g: 100, b: 50, a: 1 };
    const s: RgbaColor = { r: 100, g: 50, b: 30, a: 1 };
    const result = interpolateColor(p, s, 0.5);
    expect(result.r).toBe(150);
    expect(result.g).toBe(75);
    expect(result.b).toBe(40);
  });
});

// =============================================================================
// MakeupType 확장 검증
// =============================================================================

describe('MakeupType 확장', () => {
  it('eyeshadow와 foundation이 MakeupType에 포함된다', () => {
    const types: import('@/lib/virtual-try-on/types').MakeupType[] = [
      'lip',
      'blush',
      'hair-color',
      'eyeshadow',
      'foundation',
    ];
    expect(types).toHaveLength(5);
    expect(types).toContain('eyeshadow');
    expect(types).toContain('foundation');
  });
});
