/**
 * 통합 분석 skin 저장 풍부화 헬퍼 테스트 (ADR-109 무손실 — Phase 2C)
 * buildSkinEnrichment: skinType + 지표에서 결정론적으로 파생되는 풍부화 필드 검증.
 * 성분 DB(getWarningIngredientsForSkinType)만 모킹, 제품추천/INGREDIENT_POOL은 실제 사용.
 */

import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  buildSkinEnrichment,
  type SkinMetricsForEnrichment,
} from '@/lib/analysis/integrated/internal/skin-enrichment';

// 성분 DB 모킹 — DB를 치는 유일한 순수 외 의존성
const { mockWarningIngredients } = vi.hoisted(() => ({
  mockWarningIngredients: [
    {
      name_ko: '알코올 변성제',
      name_en: 'Alcohol Denat',
      ewg_grade: 4,
      side_effects: '피부 건조 및 자극 유발 가능',
      alternatives: ['글리세린'],
      category: '용제',
      warning_sensitive: 4,
      warning_dry: 5,
      warning_oily: 2,
      warning_combination: 3,
    },
    {
      name_ko: '인공향료',
      name_en: 'Fragrance',
      ewg_grade: 5,
      side_effects: '알레르기 반응 가능성',
      alternatives: null,
      category: '향료',
      warning_sensitive: 3,
      warning_dry: 3,
      warning_oily: 3,
      warning_combination: 3,
    },
  ],
}));

vi.mock('@/lib/ingredients', () => ({
  getWarningIngredientsForSkinType: vi.fn().mockResolvedValue(mockWarningIngredients),
}));

// PC 조회 체인(.from().select().eq().order().limit().single())을 흉내내는 목
function createSupabaseMock(singleResult: { data: unknown }): SupabaseClient {
  const chain = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn().mockResolvedValue(singleResult),
  };
  chain.from.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain as unknown as SupabaseClient;
}

const METRICS: SkinMetricsForEnrichment = {
  hydration: 40,
  oil_level: 70,
  pores: 45,
  pigmentation: 60,
  wrinkles: 55,
  sensitivity: 60,
};

describe('buildSkinEnrichment', () => {
  describe('PC 없음 (single → data: null)', () => {
    it('반환 객체에 풍부화 키가 모두 존재한다', async () => {
      const supabase = createSupabaseMock({ data: null });
      const result = await buildSkinEnrichment(supabase, 'user_1', 'dry', METRICS, []);

      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('ingredient_warnings');
      expect(result).toHaveProperty('personal_color_season');
      expect(result).toHaveProperty('foundation_recommendation');
      expect(result).toHaveProperty('recommendationExtras');
    });

    it('PC 부재 시 시즌/파운데이션은 null', async () => {
      const supabase = createSupabaseMock({ data: null });
      const result = await buildSkinEnrichment(supabase, 'user_1', 'dry', METRICS, []);

      expect(result.personal_color_season).toBeNull();
      expect(result.foundation_recommendation).toBeNull();
    });

    it('성분 경고는 모킹한 성분 개수만큼 생성되고 shape가 유효하다', async () => {
      const supabase = createSupabaseMock({ data: null });
      const result = await buildSkinEnrichment(supabase, 'user_1', 'dry', METRICS, []);

      expect(result.ingredient_warnings).toHaveLength(mockWarningIngredients.length);
      for (const warning of result.ingredient_warnings) {
        expect(warning).toHaveProperty('ingredient');
        expect(typeof warning.ingredient).toBe('string');
        expect(['high', 'medium', 'low']).toContain(warning.level);
        expect(typeof warning.reason).toBe('string');
        expect(warning.reason.length).toBeGreaterThan(0);
      }
      // dry 타입은 warning_dry 기준: 5 → high, 3 → medium
      expect(result.ingredient_warnings[0].level).toBe('high');
      expect(result.ingredient_warnings[1].level).toBe('medium');
    });

    it('recommendationExtras shape — insight/ingredients/루틴/케어 팁', async () => {
      const supabase = createSupabaseMock({ data: null });
      const result = await buildSkinEnrichment(supabase, 'user_1', 'dry', METRICS, []);

      const extras = result.recommendationExtras;
      expect(typeof extras.insight).toBe('string');

      expect(Array.isArray(extras.ingredients)).toBe(true);
      expect(extras.ingredients.length).toBeLessThanOrEqual(3);
      for (const ing of extras.ingredients) {
        expect(typeof ing.name).toBe('string');
        expect(typeof ing.reason).toBe('string');
      }

      expect(Array.isArray(extras.morning_routine)).toBe(true);
      expect(extras.morning_routine.length).toBeGreaterThan(0);
      for (const step of extras.morning_routine) expect(typeof step).toBe('string');

      expect(Array.isArray(extras.evening_routine)).toBe(true);
      expect(extras.evening_routine.length).toBeGreaterThan(0);
      for (const step of extras.evening_routine) expect(typeof step).toBe('string');

      expect(Array.isArray(extras.weekly_care)).toBe(true);
      expect(Array.isArray(extras.lifestyle_tips)).toBe(true);
    });

    it('primaryConcerns를 넘기면 insight에 고민 문자열이 포함된다', async () => {
      const supabase = createSupabaseMock({ data: null });
      const result = await buildSkinEnrichment(supabase, 'user_1', 'dry', METRICS, [
        '건조함',
        '모공',
      ]);

      expect(result.recommendationExtras.insight).toContain('건조함');
      expect(result.recommendationExtras.insight).toContain('모공');
    });

    it('primaryConcerns가 빈 배열이면 기본 문구를 사용한다', async () => {
      const supabase = createSupabaseMock({ data: null });
      const result = await buildSkinEnrichment(supabase, 'user_1', 'dry', METRICS, []);

      expect(result.recommendationExtras.insight).toBe('피부 상태에 맞춘 루틴으로 관리해보세요.');
    });

    it('products는 카테고리별 제품명 배열 형태', async () => {
      const supabase = createSupabaseMock({ data: null });
      const result = await buildSkinEnrichment(supabase, 'user_1', 'dry', METRICS, []);

      expect(typeof result.products).toBe('object');
      expect(Object.keys(result.products).length).toBeGreaterThan(0);
      for (const list of Object.values(result.products)) {
        expect(Array.isArray(list)).toBe(true);
        for (const name of list) expect(typeof name).toBe('string');
      }
    });
  });

  describe('PC 있음 (single → Spring)', () => {
    it('시즌이 채워지고 파운데이션은 시즌 맵 문자열로 폴백된다', async () => {
      const supabase = createSupabaseMock({
        data: { season: 'Spring', makeup_recommendations: null },
      });
      const result = await buildSkinEnrichment(supabase, 'user_1', 'oily', METRICS, []);

      expect(result.personal_color_season).toBe('Spring');
      expect(result.foundation_recommendation).not.toBeNull();
      expect(typeof result.foundation_recommendation).toBe('string');
    });
  });

  describe('유효하지 않은 skinType', () => {
    it("'weird'를 넣어도 throw 없이 normal로 처리되어 정상 반환된다", async () => {
      const supabase = createSupabaseMock({ data: null });
      const result = await buildSkinEnrichment(supabase, 'user_1', 'weird', METRICS, []);

      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('recommendationExtras');
      expect(result.ingredient_warnings).toHaveLength(mockWarningIngredients.length);
      // normal 폴백: warning 4개 평균으로 레벨 산정 (알코올 변성제 avg 3.5→round 4 → high)
      expect(['high', 'medium', 'low']).toContain(result.ingredient_warnings[0].level);
    });
  });
});
