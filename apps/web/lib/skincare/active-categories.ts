/**
 * 활성 성분 카테고리 맵 — 보유 제품에서 활성(각질/레티노이드/비타민C/진정) 탐지
 *
 * @module lib/skincare/active-categories
 * @description
 *   스킨 사이클링·캡슐 화장대의 입력. 제품명·성분 배열에서 어떤 활성 카테고리를
 *   보유했는지 결정론적으로 탐지한다(랜덤·AI 없음). 별칭은 기존 정본
 *   (ingredient-timeline aliases · product-synergy 성분 키워드)을 재사용·확장한다.
 *
 * @see docs/adr/ADR-117-custom-routine-engine.md (v2 로드맵)
 * @see docs/research/claude-ai-research/2026-07-rx-advancement.md §1, §2
 */

import type { ShelfItem } from '@/lib/scan/product-shelf';

/** 활성 성분 카테고리 */
export type ActiveCategory = 'retinoid' | 'exfoliantAHA' | 'exfoliantBHA' | 'vitaminC' | 'soothing';

/**
 * 카테고리별 표시 라벨 + 매칭 별칭 (소문자 비교).
 * 별칭 = ingredient-timeline INGREDIENT_TIMELINES aliases + product-synergy 성분 키워드 병합.
 */
export const ACTIVE_INGREDIENT_CATEGORIES: Record<
  ActiveCategory,
  { label: string; aliases: string[] }
> = {
  retinoid: {
    label: '레티노이드',
    aliases: [
      '레티놀',
      'retinol',
      '레티닐',
      'retinyl',
      '레티날',
      'retinal',
      '레틴알데하이드',
      'retinaldehyde',
      '레티노이드',
      'retinoid',
      '트레티노인',
      'tretinoin',
      '아다팔렌',
      'adapalene',
    ],
  },
  exfoliantAHA: {
    label: 'AHA 각질 케어',
    aliases: [
      'aha',
      '아하',
      '글리콜릭애씨드',
      'glycolic acid',
      '글리콜산',
      '락틱애씨드',
      'lactic acid',
      '젖산',
      '만델릭애씨드',
      'mandelic acid',
    ],
  },
  exfoliantBHA: {
    label: 'BHA 각질 케어',
    aliases: ['bha', '비에이치에이', '살리실릭애씨드', 'salicylic acid', '살리실산'],
  },
  vitaminC: {
    label: '비타민C',
    aliases: [
      '비타민c',
      'vitamin c',
      'ascorbic acid',
      '아스코르빅애씨드',
      '아스코르빈산',
      '아스코르브산',
      '아스코빌',
      'ascorbyl',
    ],
  },
  soothing: {
    label: '진정·장벽',
    aliases: [
      '센텔라',
      'centella',
      '병풀',
      'cica',
      '시카',
      '마데카소사이드',
      'madecassoside',
      '판테놀',
      'panthenol',
      '알란토인',
      'allantoin',
      '알로에',
      'aloe',
      '세라마이드',
      'ceramide',
    ],
  },
};

/** 제품 1개의 검색 텍스트(제품명·브랜드·성분 INCI) 구성 (소문자) */
function itemSearchText(item: ShelfItem): string {
  return [
    item.productName,
    item.productBrand,
    ...(item.productIngredients?.map((i) => i.inciName) ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * 제품 1개가 보유한 활성 카테고리 집합 (결정론적).
 * 별칭이 하나라도 텍스트에 포함되면 해당 카테고리로 판정 — 커버되지 않으면 미판정(지어내지 않음).
 */
export function detectItemActives(item: ShelfItem): Set<ActiveCategory> {
  const text = itemSearchText(item);
  const detected = new Set<ActiveCategory>();
  for (const [category, { aliases }] of Object.entries(ACTIVE_INGREDIENT_CATEGORIES)) {
    if (aliases.some((alias) => text.includes(alias.toLowerCase()))) {
      detected.add(category as ActiveCategory);
    }
  }
  return detected;
}

/**
 * 제품함 전체에서 보유한 활성 카테고리 합집합 (결정론적).
 * 사이클링 엔진 입력 — "레티노이드/산 보유 여부"로 요일 배정.
 */
export function detectOwnedActives(shelfItems: ShelfItem[]): Set<ActiveCategory> {
  const owned = new Set<ActiveCategory>();
  for (const item of shelfItems) {
    for (const category of detectItemActives(item)) {
      owned.add(category);
    }
  }
  return owned;
}
