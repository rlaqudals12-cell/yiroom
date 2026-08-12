/**
 * seeded-random 유틸리티 테스트
 *
 * @description 결정론적 시드 기반 난수 검증 (재현성 계약)
 */

import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  hashStringToSeed,
  hashImageFingerprint,
  buildFallbackSeed,
  DEFAULT_SEED,
} from '@/lib/utils/seeded-random';

describe('hashStringToSeed', () => {
  it('should be deterministic for the same input', () => {
    expect(hashStringToSeed('abc')).toBe(hashStringToSeed('abc'));
  });

  it('should differ for different inputs', () => {
    expect(hashStringToSeed('abc')).not.toBe(hashStringToSeed('abd'));
  });

  it('should return an unsigned 32-bit integer', () => {
    const h = hashStringToSeed('yiroom');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
  });

  it('should handle empty string', () => {
    const h = hashStringToSeed('');
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
  });
});

describe('createSeededRandom', () => {
  it('should produce identical sequences for the same seed', () => {
    const a = createSeededRandom('seed-1');
    const b = createSeededRandom('seed-1');
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('should produce different sequences for different seeds', () => {
    const a = createSeededRandom('seed-1');
    const b = createSeededRandom('seed-2');
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it('should return values in [0, 1)', () => {
    const rng = createSeededRandom('range-check');
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('should accept a numeric seed', () => {
    const a = createSeededRandom(12345);
    const b = createSeededRandom(12345);
    expect(a()).toBe(b());
  });

  it('should not degenerate for a zero seed', () => {
    const rng = createSeededRandom(0);
    const values = Array.from({ length: 10 }, () => rng());
    // 상수(전부 동일)로 붕괴하지 않아야 함
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it('should spread reasonably across the unit interval', () => {
    const rng = createSeededRandom(DEFAULT_SEED);
    const buckets = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) {
      buckets[Math.min(3, Math.floor(rng() * 4))]++;
    }
    // 각 사분면에 최소 1개 이상 (완전 편향 아님)
    buckets.forEach((count) => expect(count).toBeGreaterThan(0));
  });
});

describe('hashImageFingerprint', () => {
  /** 조각 샘플링(앞·중간·뒤 256자)을 넘어서는 길이의 가짜 이미지 문자열 */
  const bigImage = (fill: string): string => `data:image/jpeg;base64,${fill.repeat(2000)}`;

  it('같은 이미지 문자열은 항상 같은 지문을 낸다', () => {
    const img = bigImage('AB');
    expect(hashImageFingerprint(img)).toBe(hashImageFingerprint(img));
  });

  it('다른 이미지는 다른 지문을 낸다', () => {
    expect(hashImageFingerprint(bigImage('AB'))).not.toBe(hashImageFingerprint(bigImage('CD')));
  });

  it('길이가 같아도 내용이 다르면 지문이 다르다 (조각 샘플링 검증)', () => {
    const base = bigImage('AB');
    // 뒷부분만 바꿈 — tail 조각에 반영돼야 한다
    const tailChanged = `${base.slice(0, base.length - 10)}ZZZZZZZZZZ`;
    expect(tailChanged.length).toBe(base.length);
    expect(hashImageFingerprint(tailChanged)).not.toBe(hashImageFingerprint(base));
  });

  it('이미지가 없으면 no-image 고정값 (비결정 재료 미사용)', () => {
    expect(hashImageFingerprint()).toBe('no-image');
    expect(hashImageFingerprint(null)).toBe('no-image');
    expect(hashImageFingerprint('')).toBe('no-image');
  });
});

describe('buildFallbackSeed', () => {
  const img = `data:image/jpeg;base64,${'QQ'.repeat(2000)}`;

  it('같은 사용자·축·사진이면 항상 같은 시드 (재현성 계약)', () => {
    expect(buildFallbackSeed('user-1', 'hair', img)).toBe(buildFallbackSeed('user-1', 'hair', img));
  });

  it('사용자가 다르면 시드가 다르다', () => {
    expect(buildFallbackSeed('user-1', 'hair', img)).not.toBe(
      buildFallbackSeed('user-2', 'hair', img)
    );
  });

  it('축이 다르면 시드가 다르다 (축 간 결과 동조 방지)', () => {
    expect(buildFallbackSeed('user-1', 'hair', img)).not.toBe(
      buildFallbackSeed('user-1', 'body', img)
    );
  });

  it('사진이 다르면 시드가 다르다', () => {
    const other = `data:image/jpeg;base64,${'RR'.repeat(2000)}`;
    expect(buildFallbackSeed('user-1', 'hair', img)).not.toBe(
      buildFallbackSeed('user-1', 'hair', other)
    );
  });

  it('사진이 없어도 사용자·축만으로 결정론적이다', () => {
    expect(buildFallbackSeed('user-1', 'body')).toBe(buildFallbackSeed('user-1', 'body'));
    expect(buildFallbackSeed('user-1', 'body')).toContain('no-image');
  });
});
