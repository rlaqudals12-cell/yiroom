/**
 * 제품 이미지 백필 — 순수 정규화·매칭·페이로드 로직 (네트워크/DB 없음)
 *
 * @description
 *   `backfill-product-images.mts`(CLI)에서 분리한 순수 함수 모음.
 *   네이버 쇼핑 검색 결과를 받아 대상 제품(브랜드+이름)과 대조하고,
 *   "확실히 같은 제품일 때만" 이미지 URL을 채택한다.
 *
 *   보존/정직성 원칙:
 *   - 이미 이미지가 있는 행은 절대 건드리지 않는다(`needsBackfill` 가드).
 *   - 매칭 가드: 브랜드 일치 + 이름 유사도 임계치. 애매하면 스킵(unmatched).
 *     "틀린 이미지"는 "이미지 없음"보다 나쁘므로 보수적으로 판정한다.
 *   - image_url 외의 컬럼은 절대 만들지 않는다(`buildImagePatch`).
 *
 * @see scripts/backfill-product-images.mts · docs/plans/2026-07-07-roadmap-to-companion.md Phase 3
 */

// ── 지원 테이블 ────────────────────────────────────────────────────────────────

/** 이미지 백필 지원 테이블 — 둘 다 name/brand/image_url 컬럼 보유 */
export const SUPPORTED_TABLES = ['cosmetic_products', 'supplement_products'] as const;
export type SupportedTable = (typeof SUPPORTED_TABLES)[number];

// ── 타입 ──────────────────────────────────────────────────────────────────────

/** DB에서 읽는 최소 부분집합 (cosmetic_products / supplement_products 공통) */
export interface ProductRow {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
}

/** 네이버 쇼핑 검색 item 중 백필이 읽는 필드 */
export interface NaverShopItem {
  title: string;
  image: string;
  link?: string;
  brand?: string;
  maker?: string;
  /** 1~3=일반상품, 4~6=중고, 7~9=단종/예정 */
  productType?: string;
}

/** 한 제품에 대한 백필 판정 결과 */
export type BackfillDecision =
  | { status: 'matched'; imageUrl: string; score: number; matchedTitle: string }
  | { status: 'unmatched'; reason: string; bestScore: number; bestTitle: string | null }
  | { status: 'skip'; reason: string };

// ── 임계치 ──────────────────────────────────────────────────────────────────────

/** 최소 이름 유사도(브랜드 일치 전제). 이 미만이면 채택하지 않음 */
export const MIN_SIMILARITY = 0.5;
/** 이 유사도 이상이면 브랜드 표기가 달라도(영문↔한글) 같은 제품으로 인정 */
export const HIGH_CONFIDENCE_SIMILARITY = 0.8;

// ── 정규화 ──────────────────────────────────────────────────────────────────────

/** 네이버 title의 `<b>` 등 태그 제거 */
export function stripHtml(raw: string): string {
  return raw.replace(/<[^>]{0,100}>/g, '');
}

/**
 * 매칭용 정규화: HTML 제거 → 소문자 → 한글/영숫자 외 문자를 공백 → 연속 공백 축약.
 * 특수문자·괄호·기호로 인한 토큰 어긋남을 없앤다.
 */
