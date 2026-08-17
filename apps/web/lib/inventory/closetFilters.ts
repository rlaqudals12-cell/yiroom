/**
 * 옷장 목록 필터 (클라이언트 측 순수 함수)
 *
 * 근본 원인: 옷장 페이지가 카테고리를 `in('sub_category', ['top', ...])`으로,
 * 시즌을 `overlaps('metadata->season', ...)`으로 DB에 물었다.
 * - sub_category에는 한글 세부종류('티셔츠')가 저장되므로 영문 값 조회는 항상 0건.
 * - metadata->season은 jsonb라 배열 전용 연산자(overlaps)가 적용되지 않아 쿼리 자체가 실패.
 *
 * 두 필터 모두 "조회 후 클라이언트 필터"로 옮기고, 카테고리는 조립기(closetMatcher)·
 * 집계와 동일한 기준(resolveClothingCategory)을 쓴다 — 화면마다 기준이 갈리지 않게.
 *
 * @module lib/inventory/closetFilters
 */

import type { InventoryItem, Season } from '@/types/inventory';
import { toClothingItem } from '@/types/inventory';
import { resolveClothingCategory } from './clothingCategory';

export interface ClosetFilterCriteria {
  /** 영문 대분류 목록 (빈 배열 = 카테고리 무관) */
  categories?: string[];
  /** 시즌 목록 (빈 배열 = 시즌 무관). "하나라도 포함"(OR) 의미 */
  seasons?: string[];
}

/** 아이템이 선택된 카테고리 중 하나에 속하는지 — 미매핑 아이템은 제외(추측 금지) */
function matchesCategory(item: InventoryItem, categories: string[]): boolean {
  if (categories.length === 0) return true;
  const resolved = resolveClothingCategory(item);
  return resolved !== null && categories.includes(resolved);
}

/** 아이템 시즌 태그가 선택된 시즌과 하나라도 겹치는지 — 태그 없는 아이템은 제외 */
function matchesSeason(item: InventoryItem, seasons: string[]): boolean {
  if (seasons.length === 0) return true;
  // toClothingItem이 season 부재를 빈 배열로 정규화한다 (태그 없는 아이템 = 매칭 없음)
  const itemSeasons: Season[] = toClothingItem(item).metadata.season;
  return itemSeasons.some((s) => seasons.includes(s));
}

/**
 * 옷장 아이템을 카테고리·시즌 기준으로 거른다.
 *
 * @param items 조회된 옷장 아이템
 * @param criteria 선택된 필터 (빈 배열/미지정이면 해당 축은 통과)
 */
export function filterClosetItems(
  items: InventoryItem[],
  criteria: ClosetFilterCriteria
): InventoryItem[] {
  const categories = criteria.categories ?? [];
  const seasons = criteria.seasons ?? [];
  if (categories.length === 0 && seasons.length === 0) return items;

  return items.filter((item) => matchesCategory(item, categories) && matchesSeason(item, seasons));
}

/**
 * 이름·브랜드 검색용 PostGREST `or()` 필터 문자열을 안전하게 조립한다.
 *
 * 왜: 검색어를 그대로 `name.ilike.%검색어%,brand.ilike.%검색어%`에 끼워 넣으면
 * 쉼표·괄호가 필터 구분자로 해석돼 조건이 쪼개지거나 쿼리가 통째로 실패한다
 * (사용자에겐 "검색만 하면 옷장이 빈다"로 보인다). 값 전체를 큰따옴표로 감싸고
 * 따옴표·역슬래시만 이스케이프하면 예약문자를 리터럴로 넘길 수 있다.
 *
 * `%`는 의도된 와일드카드라 그대로 둔다(사용자가 넣으면 범위가 넓어질 뿐 오작동 아님).
 */
export function buildClosetSearchFilter(query: string): string {
  const escaped = query.replace(/["\\]/g, (char) => `\\${char}`);
  return `name.ilike."%${escaped}%",brand.ilike."%${escaped}%"`;
}
