/**
 * 제품 필터 어휘 브리지 테스트 (2026-08 매칭 감사 A2·A6·A8)
 *
 * 감사 실측: 피부 결과 지표 id(pores/wrinkles/…)를 그대로 넘겨 제품 DB 어휘와의 교집합이
 * `hydration` 1개뿐이었다. 퍼스널컬러 결과에는 무채(프라이머·마스카라·세팅스프레이)가 섞였고,
 * 연령대는 UI(50plus)와 DB(50s) 어휘가 달랐다.
 */

import { describe, it, expect } from 'vitest';
import {
  expandConcernsToDbValues,
  mapSkinMetricsToConcerns,
  expandSkinConcernsToDbValues,
  mapAgeGroupsToDbValues,
  AGE_GROUP_TO_DB,
  PERSONAL_COLOR_MAKEUP_SUBCATEGORIES,
  SKIN_METRIC_TO_CONCERNS,
} from '@/lib/products/vocabulary';
import type { SkinConcern } from '@/types/product';
import type { AgeGroup } from '@/types/hybrid';

// cosmetic_products.concerns prod 실 vocab 중 브리지가 참조하는 값들
// (2026-08-17 실쿼리 스냅샷 — 유령 값 방지용)
const DB_CONCERN_VOCAB = new Set([
  'hydration',
  'barrier',
  'barrier_repair',
  'pore',
  'blackhead',
  'sebum',
  'oil-control',
  'acne',
  'acne-scar',
  'blemish',
  'aging',
  'anti-aging',
  'wrinkle',
  'wrinkles',
  'elasticity',
  'firming',
  'whitening',
  'tone-up',
  'dark-circle',
  'dark_circles',
  'redness',
  'soothing',
  'atopy',
]);

// prod cosmetic_products(category='makeup') subcategory 실측 19종 (2026-08-17)
const DB_MAKEUP_SUBCATEGORIES = new Set([
  'lip',
  'eyeshadow',
  'blush',
  'primer',
  'eyeliner',
  'concealer',
  'foundation',
  'brow',
  'lip-gloss',
  'setting-spray',
  'mascara',
  'highlighter',
  'powder',
  'cushion',
  'contour',
  'eye',
  'lip-liner',
  'brush',
  'multi-palette',
]);

describe('mapSkinMetricsToConcerns (A6 — 피부 결과 지표 → 정본 고민 어휘)', () => {
  it('결과 지표 id를 DB가 아는 고민 어휘로 옮긴다', () => {
    expect(mapSkinMetricsToConcerns(['pores'])).toEqual(['pore']);
    expect(mapSkinMetricsToConcerns(['wrinkles'])).toEqual(['aging']);
    expect(mapSkinMetricsToConcerns(['pigmentation'])).toEqual(['whitening']);
    expect(mapSkinMetricsToConcerns(['sensitivity'])).toEqual(['redness']);
    expect(mapSkinMetricsToConcerns(['trouble'])).toEqual(['acne']);
  });

  it('경고 지표 전체를 넘기면 교집합이 4개 이상 생긴다 (기존: hydration 1개뿐)', () => {
    const warningMetrics = [
      'hydration',
      'pores',
      'wrinkles',
      'pigmentation',
      'trouble',
      'elasticity',
    ];
    const mapped = mapSkinMetricsToConcerns(warningMetrics);
    expect(mapped.length).toBeGreaterThanOrEqual(4);
    expect(mapped).toEqual(expect.arrayContaining(['hydration', 'pore', 'aging', 'whitening']));
  });

  it('멱등이다 — 이미 정본 어휘인 값을 다시 넣어도 그대로다', () => {
    const once = mapSkinMetricsToConcerns(['pores', 'wrinkles']);
    expect(mapSkinMetricsToConcerns(once)).toEqual(once);
  });

  it('중복 지표는 한 번만 나온다 (wrinkles·elasticity → aging)', () => {
    expect(mapSkinMetricsToConcerns(['wrinkles', 'elasticity'])).toEqual(['aging']);
  });

  it('대응 어휘가 없는 지표는 지어내지 않고 버린다', () => {
    // oil = 피부타입(oily) 축이 커버, darkCircles = 정본 SkinConcern에 대응 값 없음
    expect(mapSkinMetricsToConcerns(['oil', 'darkCircles', 'nonexistent'])).toEqual([]);
  });

  it('매핑 결과는 전부 정본 SkinConcern 유니온 값이다', () => {
    const canonical = new Set<SkinConcern>([
      'acne',
      'aging',
      'whitening',
      'hydration',
      'pore',
      'redness',
    ]);
    for (const values of Object.values(SKIN_METRIC_TO_CONCERNS)) {
      for (const v of values) expect(canonical.has(v)).toBe(true);
    }
  });
});

