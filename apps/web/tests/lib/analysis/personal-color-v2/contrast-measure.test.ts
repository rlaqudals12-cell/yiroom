/**
 * 퍼스널 대비 오케스트레이터 테스트 (ADR-116)
 * - deriveContrastFromPixels: 피부(zone-sampler) + 모발(hair-sampler) 실측 결합
 * - 실측 성공 → 대비 판정 / 랜드마크·모발 실측 미달 → null (추측 금지)
 */

import { describe, it, expect } from 'vitest';
import type { Point3D } from '@/lib/image-engine/types';
import { deriveContrastFromPixels } from '@/lib/analysis/personal-color-v2';

const W = 300;
const H = 300;

const SKIN = { r: 215, g: 170, b: 145 }; // isSkinPixel 통과 (밝은 피부, L*≈74)
const HAIR = { r: 20, g: 20, b: 20 }; // 비피부·저채도 어두운 모발 (L*≈8)

/**
 * 상단(y<50) = 어두운 모발 밴드, 그 아래 = 피부색.
 * 헤어 샘플 존(상단중앙 = lm[10] 위 35px)은 어두운 밴드에 놓이고,
 * 6개 피부 존은 피부 영역에 놓이도록 랜드마크를 배치한다.
 */
function makeLayeredImage(): Uint8ClampedArray {
  const px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    const c = y < 50 ? HAIR : SKIN;
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      px[idx] = c.r;
      px[idx + 1] = c.g;
      px[idx + 2] = c.b;
      px[idx + 3] = 255;
    }
  }
  return px;
}

/** 전체 피부색 (모발 픽셀 없음 → 대비 미판정 유도) */
function skinOnlyImage(): Uint8ClampedArray {
  const px = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    px[i * 4] = SKIN.r;
    px[i * 4 + 1] = SKIN.g;
    px[i * 4 + 2] = SKIN.b;
    px[i * 4 + 3] = 255;
  }
  return px;
}

/** 468 랜드마크 (px). 모발 존(10/127/356) + 피부 존(151/234/454/6/152/172) 배치 */
function makeLandmarks(): Point3D[] {
  const lm: Point3D[] = Array.from({ length: 468 }, () => ({ x: 0, y: 0, z: 0 }));
  // faceWidth = |356 - 127| = 100 → up=35(top), radius=16
  lm[127] = { x: 100, y: 150, z: 0 };
  lm[356] = { x: 200, y: 150, z: 0 };
  lm[10] = { x: 150, y: 60, z: 0 }; // 상단중앙 헤어 존 → (150, 25) 어두운 밴드
  // 피부 6존 (모두 y>50 피부 영역)
  lm[151] = { x: 150, y: 85, z: 0 }; // forehead
  lm[234] = { x: 110, y: 180, z: 0 }; // leftCheek
  lm[454] = { x: 190, y: 180, z: 0 }; // rightCheek
  lm[6] = { x: 150, y: 170, z: 0 }; // nose
  lm[152] = { x: 150, y: 220, z: 0 }; // chin
  lm[172] = { x: 120, y: 210, z: 0 }; // jawline
  return lm;
}

describe('deriveContrastFromPixels', () => {
  it('밝은 피부 + 어두운 모발 실측 → high (격차 ≥ 45)', () => {
    const level = deriveContrastFromPixels(makeLayeredImage(), W, H, makeLandmarks());
    expect(level).toBe('high');
  });

  it('결정론 — 동일 입력은 항상 동일 판정', () => {
    const img = makeLayeredImage();
    const lm = makeLandmarks();
    expect(deriveContrastFromPixels(img, W, H, lm)).toBe(deriveContrastFromPixels(img, W, H, lm));
  });

  it('모발 픽셀이 없으면(전체 피부) null — 지어내지 않음', () => {
    expect(deriveContrastFromPixels(skinOnlyImage(), W, H, makeLandmarks())).toBeNull();
  });

  it('랜드마크가 468 미만이면 null (예외 대신 미판정)', () => {
    const lm = makeLandmarks().slice(0, 200);
    expect(deriveContrastFromPixels(makeLayeredImage(), W, H, lm)).toBeNull();
  });

  it('빈 입력·비정상 크기는 null', () => {
    expect(deriveContrastFromPixels(makeLayeredImage(), 0, H, makeLandmarks())).toBeNull();
    expect(deriveContrastFromPixels(new Uint8ClampedArray(0), W, H, makeLandmarks())).toBeNull();
  });
});
