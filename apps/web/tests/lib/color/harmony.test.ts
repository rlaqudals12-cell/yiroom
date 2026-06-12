import { describe, it, expect } from 'vitest';
import {
  complementary,
  analogous,
  triadic,
  splitComplementary,
  tonOnTone,
  analyzeHarmony,
} from '@/lib/color/harmony';
import { hexToLab, calculateHue } from '@/lib/color/conversions';

/** 두 hex의 색상각(h°) 차이를 0~180 범위로 반환 */
function hueDiff(hexA: string, hexB: string): number {
  const a = calculateHue(hexToLab(hexA));
  const b = calculateHue(hexToLab(hexB));
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

const RED = '#E74C3C'; // 채도 충분한 기준색
const TEAL = '#16A085';

describe('color/harmony', () => {
  describe('complementary (보색)', () => {
    it('유효한 hex를 반환한다', () => {
      expect(complementary(RED)).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('기준색과 색상각이 약 180도 차이난다', () => {
      // Lab→RGB 라운드트립·gamut 클리핑 오차 허용
      expect(hueDiff(RED, complementary(RED))).toBeGreaterThan(150);
    });
  });

  describe('analogous (유사색)', () => {
    it('양옆 2색을 반환한다', () => {
      const result = analogous(RED);
      expect(result).toHaveLength(2);
      result.forEach((c) => expect(c).toMatch(/^#[0-9a-fA-F]{6}$/));
    });

    it('기준색과 색상각 차이가 작다(기본 30도 이내 근사)', () => {
      analogous(RED, 30).forEach((c) => {
        expect(hueDiff(RED, c)).toBeLessThan(55);
      });
    });

    it('spread가 클수록 색상각 차이가 커진다', () => {
      const near = analogous(RED, 20)[1];
      const far = analogous(RED, 60)[1];
      expect(hueDiff(RED, far)).toBeGreaterThan(hueDiff(RED, near));
    });
  });

  describe('triadic (삼각 배색)', () => {
    it('2개의 보조색을 반환한다', () => {
      expect(triadic(TEAL)).toHaveLength(2);
    });

    it('약 120도/240도 회전한다', () => {
      const [t1, t2] = triadic(TEAL);
      expect(hueDiff(TEAL, t1)).toBeGreaterThan(90);
      expect(hueDiff(TEAL, t2)).toBeGreaterThan(90);
    });
  });

  describe('splitComplementary (분할 보색)', () => {
    it('2색을 반환하고 보색 근처에 위치한다', () => {
      const result = splitComplementary(RED);
      expect(result).toHaveLength(2);
      result.forEach((c) => expect(hueDiff(RED, c)).toBeGreaterThan(120));
    });
  });

  describe('tonOnTone (톤온톤)', () => {
    it('지정 단계 수만큼 반환한다', () => {
      expect(tonOnTone(RED, 3)).toHaveLength(3);
      expect(tonOnTone(RED, 5)).toHaveLength(5);
    });

    it('같은 색상각을 유지하며 명도만 다르다', () => {
      const shades = tonOnTone(RED, 3);
      const lightness = shades.map((c) => hexToLab(c).L);
      // 명도 오름차순(단조 증가)
      expect(lightness[0]).toBeLessThan(lightness[2]);
      // 색상각은 서로 비슷 (톤온톤 = 동일 hue)
      expect(hueDiff(shades[0], shades[2])).toBeLessThan(30);
    });

    it('steps=1이면 중간 명도 1색', () => {
      expect(tonOnTone(RED, 1)).toHaveLength(1);
    });
  });

  describe('analyzeHarmony (통합)', () => {
    it('모든 배색 유형을 포함한 결과를 반환한다', () => {
      const result = analyzeHarmony(RED);
      expect(result.base).toBe(RED);
      expect(result.lch.chroma).toBeGreaterThan(0);
      expect(result.complementary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result.analogous).toHaveLength(2);
      expect(result.triadic).toHaveLength(2);
      expect(result.splitComplementary).toHaveLength(2);
      expect(result.tonOnTone.length).toBeGreaterThanOrEqual(3);
    });

    it('무채색(회색)에서도 크래시 없이 동작한다', () => {
      // 회색은 chroma≈0 → hue 불안정하지만 함수는 유효 hex 반환해야 함
      const result = analyzeHarmony('#808080');
      expect(result.complementary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(result.tonOnTone.every((c) => /^#[0-9a-fA-F]{6}$/.test(c))).toBe(true);
    });
  });
});
