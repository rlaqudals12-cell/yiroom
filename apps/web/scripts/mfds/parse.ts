/**
 * 식약처 성분 임포트 — 순수 파싱·정규화·업서트 계획 로직 (네트워크/DB 없음)
 *
 * @description
 *   `import-mfds-ingredients.mts`(CLI)에서 분리한 순수 함수 모음.
 *   네트워크 응답을 받아 `cosmetic_ingredients` 스키마에 맞는 레코드로 정규화하고,
 *   기존 행과 대조해 "빈 필드만 채우는" 업서트 계획(inserts/updates)을 만든다.
 *
 *   이 파일만으로 dry-run 파싱 검증이 가능해야 하므로, 실제 API 필드명이
 *   확정되기 전에도 여러 후보 키에서 값을 뽑는 관용적 추출기를 사용한다.
 *   (첫 실호출 응답의 원본 키는 CLI dry-run이 로그로 출력 → 필요 시 후보 목록 보강)
 *
 * @see docs/specs/SDD-PRODUCT-FIT-SCAN.md §4 · docs/adr/ADR-112-product-fit-scan.md
 */

// ── 스키마 대응 타입 (마이그 202601040100) ───────────────────────────────────

/** cosmetic_ingredients 중 임포트가 읽고 쓰는 부분집합 */
export interface IngredientRow {
  id: string;
  name_ko: string;
  name_en: string | null;
  name_inci: string | null;
  aliases: string[] | null;
  ewg_score: number | null;
  ewg_data_availability: string | null;
  category: string;
  functions: string[] | null;
  is_caution_20: boolean | null;
  is_allergen: boolean | null;
  allergen_type: string | null;
  description: string | null;
  benefits: string[] | null;
  concerns: string[] | null;
  source: string | null;
}

/** insert 시 사용하는 행(부분) — id/타임스탬프는 DB 기본값 */
export interface IngredientInsert {
  name_ko: string;
  name_en: string | null;
  name_inci: string | null;
  aliases: string[] | null;
  category: string;
  description: string | null;
  concerns: string[] | null;
  source: string;
}

/** 정규화된 수집 레코드 (원료성분 + 규제정보를 이름 키로 병합한 결과) */
export interface IncomingRecord {
  nameKo: string;
  nameEn: string | null;
  nameInci: string | null;
  /** INCI 비교 키 (소문자·공백제거). INCI 없으면 null */
  inciKey: string | null;
  /** 국문명 비교 키 (소문자·공백제거) */
  koKey: string;
  aliases: string[];
  category: string;
  description: string | null;
  concerns: string[];
  source: string;
}

export interface UpdatePlan {
  id: string;
  patch: Partial<IngredientRow>;
}

export interface UpsertPlan {
  inserts: IngredientInsert[];
  updates: UpdatePlan[];
}

// ── 상수 ──────────────────────────────────────────────────────────────────────

export const SOURCE_INGREDIENT = '식약처 화장품 원료성분 정보 API (data.go.kr 15111774)';
export const SOURCE_REGULATION = '식약처 화장품 규제(사용제한) 정보 API (data.go.kr 15111773)';
export const DEFAULT_CATEGORY = '미분류';

/**
 * 실제 API 필드명이 확정되기 전 관용 추출을 위한 후보 키 목록.
 * 첫 실호출 응답을 보고 필요 시 여기만 보강하면 된다.
 */
