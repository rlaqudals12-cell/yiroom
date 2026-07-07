/**
 * 색상명↔hex 브리지 + LCh 코디 조화 판정 테스트
 * @see lib/inventory/color-bridge.ts
 */

import { describe, it, expect } from 'vitest';
import { colorNameToHex, assessOutfitHarmony } from '@/lib/inventory/color-bridge';

describe('colorNameToHex', () => {
  it('한글 색상명을 대표 hex로 변환한다', () => {
    expect(colorNameToHex('네이비')).toBe('#1F3A5F');
    expect(colorNameToHex('코랄')).toBe('#F08872');
  });

  it('부분 일치를 허용한다 (라이트 그레이 → 그레이)', () => {
    expect(colorNameToHex('라이트 그레이')).toBe('#8E8E8E');
  });

  it('알 수 없는 색상명은 null — 지어내지 않는다', () => {
    expect(colorNameToHex('무지개펄')).toBeNull();
  });
});

describe('assessOutfitHarmony', () => {
  it('색상명이 hex로 풀리지 않으면 null', () => {
    expect(assessOutfitHarmony(['외계색'], ['네이비'])).toBeNull();
    expect(assessOutfitHarmony(undefined, ['네이비'])).toBeNull();
  });

  it('무채색 둘 조합은 neutral-base', () => {
    const result = assessOutfitHarmony(['화이트'], ['블랙']);
    expect(result?.kind).toBe('neutral-base');
  });

  it('무채색 + 유채색은 accent', () => {
    const result = assessOutfitHarmony(['화이트'], ['코랄']);
    expect(result?.kind).toBe('accent');
  });

  it('같은 색 계열(레드+와인)은 톤온톤/유사 계열로 판정', () => {
    const result = assessOutfitHarmony(['레드'], ['와인']);
    expect(['tone-on-tone', 'analogous']).toContain(result?.kind);
  });

  it('보색 관계(블루 hue 278 ↔ 옐로우 hue 93, LCh 기준)는 complementary', () => {
    const result = assessOutfitHarmony(['블루'], ['옐로우']);
    expect(result?.kind).toBe('complementary');
  });

  it('모든 판정에 사용자 문구(tip)가 붙는다', () => {
    const result = assessOutfitHarmony(['코랄'], ['네이비']);
    expect(result?.tip).toBeTruthy();
  });
});
