/**
 * composeDailyOutfit 테스트 — 베스트 컬러 → 오늘의 배색(상의·하의·포인트).
 * 핵심: 결정론(같은 날+같은 팔레트=같은 조합), 빈 입력 null, ADR-105 배색 엔진 재사용.
 */

import { describe, it, expect } from 'vitest';
import { hexToLab, calculateChroma } from '@/lib/color';
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

  it('파생색(하의·가방)은 "계열" 표기로 정직하게 이름 짓는다', () => {
    const out = composeDailyOutfit(palette, new Date('2026-07-08'))!;
    for (const role of ['하의', '가방'] as const) {
      const block = out.colors.find((c) => c.role === role)!;
      expect(block.name).toContain('계열');
    }
  });

  it('포인트는 진단 팔레트 중 최고 채도 색(합성 보색 아님, 원본 이름 유지)', () => {
    const out = composeDailyOutfit(palette, new Date('2026-07-08'))!;
    const top = out.colors[0];
    const point = out.colors.find((c) => c.role === '포인트')!;
    // 진단 hex 내 선택 — 팔레트에 실재하는 색이고, 원본 이름을 그대로 쓴다
    const original = palette.find((p) => p.hex === point.hex);
    expect(original).toBeDefined();
    expect(point.name).toBe(original!.name);
    // 베이스(상의)와 다른 색 중 채도가 가장 높은 색이어야 한다
    const others = palette.filter((p) => p.hex !== top.hex);
    const maxChroma = Math.max(...others.map((p) => calculateChroma(hexToLab(p.hex))));
    expect(calculateChroma(hexToLab(point.hex))).toBe(maxChroma);
  });

  it('팔레트가 1색이면 포인트도 그 색 그대로(지어내지 않음)', () => {
    const out = composeDailyOutfit([{ name: '코랄', hex: '#FF7F50' }], new Date('2026-07-08'))!;
    const point = out.colors.find((c) => c.role === '포인트')!;
    expect(point.hex).toBe('#FF7F50');
    expect(point.name).toBe('코랄');
  });

  it('신발은 중립색 뉴트럴로 배색을 받쳐준다', () => {
    const out = composeDailyOutfit(palette, new Date('2026-07-08'))!;
    const shoes = out.colors.find((c) => c.role === '신발')!;
    expect(['차콜', '아이보리', '에스프레소', '오프화이트']).toContain(shoes.name);
  });

  it('저대비(low)+밝은 베이스면 어두운 신발 대신 중명도 그레이(무채)', () => {
    // 골드 L*≈87(>55) + low — 톤온톤 처방에서 어두운 신발의 명암 점프를 피한다.
    // 웜 팔레트(골드)이므로 웜 그레이
    const out = composeDailyOutfit(
      [{ name: '골드', hex: '#FFD700' }],
      new Date('2026-07-08'),
      'low'
    )!;
    const shoes = out.colors.find((c) => c.role === '신발')!;
    expect(shoes.hex).toBe('#9A9187');
    expect(shoes.name).toBe('그레이');
    // 무채 뉴트럴 계약 — 채도 C*<12 (색 지어내기 없음)
    expect(calculateChroma(hexToLab(shoes.hex))).toBeLessThan(12);

    // 쿨 팔레트(더스티 블루)에서는 쿨 그레이
    const cool = composeDailyOutfit(
      [{ name: '아이스 블루', hex: '#BFD3E6' }],
      new Date('2026-07-08'),
      'low'
    )!;
    const coolShoes = cool.colors.find((c) => c.role === '신발')!;
    expect(coolShoes.hex).toBe('#8E939B');
    expect(calculateChroma(hexToLab(coolShoes.hex))).toBeLessThan(12);
  });

  it('그레이 분기는 low+밝은 베이스에서만 — 그 외 경로는 명도 규칙 유지', () => {
    // low + 어두운 베이스(잉크 블랙 L*≈9, 쿨) → 밝은 뉴트럴(오프화이트)
    const dark = composeDailyOutfit(
      [{ name: '잉크 블랙', hex: '#1A1A1E' }],
      new Date('2026-07-08'),
      'low'
    )!;
    expect(dark.colors.find((c) => c.role === '신발')!.name).toBe('오프화이트');
    // high + 밝은 베이스(골드, 웜) → 어두운 뉴트럴(에스프레소)
    const high = composeDailyOutfit(
      [{ name: '골드', hex: '#FFD700' }],
      new Date('2026-07-08'),
      'high'
    )!;
    expect(high.colors.find((c) => c.role === '신발')!.name).toBe('에스프레소');
    // 대비 미지정 + 밝은 베이스 → 어두운 뉴트럴(하위호환)
    const plain = composeDailyOutfit([{ name: '골드', hex: '#FFD700' }], new Date('2026-07-08'))!;
    expect(plain.colors.find((c) => c.role === '신발')!.name).toBe('에스프레소');
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

/**
 * 뉴트럴(신발) 언더톤 분기 — 쿨(여름·겨울)에게 웜 아이보리를 신기면 배색 전체가 어긋난다.
 * 진단 시즌이 있으면 시즌이, 없으면 팔레트 b* 평균이 결정한다(둘 다 결정론).
 */
describe('composeDailyOutfit — 뉴트럴 시즌(언더톤) 분기', () => {
  const LIGHT_BASE = [{ name: '라이트 베이스', hex: '#E8DCC8' }]; // L*≈87(>55) → 어두운 뉴트럴 경로
  const DARK_BASE = [{ name: '다크 베이스', hex: '#2E3138' }]; // L*≈20(<55) → 밝은 뉴트럴 경로
  const DATE = new Date('2026-07-08');

  function shoes(out: ReturnType<typeof composeDailyOutfit>): { hex: string; name: string } {
    const s = out!.colors.find((c) => c.role === '신발')!;
    return { hex: s.hex, name: s.name };
  }

  it('쿨(여름·겨울)은 오프화이트/차콜을 신는다', () => {
    expect(shoes(composeDailyOutfit(DARK_BASE, DATE, undefined, 'summer'))).toEqual({
      hex: '#F0F0F2',
      name: '오프화이트',
    });
    expect(shoes(composeDailyOutfit(LIGHT_BASE, DATE, undefined, 'winter'))).toEqual({
      hex: '#3A3A3C',
      name: '차콜',
    });
  });

  it('웜(봄·가을)은 아이보리/에스프레소를 신는다', () => {
    expect(shoes(composeDailyOutfit(DARK_BASE, DATE, undefined, 'spring'))).toEqual({
      hex: '#ECE6DC',
      name: '아이보리',
    });
    expect(shoes(composeDailyOutfit(LIGHT_BASE, DATE, undefined, 'autumn'))).toEqual({
      hex: '#3B302A',
      name: '에스프레소',
    });
  });

  it('시즌 표기 흔들림(대문자·한국어 라벨)도 같은 언더톤으로 읽는다', () => {
    const upper = shoes(composeDailyOutfit(LIGHT_BASE, DATE, undefined, 'Winter'));
    const korean = shoes(composeDailyOutfit(LIGHT_BASE, DATE, undefined, '겨울 쿨톤'));
    expect(upper.name).toBe('차콜');
    expect(korean.name).toBe('차콜');
  });

  it('시즌이 없으면 팔레트 b* 평균으로 폴백한다(웜 팔레트=웜 뉴트럴)', () => {
    // 코랄·골드·오렌지 = b* 평균 크게 양수(노랑 기울기) → 웜
    const warm = shoes(composeDailyOutfit(palette, DATE));
    expect(['아이보리', '에스프레소']).toContain(warm.name);
    // 쿨 팔레트(블루·라벤더) → 쿨 뉴트럴
    const cool = shoes(
      composeDailyOutfit(
        [
          { name: '아이스 블루', hex: '#9DBEDC' },
          { name: '라벤더', hex: '#B9AEDC' },
        ],
        DATE
      )
    );
    expect(['오프화이트', '차콜']).toContain(cool.name);
  });

  it('시즌 분기 후에도 결정론 — 같은 입력이면 같은 조합', () => {
    const a = composeDailyOutfit(LIGHT_BASE, DATE, 'high', 'autumn');
    const b = composeDailyOutfit(LIGHT_BASE, DATE, 'high', 'autumn');
    expect(a).toEqual(b);
    // 시즌만 달라지면 신발만 달라진다(나머지 배색은 불변 — 시즌은 뉴트럴 축에만 개입)
    const cool = composeDailyOutfit(LIGHT_BASE, DATE, 'high', 'winter')!;
    const warm = composeDailyOutfit(LIGHT_BASE, DATE, 'high', 'autumn')!;
    expect(cool.colors.filter((c) => c.role !== '신발')).toEqual(
      warm.colors.filter((c) => c.role !== '신발')
    );
    expect(cool.colors.find((c) => c.role === '신발')!.hex).not.toBe(
      warm.colors.find((c) => c.role === '신발')!.hex
    );
  });

  it('뉴트럴은 저채도 계약을 지킨다(C*<12 — 색 지어내기 없음)', () => {
    for (const season of ['spring', 'summer', 'autumn', 'winter']) {
      for (const base of [LIGHT_BASE, DARK_BASE]) {
        const s = shoes(composeDailyOutfit(base, DATE, undefined, season));
        expect(calculateChroma(hexToLab(s.hex))).toBeLessThan(12);
      }
    }
  });
});

/**
 * 뮤트 베이스(C*<15) 경로 — analogous 회전은 L*·C*를 보존해 "같은 회청 덩어리"를
 * 만들던 근본 원인. 하의·가방을 진단 팔레트에서 직접 선정하는지 검증한다.
 */
describe('composeDailyOutfit — 뮤트 베이스 팔레트 직접 선정', () => {
  // 실측 Lab: 회청 L*37.6 C*8.6(뮤트·유채) / 더스티 로즈 L*62.1 C*10.0 / 라이트 그레이 L*81.0 C*1.1(무채)
  const MUTED = [
    { name: '회청', hex: '#4E5A66' },
    { name: '더스티 로즈', hex: '#A89096' },
    { name: '라이트 그레이', hex: '#C9C9CB' },
  ];
  // 시드 20260707 % 3 === 0 → 상의(base) = 회청(결정론적 고정)
  const MUTED_DATE = new Date('2026-07-07');

  function lightness(hex: string): number {
    return hexToLab(hex).L;
  }

  it('전제 검증: 베이스는 뮤트(C*<15), 팔레트 무채는 라이트 그레이뿐', () => {
    expect(calculateChroma(hexToLab('#4E5A66'))).toBeLessThan(15);
    expect(calculateChroma(hexToLab('#A89096'))).toBeLessThan(15);
    expect(calculateChroma(hexToLab('#C9C9CB'))).toBeLessThan(8);
    expect(calculateChroma(hexToLab('#4E5A66'))).toBeGreaterThanOrEqual(8);
    expect(calculateChroma(hexToLab('#A89096'))).toBeGreaterThanOrEqual(8);
  });

  it('하의·가방을 진단 팔레트에서 직접 선정한다(원본 hex·이름 유지)', () => {
    const out = composeDailyOutfit(MUTED, MUTED_DATE)!;
    const top = out.colors[0];
    const bottom = out.colors.find((c) => c.role === '하의')!;
    const bag = out.colors.find((c) => c.role === '가방')!;
    expect(top.hex).toBe('#4E5A66');
    // 하의 = 상의와 |ΔL*| 최대인 진단색(라이트 그레이 L*81.0)
    expect(bottom.hex).toBe('#C9C9CB');
    expect(bottom.name).toBe('라이트 그레이');
    // 가방 = 상·하의와 ΔE 최대인 진단색 — 무채(라이트 그레이) 소진 후 유채 우선(더스티 로즈)
    expect(bag.hex).toBe('#A89096');
    expect(bag.name).toBe('더스티 로즈');
  });

  it('상의·하의·가방의 pairwise 명도 격차가 지각 가능 하한(ΔL* 12) 이상이다', () => {
    const out = composeDailyOutfit(MUTED, MUTED_DATE)!;
    const [topL, bottomL, bagL] = (['상의', '하의', '가방'] as const).map((role) =>
      lightness(out.colors.find((c) => c.role === role)!.hex)
    );
    expect(Math.abs(topL - bottomL)).toBeGreaterThanOrEqual(12);
    expect(Math.abs(topL - bagL)).toBeGreaterThanOrEqual(12);
    expect(Math.abs(bottomL - bagL)).toBeGreaterThanOrEqual(12);
  });

  it('무채 상한 1칸 — 무채 2개가 뽑힐 상황이면 차순위 유채로 교체한다', () => {
    // 시드 20260708 % 4 === 0 → 상의 = 회청. 하의 = 라이트 그레이(무채, ΔL 최대).
    // 가드 없으면 가방 maximin은 잉크 블랙(무채) — 가드가 유채(더스티 로즈)로 교체해야 한다.
    const guarded = [
      { name: '회청', hex: '#4E5A66' },
      { name: '라이트 그레이', hex: '#C9C9CB' },
      { name: '잉크 블랙', hex: '#1A1A1E' },
      { name: '더스티 로즈', hex: '#A89096' },
    ];
    const out = composeDailyOutfit(guarded, new Date('2026-07-08'))!;
    const bottom = out.colors.find((c) => c.role === '하의')!;
    const bag = out.colors.find((c) => c.role === '가방')!;
    expect(bottom.hex).toBe('#C9C9CB');
    expect(bag.hex).not.toBe('#1A1A1E');
    expect(bag.hex).toBe('#A89096');
    // 상의·하의·가방 중 무채(C*<8)는 최대 1칸
    const achromaticCount = (['상의', '하의', '가방'] as const)
      .map((role) => out.colors.find((c) => c.role === role)!.hex)
      .filter((hex) => calculateChroma(hexToLab(hex)) < 8).length;
    expect(achromaticCount).toBeLessThanOrEqual(1);
  });

  it('1색 뮤트 팔레트 — 파생 폴백으로도 하의 명도 격차를 보장한다(계열명 표기)', () => {
    // 더스티 블루 L*51.1 C*10.3 — 팔레트 선정 불가(자기 자신뿐) → 명도 이동 파생 폴백
    const out = composeDailyOutfit([{ name: '더스티 블루', hex: '#6E7B8B' }], MUTED_DATE)!;
    const top = out.colors[0];
    const bottom = out.colors.find((c) => c.role === '하의')!;
    const bag = out.colors.find((c) => c.role === '가방')!;
    expect(bottom.hex).not.toBe(top.hex);
    expect(Math.abs(lightness(top.hex) - lightness(bottom.hex))).toBeGreaterThanOrEqual(12);
    expect(bottom.name).toContain('계열');
    // 가방 폴백도 상·하의와 겹치지 않는 명도로 벌어진다
    expect(bag.hex).not.toBe(top.hex);
    expect(bag.hex).not.toBe(bottom.hex);
    expect(out.colors).toHaveLength(5);
  });

  it('파생색 L*는 [30, 88]로 클램프된다(검정/흰색 붕괴 방지)', () => {
    // 잉크 블랙 L*9.4 + low 대비(+8 → 17.4)는 하한 30으로 클램프
    const dark = composeDailyOutfit([{ name: '잉크 블랙', hex: '#1A1A1E' }], MUTED_DATE, 'low')!;
    const darkBottom = dark.colors.find((c) => c.role === '하의')!;
    expect(lightness(darkBottom.hex)).toBeGreaterThanOrEqual(29);
    expect(lightness(darkBottom.hex)).toBeLessThanOrEqual(32);
    // 페일 아이보리 L*97.3 + low 대비(-8 → 89.3)는 상한 88로 클램프
    const light = composeDailyOutfit(
      [{ name: '페일 아이보리', hex: '#FAF7F0' }],
      MUTED_DATE,
      'low'
    )!;
    const lightBottom = light.colors.find((c) => c.role === '하의')!;
    expect(lightness(lightBottom.hex)).toBeLessThanOrEqual(88.6);
    expect(lightness(lightBottom.hex)).toBeGreaterThanOrEqual(86);
  });

  it('뮤트 경로도 결정론 — 같은 날짜+같은 팔레트면 같은 조합', () => {
    const a = composeDailyOutfit(MUTED, MUTED_DATE);
    const b = composeDailyOutfit(MUTED, MUTED_DATE);
    expect(a).toEqual(b);
  });

  it('포인트는 하의·가방에 이미 배정된 진단색을 배제한다 (밝은 뉴트럴 + 딥 1점)', () => {
    // 실측 Lab: 아이보리 L*91.8 C*6.1 / 샌드 L*84.4 C*5.7 / 그레이지 L*72.2 C*7.2 / 딥 네이비 L*24.1 C*11.3
    // 시드 20260708 % 4 === 0 → 상의 = 아이보리(뮤트) → 하의 = ΔL* 최대인 딥 네이비.
    // 배제 없으면 최고 채도(딥 네이비)가 포인트로도 뽑혀 하의와 같은 색이 매일 반복된다.
    const brightNeutral = [
      { name: '아이보리', hex: '#EDE7DC' },
      { name: '샌드', hex: '#D8D2C8' },
      { name: '그레이지', hex: '#B8B0A4' },
      { name: '딥 네이비', hex: '#2F3A4A' },
    ];
    const out = composeDailyOutfit(brightNeutral, new Date('2026-07-08'))!;
    const bottom = out.colors.find((c) => c.role === '하의')!;
    const bag = out.colors.find((c) => c.role === '가방')!;
    const point = out.colors.find((c) => c.role === '포인트')!;

    expect(bottom.hex).toBe('#2F3A4A');
    expect(point.hex).not.toBe(bottom.hex);
    expect(point.hex).not.toBe(bag.hex);
    // 여전히 진단 팔레트 안의 색(합성 없음) + 원본 이름 유지
    expect(point.hex).toBe('#B8B0A4');
    expect(point.name).toBe('그레이지');
  });

  it('가방이 팔레트에서 선정된 날에도 포인트가 가방과 겹치지 않는다', () => {
    // 상의 회청 · 하의 라이트 그레이 · 가방 더스티 로즈(팔레트 선정) → 포인트는 남은 잉크 블랙
    const guarded = [
      { name: '회청', hex: '#4E5A66' },
      { name: '라이트 그레이', hex: '#C9C9CB' },
      { name: '잉크 블랙', hex: '#1A1A1E' },
      { name: '더스티 로즈', hex: '#A89096' },
    ];
    const out = composeDailyOutfit(guarded, new Date('2026-07-08'))!;
    const bag = out.colors.find((c) => c.role === '가방')!;
    const point = out.colors.find((c) => c.role === '포인트')!;

    expect(bag.hex).toBe('#A89096');
    expect(point.hex).toBe('#1A1A1E');
    expect(point.name).toBe('잉크 블랙');
  });

  it('후보 소진(좁은 팔레트)이면 기존 폴백 — 진단색 안에서 고르고 결정론 유지', () => {
    // 3색 팔레트는 상의·하의·가방이 전부 소비 → 배제 후보가 없다.
    // 이때는 기존 동작(베이스 제외 최고 채도)으로 되돌아가되 색을 지어내지 않는다.
    const out = composeDailyOutfit(MUTED, MUTED_DATE)!;
    const point = out.colors.find((c) => c.role === '포인트')!;
    expect(MUTED.some((p) => p.hex === point.hex)).toBe(true);
    expect(point.hex).not.toBe(out.colors[0].hex); // 상의(베이스)와는 다르다
    // 같은 날 재호출 결과가 동일해야 한다(결정론)
    expect(composeDailyOutfit(MUTED, MUTED_DATE)!.colors).toEqual(out.colors);
  });

  it('유채 베이스(C*≥15) 경로는 기존 로직 그대로 — 하의·가방이 파생 계열명이다', () => {
    // 코랄 C*65.7 — 뮤트 아님 → analogous 파생 유지(팔레트 원본이 아닌 합성색)
    const out = composeDailyOutfit(palette, new Date('2026-07-08'))!;
    for (const role of ['하의', '가방'] as const) {
      const block = out.colors.find((c) => c.role === role)!;
      expect(block.name).toContain('계열');
      expect(palette.some((p) => p.hex.toLowerCase() === block.hex.toLowerCase())).toBe(false);
    }
  });
});
