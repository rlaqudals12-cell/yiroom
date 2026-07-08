/**
 * 오늘의 배색 조합 — 진단된 베스트 컬러에서 상의·하의·포인트 3색을 도출한다.
 *
 * @module lib/color/daily-outfit
 * @description ADR-105 배색 엔진(lib/color/harmony)을 재사용해 "예쁜 색 하드코딩"이 아니라
 * 사용자의 퍼스널컬러 대표색을 토대로 오늘의 코디 배색을 계산한다.
 *  - 상의(base)  = 베스트 컬러(날짜 기준 회전 선택)
 *  - 하의(bottom) = 유사색(analogous) — 조화로운 기본 배색
 *  - 포인트(point) = 보색(complementary) — 가방·액세서리 한 점 악센트
 *
 * 결정론: 같은 날짜 + 같은 팔레트 → 항상 같은 조합. Math.random / Date.now 미사용
 * (날짜의 연·월·일만 시드로 사용 → 하루 안에서는 불변, 자정에 자연스럽게 바뀜).
 *
 * @see lib/color/harmony.ts
 */

import { analogous, complementary } from './harmony';

export type OutfitRole = '상의' | '하의' | '포인트';

export interface OutfitColor {
  hex: string;
  role: OutfitRole;
}

export interface DailyOutfitPalette {
  /** 기준 대표색 이름(상의 색) */
  baseName: string;
  /** [상의, 하의, 포인트] 순서 고정 */
  colors: [OutfitColor, OutfitColor, OutfitColor];
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
 * 오늘의 배색 조합 생성 — 순수 함수.
 * 유효한 베스트 컬러가 없으면 null(호출부에서 섹션 생략 — 정직성 가드).
 *
 * @param bestColors 진단된 베스트 컬러(hex 팔레트)
 * @param date 기준 날짜(기본 오늘) — 테스트에서 고정 주입
 */
export function composeDailyOutfit(
  bestColors: ReadonlyArray<{ name?: string; hex?: string }>,
  date: Date = new Date()
): DailyOutfitPalette | null {
  const valid = bestColors.filter((c) => isHex(c?.hex));
  if (valid.length === 0) return null;

  const seed = dateSeed(date);
  const base = valid[seed % valid.length];
  const baseHex = base.hex as string;

  // 유사색 2개(-spread, +spread) 중 날짜로 하나 선택 → 하의
  const neighbors = analogous(baseHex, 30);
  const bottomHex = neighbors[seed % neighbors.length];
  // 보색 → 포인트
  const pointHex = complementary(baseHex);

  return {
    baseName: base.name?.trim() || '베스트 컬러',
    colors: [
      { hex: baseHex, role: '상의' },
      { hex: bottomHex, role: '하의' },
      { hex: pointHex, role: '포인트' },
    ],
  };
}
