/**
 * 오늘의 배색 조합 — 진단된 베스트 컬러에서 상의·하의·포인트 3색을 도출한다.
 *
 * @module lib/color/daily-outfit
 * @description ADR-105 배색 엔진(lib/color/harmony)을 재사용해 "예쁜 색 하드코딩"이 아니라
 * 사용자의 퍼스널컬러 대표색을 토대로 오늘의 코디 배색을 계산한다.
 *  - 상의(base)  = 베스트 컬러(날짜 기준 회전 선택)
 *  - 하의(bottom) = 유사색(analogous) — 조화로운 기본 배색
 *  - 신발(shoes)  = 중립색(명도로 결정) — 배색을 받쳐주는 뉴트럴
 *  - 가방(bag)    = 유사색(다른 이웃) — 배색 파생 소품
 *  - 포인트(point) = 보색(complementary) — 액세서리 한 점 악센트
 *
 * 색 이름(name): 상의는 진단된 원본 이름(있으면). 파생색은 지어내지 않고
 * 실제 계산된 색의 "계열명"(예: 소프트 블루 계열)으로 정직하게 표기. 중립색은 뉴트럴 이름.
 *
 * 결정론: 같은 날짜 + 같은 팔레트 → 항상 같은 조합. Math.random / Date.now 미사용
 * (날짜의 연·월·일만 시드로 사용 → 하루 안에서는 불변, 자정에 자연스럽게 바뀜).
 *
 * @see lib/color/harmony.ts
 */

import { hexToLab, labToHex, calculateChroma, calculateHue } from '@/lib/color';
import { analogous, complementary } from './harmony';

export type OutfitRole = '상의' | '하의' | '신발' | '가방' | '포인트';

/** 퍼스널 대비 레벨 (ADR-116) — 배색 명도 격차 조절용 */
export type OutfitContrast = 'low' | 'medium' | 'high';

export interface OutfitColor {
  hex: string;
  role: OutfitRole;
  /** 색 이름 — 상의는 원본, 파생색은 계열명, 중립색은 뉴트럴명(지어내지 않음) */
  name: string;
}

export interface DailyOutfitPalette {
  /** 기준 대표색 이름(상의 색) */
  baseName: string;
  /** [상의, 하의, 신발, 가방, 포인트] 순서 고정 */
  colors: OutfitColor[];
}

/** #RRGGBB 형태의 유효 hex인지 (배색 함수 입력 보호) */
function isHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value.trim());
}

/**
 * 날짜 → 정수 시드. 연·월·일만 사용해 하루 동안 불변(결정론).
 * (Date.now 대신 달력값을 써서 같은 날 재호출 시 동일 결과 보장)
 */
