/**
 * 식약처 성분 임포트 — 순수 로직 단위 테스트 (네트워크/DB 없음)
 *
 * 대상: scripts/mfds/parse.ts
 *  - 응답 봉투 파싱 (extractItems/extractTotalCount)
 *  - 정규화 (전각→반각, 괄호 병기, 비교 키)
 *  - item → 레코드 매핑 (원료성분 / 규제정보)
 *  - 병합 및 업서트 계획 — "빈 필드만 채움" 정책 포함
 */
import { describe, it, expect } from 'vitest';

import {
  toHalfWidth,
  normalizeName,
  compareKey,
  splitParenthetical,
  extractItems,
  extractTotalCount,
  mapIngredientItem,
  mapRegulationItem,
  mergeRecords,
  buildUpsertPlan,
  SOURCE_INGREDIENT,
  SOURCE_REGULATION,
  DEFAULT_CATEGORY,
  type IngredientRow,
} from '@/scripts/mfds/parse';

// ── 테스트 픽스처 ─────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<IngredientRow> = {}): IngredientRow {
  return {
    id: 'row-1',
    name_ko: '나이아신아마이드',
    name_en: null,
    name_inci: null,
    aliases: null,
    ewg_score: null,
    ewg_data_availability: null,
    category: '기능성',
    functions: null,
    is_caution_20: false,
    is_allergen: false,
    allergen_type: null,
    description: null,
    benefits: null,
    concerns: null,
    source: null,
    ...overrides,
  };
}

// ── 정규화 ────────────────────────────────────────────────────────────────────

describe('normalize', () => {
  it('전각 영숫자·전각 공백을 반각으로 변환한다', () => {
    expect(toHalfWidth('ＡＢＣ１２３')).toBe('ABC123');
    expect(toHalfWidth('가　나')).toBe('가 나');
  });

  it('normalizeName: 트림 + 연속 공백 축약 + 전각 변환', () => {
    expect(normalizeName('  나이아신  아마이드　 ')).toBe('나이아신 아마이드');
    expect(normalizeName('ＮＩＡＣＩＮＡＭＩＤＥ')).toBe('NIACINAMIDE');
  });

  it('normalizeName: 문자열이 아니면 빈 문자열', () => {
    expect(normalizeName(null)).toBe('');
    expect(normalizeName(42)).toBe('');
    expect(normalizeName(undefined)).toBe('');
  });

  it('compareKey: 소문자 + 공백 제거 (INCI 비교 키)', () => {
    expect(compareKey('Sodium Hyaluronate')).toBe('sodiumhyaluronate');
    expect(compareKey('  SODIUM  HYALURONATE ')).toBe('sodiumhyaluronate');
  });

  it('splitParenthetical: 괄호 병기를 별칭으로 분리한다', () => {
    expect(splitParenthetical('나이아신아마이드(니코틴아마이드)')).toEqual({
      primary: '나이아신아마이드',
      aliases: ['니코틴아마이드'],
    });
  });

  it('splitParenthetical: 괄호 내 복수 병기(쉼표·가운뎃점) 분리', () => {
    const r = splitParenthetical('토코페롤(비타민E, 비타민 E)');
    expect(r.primary).toBe('토코페롤');
    expect(r.aliases).toEqual(['비타민E', '비타민 E']);
  });

  it('splitParenthetical: 전각 괄호도 처리한다', () => {
    const r = splitParenthetical('레티놀（비타민A）');
    expect(r.primary).toBe('레티놀');
    expect(r.aliases).toEqual(['비타민A']);
  });

  it('splitParenthetical: 괄호 없으면 별칭 없음', () => {
    expect(splitParenthetical('세라마이드')).toEqual({ primary: '세라마이드', aliases: [] });
  });
});

// ── 응답 봉투 파싱 ────────────────────────────────────────────────────────────

