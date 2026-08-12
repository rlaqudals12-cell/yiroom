/**
 * seeded-random 유틸리티 테스트
 *
 * @description 결정론적 시드 기반 난수 검증 (재현성 계약)
 */

import { describe, it, expect } from 'vitest';
import { createSeededRandom, hashStringToSeed, DEFAULT_SEED } from '@/lib/utils/seeded-random';

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
