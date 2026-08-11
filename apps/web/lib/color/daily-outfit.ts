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
 *  - 포인트(point) = 진단 팔레트 중 최고 채도 색(하의·가방에 이미 배정된 hex는 배제) — 액세서리 한 점 악센트
 *    (보색 합성 폐지: 합성색은 저채도 베이스에서 흐릿한 비진단색으로 수렴해
 *     포인트가 죽는다. 진단 hex 안에서 고르면 "실제 내 색"이면서 가장 또렷하다)
 *
 * 뮤트 베이스 예외(2026-08): 베이스 C*<15이면 하의·가방을 analogous 합성 대신
 * 진단 팔레트에서 직접 선정한다. rotateHue는 L*·C*를 보존하고 h°만 돌리므로
 * 저채도 베이스에서는 파생색이 ΔE≈6 이하 — 상의·하의·가방이 "같은 회청 덩어리"로
 * 보이는 근본 원인이었다. 유채(C*≥15) 베이스 경로는 기존 로직 그대로(결정론 유지).
 *
 * 색 이름(name): 상의는 진단된 원본 이름(있으면). 파생색은 지어내지 않고
 * 실제 계산된 색의 "계열명"(예: 소프트 블루 계열)으로 정직하게 표기. 중립색은 뉴트럴 이름.
 *
 * 결정론: 같은 날짜 + 같은 팔레트 → 항상 같은 조합. Math.random / Date.now 미사용
 * (날짜의 연·월·일만 시드로 사용 → 하루 안에서는 불변, 자정에 자연스럽게 바뀜).
 *
 * @see lib/color/harmony.ts
 */

import { hexToLab, labToHex, calculateChroma, calculateHue, calculateCIEDE2000 } from '@/lib/color';
import { analogous } from './harmony';

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

/** 뮤트 베이스 판정 임계(C*) — 이 미만이면 analogous 회전 파생이 지각 불가 색차로 수렴 */
const MUTED_CHROMA_MAX = 15;
/** 무채색 판정 임계(C*) — 배색(상의·하의·가방) 안에서 무채는 1칸까지만 허용 */
const ACHROMATIC_CHROMA_MAX = 8;
/** 하의 팔레트 선정의 최소 명도 격차(|ΔL*|) — 미만이면 파생 폴백으로 격차를 보장 */
const MIN_BOTTOM_L_GAP = 12;
/** 가방 팔레트 선정의 최소 색차(ΔE00) — 미만이면 상·하의와 구분 불가라 파생 폴백 */
const MIN_BAG_DELTA_E = 5;

/** 파생색 명도 안전 범위 — 검정/흰색 붕괴 방지(진단 hue·채도는 보존) */
function clampLightness(L: number): number {
  return Math.max(30, Math.min(88, L));
}

/** 무채색(C*<8) 여부 — 배색 내 무채 상한 1칸 가드에 사용 */
function isAchromaticHex(hex: string): boolean {
  return calculateChroma(hexToLab(hex)) < ACHROMATIC_CHROMA_MAX;
}

/**
 * 날짜 → 정수 시드. 연·월·일만 사용해 하루 동안 불변(결정론).
 * (Date.now 대신 달력값을 써서 같은 날 재호출 시 동일 결과 보장)
 */