describe('extractItems / extractTotalCount', () => {
  const item = { INGR_KOR_NAME: '글리세린' };

  it('response.body.items.item 배열 봉투', () => {
    const json = { response: { body: { items: { item: [item, item] }, totalCount: 2 } } };
    expect(extractItems(json)).toHaveLength(2);
    expect(extractTotalCount(json)).toBe(2);
  });

  it('response.body.items.item 단일 객체(비배열)도 배열로 강제', () => {
    const json = { response: { body: { items: { item }, totalCount: '1' } } };
    expect(extractItems(json)).toEqual([item]);
    expect(extractTotalCount(json)).toBe(1);
  });

  it('body.items 직접 배열 봉투', () => {
    expect(extractItems({ body: { items: [item] } })).toEqual([item]);
  });

  it('루트 items / data 배열 봉투', () => {
    expect(extractItems({ items: [item] })).toEqual([item]);
    expect(extractItems({ data: [item] })).toEqual([item]);
  });

  it('빈/이상 응답은 빈 배열·null', () => {
    expect(extractItems(null)).toEqual([]);
    expect(extractItems('oops')).toEqual([]);
    expect(extractItems({})).toEqual([]);
    expect(extractTotalCount({})).toBeNull();
    expect(extractTotalCount(null)).toBeNull();
  });
});

// ── item 매핑 ─────────────────────────────────────────────────────────────────

describe('mapIngredientItem (원료성분 15111774)', () => {
  it('표준명·영문명·CAS·기원정의를 매핑한다', () => {
    const rec = mapIngredientItem({
      INGR_KOR_NAME: '나이아신아마이드(니코틴아마이드)',
      INGR_ENG_NAME: 'Niacinamide',
      CAS_NO: '98-92-0',
      ORIGIN_MAJOR_KOR_NAME: '비타민 B3의 아마이드 형태',
    });
    expect(rec).not.toBeNull();
    expect(rec!.nameKo).toBe('나이아신아마이드');
    expect(rec!.aliases).toEqual(['니코틴아마이드']);
    expect(rec!.nameEn).toBe('Niacinamide');
    expect(rec!.nameInci).toBe('Niacinamide'); // INCI 필드 없으면 영문명 대체
    expect(rec!.inciKey).toBe('niacinamide'); // 소문자 비교 키
    expect(rec!.description).toContain('비타민 B3');
    expect(rec!.description).toContain('CAS: 98-92-0');
    expect(rec!.source).toBe(SOURCE_INGREDIENT);
    expect(rec!.category).toBe(DEFAULT_CATEGORY);
  });

  it('INCI_NAME이 있으면 영문명보다 우선한다', () => {
    const rec = mapIngredientItem({
      INGR_KOR_NAME: '히알루론산나트륨',
      INGR_ENG_NAME: 'Hyaluronic Acid Sodium Salt',
      INCI_NAME: 'Sodium Hyaluronate',
    });
    expect(rec!.nameInci).toBe('Sodium Hyaluronate');
    expect(rec!.inciKey).toBe('sodiumhyaluronate');
  });

  it('국문명 없는 item은 스킵(null) — name_ko NOT NULL 보호', () => {
    expect(mapIngredientItem({ INGR_ENG_NAME: 'Glycerin' })).toBeNull();
    expect(mapIngredientItem({})).toBeNull();
  });

  it('대체 필드명(camelCase 등)도 후보 키로 흡수한다', () => {
    const rec = mapIngredientItem({ korName: '글리세린', engName: 'Glycerin' });
    expect(rec!.nameKo).toBe('글리세린');
    expect(rec!.nameEn).toBe('Glycerin');
  });
});

describe('mapRegulationItem (규제정보 15111773)', () => {
  it('배합한도 성분 → 사용제한 노트(한도 병기)', () => {
    const rec = mapRegulationItem({
      INGR_KOR_NAME: '살리실릭애씨드',
      LIMIT_CONTENT: '0.5%',
      DIVISION: '사용상의 제한이 필요한 원료',
    });
    expect(rec!.concerns).toEqual(['식약처 사용제한 원료: 0.5%']);
    expect(rec!.source).toBe(SOURCE_REGULATION);
  });

  it('배합금지 성분 → 사용금지 노트', () => {
    const rec = mapRegulationItem({
      INGR_KOR_NAME: '하이드로퀴논',
      DIVISION: '사용할 수 없는 원료(배합금지)',
    });
    expect(rec!.concerns).toEqual(['식약처 사용금지 원료']);
  });

  it('한도·구분 정보가 없으면 일반 제한 노트', () => {
    const rec = mapRegulationItem({ INGR_KOR_NAME: '어떤성분' });
    expect(rec!.concerns).toEqual(['식약처 사용제한 원료']);
  });

  it('국문명 없으면 스킵', () => {
    expect(mapRegulationItem({ LIMIT_CONTENT: '1%' })).toBeNull();
  });
});

// ── 병합 ──────────────────────────────────────────────────────────────────────

