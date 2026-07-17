import { describe, it, expect } from 'vitest';
import { getCardPalette } from '@/lib/share/tone-palettes';

const TWELVE_TONES = [
  'light-spring',
  'true-spring',
  'bright-spring',
  'light-summer',
  'true-summer',
  'muted-summer',
  'muted-autumn',
  'true-autumn',
  'deep-autumn',
  'deep-winter',
  'true-winter',
  'bright-winter',
];

describe('getCardPalette — 공유카드 12톤 큐레이션 팔레트', () => {
  it('12톤 전부 베스트 6색(이름 포함) + 피해야 할 색 4색을 반환한다', () => {
    for (const tone of TWELVE_TONES) {
      const p = getCardPalette(tone, 'ko');
      expect(p, tone).not.toBeNull();
      expect(p!.best, tone).toHaveLength(6);
      expect(p!.avoid, tone).toHaveLength(4);
      for (const c of p!.best) {
        expect(c.hex, tone).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(c.name.length, tone).toBeGreaterThan(0);
      }
      for (const c of p!.avoid) {
        expect(c.hex, tone).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it('로케일: ko는 한국어, en은 영어, ja/zh는 en 폴백(외래어 관습)', () => {
    expect(getCardPalette('muted-summer', 'ko')!.best[0].name).toBe('더스티 로즈');
    expect(getCardPalette('muted-summer', 'en')!.best[0].name).toBe('Dusty Rose');
    expect(getCardPalette('muted-summer', 'ja')!.best[0].name).toBe('Dusty Rose');
    expect(getCardPalette('muted-summer', 'zh')!.best[0].name).toBe('Dusty Rose');
  });

  it('4계절 폴백: season만 있으면 트루 톤 팔레트로 매핑한다', () => {
    const summer = getCardPalette('summer', 'ko');
    const trueSummer = getCardPalette('true-summer', 'ko');
    expect(summer).toEqual(trueSummer);
  });

  it('미지의 톤·빈 값이면 null — 팔레트를 지어내지 않는다', () => {
    expect(getCardPalette('unknown-tone', 'ko')).toBeNull();
    expect(getCardPalette(null, 'ko')).toBeNull();
    expect(getCardPalette(undefined, 'ko')).toBeNull();
    expect(getCardPalette('', 'ko')).toBeNull();
  });

  it('12톤 전부 포인트 컬러 3개 — 유효 hex + ko/en 이름 존재', () => {
    for (const tone of TWELVE_TONES) {
      const ko = getCardPalette(tone, 'ko')!;
      const en = getCardPalette(tone, 'en')!;
      expect(ko.accent, tone).toHaveLength(3);
      for (const c of ko.accent) {
        expect(c.hex, tone).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(c.name.length, tone).toBeGreaterThan(0);
      }
      for (const c of en.accent) {
        expect(c.name.length, tone).toBeGreaterThan(0);
      }
    }
  });

  it('포인트 컬러 hex는 같은 톤의 베스트 6과 중복되지 않는다', () => {
    for (const tone of TWELVE_TONES) {
      const p = getCardPalette(tone, 'ko')!;
      const bestHexes = new Set(p.best.map((c) => c.hex.toUpperCase()));
      for (const c of p.accent) {
        expect(bestHexes.has(c.hex.toUpperCase()), `${tone}: ${c.hex}`).toBe(false);
      }
    }
  });

  it('금속 2개 — 웜(spring/autumn)=골드·로즈 골드, 쿨(summer/winter)=실버·화이트 골드', () => {
    for (const tone of TWELVE_TONES) {
      const p = getCardPalette(tone, 'en')!;
      expect(p.metals, tone).toHaveLength(2);
      for (const c of p.metals) {
        expect(c.hex, tone).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
      const names = p.metals.map((c) => c.name);
      if (tone.endsWith('spring') || tone.endsWith('autumn')) {
        expect(names, tone).toEqual(['Gold', 'Rose Gold']);
      } else {
        expect(names, tone).toEqual(['Silver', 'White Gold']);
      }
    }
  });

  it('포인트·금속 로케일: ko는 한국어, ja/zh는 en 폴백', () => {
    expect(getCardPalette('muted-summer', 'ko')!.accent[0].name).toBe('뮤트 베리');
    expect(getCardPalette('muted-summer', 'en')!.accent[0].name).toBe('Muted Berry');
    expect(getCardPalette('muted-summer', 'ja')!.accent[0].name).toBe('Muted Berry');
    expect(getCardPalette('muted-summer', 'ko')!.metals[0].name).toBe('실버');
    expect(getCardPalette('muted-summer', 'ja')!.metals[0].name).toBe('Silver');
  });

  it('4계절 폴백 경로에서도 포인트 3개 + 시즌 패밀리 금속이 나온다', () => {
    const autumn = getCardPalette('autumn', 'ko')!;
    expect(autumn.accent).toHaveLength(3);
    expect(autumn.metals.map((c) => c.name)).toEqual(['골드', '로즈 골드']);
    const winter = getCardPalette('winter', 'ko')!;
    expect(winter.accent).toHaveLength(3);
    expect(winter.metals.map((c) => c.name)).toEqual(['실버', '화이트 골드']);
  });
});
