/**
 * AV-2: 절차적 지오메트리 테스트 — 결정론·유효성·모프 반영
 * @see docs/specs/SDD-BODY-AVATAR-3D.md §4
 */

import { describe, it, expect } from 'vitest';
import { buildAvatarGeometry, deriveAvatarParams } from '@/lib/avatar';
import type { AvatarParams } from '@/lib/avatar';

const PRESET_S = deriveAvatarParams({
  body_type: 'S',
  ratio: null,
  shoulder: null,
  waist: null,
  hip: null,
});

function paramsWith(morphs: Partial<AvatarParams['morphs']>): AvatarParams {
  return { ...PRESET_S, morphs: { ...PRESET_S.morphs, ...morphs } };
}

/** y 구간 내 최대 |x| — 해당 부위 실루엣 폭 (팔 포함) */
function maxWidthInBand(positions: Float32Array, yMin: number, yMax: number): number {
  let max = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    if (y >= yMin && y <= yMax) {
      max = Math.max(max, Math.abs(positions[i]));
    }
  }
  return max;
}

/**
 * y 구간 내 최대 |z| — 몸통 단면 깊이.
 * 힙 밴드(y≈0.9-0.98)에는 팔 하단 정점도 들어오지만 팔은 단면이 작아
 * 깊이(z)는 몸통이 지배적 → 힙 모프 검증은 z로 측정한다.
 */
function maxDepthInBand(positions: Float32Array, yMin: number, yMax: number): number {
  let max = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    if (y >= yMin && y <= yMax) {
      max = Math.max(max, Math.abs(positions[i + 2]));
    }
  }
  return max;
}

describe('buildAvatarGeometry', () => {
  it('결정론 — 동일 params → 동일 정점 배열 (원리 §4)', () => {
    const a = buildAvatarGeometry(PRESET_S);
    const b = buildAvatarGeometry(PRESET_S);
    expect(a.positions).toEqual(b.positions);
    expect(a.indices).toEqual(b.indices);
  });

  it('유효한 메시 — 정점 수 범위·인덱스 경계·삼각형 단위', () => {
    const { positions, indices } = buildAvatarGeometry(PRESET_S);
    const vertexCount = positions.length / 3;

    expect(positions.length % 3).toBe(0);
    expect(indices.length % 3).toBe(0);
    // 실루엣 표현에 충분 + 모바일 안전권 (SDD §2.2)
    expect(vertexCount).toBeGreaterThan(500);
    expect(vertexCount).toBeLessThanOrEqual(5000);
    for (const idx of indices) {
      expect(idx).toBeLessThan(vertexCount);
    }
  });

  it('신장 정규화 — y 범위가 [0, ~1.75] (발바닥 원점)', () => {
    const { positions } = buildAvatarGeometry(PRESET_S);
    let yMin = Infinity;
    let yMax = -Infinity;
    for (let i = 1; i < positions.length; i += 3) {
      yMin = Math.min(yMin, positions[i]);
      yMax = Math.max(yMax, positions[i]);
    }
    expect(yMin).toBeGreaterThanOrEqual(0);
    expect(yMax).toBeGreaterThan(1.6);
    expect(yMax).toBeLessThan(1.9);
  });

  it('어깨 모프 ↑ → 어깨 밴드 폭 단조 증가', () => {
    const narrow = buildAvatarGeometry(paramsWith({ shoulder: 0.2 }));
    const wide = buildAvatarGeometry(paramsWith({ shoulder: 0.9 }));
    // 어깨 밴드 y∈[1.36, 1.44] — 팔 포함이어도 어깨 모프가 팔 위치를 밀어내므로 단조 유지
    expect(maxWidthInBand(wide.positions, 1.36, 1.44)).toBeGreaterThan(
      maxWidthInBand(narrow.positions, 1.36, 1.44)
    );
  });

  it('힙 모프 ↑ → 힙 밴드 몸통 단면 단조 증가', () => {
    const narrow = buildAvatarGeometry(paramsWith({ hip: 0.2 }));
    const wide = buildAvatarGeometry(paramsWith({ hip: 0.9 }));
    expect(maxDepthInBand(wide.positions, 0.9, 0.98)).toBeGreaterThan(
      maxDepthInBand(narrow.positions, 0.9, 0.98)
    );
  });

  it('S/W/N 프리셋 실루엣이 서로 다르다', () => {
    const empty = { ratio: null, shoulder: null, waist: null, hip: null };
    const s = buildAvatarGeometry(deriveAvatarParams({ body_type: 'S', ...empty }));
    const w = buildAvatarGeometry(deriveAvatarParams({ body_type: 'W', ...empty }));
    const n = buildAvatarGeometry(deriveAvatarParams({ body_type: 'N', ...empty }));

    expect(s.positions).not.toEqual(w.positions);
    expect(w.positions).not.toEqual(n.positions);
    expect(s.positions).not.toEqual(n.positions);

    // W는 S보다 힙 몸통 단면이 큼 (팔 오염 없는 깊이 z로 측정)
    const wHip = maxDepthInBand(w.positions, 0.9, 0.98);
    const sHip = maxDepthInBand(s.positions, 0.9, 0.98);
    expect(wHip).toBeGreaterThan(sHip);
  });
});