describe('mergeRecords', () => {
  it('같은 INCI 키의 원료성분+규제정보를 하나로 병합한다 (concerns union)', () => {
    const a = mapIngredientItem({
      INGR_KOR_NAME: '살리실릭애씨드',
      INCI_NAME: 'Salicylic Acid',
      CAS_NO: '69-72-7',
    })!;
    const b = mapRegulationItem({
      INGR_KOR_NAME: '살리실릭애씨드',
      INCI_NAME: 'salicylic acid', // 대소문자 달라도 같은 키
      LIMIT_CONTENT: '0.5%',
    })!;
    const merged = mergeRecords([a, b]);
    expect(merged).toHaveLength(1);
    expect(merged[0].description).toContain('CAS: 69-72-7');
    expect(merged[0].concerns).toEqual(['식약처 사용제한 원료: 0.5%']);
    expect(merged[0].source).toBe(SOURCE_INGREDIENT); // 원료성분 소스 우선
  });

  it('INCI 없는 레코드는 국문 키로 병합한다', () => {
    const a = mapIngredientItem({ INGR_KOR_NAME: '어성초추출물' })!;
    const b = mapRegulationItem({ INGR_KOR_NAME: '어성초 추출물' })!; // 공백 차이 무시
    expect(mergeRecords([a, b])).toHaveLength(1);
  });

  it('규제정보가 먼저 와도 원료성분 소스로 승격된다', () => {
    const reg = mapRegulationItem({ INGR_KOR_NAME: '성분X', LIMIT_CONTENT: '1%' })!;
    const ing = mapIngredientItem({ INGR_KOR_NAME: '성분X', CAS_NO: '1-1-1' })!;
    const merged = mergeRecords([reg, ing]);
    expect(merged[0].source).toBe(SOURCE_INGREDIENT);
    expect(merged[0].concerns).toEqual(['식약처 사용제한 원료: 1%']);
  });

  it('다른 성분은 병합되지 않는다', () => {
    const a = mapIngredientItem({ INGR_KOR_NAME: '글리세린', INCI_NAME: 'Glycerin' })!;
    const b = mapIngredientItem({ INGR_KOR_NAME: '레티놀', INCI_NAME: 'Retinol' })!;
    expect(mergeRecords([a, b])).toHaveLength(2);
  });
});

// ── 업서트 계획 — "빈 필드만 채움" 정책 ──────────────────────────────────────

