/**
 * 영양제/보충제 추천 모듈 테스트
 *
 * @module tests/lib/nutrition/supplementInsight
 */

import { describe, it, expect } from 'vitest';
import {
  getSupplementRecommendations,
  getTopSupplements,
  GOAL_SUPPLEMENTS,
  SKIN_CONCERN_SUPPLEMENTS,
  type SkinConcern,
  type SupplementRecommendation,
} from '@/lib/nutrition/supplementInsight';
import type { NutritionGoal } from '@/types/nutrition';

describe('lib/nutrition/supplementInsight', () => {
  // ---------------------------------------------------------------------------
  // 상수 테스트
  // ---------------------------------------------------------------------------

  describe('GOAL_SUPPLEMENTS', () => {
    const goals: NutritionGoal[] = ['weight_loss', 'maintain', 'muscle', 'skin', 'health'];

    it.each(goals)('%s 목표에 대한 영양제가 정의되어 있다', (goal) => {
      expect(GOAL_SUPPLEMENTS[goal]).toBeDefined();
      expect(GOAL_SUPPLEMENTS[goal].length).toBeGreaterThan(0);
    });

    it('모든 영양제가 올바른 형식을 가진다', () => {
      for (const goal of goals) {
        for (const supp of GOAL_SUPPLEMENTS[goal]) {
          expect(supp).toHaveProperty('name');
          expect(supp).toHaveProperty('category');
          expect(supp).toHaveProperty('reason');
          expect(supp).toHaveProperty('timing');
          expect(supp).toHaveProperty('priority');
          expect(['high', 'medium', 'low']).toContain(supp.priority);
        }
      }
    });

    it('근육 목표에 단백질 관련 영양제가 포함된다', () => {
      const muscleSupps = GOAL_SUPPLEMENTS.muscle;
      const hasProtein = muscleSupps.some((s) => s.category === 'protein');
      expect(hasProtein).toBe(true);
    });

    it('피부 목표에 콜라겐이 포함된다', () => {
      const skinSupps = GOAL_SUPPLEMENTS.skin;
      const hasCollagen = skinSupps.some((s) => s.name.includes('콜라겐'));
      expect(hasCollagen).toBe(true);
    });
  });

  describe('SKIN_CONCERN_SUPPLEMENTS', () => {
    const concerns: SkinConcern[] = [
      'hydration',
      'oil',
      'wrinkles',
      'elasticity',
      'pigmentation',
      'trouble',
    ];

    it.each(concerns)('%s 피부 고민에 대한 영양제가 정의되어 있다', (concern) => {
      expect(SKIN_CONCERN_SUPPLEMENTS[concern]).toBeDefined();
      expect(SKIN_CONCERN_SUPPLEMENTS[concern].length).toBeGreaterThan(0);
    });

    it('수분 부족에 히알루론산이 추천된다', () => {
      const hydrationSupps = SKIN_CONCERN_SUPPLEMENTS.hydration;
      const hasHA = hydrationSupps.some((s) => s.name.includes('히알루론산'));
      expect(hasHA).toBe(true);
    });

    it('색소침착에 비타민C가 추천된다', () => {
      const pigmentSupps = SKIN_CONCERN_SUPPLEMENTS.pigmentation;
      const hasVitC = pigmentSupps.some((s) => s.name.includes('비타민C'));
      expect(hasVitC).toBe(true);
    });

    it('트러블에 아연이 추천된다', () => {
      const troubleSupps = SKIN_CONCERN_SUPPLEMENTS.trouble;
      const hasZinc = troubleSupps.some((s) => s.name.includes('아연'));
      expect(hasZinc).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getSupplementRecommendations 테스트
  // ---------------------------------------------------------------------------

  describe('getSupplementRecommendations', () => {
    it('목표만 전달하면 해당 목표의 영양제를 반환한다', () => {
      const result = getSupplementRecommendations('weight_loss');

      expect(result.goalSupplements.length).toBeGreaterThan(0);
      expect(result.skinSupplements).toHaveLength(0);
      expect(result.allSupplements.length).toBe(result.goalSupplements.length);
    });

    it('피부 고민과 함께 전달하면 피부 영양제도 반환한다', () => {
      const result = getSupplementRecommendations('health', ['hydration', 'wrinkles']);

      expect(result.goalSupplements.length).toBeGreaterThan(0);
      expect(result.skinSupplements.length).toBeGreaterThan(0);
      expect(result.summary).toContain('피부 고민');
    });

    it('통합 결과에서 중복이 제거된다', () => {
      // skin 목표와 wrinkles 피부 고민 모두 콜라겐을 포함
      const result = getSupplementRecommendations('skin', ['wrinkles']);

      const collagenCount = result.allSupplements.filter((s) => s.name.includes('콜라겐')).length;
      expect(collagenCount).toBeLessThanOrEqual(1);
    });

    it('결과가 우선순위로 정렬된다', () => {
      const result = getSupplementRecommendations('muscle', ['trouble']);

      const priorities = result.allSupplements.map((s) => s.priority);
      const priorityOrder = { high: 0, medium: 1, low: 2 };

      for (let i = 1; i < priorities.length; i++) {
        expect(priorityOrder[priorities[i]]).toBeGreaterThanOrEqual(
          priorityOrder[priorities[i - 1]]
        );
      }
    });

    it('요약 메시지에 목표가 포함된다', () => {
      const result = getSupplementRecommendations('muscle');
      expect(result.summary).toContain('근육 증가');
    });

    it('요약 메시지에 영양제 개수가 포함된다', () => {
      const result = getSupplementRecommendations('health');
      expect(result.summary).toMatch(/\d+개 영양제/);
    });

    it('빈 피부 고민 배열을 전달해도 동작한다', () => {
      const result = getSupplementRecommendations('maintain', []);

      expect(result.goalSupplements.length).toBeGreaterThan(0);
      expect(result.skinSupplements).toHaveLength(0);
    });

    it('모든 목표 타입에서 유효한 결과를 반환한다', () => {
      const goals: NutritionGoal[] = ['weight_loss', 'maintain', 'muscle', 'skin', 'health'];

      for (const goal of goals) {
        const result = getSupplementRecommendations(goal);
        expect(result).toHaveProperty('goalSupplements');
        expect(result).toHaveProperty('skinSupplements');
        expect(result).toHaveProperty('allSupplements');
        expect(result).toHaveProperty('summary');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getTopSupplements 테스트
  // ---------------------------------------------------------------------------

  describe('getTopSupplements', () => {
    it('기본 3개를 반환한다', () => {
      const result = getSupplementRecommendations('muscle', ['trouble']);
      const top = getTopSupplements(result);

      expect(top.length).toBeLessThanOrEqual(3);
    });

    it('지정한 개수만큼 반환한다', () => {
      const result = getSupplementRecommendations('health', ['hydration', 'wrinkles', 'trouble']);
      const top5 = getTopSupplements(result, 5);

      expect(top5.length).toBeLessThanOrEqual(5);
    });

    it('전체보다 많은 개수를 요청하면 전체를 반환한다', () => {
      const result = getSupplementRecommendations('maintain');
      const topAll = getTopSupplements(result, 100);

      expect(topAll.length).toBe(result.allSupplements.length);
    });

    it('1개만 요청해도 동작한다', () => {
      const result = getSupplementRecommendations('weight_loss');
      const top1 = getTopSupplements(result, 1);

      expect(top1.length).toBe(1);
    });

    it('반환된 영양제가 우선순위 순서를 유지한다', () => {
      const result = getSupplementRecommendations('skin', ['pigmentation']);
      const top = getTopSupplements(result, 3);

      // 첫 번째 요소가 가장 높은 우선순위
      if (top.length > 1) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        expect(priorityOrder[top[0].priority]).toBeLessThanOrEqual(priorityOrder[top[1].priority]);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 카테고리 및 복용 시기 테스트
  // ---------------------------------------------------------------------------

  describe('영양제 카테고리', () => {
    const allSupplements: SupplementRecommendation[] = [];

    // 모든 영양제 수집
    for (const supps of Object.values(GOAL_SUPPLEMENTS)) {
      allSupplements.push(...supps);
    }
    for (const supps of Object.values(SKIN_CONCERN_SUPPLEMENTS)) {
      allSupplements.push(...supps);
    }

    it('모든 카테고리가 유효하다', () => {
      const validCategories = [
        'vitamin',
        'mineral',
        'protein',
        'omega',
        'probiotic',
        'herbal',
        'other',
      ];

      for (const supp of allSupplements) {
        expect(validCategories).toContain(supp.category);
      }
    });

    it('모든 복용 시기가 정의되어 있다', () => {
      for (const supp of allSupplements) {
        expect(supp.timing).toBeTruthy();
        expect(supp.timing.length).toBeGreaterThan(0);
      }
    });

    it('주의사항이 있는 영양제는 caution 필드를 가진다', () => {
      const suppsWithCaution = allSupplements.filter((s) => s.caution);

      // 주의사항이 있는 영양제가 존재함
      expect(suppsWithCaution.length).toBeGreaterThan(0);

      for (const supp of suppsWithCaution) {
        expect(supp.caution!.length).toBeGreaterThan(0);
      }
    });
  });
});