export const FIELD_CANDIDATES = {
  nameKo: ['INGR_KOR_NAME', 'KOR_NAME', 'CHEMICAL_NAME_KOR', 'ingrKorName', 'korName', 'name_ko'],
  nameEn: ['INGR_ENG_NAME', 'ENG_NAME', 'CHEMICAL_NAME_ENG', 'ingrEngName', 'engName', 'name_en'],
  nameInci: ['INCI_NAME', 'INCI_NM', 'inciName', 'name_inci'],
  cas: ['CAS_NO', 'CAS_NUM', 'casNo', 'CAS'],
  definition: ['DEFINITION', 'ORIGIN_MAJOR_KOR_NAME', 'DEFN', 'definition', 'DESCRIPTION'],
  // 규제정보(15111773)
  limitContent: [
    'LIMIT_CONTENT',
    'USE_LIMIT',
    'MIXTURE_QY',
    'SPEC_CONTENT',
    'LIMIT_STANDRD',
    'limitContent',
  ],
  prohibitFlag: ['PROHIBI_YN', 'PROHIBIT_YN', 'BAN_YN', 'USE_YN'],
  regKindText: ['DIVISION', 'DIV', 'KIND', 'TYPE', 'GUBUN', 'GBN', 'division'],
} as const;

// ── 정규화 ────────────────────────────────────────────────────────────────────

/**
 * 전각 ASCII(U+FF01~FF5E)·전각 공백(U+3000)을 반각으로 변환.
 * 식약처 원본에 종종 섞여있는 전각 문자를 통일한다.
 */
export function toHalfWidth(input: string): string {
  return input
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ');
}

/** 성분명 정규화: 전각→반각, 트림, 연속 공백 1칸 */
export function normalizeName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return toHalfWidth(raw).replace(/\s+/g, ' ').trim();
}

/** 비교 키: 소문자 + 모든 공백 제거 (매칭·중복 판정용) */
export function compareKey(name: string): string {
  return normalizeName(name).toLowerCase().replace(/\s+/g, '');
}

/**
 * 괄호 병기 분리: "나이아신아마이드(니코틴아마이드)" → primary + aliases.
 * 짝이 맞는 첫 괄호만 처리하고, 괄호가 없으면 aliases는 빈 배열.
 */
export function splitParenthetical(raw: unknown): { primary: string; aliases: string[] } {
  const name = normalizeName(raw);
  const m = name.match(/^(.*?)[（(]([^（）()]+)[)）]\s*(.*)$/);
  if (!m) return { primary: name, aliases: [] };
  const primary = `${m[1].trim()} ${m[3].trim()}`.trim();
  const aliases = m[2]
    .split(/[,，/·]/)
    .map((s) => normalizeName(s))
    .filter((s) => s.length > 0);
  return { primary: primary || name, aliases };
}

// ── 응답 봉투 파싱 ────────────────────────────────────────────────────────────

/** 값을 배열로 강제 (단일 객체·null 안전) */
function asArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v === null || v === undefined) return [];
  return [v as T];
}

/**
 * data.go.kr 응답의 다양한 봉투 형태에서 item 배열을 뽑는다.
 * 지원: {response:{body:{items:{item:[]}}}} / {body:{items:[]}} / {items:[]} / {data:[]}
 */
export function extractItems(json: unknown): Record<string, unknown>[] {
  if (!json || typeof json !== 'object') return [];
  const root = json as Record<string, unknown>;

  const body =
    (root.response as Record<string, unknown> | undefined)?.body ??
    (root.body as Record<string, unknown> | undefined) ??
    root;

  const b = body as Record<string, unknown>;
  const items = b.items ?? b.item ?? b.data ?? [];

  if (Array.isArray(items)) return asArray<Record<string, unknown>>(items);
  if (items && typeof items === 'object') {
    const inner = (items as Record<string, unknown>).item ?? items;
    return asArray<Record<string, unknown>>(inner);
  }
  return [];
}