describe('expandSkinConcernsToDbValues (A1 후보 풀 오버랩용)', () => {
  it('정본 고민을 DB 동의어까지 확장한다', () => {
    expect(expandSkinConcernsToDbValues(['pore'])).toEqual(
      expect.arrayContaining(['pore', 'blackhead', 'sebum'])
    );
    expect(expandSkinConcernsToDbValues(['aging'])).toEqual(
      expect.arrayContaining(['aging', 'wrinkle', 'anti-aging'])
    );
  });

  it('확장 값은 전부 DB 실 vocab이다 (유령 값 0)', () => {
    const all: SkinConcern[] = ['acne', 'aging', 'whitening', 'hydration', 'pore', 'redness'];
    for (const value of expandSkinConcernsToDbValues(all)) {
      expect(DB_CONCERN_VOCAB.has(value)).toBe(true);
    }
  });

  it('빈 입력은 빈 배열 (오버랩 쿼리를 걸지 않도록)', () => {
    expect(expandSkinConcernsToDbValues([])).toEqual([]);
  });
});

describe('expandConcernsToDbValues (UI 칩 승격본 — 기존 동작 보존)', () => {
  it('UI 칩 id 자신을 포함해 확장한다', () => {
    expect(expandConcernsToDbValues(['soothing'])).toEqual(
      expect.arrayContaining(['soothing', 'redness', 'atopy'])
    );
  });

  it('여러 칩 선택 시 중복 없는 합집합', () => {
    const expanded = expandConcernsToDbValues(['acne', 'pore']);
    expect(new Set(expanded).size).toBe(expanded.length);
  });
});

describe('PERSONAL_COLOR_MAKEUP_SUBCATEGORIES (A2 — 색조 무채 제외)', () => {
  it('색 선택이 개인색과 무관한 세분류를 제외한다', () => {
    for (const excluded of ['primer', 'setting-spray', 'mascara', 'brow', 'powder', 'brush']) {
      expect(PERSONAL_COLOR_MAKEUP_SUBCATEGORIES).not.toContain(excluded);
    }
  });

  it('색이 있는 립·아이·치크·베이스 세분류는 포함한다', () => {
    for (const included of [
      'lip',
      'lip-gloss',
      'blush',
      'eyeshadow',
      'cushion',
      'foundation',
      'concealer',
      'highlighter',
      'contour',
    ]) {
      expect(PERSONAL_COLOR_MAKEUP_SUBCATEGORIES).toContain(included);
    }
  });

  it('화이트리스트 값은 전부 DB 실재 subcategory다 (유령 값 = 조용한 0건)', () => {
    for (const value of PERSONAL_COLOR_MAKEUP_SUBCATEGORIES) {
      expect(DB_MAKEUP_SUBCATEGORIES.has(value)).toBe(true);
    }
  });
});

describe('mapAgeGroupsToDbValues (A8 — 연령대 UI↔DB 어휘)', () => {
  it('50plus만 DB 어휘(50s)로 변환하고 나머지는 그대로 통과한다', () => {
    expect(mapAgeGroupsToDbValues(['50plus'])).toEqual(['50s']);
    expect(mapAgeGroupsToDbValues(['10s', '20s', '30s', '40s'])).toEqual([
      '10s',
      '20s',
      '30s',
      '40s',
    ]);
  });

  it('모든 UI 연령대에 DB 매핑이 있다 (누락 = 조용한 0건)', () => {
    const uiGroups: AgeGroup[] = ['10s', '20s', '30s', '40s', '50plus'];
    const dbVocab = new Set(['10s', '20s', '30s', '40s', '50s']);
    for (const g of uiGroups) {
      expect(AGE_GROUP_TO_DB[g]).toBeDefined();
      expect(dbVocab.has(AGE_GROUP_TO_DB[g])).toBe(true);
    }
  });
});
