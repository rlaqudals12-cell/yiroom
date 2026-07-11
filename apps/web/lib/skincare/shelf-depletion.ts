/**
 * 소진 예측 어댑터 — 개봉 후 사용기한(PAO) 기반 잔여일 추정 (ADR-117 루틴 v2)
 *
 * @module lib/skincare/shelf-depletion
 * @description
 *   내 제품함(user_product_shelf)의 openedAt/expiresAt으로 남은 사용일을 추정한다.
 *   ADR-117 v1의 inventory 이원화 봉인을 지키며, shelf 데이터만으로 가벼운 어댑터를 제공한다.
 *
 *   정직성: 데이터 없으면 null (지어내지 않음). expiresAt이 있으면 그 값 기준(high 신뢰),
 *   없고 openedAt만 있으면 카테고리별 표준 PAO로 추정(medium 신뢰).
 */

import type { ShelfItem } from '@/lib/scan/product-shelf';
import type { ProductCategory } from '@/types/skincare-routine';
import { detectProductCategory } from './shelf-routine-sync';

/** 소진 예측 결과 */
export interface ShelfDepletion {
  shelfItemId: string;
  name: string;
  /** 남은 사용일 (음수면 이미 초과) */
  daysRemaining: number;
  confidence: 'medium' | 'high';
}

/**
 * 카테고리별 표준 개봉 후 사용기한(개월).
 * 근거: 국제 화장품 PAO(Period After Opening) 표기 관행 — 개봉 후 안정성 기준.
 * 자차/세럼/앰플/오일/스팟/아이크림 6개월, 크림/토너/에센스/클렌저/마스크 12개월.
 */
const PAO_MONTHS_BY_CATEGORY: Record<ProductCategory, number> = {
  sunscreen: 6,
  serum: 6,
  ampoule: 6,
  oil: 6,
  spot_treatment: 6,
  eye_cream: 6,
  cream: 12,
  toner: 12,
  essence: 12,
  cleanser: 12,
  mask: 12,
};

/** 카테고리 불명 시 보수적 기본 PAO(개월) */
const DEFAULT_PAO_MONTHS = 12;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Date | ISO 문자열 | 타임스탬프 → 유효한 Date. 무효(null·NaN)면 null.
 *
 * ShelfItem 타입은 날짜 필드가 Date라고 약속하지만, API 응답을 그대로 JSON.parse해
 * 넘기는 소비처(예: 제품함 상세 `scan/shelf/[id]`)는 ISO 문자열을 담아 전달한다.
 * 여기서 강제 변환·NaN 가드하여 문자열에 `.getTime()`을 호출하는 런타임 크래시를
 * 원천 차단한다(ShelfItem-over-JSON 계약 불일치 방어).
 */
function toValidDate(value: Date | string | number | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * 제품 1개의 소진(사용기한) 예측.
 * expiresAt 우선(high) → openedAt + 카테고리 PAO(medium) → 둘 다 없으면 null.
 *
 * @param item 제품함 아이템
 * @param now 기준 시각(테스트 주입용, 기본 현재)
 */
export function estimateShelfDepletion(item: ShelfItem, now?: Date): ShelfDepletion | null {
  const today = now ?? new Date();

  // 1) 명시적 만료일 — 가장 신뢰도 높음 (문자열/무효 방어)
  const expiresAt = toValidDate(item.expiresAt);
  if (expiresAt) {
    return {
      shelfItemId: item.id,
      name: item.productName,
      daysRemaining: daysBetween(today, expiresAt),
      confidence: 'high',
    };
  }

  // 2) 개봉일 + 카테고리 표준 PAO 추정 (문자열/무효 방어)
  const openedAt = toValidDate(item.openedAt);
  if (openedAt) {
    const category = detectProductCategory(item);
    const months = category ? PAO_MONTHS_BY_CATEGORY[category] : DEFAULT_PAO_MONTHS;
    const expiry = new Date(openedAt);
    expiry.setMonth(expiry.getMonth() + months);
    return {
      shelfItemId: item.id,
      name: item.productName,
      daysRemaining: daysBetween(today, expiry),
      confidence: 'medium',
    };
  }

  // 3) 근거 없음 — 지어내지 않는다
  return null;
}