function dateSeed(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/**
 * 명도만 지정값으로 바꾼 변형색 — hue·채도(a*, b*) 보존, L*는 [30, 88] 클램프.
 * 왜 클램프: 극단 명도 베이스에서 파생색이 검정/흰색으로 붕괴해 "색"이 사라지는 것을 막는다.
 */
function withLightness(hex: string, targetL: number): string {
  const lab = hexToLab(hex);
  return labToHex({ L: clampLightness(targetL), a: lab.a, b: lab.b });
}

/**
 * 명도만 이동한 변형색 — 상·하의 명도 격차(대비) 조절용.
 * 밝은 base는 어둡게, 어두운 base는 밝게 밀어 자연스러운 방향으로 격차를 만든다.
 */
function shiftLightness(hex: string, delta: number): string {
  return withLightness(hex, hexToLab(hex).L + delta);
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

/**
 * 배색을 받쳐주는 중립 신발색 — 밝은 상의는 어두운 신발, 어두운 상의는 밝은 신발(결정론).
 * 저대비(low) 퍼스널 대비에서 밝은 베이스일 때만 차콜 대신 중명도 그레이(L*≈61 무채) —
 * 톤온톤으로 좁힌 상·하의 옆에서 차콜의 강한 명암 점프가 저대비 처방을 깨기 때문.
 * 그 외 전 경로는 현행(차콜/아이보리) 유지 — 뉴트럴 정직 계약(색 지어내기 없음).
 */
function neutralShoes(baseL: number, contrast?: OutfitContrast): OutfitColor {
  if (contrast === 'low' && baseL > 55) {
    return { hex: '#8E939B', role: '신발', name: '그레이' };
  }
  return baseL > 55
    ? { hex: '#3A3A3C', role: '신발', name: '차콜' }
    : { hex: '#ECE6DC', role: '신발', name: '아이보리' };
}

/**
 * 포인트 색 — 합성 보색 대신 진단 팔레트 안에서 최고 채도 색을 고른다(결정론).
 * 왜: 베스트 팔레트가 뉴트럴로 수렴한 날 보색 합성마저 저채도라 포인트가 죽는다.
 * 진단 hex 내 선택이므로 채도 증폭·색 지어내기 없음(정직성).
 *
 * 중복 배정 방지(2026-08): 뮤트 베이스 경로는 하의·가방도 진단 팔레트에서 직접 뽑기 때문에
 * 배제 없이 최고 채도만 고르면 같은 hex가 하의(또는 가방)와 포인트에 동시에 배정된다.
 * 결정론이라 그 조합이 매일 반복되므로, 이미 배정된 hex를 먼저 배제한다.
 * 후보 소진 시(좁은 팔레트) 기존 폴백 순서로 되돌아간다: 베이스 제외 → 전체(1색 팔레트).
 */
function pickPointColor(
  valid: ReadonlyArray<{ name?: string; hex?: string }>,
  baseHex: string,
  assignedHexes: ReadonlyArray<string> = []
): OutfitColor {
  const used = new Set([baseHex, ...assignedHexes].map((hex) => hex.toLowerCase()));
  const unused = valid.filter((c) => !used.has((c.hex as string).toLowerCase()));
  const others = valid.filter((c) => (c.hex as string).toLowerCase() !== baseHex.toLowerCase());

  let pool: ReadonlyArray<{ name?: string; hex?: string }> = unused;
  if (pool.length === 0) pool = others;
  if (pool.length === 0) pool = valid;

  let best = pool[0];
  let bestChroma = -1;
  for (const candidate of pool) {
    const chroma = calculateChroma(hexToLab(candidate.hex as string));
    if (chroma > bestChroma) {
      bestChroma = chroma;
      best = candidate;
    }
  }

  const hex = best.hex as string;
  // 진단된 원본 이름 그대로(있으면) — 파생색이 아니므로 계열명 폴백은 이름 없을 때만
  return { hex, role: '포인트', name: best.name?.trim() || colorFamilyName(hex) };
}

/**
 * 뮤트 베이스 하의 — 진단 팔레트에서 상의와 명도 격차(|ΔL*|)가 가장 큰 색을 직접 선정.
 * 왜: 뮤트 베이스에서 analogous 회전은 L*·C*를 보존해 상·하의가 같은 덩어리로 보인다.
 * 진단 원본 hex·이름을 그대로 유지(색 지어내기 없음). 무채 상한 1칸: 베이스가 이미
 * 무채(C*<8)면 유채 후보를 우선한다(유채가 하나도 없으면 전체 허용).
 * 최대 격차가 MIN_BOTTOM_L_GAP 미만이면(1색 팔레트 등) 명도 이동 파생으로 폴백
 * — 파생은 진단 hue·채도를 보존한 명도 이동이라 채도 증폭이 아니다.
 */
function pickMutedBottom(
  valid: ReadonlyArray<{ name?: string; hex?: string }>,
  baseHex: string,
  baseL: number
): OutfitColor {
  const chromatic = valid.filter((c) => !isAchromaticHex(c.hex as string));
  const pool = isAchromaticHex(baseHex) && chromatic.length > 0 ? chromatic : valid;

  let best = pool[0];
  let bestGap = -1;
  for (const candidate of pool) {
    const gap = Math.abs(hexToLab(candidate.hex as string).L - baseL);
    if (gap > bestGap) {
      bestGap = gap;
      best = candidate;
    }
  }

  if (bestGap >= MIN_BOTTOM_L_GAP) {
    const hex = best.hex as string;
    return { hex, role: '하의', name: best.name?.trim() || colorFamilyName(hex) };
  }
  // 폴백: 명도 격차 보장(밝은 베이스는 어둡게, 어두운 베이스는 밝게)
  const hex = withLightness(baseHex, baseL > 50 ? baseL - 18 : baseL + 18);
  return { hex, role: '하의', name: colorFamilyName(hex) };
}

/**
 * 뮤트 베이스 가방 — 상의·하의 모두와의 색차(ΔE00) 최솟값이 가장 큰 진단색(maximin).
 * 무채 상한 1칸: 상의·하의에 이미 무채가 있으면 유채 후보를 우선(차순위 유채 교체).
 * 최대 점수가 MIN_BAG_DELTA_E 미만이면(팔레트가 좁아 구분 불가) 명도 이동 파생으로 폴백
 * — 폴백 명도는 ±34 두 후보 중 상·하의와의 명도 거리가 더 큰 쪽(결정론: 동률이면 밝은 쪽).
 */
function pickMutedBag(
  valid: ReadonlyArray<{ name?: string; hex?: string }>,
  baseHex: string,
  bottomHex: string,
  baseL: number
): OutfitColor {
  const usedAchromatic = isAchromaticHex(baseHex) || isAchromaticHex(bottomHex);
  const chromatic = valid.filter((c) => !isAchromaticHex(c.hex as string));
  const pool = usedAchromatic && chromatic.length > 0 ? chromatic : valid;

  const baseLab = hexToLab(baseHex);
  const bottomLab = hexToLab(bottomHex);
  let best = pool[0];
  let bestScore = -1;
  for (const candidate of pool) {
    const lab = hexToLab(candidate.hex as string);
    const score = Math.min(calculateCIEDE2000(lab, baseLab), calculateCIEDE2000(lab, bottomLab));
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  if (bestScore >= MIN_BAG_DELTA_E) {
    const hex = best.hex as string;
    return { hex, role: '가방', name: best.name?.trim() || colorFamilyName(hex) };
  }
  // 폴백: 밝은/어두운 두 후보 중 상·하의 어느 쪽과도 명도 거리가 최대인 쪽(클램프 반영)
  const bottomL = bottomLab.L;
  const lighter = clampLightness(baseL + 34);
  const darker = clampLightness(baseL - 34);
  const scoreOf = (L: number): number => Math.min(Math.abs(L - baseL), Math.abs(L - bottomL));
  const targetL = scoreOf(lighter) >= scoreOf(darker) ? lighter : darker;
  const hex = withLightness(baseHex, targetL);
  return { hex, role: '가방', name: colorFamilyName(hex) };
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
  const baseLab = hexToLab(baseHex);
  const baseL = baseLab.L;
  // 뮤트 베이스(C*<15): analogous 회전 파생이 지각 불가 색차로 수렴 → 팔레트 직접 선정으로 전환
  const isMutedBase = calculateChroma(baseLab) < MUTED_CHROMA_MAX;

  // 유사색 2개(-spread, +spread) — 유채 베이스에서만 하의(기본)·가방에 배색 파생으로 사용
  const neighbors = analogous(baseHex, 30);
  const bottomNeighbor = neighbors[seed % neighbors.length];
  const bagNeighbor = neighbors[(seed + 1) % neighbors.length];

  // 하의: 대비 수준(ADR-116) → 뮤트 팔레트 선정 → 유사색(하위호환) 순으로 결정
  let bottom: OutfitColor;
  if (contrast === 'high') {
    // 명암 격차 큰 조합: 밝은 base는 어둡게, 어두운 base는 밝게
    const hex = shiftLightness(baseHex, baseL > 50 ? -35 : 35);
    bottom = { hex, role: '하의', name: colorFamilyName(hex) };
  } else if (contrast === 'low') {
    // 톤온톤: 인접 명도(작은 격차)로 좁혀 얼굴이 묻히지 않게
    const hex = shiftLightness(baseHex, baseL > 50 ? -8 : 8);
    bottom = { hex, role: '하의', name: colorFamilyName(hex) };
  } else if (isMutedBase) {
    bottom = pickMutedBottom(valid, baseHex, baseL);
  } else {
    bottom = { hex: bottomNeighbor, role: '하의', name: colorFamilyName(bottomNeighbor) };
  }

  // 가방: 뮤트 베이스면 팔레트 maximin 선정, 유채 베이스면 기존 유사색 파생(불변)
  const bag: OutfitColor = isMutedBase
    ? pickMutedBag(valid, baseHex, bottom.hex, baseL)
    : { hex: bagNeighbor, role: '가방', name: colorFamilyName(bagNeighbor) };

  // 포인트: 진단 팔레트 중 최고 채도 색 — 이미 배정된 하의·가방 hex는 배제(중복 배정 방지)
  const point = pickPointColor(valid, baseHex, [bottom.hex, bag.hex]);

  return {
    baseName: base.name?.trim() || '베스트 컬러',
    colors: [
      // 상의: 진단된 원본 이름 사용(있으면), 없으면 실제 색의 계열명
      { hex: baseHex, role: '상의', name: base.name?.trim() || colorFamilyName(baseHex) },
      // 하의: 뮤트=진단 원본 유지 / 유채=배색 파생 계열명(지어내지 않음)
      bottom,
      // 신발: 배색을 받쳐주는 중립색(저대비+밝은 베이스만 그레이 분기 — 위 neutralShoes 주석)
      neutralShoes(baseL, contrast),
      // 가방: 뮤트=진단 원본 유지 / 유채=다른 유사색 계열명
      bag,
      // 포인트: 진단 팔레트 내 최고 채도 색(원본 이름 유지)
      point,
    ],
  };
}
