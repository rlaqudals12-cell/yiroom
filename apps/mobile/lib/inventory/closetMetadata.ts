/**
 * 옷장 등록 메타데이터 조립 (웹 계약 정본 포팅)
 *
 * 근본 원인: 모바일 등록 화면이 복수형 키(colors/seasons/occasions)와 다른 어휘('fall',
 * 'daily'/'work'/'sports')로 저장했는데, 매칭 로직(closetMatcher)은 웹 계약인 단수 키
 * (color/season/occasion)와 웹 어휘(autumn,
 * casual/formal/workout/date/travel/work/wedding_guest)를 읽는다.
 * → 색·계절·TPO 점수가 전부 기본값 50으로 고정돼 "추천"이 사실상 무작위였다.
 *
 * 정본 = apps/web/app/(main)/closet/add/page.tsx 의 저장 페이로드.
 * 키 계약을 이 한 곳에 고정하고 테스트로 못박는다.
 *
 * @module lib/inventory/closetMetadata
 */

import type { ClothingCategory, Occasion, Pattern, Season } from './types';

/**
 * 옷장 아이템 metadata JSONB 형상 (웹과 동일).
 *
 * `type` 별칭인 이유: InventoryItem.metadata(Record<string, unknown>)에 그대로
 * 대입하려면 암묵적 인덱스 시그니처가 필요하다(interface는 대입 불가).
 */
export type ClosetItemMetadata = {
  /** 색상 목록 — 단수 키 (웹 계약) */
  color: string[];
  /** 계절 목록 — 단수 키, 어휘는 autumn (fall 아님) */
  season: Season[];
  /** 착용 상황 목록 — 단수 키, 웹 어휘(casual/formal/workout/date/travel/work/wedding_guest) */
  occasion: Occasion[];
  /**
   * 영문 대분류 보존 — sub_category에는 한글 세부종류('티셔츠')가 들어갈 수 있어
   * 조립기(closetMatcher)가 쓸 대분류를 별도로 남긴다 (웹 2026-07-26 수리와 동일 계약)
   */
  clothingCategory: ClothingCategory;
  pattern?: Pattern;
  notes?: string;
};

export interface ClosetMetadataInput {
  colors: string[];
  seasons: Season[];
  occasions: Occasion[];
  clothingCategory: ClothingCategory;
  pattern?: Pattern;
  notes?: string;
}

/**
 * 등록 화면 입력을 웹 계약 metadata로 변환한다.
 *
 * @param input 등록 폼 값 (복수형 이름은 폼 로컬 상태 명칭일 뿐, 저장 키는 단수)
 * @returns user_inventory.metadata에 저장할 JSONB 객체
 */
export function buildClosetMetadata(input: ClosetMetadataInput): ClosetItemMetadata {
  const metadata: ClosetItemMetadata = {
    color: input.colors,
    season: input.seasons,
    occasion: input.occasions,
    clothingCategory: input.clothingCategory,
  };

  // 선택 항목은 값이 있을 때만 넣는다 (빈 문자열/undefined로 JSONB를 오염시키지 않음)
  if (input.pattern) metadata.pattern = input.pattern;

  const notes = input.notes?.trim();
  if (notes) metadata.notes = notes;

  return metadata;
}
