/**
 * 화장품 성분 타입 및 유틸리티 함수 테스트
 * @description ingredient.ts의 타입 변환 및 유틸 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getEWGLevel,
  toCosmeticIngredient,
  getEWGLevelLabel,
  getEWGLevelColors,
  getIngredientCategoryLabel,
  EWG_COLORS,
  INGREDIENT_CATEGORY_LABELS,
  type CosmeticIngredientRow,
  type EWGLevel,
  type IngredientCategory,
} from '@/types/ingredient';

// =============================================================================
// Mock 데이터
// =============================================================================

const mockIngredientRow: CosmeticIngredientRow = {
  id: 'test-id-001',
  name_ko: '히알루론산',
  name_en: 'Hyaluronic Acid',
  name_inci: 'SODIUM HYALURONATE',
  aliases: ['HA', '소듐히알루로네이트'],
  ewg_score: 1,
  ewg_data_availability: 'good',
  category: 'moisturizer',
  functions: ['보습', '피부장벽강화'],
  is_caution_20: false,
  is_allergen: false,
  allergen_type: null,
  skin_type_caution: {
    oily: 'recommended',
    dry: 'recommended',
    sensitive: 'recommended',
    combination: 'recommended',
    normal: 'recommended',
  },
  description: '피부 수분 유지에 탁월한 보습제',
  benefits: ['강력한 보습', '주름 개선', '피부 탄력 증가'],
  concerns: [],
  source: 'EWG Skin Deep',
  created_at: '2026-01-04T00:00:00.000Z',
  updated_at: '2026-01-04T12:00:00.000Z',
};

// =============================================================================
// 테스트
// =============================================================================

describe('ingredient types', () => {
  // ---------------------------------------------------------------------------
  // getEWGLevel
  // ---------------------------------------------------------------------------

  describe('getEWGLevel', () => {
    it('점수 1-2는 low를 반환해야 함', () => {
      expect(getEWGLevel(1)).toBe('low');
      expect(getEWGLevel(2)).toBe('low');
    });

    it('점수 3-6은 moderate를 반환해야 함', () => {
      expect(getEWGLevel(3)).toBe('moderate');
      expect(getEWGLevel(4)).toBe('moderate');
      expect(getEWGLevel(5)).toBe('moderate');
      expect(getEWGLevel(6)).toBe('moderate');
    });

    it('점수 7-10은 high를 반환해야 함', () => {
      expect(getEWGLevel(7)).toBe('high');
      expect(getEWGLevel(8)).toBe('high');
      expect(getEWGLevel(9)).toBe('high');
      expect(getEWGLevel(10)).toBe('high');
    });

    it('undefined는 unknown을 반환해야 함', () => {
      expect(getEWGLevel(undefined)).toBe('unknown');
    });

    it('null은 unknown을 반환해야 함', () => {
      expect(getEWGLevel(null)).toBe('unknown');
    });
  });

  // ---------------------------------------------------------------------------
  // toCosmeticIngredient
  // ---------------------------------------------------------------------------

  describe('toCosmeticIngredient', () => {
    it('DB row를 CosmeticIngredient로 변환해야 함', () => {
      const result = toCosmeticIngredient(mockIngredientRow);

      expect(result.id).toBe('test-id-001');
      expect(result.nameKo).toBe('히알루론산');
      expect(result.nameEn).toBe('Hyaluronic Acid');
      expect(result.nameInci).toBe('SODIUM HYALURONATE');
      expect(result.aliases).toEqual(['HA', '소듐히알루로네이트']);
      expect(result.ewgScore).toBe(1);
      expect(result.ewgDataAvailability).toBe('good');
      expect(result.category).toBe('moisturizer');
      expect(result.functions).toEqual(['보습', '피부장벽강화']);
      expect(result.isCaution20).toBe(false);
      expect(result.isAllergen).toBe(false);
      expect(result.allergenType).toBeUndefined();
      expect(result.skinTypeCaution?.oily).toBe('recommended');
      expect(result.description).toBe('피부 수분 유지에 탁월한 보습제');
      expect(result.benefits).toEqual(['강력한 보습', '주름 개선', '피부 탄력 증가']);
      expect(result.concerns).toEqual([]);
      expect(result.source).toBe('EWG Skin Deep');
      expect(result.createdAt).toBe('2026-01-04T00:00:00.000Z');
      expect(result.updatedAt).toBe('2026-01-04T12:00:00.000Z');
    });

    it('null 필드는 undefined로 변환해야 함', () => {
      const rowWithNulls: CosmeticIngredientRow = {
        ...mockIngredientRow,
        name_en: null,
        name_inci: null,
        aliases: null,
        ewg_score: null,
        ewg_data_availability: null,
        functions: null,
        allergen_type: null,
        skin_type_caution: null,
        description: null,
        benefits: null,
        concerns: null,
        source: null,
      };

      const result = toCosmeticIngredient(rowWithNulls);

      // ?? undefined 패턴 사용 필드
      expect(result.nameEn).toBeUndefined();
      expect(result.nameInci).toBeUndefined();
      expect(result.aliases).toBeUndefined();
      expect(result.ewgScore).toBeUndefined();
      expect(result.allergenType).toBeUndefined();
      expect(result.skinTypeCaution).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.benefits).toBeUndefined();
      expect(result.concerns).toBeUndefined();
      expect(result.source).toBeUndefined();

      // ewgDataAvailability는 as 캐스팅으로 null이 유지될 수 있음
      expect([null, undefined]).toContain(result.ewgDataAvailability);

      // 빈 배열 기본값
      expect(result.functions).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // getEWGLevelLabel
  // ---------------------------------------------------------------------------

  describe('getEWGLevelLabel', () => {
    it('각 레벨에 대한 한글 라벨을 반환해야 함', () => {
      expect(getEWGLevelLabel('low')).toBe('안전');
      expect(getEWGLevelLabel('moderate')).toBe('보통');
      expect(getEWGLevelLabel('high')).toBe('주의');
      expect(getEWGLevelLabel('unknown')).toBe('미확인');
    });
  });

  // ---------------------------------------------------------------------------
  // getEWGLevelColors
  // ---------------------------------------------------------------------------

  describe('getEWGLevelColors', () => {
    it('각 레벨에 대한 색상 객체를 반환해야 함', () => {
      const levels: EWGLevel[] = ['low', 'moderate', 'high', 'unknown'];

      levels.forEach((level) => {
        const colors = getEWGLevelColors(level);
        expect(colors).toHaveProperty('text');
        expect(colors).toHaveProperty('bg');
        expect(colors).toHaveProperty('border');
        expect(colors).toHaveProperty('label');
      });
    });

    it('low 레벨은 녹색 계열이어야 함', () => {
      const colors = getEWGLevelColors('low');
      expect(colors.text).toContain('green');
      expect(colors.bg).toContain('green');
    });

    it('high 레벨은 빨간색 계열이어야 함', () => {
      const colors = getEWGLevelColors('high');
      expect(colors.text).toContain('red');
      expect(colors.bg).toContain('red');
    });
  });

  // ---------------------------------------------------------------------------
  // getIngredientCategoryLabel
  // ---------------------------------------------------------------------------

  describe('getIngredientCategoryLabel', () => {
    it('모든 카테고리에 대한 한글 라벨을 반환해야 함', () => {
      const categories: IngredientCategory[] = [
        'moisturizer',
        'whitening',
        'antioxidant',
        'soothing',
        'surfactant',
        'preservative',
        'sunscreen',
        'exfoliant',
        'emulsifier',
        'fragrance',
        'colorant',
        'other',
      ];

      categories.forEach((category) => {
        const label = getIngredientCategoryLabel(category);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });

    it('특정 카테고리 라벨이 올바른지 확인', () => {
      expect(getIngredientCategoryLabel('moisturizer')).toBe('보습제');
      expect(getIngredientCategoryLabel('whitening')).toBe('미백제');
      expect(getIngredientCategoryLabel('preservative')).toBe('방부제');
      expect(getIngredientCategoryLabel('sunscreen')).toBe('자외선차단제');
    });
  });

  // ---------------------------------------------------------------------------
  // 상수 검증
  // ---------------------------------------------------------------------------

  describe('EWG_COLORS', () => {
    it('모든 레벨에 대한 색상이 정의되어야 함', () => {
      expect(EWG_COLORS).toHaveProperty('low');
      expect(EWG_COLORS).toHaveProperty('moderate');
      expect(EWG_COLORS).toHaveProperty('high');
      expect(EWG_COLORS).toHaveProperty('unknown');
    });
  });

  describe('INGREDIENT_CATEGORY_LABELS', () => {
    it('12개 카테고리가 정의되어야 함', () => {
      expect(Object.keys(INGREDIENT_CATEGORY_LABELS)).toHaveLength(12);
    });
  });
});
