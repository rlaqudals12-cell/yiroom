import { describe, it, expect } from 'vitest';
import { expandConcernsToDbValues } from '@/components/beauty/BeautyRecommendTab';

/**
 * 뷰티 추천 고민 필터 어휘 매핑 (near-0 붕괴 근본 수리, 2026-07-10)
 *
 * 스킨케어 제품은 concerns가 100% 태깅(null 0건)이라 UI 고민 id와 DB 값 어휘가 어긋나면
 * 여러 고민 선택이 near-0로 붕괴한다. 확장 매핑이 (1) 전 고민을 커버하고 (2) DB 실재 값만
 * 쓰는지(유령 값 0) 검증한다.
 */

// cosmetic_products.concerns DB 실 vocab (2026-07-10 prod 실쿼리 스냅샷)
const DB_CONCERN_VOCAB = new Set([
  'acne',
  'acne-scar',
  'aging',
  'anti-aging',
  'antioxidant',
  'atopy',
  'barrier',
  'barrier_repair',
  'blackhead',
  'blemish',
  'cleansing',
  'coverage',
  'cuticle_care',
  'damage_repair',
  'dandruff',
  'dark-circle',
  'dark_circles',
  'deep_cleansing',
  'dry_hair',
  'elasticity',
  'exfoliation',
  'firming',
  'fragrance',
  'frizz',
  'frizz_control',
  'gentle_cleansing',
  'gray-hair',
  'hair-color',
  'hair-damage',
  'hair-hydration',
  'hair-loss',
  'hair-nourishing',
  'hair-shine',
  'hair-styling',
  'hair_loss',
  'hydration',
  'lasting',
  'lip-care',
  'lip-color',
  'lip-hydration',
  'lip_care',
  'makeup-removal',
  'makeup_removal',
  'nail-strength',
  'nail_growth',
  'nail_protection',
  'nail_strengthening',
  'natural-finish',
  'nourishing',
  'oil-control',
  'oily-scalp',
  'pore',
  'puffiness',
  'redness',
  'scalp-care',
  'scalp_health',
  'sebum',
  'shine',
  'smoothing',
  'soothing',
  'strengthening',
  'tone-up',
  'uv-protection',
  'uv_protection',
  'whitening',
  'wrinkle',
  'wrinkles',
]);

const UI_CONCERNS = [
  'hydration',
  'whitening',
  'pore',
  'soothing',
  'acne',
  'wrinkle',
  'elasticity',
] as const;

describe('expandConcernsToDbValues (고민 어휘 매핑)', () => {
  it('모든 UI 고민이 최소 1개 이상 DB 값으로 확장된다 (빈 매핑 = near-0 붕괴)', () => {
    for (const concern of UI_CONCERNS) {
      const expanded = expandConcernsToDbValues([concern]);
      expect(expanded.length).toBeGreaterThan(0);
      // 원래 id 자신도 포함되어야 한다 (하위호환)
      expect(expanded).toContain(concern);
    }
  });

  it('확장 값은 전부 DB 실 vocab에 존재한다 (유령 값 0)', () => {
    for (const concern of UI_CONCERNS) {
      for (const value of expandConcernsToDbValues([concern])) {
        expect(DB_CONCERN_VOCAB.has(value)).toBe(true);
      }
    }
  });

  it('여러 고민 선택 시 중복 없이 합집합을 만든다', () => {
    const expanded = expandConcernsToDbValues(['acne', 'pore']);
    // acne·pore 둘 다 sebum/blackhead를 포함 — 중복 제거 확인
    expect(new Set(expanded).size).toBe(expanded.length);
    expect(expanded).toContain('acne');
    expect(expanded).toContain('pore');
  });

  it('진정(soothing)은 DB 변형(redness/atopy/barrier)까지 확장한다 (기존 4개 붕괴 완화)', () => {
    const expanded = expandConcernsToDbValues(['soothing']);
    expect(expanded).toContain('redness');
    expect(expanded).toContain('atopy');
    expect(expanded.length).toBeGreaterThanOrEqual(4);
  });
});
