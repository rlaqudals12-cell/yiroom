/**
 * 스캔 판정 조립 테스트 — ADR-112 (온디바이스)
 * - 피부 프로필 유/무 분기(hasUserAnalysis) = CTA 게이팅의 근거
 * - L1 규제(supabase 有/無)·L4 타임라인 부착
 * - fetchScanUserAnalysis: 프로필 매핑 + 시즌→톤 파생 + 데이터 없음 처리
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { UserAnalysisData } from '../../../lib/scan/compatibility';
import { buildScanVerdict, fetchScanUserAnalysis } from '../../../lib/scan/verdict';
import type { ProductIngredient } from '../../../types/scan';

const INGREDIENTS: ProductIngredient[] = [
  { order: 1, inciName: 'RETINOL', nameKo: '레티놀' },
  { order: 2, inciName: 'FRAGRANCE', nameKo: '향료' },
];

const INGREDIENT_ROWS = [
  {
    name_ko: '향료',
    name_en: 'Fragrance',
    name_inci: 'FRAGRANCE',
    aliases: ['parfum'],
    ewg_score: 6,
    is_caution_20: true,
    is_allergen: true,
    allergen_type: '착향제',
  },
];

/** cosmetic_ingredients 단일 쿼리(from→select→limit) mock */
function ingredientDbClient(): SupabaseClient {
  const limit = jest.fn().mockResolvedValue({ data: INGREDIENT_ROWS, error: null });
  const select = jest.fn().mockReturnValue({ limit });
  const from = jest.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

describe('buildScanVerdict', () => {
  it('피부 프로필이 없으면 hasUserAnalysis.skinAnalysis=false (CTA 게이팅 근거)', async () => {
    const v = await buildScanVerdict({ ingredients: INGREDIENTS });
    expect(v.hasUserAnalysis.skinAnalysis).toBe(false);
    expect(typeof v.overallScore).toBe('number');
  });

  it('피부 프로필이 있으면 hasUserAnalysis.skinAnalysis=true', async () => {
    const userAnalysis: UserAnalysisData = {
      skinAnalysis: { skinType: 'sensitive', concerns: [], sensitivity: 'high' },
    };
    const v = await buildScanVerdict({ ingredients: INGREDIENTS, userAnalysis });
    expect(v.hasUserAnalysis.skinAnalysis).toBe(true);
  });

  it('L4 타임라인이 부착된다 (RETINOL → 레티놀)', async () => {
    const v = await buildScanVerdict({ ingredients: INGREDIENTS });
    expect(v.timelines.some((t) => t.name === '레티놀')).toBe(true);
    // 전 항목 출처 존재 (정직성)
    for (const t of v.timelines) {
      expect(t.sourceUrl).toMatch(/^https?:\/\//);
    }
  });

  it('supabase가 있으면 L1 규제 사실이 부착된다 (FRAGRANCE 알레르겐)', async () => {
    const v = await buildScanVerdict({ ingredients: INGREDIENTS, supabase: ingredientDbClient() });
    expect(v.regulatory.some((r) => r.kind === 'allergen25')).toBe(true);
  });

  it('supabase가 없으면 규제 레이어는 빈 배열(판정은 진행)', async () => {
    const v = await buildScanVerdict({ ingredients: INGREDIENTS });
    expect(v.regulatory).toEqual([]);
  });

  it('결정론: 동일 입력 → 동일 타임라인', async () => {
    const a = await buildScanVerdict({ ingredients: INGREDIENTS });
    const b = await buildScanVerdict({ ingredients: INGREDIENTS });
    expect(a.timelines).toEqual(b.timelines);
  });
});

/** fetchScanUserAnalysis용 프로필 쿼리 체인 mock */
function profileClient(skinRow: unknown, colorRow: unknown): SupabaseClient {
  const from = jest.fn((table: string) => {
    const row = table === 'skin_analyses' ? skinRow : colorRow;
    const maybeSingle = jest.fn().mockResolvedValue({ data: row, error: null });
    const limit = jest.fn().mockReturnValue({ maybeSingle });
    const order = jest.fn().mockReturnValue({ limit });
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    return { select };
  });
  return { from } as unknown as SupabaseClient;
}

describe('fetchScanUserAnalysis', () => {
  it('skin_analyses 행 → skinAnalysis 매핑 (한글 타입 변환)', async () => {
    const client = profileClient(
      { skin_type: '민감성', concerns: ['redness'], sensitivity: 80 },
      null
    );
    const result = await fetchScanUserAnalysis(client, 'user_1');
    expect(result.skinAnalysis?.skinType).toBe('sensitive');
    expect(result.skinAnalysis?.sensitivity).toBe('high');
    expect(result.skinAnalysis?.concerns).toEqual(['redness']);
  });

  it('시즌 → 톤 파생 (autumn → warm)', async () => {
    const client = profileClient(null, { season: 'autumn' });
    const result = await fetchScanUserAnalysis(client, 'user_1');
    expect(result.personalColor).toEqual({ seasonType: 'autumn', tone: 'warm' });
  });

  it('시즌 → 톤 파생 (여름 → cool)', async () => {
    const client = profileClient(null, { season: '여름 쿨톤' });
    const result = await fetchScanUserAnalysis(client, 'user_1');
    expect(result.personalColor).toEqual({ seasonType: 'summer', tone: 'cool' });
  });

  it('데이터가 없으면 빈 프로필 (지어내지 않음)', async () => {
    const client = profileClient(null, null);
    const result = await fetchScanUserAnalysis(client, 'user_1');
    expect(result).toEqual({});
  });

  it('userId가 없으면 조회 없이 빈 프로필', async () => {
    const client = profileClient({ skin_type: 'oily' }, null);
    const result = await fetchScanUserAnalysis(client, '');
    expect(result).toEqual({});
    expect(client.from).not.toHaveBeenCalled();
  });
});
