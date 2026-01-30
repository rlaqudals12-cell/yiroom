/**
 * RDA 데이터베이스 테스트
 *
 * @module tests/lib/nutrition/rda-database
 */

import { describe, it, expect } from 'vitest';
import {
  KOREAN_RDA,
  getRDA,
  getNutrientRDA,
  getUpperLimits,
  getAllNutrientIds,
  type NutrientId,
  type RDAGender,
} from '@/lib/nutrition/rda-database';

describe('lib/nutrition/rda-database', () => {
  // ---------------------------------------------------------------------------
  // KOREAN_RDA 상수 테스트
  // ---------------------------------------------------------------------------

  describe('KOREAN_RDA', () => {
    const genders: RDAGender[] = ['male', 'female'];

    it('남성과 여성 데이터가 모두 정의되어 있다', () => {
      expect(KOREAN_RDA.male).toBeDefined();
      expect(KOREAN_RDA.female).toBeDefined();
    });

    it('모든 필수 영양소가 정의되어 있다', () => {
      const requiredNutrients: NutrientId[] = [
        'vitaminA',
        'vitaminC',
        'vitaminD',
        'vitaminE',
        'vitaminK',
        'vitaminB1',
        'vitaminB2',
        'vitaminB3',
        'vitaminB6',
        'vitaminB12',
        'folate',
        'biotin',
        'calcium',
        'magnesium',
        'zinc',
        'selenium',
        'iron',
        'omega3',
      ];

      for (const gender of genders) {
        for (const nutrient of requiredNutrients) {
          expect(KOREAN_RDA[gender][nutrient]).toBeDefined();
        }
      }
    });

    it('각 영양소 RDA가 필수 필드를 가진다', () => {
      for (const gender of genders) {
        for (const rdaInfo of Object.values(KOREAN_RDA[gender])) {
          expect(rdaInfo).toHaveProperty('rda');
          expect(rdaInfo).toHaveProperty('unit');
          expect(rdaInfo).toHaveProperty('ul');
          expect(rdaInfo).toHaveProperty('nameKo');
          expect(rdaInfo).toHaveProperty('nameEn');
        }
      }
    });

    it('RDA 값이 양수다', () => {
      for (const gender of genders) {
        for (const rdaInfo of Object.values(KOREAN_RDA[gender])) {
          expect(rdaInfo.rda).toBeGreaterThan(0);
        }
      }
    });

    it('UL이 있는 경우 RDA보다 크거나 같다', () => {
      for (const gender of genders) {
        for (const rdaInfo of Object.values(KOREAN_RDA[gender])) {
          if (rdaInfo.ul !== null) {
            expect(rdaInfo.ul).toBeGreaterThanOrEqual(rdaInfo.rda);
          }
        }
      }
    });

    it('성별에 따라 일부 RDA가 다르다', () => {
      // 철분: 여성이 남성보다 높음 (월경으로 인한 손실)
      expect(KOREAN_RDA.female.iron.rda).toBeGreaterThan(KOREAN_RDA.male.iron.rda);

      // 아연: 남성이 여성보다 높음
      expect(KOREAN_RDA.male.zinc.rda).toBeGreaterThan(KOREAN_RDA.female.zinc.rda);
    });

    it('한글 이름이 정확하다', () => {
      expect(KOREAN_RDA.male.vitaminC.nameKo).toBe('비타민 C');
      expect(KOREAN_RDA.male.calcium.nameKo).toBe('칼슘');
      expect(KOREAN_RDA.male.iron.nameKo).toBe('철분');
      expect(KOREAN_RDA.male.omega3.nameKo).toBe('오메가-3');
    });

    it('단위가 정확하다', () => {
      expect(KOREAN_RDA.male.vitaminC.unit).toBe('mg');
      expect(KOREAN_RDA.male.vitaminD.unit).toContain('IU');
      expect(KOREAN_RDA.male.vitaminA.unit).toContain('μg');
      expect(KOREAN_RDA.male.omega3.unit).toContain('EPA+DHA');
    });
  });

  // ---------------------------------------------------------------------------
  // getRDA 테스트
  // ---------------------------------------------------------------------------

  describe('getRDA', () => {
    it('남성 RDA를 반환한다', () => {
      const maleRDA = getRDA('male');

      expect(maleRDA).toBeDefined();
      expect(maleRDA.vitaminC.rda).toBe(100);
      expect(maleRDA.calcium.rda).toBe(800);
    });

    it('여성 RDA를 반환한다', () => {
      const femaleRDA = getRDA('female');

      expect(femaleRDA).toBeDefined();
      expect(femaleRDA.iron.rda).toBe(14);
      expect(femaleRDA.vitaminA.rda).toBe(650);
    });

    it('반환된 객체가 모든 영양소를 포함한다', () => {
      const rda = getRDA('male');
      const nutrientCount = Object.keys(rda).length;

      expect(nutrientCount).toBe(18); // 18개 영양소
    });
  });

  // ---------------------------------------------------------------------------
  // getNutrientRDA 테스트
  // ---------------------------------------------------------------------------

  describe('getNutrientRDA', () => {
    it('특정 영양소의 RDA를 반환한다', () => {
      const vitaminC = getNutrientRDA('male', 'vitaminC');

      expect(vitaminC.rda).toBe(100);
      expect(vitaminC.ul).toBe(2000);
      expect(vitaminC.unit).toBe('mg');
    });

    it('성별에 따라 다른 RDA를 반환한다', () => {
      const maleIron = getNutrientRDA('male', 'iron');
      const femaleIron = getNutrientRDA('female', 'iron');

      expect(maleIron.rda).toBe(10);
      expect(femaleIron.rda).toBe(14);
    });

    it('UL이 null인 영양소도 처리한다', () => {
      const vitaminK = getNutrientRDA('male', 'vitaminK');

      expect(vitaminK.ul).toBeNull();
    });

    it('모든 영양소 ID에 대해 유효한 결과를 반환한다', () => {
      const allIds = getAllNutrientIds();

      for (const id of allIds) {
        const rda = getNutrientRDA('male', id);
        expect(rda).toBeDefined();
        expect(rda.rda).toBeGreaterThan(0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getUpperLimits 테스트
  // ---------------------------------------------------------------------------

  describe('getUpperLimits', () => {
    it('모든 영양소의 상한 섭취량을 반환한다', () => {
      const limits = getUpperLimits('male');

      expect(limits.vitaminC).toBe(2000);
      expect(limits.vitaminA).toBe(3000);
      expect(limits.iron).toBe(45);
    });

    it('UL이 없는 영양소는 null을 반환한다', () => {
      const limits = getUpperLimits('male');

      expect(limits.vitaminK).toBeNull();
      expect(limits.vitaminB1).toBeNull();
      expect(limits.vitaminB2).toBeNull();
      expect(limits.vitaminB12).toBeNull();
      expect(limits.biotin).toBeNull();
    });

    it('반환 객체가 모든 영양소 ID를 키로 가진다', () => {
      const limits = getUpperLimits('female');
      const allIds = getAllNutrientIds();

      for (const id of allIds) {
        expect(id in limits).toBe(true);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getAllNutrientIds 테스트
  // ---------------------------------------------------------------------------

  describe('getAllNutrientIds', () => {
    it('모든 영양소 ID 목록을 반환한다', () => {
      const ids = getAllNutrientIds();

      expect(ids.length).toBe(18);
      expect(ids).toContain('vitaminC');
      expect(ids).toContain('calcium');
      expect(ids).toContain('iron');
      expect(ids).toContain('omega3');
    });

    it('반환값이 배열이다', () => {
      const ids = getAllNutrientIds();
      expect(Array.isArray(ids)).toBe(true);
    });

    it('모든 ID가 문자열이다', () => {
      const ids = getAllNutrientIds();

      for (const id of ids) {
        expect(typeof id).toBe('string');
      }
    });

    it('중복이 없다', () => {
      const ids = getAllNutrientIds();
      const uniqueIds = [...new Set(ids)];

      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  // ---------------------------------------------------------------------------
  // 데이터 정확성 테스트
  // ---------------------------------------------------------------------------

  describe('RDA 데이터 정확성', () => {
    it('비타민 D 권장량이 올바르다 (400 IU)', () => {
      expect(KOREAN_RDA.male.vitaminD.rda).toBe(400);
      expect(KOREAN_RDA.female.vitaminD.rda).toBe(400);
    });

    it('칼슘 권장량이 올바르다 (800 mg)', () => {
      expect(KOREAN_RDA.male.calcium.rda).toBe(800);
      expect(KOREAN_RDA.female.calcium.rda).toBe(800);
    });

    it('엽산 권장량이 올바르다 (400 μg DFE)', () => {
      expect(KOREAN_RDA.male.folate.rda).toBe(400);
      expect(KOREAN_RDA.female.folate.rda).toBe(400);
    });

    it('오메가-3 권장량이 올바르다 (500 mg EPA+DHA)', () => {
      expect(KOREAN_RDA.male.omega3.rda).toBe(500);
      expect(KOREAN_RDA.female.omega3.rda).toBe(500);
    });

    it('마그네슘 상한이 RDA와 같다 (보충제 기준)', () => {
      // 마그네슘 UL은 보충제 기준으로 RDA와 같은 350mg
      expect(KOREAN_RDA.male.magnesium.ul).toBe(350);
    });
  });
});