describe('buildUpsertPlan', () => {
  it('신규 성분은 insert로 계획한다 (ewg 필드 미포함 — 추정 금지)', () => {
    const rec = mapIngredientItem({
      INGR_KOR_NAME: '판테놀',
      INCI_NAME: 'Panthenol',
      CAS_NO: '81-13-0',
    })!;
    const plan = buildUpsertPlan([], [rec]);
    expect(plan.updates).toHaveLength(0);
    expect(plan.inserts).toHaveLength(1);
    const ins = plan.inserts[0];
    expect(ins.name_ko).toBe('판테놀');
    expect(ins.name_inci).toBe('Panthenol');
    expect(ins.category).toBe(DEFAULT_CATEGORY);
    expect(ins).not.toHaveProperty('ewg_score');
    expect(ins).not.toHaveProperty('is_caution_20');
  });

  it('기존 행의 빈 필드만 채운다 (name_en/name_inci/description/source)', () => {
    const existing = makeRow({ id: 'ex-1', name_ko: '나이아신아마이드' });
    const rec = mapIngredientItem({
      INGR_KOR_NAME: '나이아신아마이드',
      INGR_ENG_NAME: 'Niacinamide',
      CAS_NO: '98-92-0',
    })!;
    const plan = buildUpsertPlan([existing], [rec]);
    expect(plan.inserts).toHaveLength(0);
    expect(plan.updates).toHaveLength(1);
    const patch = plan.updates[0].patch;
    expect(patch.name_en).toBe('Niacinamide');
    expect(patch.name_inci).toBe('Niacinamide');
    expect(patch.description).toContain('CAS: 98-92-0');
    expect(patch.source).toBe(SOURCE_INGREDIENT);
  });

  it('이미 값 있는 필드는 절대 덮어쓰지 않는다 (수동 큐레이션 보존)', () => {
    const existing = makeRow({
      id: 'ex-2',
      name_ko: '나이아신아마이드',
      name_en: 'NIACINAMIDE (curated)',
      name_inci: 'Niacinamide',
      description: '큐레이션된 설명',
      source: '수동 큐레이션',
      ewg_score: 1,
    });
    const rec = mapIngredientItem({
      INGR_KOR_NAME: '나이아신아마이드',
      INGR_ENG_NAME: 'Niacinamide',
      ORIGIN_MAJOR_KOR_NAME: 'API 정의',
    })!;
    const plan = buildUpsertPlan([existing], [rec]);
    // 채울 빈 필드가 없으므로 update 자체가 없음
    expect(plan.inserts).toHaveLength(0);
    expect(plan.updates).toHaveLength(0);
  });

  it('어떤 patch에도 ewg_score/ewg_data_availability가 포함되지 않는다', () => {
    const existing = makeRow({ id: 'ex-3', name_ko: '레티놀', ewg_score: 9 });
    const rec = mapIngredientItem({
      INGR_KOR_NAME: '레티놀',
      INGR_ENG_NAME: 'Retinol',
    })!;
    const plan = buildUpsertPlan([existing], [rec]);
    for (const u of plan.updates) {
      expect(u.patch).not.toHaveProperty('ewg_score');
      expect(u.patch).not.toHaveProperty('ewg_data_availability');
      expect(u.patch).not.toHaveProperty('is_caution_20');
      expect(u.patch).not.toHaveProperty('is_allergen');
    }
  });

  it('concerns는 union으로 추가만 한다 (기존 항목 삭제 없음)', () => {
    const existing = makeRow({
      id: 'ex-4',
      name_ko: '살리실릭애씨드',
      concerns: ['임산부 주의'],
    });
    const rec = mapRegulationItem({
      INGR_KOR_NAME: '살리실릭애씨드',
      LIMIT_CONTENT: '0.5%',
    })!;
    const plan = buildUpsertPlan([existing], [rec]);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].patch.concerns).toEqual(['임산부 주의', '식약처 사용제한 원료: 0.5%']);
  });

  it('동일 concerns가 이미 있으면 update를 만들지 않는다 (멱등)', () => {
    const existing = makeRow({
      id: 'ex-5',
      name_ko: '살리실릭애씨드',
      name_en: 'Salicylic Acid',
      name_inci: 'Salicylic Acid',
      source: SOURCE_REGULATION,
      concerns: ['식약처 사용제한 원료: 0.5%'],
    });
    const rec = mapRegulationItem({
      INGR_KOR_NAME: '살리실릭애씨드',
      INCI_NAME: 'Salicylic Acid',
      LIMIT_CONTENT: '0.5%',
    })!;
    const plan = buildUpsertPlan([existing], [rec]);
    expect(plan.inserts).toHaveLength(0);
    expect(plan.updates).toHaveLength(0);
  });

  it('aliases는 union으로 병합한다', () => {
    const existing = makeRow({
      id: 'ex-6',
      name_ko: '나이아신아마이드',
      aliases: ['비타민B3'],
    });
    const rec = mapIngredientItem({
      INGR_KOR_NAME: '나이아신아마이드(니코틴아마이드)',
    })!;
    const plan = buildUpsertPlan([existing], [rec]);
    expect(plan.updates[0].patch.aliases).toEqual(['비타민B3', '니코틴아마이드']);
  });

  it('INCI 키 매칭이 국문명 매칭보다 우선한다', () => {
    // 국문 표기가 달라도 INCI가 같으면 같은 성분
    const existing = makeRow({
      id: 'ex-7',
      name_ko: '히알루론산 나트륨',
      name_inci: 'Sodium Hyaluronate',
    });
    const rec = mapIngredientItem({
      INGR_KOR_NAME: '소듐하이알루로네이트',
      INCI_NAME: 'SODIUM HYALURONATE',
      CAS_NO: '9067-32-7',
    })!;
    const plan = buildUpsertPlan([existing], [rec]);
    expect(plan.inserts).toHaveLength(0); // 신규 insert가 아니라
    expect(plan.updates).toHaveLength(1); // 기존 행 빈 필드 갱신
    expect(plan.updates[0].id).toBe('ex-7');
  });

  it('국문명 키 매칭: 공백·대소문자 차이를 무시한다', () => {
    const existing = makeRow({ id: 'ex-8', name_ko: '어성초 추출물' });
    const rec = mapIngredientItem({
      INGR_KOR_NAME: '어성초추출물',
      INGR_ENG_NAME: 'Houttuynia Cordata Extract',
    })!;
    const plan = buildUpsertPlan([existing], [rec]);
    expect(plan.inserts).toHaveLength(0);
    expect(plan.updates[0].id).toBe('ex-8');
  });
});
