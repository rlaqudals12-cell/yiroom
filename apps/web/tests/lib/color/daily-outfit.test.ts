/**
 * composeDailyOutfit 테스트 — 베스트 컬러 → 오늘의 배색(상의·하의·포인트).
 * 핵심: 결정론(같은 날+같은 팔레트=같은 조합), 빈 입력 null, ADR-105 배색 엔진 재사용.
 */

import { describe, it, expect } from 'vitest';
import { composeDailyOutfit } from '@/lib/color/daily-outfit';

const palette = [
  { name: '코랄', hex: '#FF7F50' },
  { name: '골드', hex: '#FFD700' },
  { name: '오렌지', hex: '#FFA500' },
];

describe('composeDailyOutfit', () => {
  it('상의·하의·신발·가방·포인트 5블록을 순서대로 반환한다', () => {
    const out = composeDailyOutfit(palette, new Date('2026-07-08'));
    expect(out).not.toBeNull();
    expect(out!.colors).toHaveLength(5);
    expect(out!.colors.map((c) => c.role)).toEqual(['상의', '하의', '신발', '가방', '포인트']);
    // 모든 블록이 유효 hex + 비어있지 않은 이름을 가진다
    expect(out!.colors.every((c) => /^#[0-9a-fA-F]{3,8}$/.test(c.hex))).toBe(true);
    expect(out!.colors.every((c) => c.name.length > 0)).toBe(true);
  });

  it('상의 이름은 진단된 원본 이름을 그대로 쓴다(지어내지 않음)', () => {
    // 2026-07-08 시드로 상의 색이 팔레트 중 하나로 결정 → 그 원본 이름이 상의 name
    const out = composeDailyOutfit(palette, new Date('2026-07-08'))!;
    const top = out.colors[0];
    const original = palette.find((p) => p.hex === top.hex);
    expect(top.name).toBe(original!.name);
  });

  it('파생색(하의·가방·포인트)은 "계열" 표기로 정직하게 이름 짓는다', () => {
    const out = composeDailyOutfit(palette, new Date('2026-07-08'))!;
    for (const role of ['하의', '가방', '포인트'] as const) {
      const block = out.colors.find((c) => c.role === role)!;
      expect(block.name).toContain('계열');
    }
  });

  it('신발은 중립색(차콜/아이보리 뉴트럴)으로 배색을 받쳐준다', () => {
    const out = composeDailyOutfit(palette, new Date('2026-07-08'))!;
    const shoes = out.colors.find((c) => c.role === '신발')!;
    expect(['차콜', '아이보리']).toContain(shoes.name);
  });

  it('같은 날짜+같은 팔레트면 항상 같은 조합(결정론)', () => {
    const a = composeDailyOutfit(palette, new Date('2026-07-08'));
    const b = composeDailyOutfit(palette, new Date('2026-07-08'));
    expect(a).toEqual(b);
  });

  it('날짜가 바뀌면 기준색 선택이 순환한다(회전)', () => {
    // 팔레트 길이 3 → 시드 % 3 로 기준색 인덱스가 도는지: 서로 다른 3일의 상의색 집합이 팔레트를 덮음
    const tops = [
      composeDailyOutfit(palette, new Date('2026-07-08'))!.colors[0].hex,
      composeDailyOutfit(palette, new Date('2026-07-09'))!.colors[0].hex,
      composeDailyOutfit(palette, new Date('2026-07-10'))!.colors[0].hex,
    ];
    // 최소 2가지 이상의 서로 다른 상의색이 나와야 "회전"이라 볼 수 있음
    expect(new Set(tops).size).toBeGreaterThanOrEqual(2);
  });

  it('유효한 베스트 컬러가 없으면 null(섹션 생략용)', () => {
    expect(composeDailyOutfit([])).toBeNull();
    expect(composeDailyOutfit([{ name: '이상값', hex: 'not-a-hex' }])).toBeNull();
    expect(composeDailyOutfit([{ name: '빈값' }])).toBeNull();
  });

  it('기준색 이름을 baseName으로 노출(이름 없으면 폴백)', () => {
    const named = composeDailyOutfit([{ name: '코랄', hex: '#FF7F50' }], new Date('2026-07-08'));
    expect(named!.baseName).toBe('코랄');
    const unnamed = composeDailyOutfit([{ hex: '#FF7F50' }], new Date('2026-07-08'));
    expect(unnamed!.baseName).toBe('베스트 컬러');
  });
});
