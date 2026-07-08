/**
 * 성분 DB 조인 매칭 (L1) 테스트 — ADR-112
 * - 정규화(소문자·공백제거·부분일치) 매칭, 미매칭 미반환, 규제 플래그 변환
 * - Supabase mock (단일 쿼리)
 */

import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  matchIngredientsToDb,
  buildRegulatoryFlags,
  type IngredientDbMatch,
} from '@/lib/scan/ingredient-db-match';

interface Row {
  name_ko: string | null;
  name_en: string | null;
  name_inci: string | null;
  aliases: string[] | null;
  ewg_score: number | null;
  is_caution_20: boolean | null;
  is_allergen: boolean | null;
  allergen_type: string | null;
}

const ROWS: Row[] = [
  {
    name_ko: '나이아신아마이드',
    name_en: 'Niacinamide',
    name_inci: 'NIACINAMIDE',
    aliases: ['니코틴아마이드', 'nicotinamide'],
    ewg_score: 1,
    is_caution_20: false,
    is_allergen: false,
    allergen_type: null,
  },
  {
    name_ko: '향료',
    name_en: 'Fragrance',
    name_inci: 'FRAGRANCE',
    aliases: ['parfum', '향'],
    ewg_score: 6,
    is_caution_20: true,
    is_allergen: true,
    allergen_type: '착향제',
  },
];

/** 단일 쿼리(from→select→limit)만 노출하는 Supabase mock */
function mockClient(rows: Row[] | null, error: unknown = null): SupabaseClient {
  const limit = vi.fn().mockResolvedValue({ data: rows, error });
  const select = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

describe('matchIngredientsToDb', () => {
  it('INCI 정확 매칭', async () => {
    const result = await matchIngredientsToDb(['NIACINAMIDE'], mockClient(ROWS));
    expect(result).toHaveLength(1);
    expect(result[0].matchedName).toBe('나이아신아마이드');
    expect(result[0].ewgGrade).toBe(1);
  });

  it('대소문자·공백 정규화 매칭', async () => {
    const result = await matchIngredientsToDb(['  fragrance '], mockClient(ROWS));
    expect(result).toHaveLength(1);
    expect(result[0].isAllergen).toBe(true);
    expect(result[0].allergenType).toBe('착향제');
  });

  it('별칭(aliases) 매칭', async () => {
    const result = await matchIngredientsToDb(['nicotinamide'], mockClient(ROWS));
    expect(result[0]?.matchedName).toBe('나이아신아마이드');
  });

  it('미등록 성분은 반환하지 않는다', async () => {
    const result = await matchIngredientsToDb(['UNKNOWN INGREDIENT XYZ'], mockClient(ROWS));
    expect(result).toEqual([]);
  });

  it('중복 성분은 한 번만 매칭한다', async () => {
    const result = await matchIngredientsToDb(
      ['NIACINAMIDE', 'niacinamide', '나이아신아마이드'],
      mockClient(ROWS)
    );
    expect(result).toHaveLength(1);
  });

  it('빈 입력은 쿼리 없이 빈 배열', async () => {
    const client = mockClient(ROWS);
    const result = await matchIngredientsToDb([], client);
    expect(result).toEqual([]);
    expect(client.from).not.toHaveBeenCalled();
  });

  it('쿼리 에러 시 빈 배열(판정 진행)', async () => {
    const result = await matchIngredientsToDb(['NIACINAMIDE'], mockClient(null, { message: 'db' }));
    expect(result).toEqual([]);
  });

  it('빈 테이블이면 빈 배열', async () => {
    const result = await matchIngredientsToDb(['NIACINAMIDE'], mockClient([]));
    expect(result).toEqual([]);
  });
});

describe('buildRegulatoryFlags', () => {
  it('알레르겐 → allergen25 (유형 라벨 포함)', () => {
    const matches: IngredientDbMatch[] = [
      { input: 'FRAGRANCE', matchedName: '향료', isAllergen: true, allergenType: '착향제' },
    ];
    const flags = buildRegulatoryFlags(matches);
    expect(flags).toContainEqual({
      ingredient: '향료',
      kind: 'allergen25',
      label: '식약처 지정 알레르기 유발 성분 (착향제)',
    });
  });

  it('주의 성분 → caution20', () => {
    const flags = buildRegulatoryFlags([{ input: 'X', matchedName: 'X', isCaution20: true }]);
    expect(flags[0].kind).toBe('caution20');
  });

  it('알레르겐 + 주의 성분은 각각 별도 항목', () => {
    const flags = buildRegulatoryFlags([
      { input: 'FRAGRANCE', matchedName: '향료', isAllergen: true, isCaution20: true },
    ]);
    expect(flags).toHaveLength(2);
    expect(flags.map((f) => f.kind).sort()).toEqual(['allergen25', 'caution20']);
  });

  it('플래그 없는 매칭은 항목 생성 안 함', () => {
    const flags = buildRegulatoryFlags([
      {
        input: 'NIACINAMIDE',
        matchedName: '나이아신아마이드',
        isAllergen: false,
        isCaution20: false,
      },
    ]);
    expect(flags).toEqual([]);
  });
});
