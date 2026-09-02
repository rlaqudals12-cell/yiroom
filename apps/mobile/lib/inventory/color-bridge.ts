/**
 * 색상명 ↔ hex 브리지 + 코디 색 조화 판정.
 *
 * 웹 `lib/inventory/color-bridge.ts`의 결정론 계약을 그대로 미러한다.
 * 옷장 분류가 저장한 색상명은 정밀 측색값이 아니므로 하드 필터에는 쓰지 않고,
 * 기본 점수가 비슷한 상·하의 쌍의 재랭킹에만 사용한다.
 */

import { analyzeHarmony } from '../color/harmony';

const NAME_TO_HEX: Record<string, string> = {
  화이트: '#F5F5F5',
  아이보리: '#FFF8E7',
  크림: '#F5EBD8',
  블랙: '#1A1A1A',
  차콜: '#36454F',
  그레이: '#8E8E8E',
  실버: '#C0C0C0',
  베이지: '#D8C8A8',
  카멜: '#C19A6B',
  탄: '#D2B48C',
  브라운: '#7B4B2A',
  카키: '#8A7F4D',
  올리브: '#708238',
  네이비: '#1F3A5F',
  블루: '#3B6FB5',
  스카이블루: '#8EC5E8',
  데님: '#4A6D8C',
  민트: '#98D8C8',
  그린: '#4E8A50',
  옐로우: '#F2D33C',
  머스타드: '#D4A937',
  오렌지: '#E8853D',
  코랄: '#F08872',
  피치: '#F5B99E',
  핑크: '#F2A0B5',
  로즈: '#C97B8B',
  레드: '#C6373C',
  와인: '#722F37',
  버건디: '#6E1E2B',
  퍼플: '#7B5AA6',
  라벤더: '#B9A7D6',
  골드: '#CFA83C',
};

export function colorNameToHex(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  for (const [key, hex] of Object.entries(NAME_TO_HEX)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return hex;
    }
  }
  return null;
}

const NEUTRAL_CHROMA = 12;

export interface OutfitHarmony {
  kind: 'neutral-base' | 'tone-on-tone' | 'analogous' | 'complementary' | 'accent';
  tip: string;
}

/** 색을 해석할 수 없으면 null을 반환해 보너스를 지어내지 않는다. */
export function assessOutfitHarmony(
  topColors: string[] | undefined,
  bottomColors: string[] | undefined
): OutfitHarmony | null {
  const topHex = (topColors ?? []).map(colorNameToHex).find(Boolean);
  const bottomHex = (bottomColors ?? []).map(colorNameToHex).find(Boolean);
  if (!topHex || !bottomHex) return null;

  const top = analyzeHarmony(topHex).lch;
  const bottom = analyzeHarmony(bottomHex).lch;
  const topNeutral = top.chroma < NEUTRAL_CHROMA;
  const bottomNeutral = bottom.chroma < NEUTRAL_CHROMA;

  if (topNeutral && bottomNeutral) {
    return {
      kind: 'neutral-base',
      tip: '무채색 베이스 조합 — 립이나 액세서리로 포인트 컬러를 더하면 완성돼요',
    };
  }
  if (topNeutral || bottomNeutral) {
    return {
      kind: 'accent',
      tip: '무채색 + 컬러 조합 — 컬러 아이템이 자연스럽게 시선을 끌어요',
    };
  }

  let diff = Math.abs(top.hue - bottom.hue) % 360;
  if (diff > 180) diff = 360 - diff;

  if (diff <= 30) {
    return {
      kind: 'tone-on-tone',
      tip: '톤온톤 조합 — 같은 색 계열이라 차분하고 세련된 인상이에요',
    };
  }
  if (diff <= 70) {
    return {
      kind: 'analogous',
      tip: '유사색 조합 — 색이 자연스럽게 이어져 편안한 느낌이에요',
    };
  }
  if (diff >= 150) {
    return {
      kind: 'complementary',
      tip: '보색 대비 조합 — 서로를 돋보이게 하는 과감한 매치예요',
    };
  }
  return {
    kind: 'accent',
    tip: '색 대비가 있는 조합 — 생기 있는 인상을 줘요',
  };
}