function dateSeed(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/**
 * 명도만 이동한 변형색 — 상·하의 명도 격차(대비) 조절용.
 * 밝은 base는 어둡게, 어두운 base는 밝게 밀어 자연스러운 방향으로 격차를 만든다.
 */
function shiftLightness(hex: string, delta: number): string {
  const lab = hexToLab(hex);
  const nextL = Math.max(0, Math.min(100, lab.L + delta));
  return labToHex({ L: nextL, a: lab.a, b: lab.b });
}

/**
 * hex → 한국어 "계열명". 배색 회전으로 파생된 색을 지어내지 않고,
 * 실제 계산된 색상각(h°)·채도(C*)·명도(L*)에서 계열을 정직하게 표기한다.
 * (저채도는 무채색 뉴트럴 계열, 유채색은 색상환 구간 + 명도 수식어)
 */
/** 색상환 구간(상한 미만) → 계열 이름. 위에서부터 처음 맞는 구간 채택 */
const HUE_FAMILIES: ReadonlyArray<{ max: number; name: string }> = [
  { max: 20, name: '레드' },
  { max: 45, name: '오렌지' },
  { max: 70, name: '옐로' },
  { max: 160, name: '그린' },
  { max: 200, name: '민트' },
  { max: 255, name: '블루' },
  { max: 295, name: '퍼플' },
  { max: 335, name: '핑크' },
  { max: 360, name: '레드' }, // 335~360은 다시 레드
];

/** 무채색(저채도) 명도 → 뉴트럴 계열 이름 */
function neutralFamilyName(L: number): string {
  if (L >= 82) return '화이트 계열';
  if (L >= 58) return '라이트 그레이 계열';
  if (L >= 32) return '그레이 계열';
  return '차콜 계열';
}

function colorFamilyName(hex: string): string {
  const lab = hexToLab(hex);
  const chroma = calculateChroma(lab);
  // 무채색(저채도) → 명도로 뉴트럴 계열
  if (chroma < 12) return neutralFamilyName(lab.L);

  const hue = calculateHue(lab); // 0~360
  const family = HUE_FAMILIES.find((f) => hue < f.max)?.name ?? '레드';
  // 명도 수식어(라이트/소프트/딥) — 실제 L*에서 유도
  let tone = '소프트 ';
  if (lab.L >= 72) tone = '라이트 ';
  else if (lab.L <= 38) tone = '딥 ';
  return `${tone}${family} 계열`;
}

/** 배색을 받쳐주는 중립 신발색 — 밝은 상의는 어두운 신발, 어두운 상의는 밝은 신발(결정론) */
function neutralShoes(baseL: number): OutfitColor {
  return baseL > 55
    ? { hex: '#3A3A3C', role: '신발', name: '차콜' }
    : { hex: '#ECE6DC', role: '신발', name: '아이보리' };
}

/**
 * 오늘의 배색 조합 생성 — 순수 함수.
 * 유효한 베스트 컬러가 없으면 null(호출부에서 섹션 생략 — 정직성 가드).
 *
 * @param bestColors 진단된 베스트 컬러(hex 팔레트)
 * @param date 기준 날짜(기본 오늘) — 테스트에서 고정 주입
 * @param contrast 퍼스널 대비(ADR-116, 선택) — high면 상·하의 명도 격차를 키우고,
 *   low면 인접 명도(톤온톤)로 좁힌다. 미지정/medium이면 기존 동작(유사색) 유지(하위호환).
 */
export function composeDailyOutfit(
  bestColors: ReadonlyArray<{ name?: string; hex?: string }>,
  date: Date = new Date(),
  contrast?: OutfitContrast
): DailyOutfitPalette | null {
  const valid = bestColors.filter((c) => isHex(c?.hex));
  if (valid.length === 0) return null;

  const seed = dateSeed(date);
  const base = valid[seed % valid.length];
  const baseHex = base.hex as string;
  const baseL = hexToLab(baseHex).L;

  // 유사색 2개(-spread, +spread) — 하의(기본)·가방(다른 이웃)에 배색 파생으로 사용
  const neighbors = analogous(baseHex, 30);
  const bottomNeighbor = neighbors[seed % neighbors.length];
  const bagNeighbor = neighbors[(seed + 1) % neighbors.length];

  // 하의 명도: 대비 수준에 따라 조절 (기본 = 유사색 — 하위호환)
  let bottomHex: string;
  if (contrast === 'high') {
    // 명암 격차 큰 조합: 밝은 base는 어둡게, 어두운 base는 밝게
    bottomHex = shiftLightness(baseHex, baseL > 50 ? -35 : 35);
  } else if (contrast === 'low') {
    // 톤온톤: 인접 명도(작은 격차)로 좁혀 얼굴이 묻히지 않게
    bottomHex = shiftLightness(baseHex, baseL > 50 ? -8 : 8);
  } else {
    bottomHex = bottomNeighbor;
  }
  // 보색 → 포인트
  const pointHex = complementary(baseHex);

  return {
    baseName: base.name?.trim() || '베스트 컬러',
    colors: [
      // 상의: 진단된 원본 이름 사용(있으면), 없으면 실제 색의 계열명
      { hex: baseHex, role: '상의', name: base.name?.trim() || colorFamilyName(baseHex) },
      // 하의: 배색 파생 → 계열명(지어내지 않음)
      { hex: bottomHex, role: '하의', name: colorFamilyName(bottomHex) },
      // 신발: 배색을 받쳐주는 중립색
      neutralShoes(baseL),
      // 가방: 다른 유사색 → 계열명
      { hex: bagNeighbor, role: '가방', name: colorFamilyName(bagNeighbor) },
      // 포인트: 보색 → 계열명
      { hex: pointHex, role: '포인트', name: colorFamilyName(pointHex) },
    ],
  };
}
