/**
 * 오늘의 배색 — 퍼스널 대비(ADR-116) 명도 격차 조절 테스트
 * high → 상·하의 명도 격차 큼 / low → 톤온톤(작은 격차) / 미지정 → 기존 동작(하위호환)
 */

import { describe, it, expect } from 'vitest';
import { hexToLab } from '@/lib/color';
import { composeDailyOutfit } from '@/lib/color/daily-outfit';

// 단일 베스트 컬러(밝은 베이지) → 상의(base) 결정론적으로 고정
const BEST = [{ name: '베이지', hex: '#EFC9B0' }];
const FIXED_DATE = new Date('2026-07-09T00:00:00Z');

function lightnessGap(topHex: string, bottomHex: string): number {
  return Math.abs(hexToLab(topHex).L - hexToLab(bottomHex).L);
}

describe('composeDailyOutfit — 퍼스널 대비 반영', () => {
  it('high 대비 → 상·하의 명도 격차가 크다', () => {
    const outfit = composeDailyOutfit(BEST, FIXED_DATE, 'high');
    expect(outfit).not.toBeNull();
    const gap = lightnessGap(outfit!.colors[0].hex, outfit!.colors[1].hex);
    expect(gap).toBeGreaterThan(25);
  });

  it('low 대비 → 톤온톤(작은 명도 격차)', () => {
    const outfit = composeDailyOutfit(BEST, FIXED_DATE, 'low');
    expect(outfit).not.toBeNull();
    const gap = lightnessGap(outfit!.colors[0].hex, outfit!.colors[1].hex);
    expect(gap).toBeLessThan(15);
  });

  it('high 격차 > low 격차', () => {
    const high = composeDailyOutfit(BEST, FIXED_DATE, 'high')!;
    const low = composeDailyOutfit(BEST, FIXED_DATE, 'low')!;
    expect(lightnessGap(high.colors[0].hex, high.colors[1].hex)).toBeGreaterThan(
      lightnessGap(low.colors[0].hex, low.colors[1].hex)
    );
  });

  it('대비 미지정 → 기존 동작 유지(상의·하의는 앞 2블록, 5블록 반환)', () => {
    const outfit = composeDailyOutfit(BEST, FIXED_DATE);
    expect(outfit).not.toBeNull();
    expect(outfit!.colors).toHaveLength(5);
    expect(outfit!.colors.map((c) => c.role)).toEqual(['상의', '하의', '신발', '가방', '포인트']);
  });

  it('결정론 — 같은 입력은 같은 조합', () => {
    const a = composeDailyOutfit(BEST, FIXED_DATE, 'high');
    const b = composeDailyOutfit(BEST, FIXED_DATE, 'high');
    expect(a).toEqual(b);
  });

  it('베스트 컬러가 없으면 null (정직성 가드)', () => {
    expect(composeDailyOutfit([], FIXED_DATE, 'high')).toBeNull();
  });
});
