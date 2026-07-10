/**
 * 성분 DB 조인 매칭 (L1 규제 레이어, ADR-112)
 *
 * @module lib/scan/ingredient-db-match
 * @description
 *   OCR/바코드로 얻은 성분명 리스트를 `cosmetic_ingredients` 테이블과 정규화 매칭한다.
 *   - 소문자·공백제거·부분일치로 별칭(name_ko/name_en/name_inci/aliases)까지 대조.
 *   - 매칭 실패 성분은 어떤 필드도 반환하지 않는다(추정 금지, 정직성 원칙).
 *   - N+1 방지: 성분 리스트당 DB 쿼리 1회. 현재 테이블 규모(~97행)에서 전량 조회 후
 *     인메모리 매칭이 INCI 특수문자(쉼표·괄호)로 인한 필터 인젝션 없이 가장 안전하다.
 *   - 모바일: RLS 하에서 cosmetic_ingredients는 공개 읽기(참조 테이블). 조회 실패 시
 *     빈 배열을 반환해 판정 자체는 계속 진행한다.
 *
 * @see docs/adr/ADR-112-product-fit-scan.md (결정 1, 2)
 * @see docs/specs/SDD-PRODUCT-FIT-SCAN.md §3
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** cosmetic_ingredients 조회 컬럼 (마이그 202601040100 기준) */
interface CosmeticIngredientRow {
  name_ko: string | null;
  name_en: string | null;
  name_inci: string | null;
  aliases: string[] | null;
  ewg_score: number | null;
  is_caution_20: boolean | null;
  is_allergen: boolean | null;
  allergen_type: string | null;
}

/** 성분 1건의 DB 매칭 결과 (매칭된 성분만 생성됨) */
export interface IngredientDbMatch {
  /** 입력 성분명 (원본) */
  input: string;
  /** DB 표준명 (name_ko 우선) */
  matchedName?: string;
  /** EWG 안전성 등급 (1-10) */
  ewgGrade?: number;
  /** 20대 주의 성분 여부 */
  isCaution20?: boolean;
  /** 알레르기 유발 성분 여부 */
  isAllergen?: boolean;
  /** 알레르기 유형 (향료·방부제 등) */
  allergenType?: string;
}

/** 규제 사실 인용 종류 — 판단이 아닌 인용(원리 §1.2) */
export type RegulatoryKind = 'allergen25' | 'restricted' | 'caution20';

/** 규제 정보 항목 (사실 인용형 라벨) */
export interface RegulatoryFlag {
  ingredient: string;
  kind: RegulatoryKind;
  label: string;
}

const SELECT_COLUMNS =
  'name_ko, name_en, name_inci, aliases, ewg_score, is_caution_20, is_allergen, allergen_type';

/** 전량 조회 상한 — 인메모리 매칭 최악 케이스 방어 */
const FETCH_LIMIT = 5000;

/** 소문자화 + 공백 전체 제거 (정규화) */
function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '').trim();
}

/** 한 행의 대조 후보(정규화된 이름 집합) */
function candidatesOf(row: CosmeticIngredientRow): string[] {
  const raw = [row.name_ko, row.name_en, row.name_inci, ...(row.aliases ?? [])];
  const out: string[] = [];
  for (const r of raw) {
    if (!r) continue;
    const n = normalize(r);
    if (n) out.push(n);
  }
  return out;
}

/**
 * 정규화된 입력에 매칭되는 행을 찾는다.
 * 1) 정확 일치 우선 → 2) 부분일치(양방향, 짧은 쪽 길이 ≥ 2 가드)로 오탐 최소화.
 * DB 순서대로 첫 매칭 반환(결정론).
 */
function findRow(norm: string, rows: CosmeticIngredientRow[]): CosmeticIngredientRow | undefined {
  if (norm.length < 2) return undefined;

  for (const row of rows) {
    if (candidatesOf(row).some((c) => c === norm)) return row;
  }
  for (const row of rows) {
    const hit = candidatesOf(row).some(
      (c) => c.length >= 2 && (c.includes(norm) || norm.includes(c))
    );
    if (hit) return row;
  }
  return undefined;
}

/**
 * 성분명 리스트를 `cosmetic_ingredients`와 매칭.
 * DB 쿼리 1회 후 인메모리 대조. 매칭된 성분만 반환한다(추정 금지).
 */
export async function matchIngredientsToDb(
  ingredientNames: string[],
  supabase: SupabaseClient
): Promise<IngredientDbMatch[]> {
  if (ingredientNames.length === 0) return [];

  const { data, error } = await supabase
    .from('cosmetic_ingredients')
    .select(SELECT_COLUMNS)
    .limit(FETCH_LIMIT);

  if (error) {
    console.error('[ingredient-db-match] 조회 실패:', error);
    return [];
  }

  const rows = (data ?? []) as unknown as CosmeticIngredientRow[];
  if (rows.length === 0) return [];

  const results: IngredientDbMatch[] = [];
  const seenInputs = new Set<string>();
  const seenRows = new Set<string>();

  for (const original of ingredientNames) {
    const norm = normalize(original);
    if (!norm || seenInputs.has(norm)) continue;
    seenInputs.add(norm);

    const row = findRow(norm, rows);
    if (!row) continue;

    // 같은 DB 행은 한 번만 보고 (INCI·국문명이 동일 성분을 가리키는 중복 방지)
    const rowKey = row.name_inci ?? row.name_ko ?? row.name_en ?? '';
    if (seenRows.has(rowKey)) continue;
    seenRows.add(rowKey);

    results.push({
      input: original,
      matchedName: row.name_ko ?? row.name_inci ?? undefined,
      ewgGrade: row.ewg_score ?? undefined,
      isCaution20: row.is_caution_20 ?? undefined,
      isAllergen: row.is_allergen ?? undefined,
      allergenType: row.allergen_type ?? undefined,
    });
  }

  return results;
}

/**
 * DB 매칭 결과 → 규제 정보(사실 인용형).
 * 알레르겐 25종 데이터가 DB에 채워지기 전이라도 kind 체계는 유지한다.
 * 한 성분이 알레르겐이면서 주의 성분이면 각각 별도 항목으로 생성된다.
 */
export function buildRegulatoryFlags(matches: IngredientDbMatch[]): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  for (const m of matches) {
    const name = m.matchedName ?? m.input;

    if (m.isAllergen) {
      flags.push({
        ingredient: name,
        kind: 'allergen25',
        label: m.allergenType
          ? `식약처 지정 알레르기 유발 성분 (${m.allergenType})`
          : '식약처 지정 알레르기 유발 착향제',
      });
    }

    if (m.isCaution20) {
      flags.push({
        ingredient: name,
        kind: 'caution20',
        label: '20대 주의 성분으로 분류돼요',
      });
    }
  }

  return flags;
}
