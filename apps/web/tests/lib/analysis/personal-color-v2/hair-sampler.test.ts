/**
 * 퍼스널 대비 측정 엔진 테스트 (ADR-116)
 * - computePersonalContrast: 결정론적 임계 판정 + 미측정 시 null
 * - sampleHairLab: 합성 픽셀 샘플링 + 신뢰도 미달 시 null
 * - 프롬프트에서 contrastLevel 필드 제거 확인
 */

import { describe, it, expect } from 'vitest';
import type { Point3D } from '@/lib/image-engine/types';
import {
  sampleHairLab,
  computePersonalContrast,
  CONTRAST_THRESHOLDS,
  HAIR_SAMPLER_CONFIG,
  generateAnalysisPrompt,
  PERSONAL_COLOR_SYSTEM_PROMPT,
} from '@/lib/analysis/personal-color-v2';

// ============================================
// 합성 이미지 헬퍼
// ============================================

const W = 200;
const H = 200;

/** 468 랜드마크 (px) — 헤어 존은 10(상단)·127/356(관자놀이)만 사용 */
function makeLandmarks(): Point3D[] {
  const lm: Point3D[] = Array.from({ length: 468 }, () => ({ x: 0, y: 0, z: 0 }));
  lm[10] = { x: 100, y: 60, z: 0 }; // 이마 최상단
  lm[127] = { x: 60, y: 100, z: 0 }; // 좌 관자놀이
  lm[356] = { x: 140, y: 100, z: 0 }; // 우 관자놀이
  return lm;
}

/** 전체를 단색으로 채운 RGBA 버퍼 */
function solidImage(r: number, g: number, b: number): Uint8ClampedArray {
  const px = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    px[i * 4] = r;
    px[i * 4 + 1] = g;
    px[i * 4 + 2] = b;
    px[i * 4 + 3] = 255;
  }
  return px;
}

/** 흑/백 체커보드 — 명도 분산 극대화(신뢰도 미달 유도) */
function checkerImage(): Uint8ClampedArray {
  const px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = (x + y) % 2 === 0 ? 15 : 245;
      const idx = (y * W + x) * 4;
      px[idx] = v;
      px[idx + 1] = v;
      px[idx + 2] = v;
      px[idx + 3] = 255;
    }
  }
  return px;
}

// ============================================
// computePersonalContrast
// ============================================

describe('computePersonalContrast', () => {
  it('흑발 + 밝은 피부 → high (격차 ≥ 45)', () => {
    expect(computePersonalContrast(72, 12)).toBe('high');
  });

  it('갈발 + 중간 피부 → medium (25 ≤ 격차 < 45)', () => {
    expect(computePersonalContrast(60, 30)).toBe('medium');
  });

  it('밝은 갈발 + 밝은 피부 → low (격차 < 25)', () => {
    expect(computePersonalContrast(58, 45)).toBe('low');
  });

  it('임계 경계값은 상한 등급으로 귀속 (25→medium, 45→high)', () => {
    expect(computePersonalContrast(50, 50 - CONTRAST_THRESHOLDS.medium)).toBe('medium');
    expect(computePersonalContrast(50, 50 - CONTRAST_THRESHOLDS.high)).toBe('high');
  });

  it('어느 한 입력이라도 없으면 null (추측 금지)', () => {
    expect(computePersonalContrast(null, 20)).toBeNull();
    expect(computePersonalContrast(70, null)).toBeNull();
    expect(computePersonalContrast(undefined, undefined)).toBeNull();
    expect(computePersonalContrast(NaN, 20)).toBeNull();
  });

  it('결정론 — 동일 입력은 항상 동일 판정', () => {
    for (let i = 0; i < 5; i++) {
      expect(computePersonalContrast(70, 20)).toBe('high');
    }
  });
});

// ============================================
// sampleHairLab
// ============================================

describe('sampleHairLab', () => {
  const landmarks = makeLandmarks();

  it('흑발(어두운 픽셀) → 낮은 L* 실측 + 밝은 피부와 high 대비', () => {
    const black = sampleHairLab(solidImage(15, 15, 15), W, H, landmarks);
    expect(black).not.toBeNull();
    expect(black!.sampleCount).toBeGreaterThanOrEqual(HAIR_SAMPLER_CONFIG.minSampleCount);
    expect(black!.avgLab.L).toBeLessThan(25);
    expect(computePersonalContrast(72, black!.avgLab.L)).toBe('high');
  });

  it('갈발(중간 명도) → 흑발보다 높은 L*, 30 밝은 피부와 medium 대비', () => {
    const black = sampleHairLab(solidImage(15, 15, 15), W, H, landmarks);
    const brown = sampleHairLab(solidImage(75, 68, 60), W, H, landmarks);
    expect(brown).not.toBeNull();
    // 흑발보다 확연히 밝게 실측되어야 명도 판별력이 있음
    expect(brown!.avgLab.L).toBeGreaterThan(black!.avgLab.L + 10);
    // 모발보다 30 밝은 피부 → 격차 30 → medium (통합 경로 검증)
    expect(computePersonalContrast(brown!.avgLab.L + 30, brown!.avgLab.L)).toBe('medium');
  });

  it('피부색만 있는 영역 → 유효 모발 픽셀 없음 → null (미판정)', () => {
    const skinOnly = sampleHairLab(solidImage(215, 170, 145), W, H, landmarks);
    expect(skinOnly).toBeNull();
  });

  it('명도 분산이 큰 영역(체커보드) → 신뢰도 미달 → null', () => {
    const noisy = sampleHairLab(checkerImage(), W, H, landmarks);
    expect(noisy).toBeNull();
  });

  it('랜드마크가 468 미만이면 null', () => {
    expect(sampleHairLab(solidImage(15, 15, 15), W, H, landmarks.slice(0, 100))).toBeNull();
  });

  it('결정론 — 동일 입력은 항상 동일 L*', () => {
    const a = sampleHairLab(solidImage(15, 15, 15), W, H, landmarks);
    const b = sampleHairLab(solidImage(15, 15, 15), W, H, landmarks);
    expect(a!.avgLab.L).toBe(b!.avgLab.L);
  });
});

// ============================================
// 프롬프트에서 contrastLevel 제거 (ADR-116 결정 2)
// ============================================

describe('PC-2 프롬프트 — 대비 필드 제거', () => {
  it('분석 프롬프트가 contrastLevel 출력을 요청하지 않는다', () => {
    const prompt = generateAnalysisPrompt({ includeDetailedAnalysis: true });
    expect(prompt).not.toContain('contrastLevel');
    expect(prompt).not.toContain('대비 레벨');
  });

  it('시스템 프롬프트에도 contrastLevel 필드가 없다', () => {
    expect(PERSONAL_COLOR_SYSTEM_PROMPT).not.toContain('contrastLevel');
  });
});