export function normalize(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return stripHtml(raw)
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 포함 비교용 키: 정규화 후 모든 공백 제거 (브랜드 포함 판정) */
export function matchKey(raw: unknown): string {
  return normalize(raw).replace(/\s+/g, '');
}

/**
 * 토큰화: 정규화 후 공백 분리. 노이즈 억제를 위해
 * 길이 2+ 토큰 또는 숫자 포함 토큰(색상 호수 등)만 남긴다.
 */
export function tokenize(raw: unknown): string[] {
  return normalize(raw)
    .split(' ')
    .filter((t) => t.length >= 2 || /\d/.test(t));
}

/**
 * 이름 유사도: 제품명 토큰 중 후보 제목에 포함된 비율 (0~1).
 * 분모가 제품명이므로 "제품명이 제목에 얼마나 담겼는가"를 본다.
 */
export function similarity(productName: string, itemTitle: string): number {
  const p = tokenize(productName);
  if (p.length === 0) return 0;
  const t = new Set(tokenize(itemTitle));
  let hit = 0;
  for (const tok of new Set(p)) if (t.has(tok)) hit++;
  return hit / new Set(p).size;
}

// ── 가드 ────────────────────────────────────────────────────────────────────────

/** 백필 대상 여부: image_url이 null/빈문자열/placeholder면 true */
export function needsBackfill(row: Pick<ProductRow, 'image_url'>): boolean {
  const u = row.image_url;
  if (u === null || u === undefined) return true;
  if (u.trim() === '') return true;
  return /placehold/i.test(u);
}

/** 사용 가능한 이미지 URL인가 (http(s) + placeholder 아님) */
export function isUsableImageUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  if (!/^https?:\/\//i.test(url.trim())) return false;
  return !/placehold/i.test(url);
}

/**
 * 브랜드 일치 가드.
 * 브랜드가 없거나 너무 짧으면(신뢰 불가) true(차단 안 함) — 유사도로만 판정.
 * 있으면 후보의 제목/브랜드/제조사 중 하나에 브랜드 키가 포함되어야 통과.
 */
export function hasBrandMatch(brand: string | null, item: NaverShopItem): boolean {
  const bk = matchKey(brand);
  if (bk.length < 2) return true;
  const haystack = [matchKey(item.title), matchKey(item.brand), matchKey(item.maker)].join('|');
  return haystack.includes(bk);
}

// ── 검색어 / 페이로드 ────────────────────────────────────────────────────────────

/** 검색어 = "브랜드 제품명" (브랜드 없으면 제품명만) */
export function buildSearchQuery(row: Pick<ProductRow, 'name' | 'brand'>): string {
  return `${(row.brand ?? '').trim()} ${row.name}`.replace(/\s+/g, ' ').trim();
}

/** 업데이트 페이로드 — image_url만. 다른 컬럼은 절대 만들지 않는다 */
export function buildImagePatch(imageUrl: string): { image_url: string } {
  return { image_url: imageUrl };
}

// ── 매칭 판정 ────────────────────────────────────────────────────────────────────

/**
 * 제품 행 + 검색 결과 목록 → 백필 판정.
 *
 * 정책(보수적):
 *  1) 이미 이미지가 있으면 skip (덮어쓰기 방지 이중 가드).
 *  2) 후보를 관련도 순(네이버 sim 정렬 가정)으로 보며 첫 "채택 가능" 항목을 선택.
 *     채택 조건: 유사도 ≥ HIGH_CONFIDENCE (브랜드 무관) 또는
 *               (브랜드 일치 && 유사도 ≥ MIN_SIMILARITY).
 *  3) 채택 실패 시 unmatched — 사유는 최고 후보 기준(브랜드 불일치 / 유사도 낮음).
 */
export function chooseImage(row: ProductRow, items: NaverShopItem[]): BackfillDecision {
  if (!needsBackfill(row)) {
    return { status: 'skip', reason: '이미 이미지 있음' };
  }

  let best: { score: number; title: string | null; brandOk: boolean } = {
    score: -1,
    title: null,
    brandOk: false,
  };

  for (const item of items) {
    // 일반 상품(1~3)만 — 중고/단종 제외 (productType 없으면 통과)
    if (item.productType && !['1', '2', '3'].includes(item.productType)) continue;
    if (!isUsableImageUrl(item.image)) continue;

    const title = stripHtml(item.title);
    const score = similarity(row.name, title);
    const brandOk = hasBrandMatch(row.brand, item);

    const accept = score >= HIGH_CONFIDENCE_SIMILARITY || (brandOk && score >= MIN_SIMILARITY);
    if (accept) {
      return { status: 'matched', imageUrl: item.image, score, matchedTitle: title };
    }

    if (score > best.score) best = { score, title, brandOk };
  }

  if (best.score < 0) {
    return { status: 'unmatched', reason: '검색 결과·이미지 없음', bestScore: 0, bestTitle: null };
  }
  const reason = best.brandOk ? '유사도 낮음' : '브랜드 불일치';
  return { status: 'unmatched', reason, bestScore: best.score, bestTitle: best.title };
}

// ── 요약 ────────────────────────────────────────────────────────────────────────

export interface DecisionSummary {
  matched: number;
  unmatched: number;
  skipped: number;
}

/** 판정 목록 집계 (CLI 리포트용) */
export function summarizeDecisions(decisions: BackfillDecision[]): DecisionSummary {
  const summary: DecisionSummary = { matched: 0, unmatched: 0, skipped: 0 };
  for (const d of decisions) {
    if (d.status === 'matched') summary.matched++;
    else if (d.status === 'unmatched') summary.unmatched++;
    else summary.skipped++;
  }
  return summary;
}
