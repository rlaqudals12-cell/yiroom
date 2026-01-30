/**
 * 영양소 섭취량 평가 함수 테스트
 *
 * @module tests/lib/nutrition/nutrient-evaluation
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateNutrientStatus,
  evaluateNutrientIntake,
  calculateBalanceIndex,
  type NutrientIntake,
} from '@/lib/nutrition/nutrient-evaluation';
import { KOREAN_RDA } from '@/lib/nutrition/rda-database';

describe('lib/nutrition/nutrient-evaluation', () => {
  // ---------------------------------------------------------------------------
  // evaluateNutrientStatus 테스트
  // ---------------------------------------------------------------------------

  describe('evaluateNutrientStatus', () => {
    const maleVitaminC = KOREAN_RDA.male.vitaminC; // rda: 100, ul: 2000

    it('RDA 70% 미만은 deficiency 상태다', () => {
      const status = evaluateNutrientStatus('vitaminC', 50, maleVitaminC);

      expect(status.status).toBe('deficiency');
      expect(status.ratio).toBe(50);
      expect(status.score).toBeLessThan(50);
    });

    it('RDA 70-130%는 optimal 상태다', () => {
      const status = evaluateNutrientStatus('vitaminC', 100, maleVitaminC);

      expect(status.status).toBe('optimal');
      expect(status.ratio).toBe(100);
      expect(status.score).toBeGreaterThanOrEqual(70);
    });

    it('RDA 130% 초과, UL 이하는 excess 상태다', () => {
      const status = evaluateNutrientStatus('vitaminC', 200, maleVitaminC);

      expect(status.status).toBe('excess');
      expect(status.ratio).toBe(200);
      expect(status.score).toBeLessThan(100);
    });

    it('UL 초과는 danger 상태다', () => {
      const status = evaluateNutrientStatus('vitaminC', 2500, maleVitaminC);

      expect(status.status).toBe('danger');
      expect(status.score).toBeLessThan(50);
    });

    it('정확한 RDA 섭취 시 높은 점수를 받는다', () => {
      const status = evaluateNutrientStatus('vitaminC', 100, maleVitaminC);

      expect(status.score).toBeGreaterThan(95);
    });

    it('반환 객체가 모든 필수 필드를 가진다', () => {
      const status = evaluateNutrientStatus('vitaminC', 100, maleVitaminC);

      expect(status).toHaveProperty('nutrientId', 'vitaminC');
      expect(status).toHaveProperty('intake', 100);
      expect(status).toHaveProperty('rda', 100);
      expect(status).toHaveProperty('ul', 2000);
      expect(status).toHaveProperty('unit', 'mg');
      expect(status).toHaveProperty('ratio');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('score');
    });

    it('점수는 0-100 범위로 제한된다', () => {
      // 극단적으로 낮은 섭취
      const lowStatus = evaluateNutrientStatus('vitaminC', 1, maleVitaminC);
      expect(lowStatus.score).toBeGreaterThanOrEqual(0);
      expect(lowStatus.score).toBeLessThanOrEqual(100);

      // 극단적으로 높은 섭취
      const highStatus = evaluateNutrientStatus('vitaminC', 10000, maleVitaminC);
      expect(highStatus.score).toBeGreaterThanOrEqual(0);
      expect(highStatus.score).toBeLessThanOrEqual(100);
    });

    it('UL이 null인 영양소도 처리한다', () => {
      const vitaminK = KOREAN_RDA.male.vitaminK; // ul: null

      // 높은 섭취량도 danger가 아님 (UL 없음)
      const status = evaluateNutrientStatus('vitaminK', 500, vitaminK);
      expect(status.status).not.toBe('danger');
    });
  });

  // ---------------------------------------------------------------------------
  // evaluateNutrientIntake 테스트
  // ---------------------------------------------------------------------------

  describe('evaluateNutrientIntake', () => {
    it('여러 영양소를 한 번에 평가한다', () => {
      const intake: NutrientIntake = {
        vitaminC: 100,
        calcium: 800,
        iron: 10,
      };

      const result = evaluateNutrientIntake(intake, 'male');

      expect(result.nutrientStatuses).toHaveLength(3);
      expect(Object.keys(result.nutrientScores)).toHaveLength(3);
    });

    it('전체 점수를 계산한다', () => {
      const optimalIntake: NutrientIntake = {
        vitaminC: 100,
        vitaminD: 400,
        calcium: 800,
      };

      const result = evaluateNutrientIntake(optimalIntake, 'male');

      // 최적 섭취 시 높은 점수
      expect(result.overallScore).toBeGreaterThan(80);
    });

    it('결핍 영양소를 식별한다', () => {
      const intake: NutrientIntake = {
        vitaminC: 30, // 70% 미만
        calcium: 800,
      };

      const result = evaluateNutrientIntake(intake, 'male');

      expect(result.deficiencies).toContain('vitaminC');
      expect(result.deficiencies).not.toContain('calcium');
    });

    it('과잉 영양소를 식별한다', () => {
      const intake: NutrientIntake = {
        vitaminC: 300, // 130% 초과, UL 이하
        calcium: 800,
      };

      const result = evaluateNutrientIntake(intake, 'male');

      expect(result.excesses).toContain('vitaminC');
    });

    it('위험 수준 영양소를 식별한다', () => {
      const intake: NutrientIntake = {
        vitaminC: 3000, // UL(2000) 초과
        calcium: 800,
      };

      const result = evaluateNutrientIntake(intake, 'male');

      expect(result.dangers).toContain('vitaminC');
    });

    it('추천 메시지를 생성한다', () => {
      const intake: NutrientIntake = {
        vitaminC: 30, // 결핍
        calcium: 800, // 정상
      };

      const result = evaluateNutrientIntake(intake, 'male');

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r) => r.includes('비타민 C'))).toBe(true);
    });

    it('양호한 상태에서 적절한 메시지를 반환한다', () => {
      const intake: NutrientIntake = {
        vitaminC: 100,
        calcium: 800,
        iron: 10,
      };

      const result = evaluateNutrientIntake(intake, 'male');

      expect(result.recommendations.length).toBeGreaterThan(0);
      // 양호한 경우 긍정적 메시지
      if (result.deficiencies.length === 0 && result.dangers.length === 0) {
        expect(result.recommendations.some((r) => r.includes('양호'))).toBe(true);
      }
    });

    it('성별에 따라 다른 RDA를 적용한다', () => {
      const intake: NutrientIntake = {
        iron: 14, // 여성 RDA, 남성은 10
      };

      const maleResult = evaluateNutrientIntake(intake, 'male');
      const femaleResult = evaluateNutrientIntake(intake, 'female');

      // 같은 섭취량이지만 비율이 다름
      const maleIronStatus = maleResult.nutrientStatuses.find((s) => s.nutrientId === 'iron');
      const femaleIronStatus = femaleResult.nutrientStatuses.find((s) => s.nutrientId === 'iron');

      expect(maleIronStatus!.ratio).toBeGreaterThan(femaleIronStatus!.ratio);
    });

    it('빈 섭취량에서도 동작한다', () => {
      const intake: NutrientIntake = {};
      const result = evaluateNutrientIntake(intake, 'male');

      expect(result.overallScore).toBe(0);
      expect(result.nutrientStatuses).toHaveLength(0);
    });

    it('정의되지 않은 영양소는 무시한다', () => {
      const intake: NutrientIntake = {
        vitaminC: 100,
        unknownNutrient: 500, // 존재하지 않는 영양소
      } as NutrientIntake;

      const result = evaluateNutrientIntake(intake, 'male');

      // vitaminC만 평가됨
      expect(result.nutrientStatuses).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // calculateBalanceIndex 테스트
  // ---------------------------------------------------------------------------

  describe('calculateBalanceIndex', () => {
    it('완벽한 균형 시 높은 인덱스를 반환한다', () => {
      const perfectIntake: NutrientIntake = {
        vitaminC: 100,
        vitaminD: 400,
        calcium: 800,
        iron: 10,
      };

      const index = calculateBalanceIndex(perfectIntake, 'male');

      expect(index).toBeGreaterThan(0.8);
    });

    it('불균형 시 낮은 인덱스를 반환한다', () => {
      const unbalancedIntake: NutrientIntake = {
        vitaminC: 20, // 매우 부족
        calcium: 2000, // 과다
        iron: 5, // 부족
      };

      const index = calculateBalanceIndex(unbalancedIntake, 'male');

      expect(index).toBeLessThan(0.5);
    });

    it('UL 초과 시 페널티가 적용된다', () => {
      const normalIntake: NutrientIntake = {
        vitaminC: 100,
      };
      const excessIntake: NutrientIntake = {
        vitaminC: 3000, // UL 초과
      };

      const normalIndex = calculateBalanceIndex(normalIntake, 'male');
      const excessIndex = calculateBalanceIndex(excessIntake, 'male');

      expect(excessIndex).toBeLessThan(normalIndex);
    });

    it('빈 섭취량은 0을 반환한다', () => {
      const index = calculateBalanceIndex({}, 'male');
      expect(index).toBe(0);
    });

    it('반환값은 0-1 범위다', () => {
      const intakes: NutrientIntake[] = [
        { vitaminC: 0 },
        { vitaminC: 100 },
        { vitaminC: 5000 },
        { vitaminC: 100, calcium: 800, iron: 10, zinc: 10 },
      ];

      for (const intake of intakes) {
        const index = calculateBalanceIndex(intake, 'male');
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThanOrEqual(1);
      }
    });

    it('소수점 둘째 자리까지 반환한다', () => {
      const intake: NutrientIntake = {
        vitaminC: 85,
        calcium: 750,
      };

      const index = calculateBalanceIndex(intake, 'male');

      // 소수점 둘째 자리까지
      expect(String(index).split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  // ---------------------------------------------------------------------------
  // 통합 시나리오 테스트
  // ---------------------------------------------------------------------------

  describe('통합 시나리오', () => {
    it('건강한 식단 평가', () => {
      const healthyIntake: NutrientIntake = {
        vitaminA: 800,
        vitaminC: 100,
        vitaminD: 400,
        vitaminE: 12,
        calcium: 800,
        iron: 10,
        zinc: 10,
        omega3: 500,
      };

      const result = evaluateNutrientIntake(healthyIntake, 'male');
      const balance = calculateBalanceIndex(healthyIntake, 'male');

      expect(result.overallScore).toBeGreaterThan(80);
      expect(result.deficiencies).toHaveLength(0);
      expect(result.dangers).toHaveLength(0);
      expect(balance).toBeGreaterThan(0.8);
    });

    it('비건 식단 부족 영양소 식별', () => {
      // 동물성 식품 제외로 부족할 수 있는 영양소
      const veganIntake: NutrientIntake = {
        vitaminB12: 0.5, // 동물성 식품에 주로 존재
        iron: 7, // 비헴철 흡수율 낮음
        omega3: 200, // 식물성 ALA는 EPA/DHA 전환 효율 낮음
      };

      const result = evaluateNutrientIntake(veganIntake, 'female');

      expect(result.deficiencies).toContain('vitaminB12');
    });

    it('과다 보충제 섭취 경고', () => {
      const oversupplementIntake: NutrientIntake = {
        vitaminA: 5000, // UL: 3000
        vitaminD: 5000, // UL: 4000
        zinc: 50, // UL: 35
      };

      const result = evaluateNutrientIntake(oversupplementIntake, 'male');

      expect(result.dangers.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r) => r.includes('과다'))).toBe(true);
    });
  });
});