/** totalCount 추출 (페이지네이션 종료 판정용). 실패 시 null */
export function extractTotalCount(json: unknown): number | null {
  if (!json || typeof json !== 'object') return null;
  const root = json as Record<string, unknown>;
  const body =
    (root.response as Record<string, unknown> | undefined)?.body ??
    (root.body as Record<string, unknown> | undefined) ??
    root;
  const raw = (body as Record<string, unknown>).totalCount;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** 후보 키들 중 첫 비어있지 않은 값을 문자열로 반환 */
function pick(item: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return null;
}

// ── 레코드 매핑 ───────────────────────────────────────────────────────────────

/**
 * 원료성분(15111774) item → IncomingRecord.
 * 국문명이 없으면 name_ko(NOT NULL)를 채울 수 없으므로 null 반환(스킵).
 */
export function mapIngredientItem(item: Record<string, unknown>): IncomingRecord | null {
  const rawKo = pick(item, FIELD_CANDIDATES.nameKo);
  if (!rawKo) return null;

  const { primary: nameKo, aliases } = splitParenthetical(rawKo);
  if (!nameKo) return null;

  const nameEn = pick(item, FIELD_CANDIDATES.nameEn);
  const nameInci = pick(item, FIELD_CANDIDATES.nameInci) ?? nameEn;
  const cas = pick(item, FIELD_CANDIDATES.cas);
  const definition = pick(item, FIELD_CANDIDATES.definition);

  const descParts: string[] = [];
  if (definition) descParts.push(normalizeName(definition));
  if (cas) descParts.push(`CAS: ${normalizeName(cas)}`);
  const description = descParts.length > 0 ? descParts.join(' · ') : null;

  return {
    nameKo,
    nameEn: nameEn ? normalizeName(nameEn) : null,
    nameInci: nameInci ? normalizeName(nameInci) : null,
    inciKey: nameInci ? compareKey(nameInci) : null,
    koKey: compareKey(nameKo),
    aliases,
    category: DEFAULT_CATEGORY,
    description,
    concerns: [],
    source: SOURCE_INGREDIENT,
  };
}

/**
 * 규제정보(15111773) item → IncomingRecord (concerns에 규제 노트, 이름 키만 확실).
 * 국문명 없으면 스킵.
 */
export function mapRegulationItem(item: Record<string, unknown>): IncomingRecord | null {
  const rawKo = pick(item, FIELD_CANDIDATES.nameKo);
  if (!rawKo) return null;

  const { primary: nameKo, aliases } = splitParenthetical(rawKo);
  if (!nameKo) return null;

  const nameEn = pick(item, FIELD_CANDIDATES.nameEn);
  const nameInci = pick(item, FIELD_CANDIDATES.nameInci) ?? nameEn;
  const limit = pick(item, FIELD_CANDIDATES.limitContent);
  const kindText = pick(item, FIELD_CANDIDATES.regKindText) ?? '';
  const prohibitFlag = pick(item, FIELD_CANDIDATES.prohibitFlag) ?? '';

  // 금지 판정: 종류 텍스트에 '금지/사용불가' 포함 또는 금지 플래그 Y
  const isProhibited = /금지|사용\s*불가|불가/.test(kindText) || /^(y|금지)/i.test(prohibitFlag);

  const note = isProhibited
    ? '식약처 사용금지 원료'
    : limit
      ? `식약처 사용제한 원료: ${normalizeName(limit)}`
      : '식약처 사용제한 원료';

  return {
    nameKo,
    nameEn: nameEn ? normalizeName(nameEn) : null,
    nameInci: nameInci ? normalizeName(nameInci) : null,
    inciKey: nameInci ? compareKey(nameInci) : null,
    koKey: compareKey(nameKo),
    aliases,
    category: DEFAULT_CATEGORY,
    description: null,
    concerns: [note],
    source: SOURCE_REGULATION,
  };
}

// ── 레코드 병합 (같은 성분의 원료성분 + 규제정보 합치기) ────────────────────

/** INCI 키 우선, 없으면 국문 키로 병합. 나중 값이 빈 필드를 채우고 concerns는 union */
export function mergeRecords(records: IncomingRecord[]): IncomingRecord[] {
  const byKey = new Map<string, IncomingRecord>();
  for (const r of records) {
    const key = r.inciKey ?? `ko:${r.koKey}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...r, aliases: [...r.aliases], concerns: [...r.concerns] });
      continue;
    }
    prev.nameEn = prev.nameEn ?? r.nameEn;
    prev.nameInci = prev.nameInci ?? r.nameInci;
    prev.inciKey = prev.inciKey ?? r.inciKey;
    prev.description = prev.description ?? r.description;
    // 원료성분 소스를 우선 표기, 규제 노트는 concerns로 흡수
    if (prev.source === SOURCE_REGULATION && r.source === SOURCE_INGREDIENT) {
      prev.source = SOURCE_INGREDIENT;
    }
    prev.aliases = unique([...prev.aliases, ...r.aliases]);
    prev.concerns = unique([...prev.concerns, ...r.concerns]);
  }
  return [...byKey.values()];
}

function unique(arr: string[]): string[] {
  return [...new Set(arr.filter((s) => s.length > 0))];
}

// ── 업서트 계획 (빈 필드만 채움 — 큐레이션 필드 보존) ─────────────────────────

/** 문자열이 비어있는가(null/공백) */
function isEmpty(v: string | null | undefined): boolean {
  return v === null || v === undefined || v.trim().length === 0;
}

/**
 * 기존 행 대비 incoming 레코드의 업서트 계획을 만든다.
 *
 * 정책:
 *  - 매칭: name_inci(소문자·공백제거) 우선, 없으면 name_ko 비교 키.
 *  - update: 기존 값이 "빈 필드"인 컬럼만 채운다. ewg_score 등 큐레이션 값은 절대 미변경.
 *  - concerns/aliases는 union(추가만) — 규제 사실은 덧붙이되 기존 항목 삭제 안 함.
 *  - insert: 신규 성분. ewg 계열은 비워둠(추정 금지).
 */
export function buildUpsertPlan(existing: IngredientRow[], incoming: IncomingRecord[]): UpsertPlan {
  const byInci = new Map<string, IngredientRow>();
  const byKo = new Map<string, IngredientRow>();
  for (const row of existing) {
    if (row.name_inci) byInci.set(compareKey(row.name_inci), row);
    if (row.name_ko) byKo.set(compareKey(row.name_ko), row);
  }

  const inserts: IngredientInsert[] = [];
  const updates: UpdatePlan[] = [];

  for (const rec of mergeRecords(incoming)) {
    const match = (rec.inciKey ? byInci.get(rec.inciKey) : undefined) ?? byKo.get(rec.koKey);

    if (!match) {
      inserts.push({
        name_ko: rec.nameKo,
        name_en: rec.nameEn,
        name_inci: rec.nameInci,
        aliases: rec.aliases.length > 0 ? rec.aliases : null,
        category: rec.category,
        description: rec.description,
        concerns: rec.concerns.length > 0 ? rec.concerns : null,
        source: rec.source,
      });
      continue;
    }

    const patch: Partial<IngredientRow> = {};
    if (isEmpty(match.name_en) && rec.nameEn) patch.name_en = rec.nameEn;
    if (isEmpty(match.name_inci) && rec.nameInci) patch.name_inci = rec.nameInci;
    if (isEmpty(match.description) && rec.description) patch.description = rec.description;
    if (isEmpty(match.source) && rec.source) patch.source = rec.source;

    // aliases union (기존 비어있거나 신규 별칭이 있을 때만)
    if (rec.aliases.length > 0) {
      const merged = unique([...(match.aliases ?? []), ...rec.aliases]);
      if (merged.length !== (match.aliases?.length ?? 0)) patch.aliases = merged;
    }
    // concerns union (규제 노트 추가 — 삭제 없음)
    if (rec.concerns.length > 0) {
      const merged = unique([...(match.concerns ?? []), ...rec.concerns]);
      if (merged.length !== (match.concerns?.length ?? 0)) patch.concerns = merged;
    }

    if (Object.keys(patch).length > 0) updates.push({ id: match.id, patch });
  }

  return { inserts, updates };
}
