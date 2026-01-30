/**
 * 영양소 시너지/길항 매트릭스 테스트
 *
 * @module tests/lib/nutrition/nutrient-synergy
 */

import { describe, it, expect } from 'vitest';
import {
  NUTRIENT_INTERACTION_MATRIX,
  getInteractionFactor,
  getInteractionType,
  applyInteractionFactor,
  getSynergyNutrients,
  getAntagonistNutrients,
  getInteractionInfo,
} from '@/lib/nutrition/nutrient-synergy';

describe('lib/nutrition/nutrient-synergy', () => {
  // ---------------------------------------------------------------------------
  // NUTRIENT_INTERACTION_MATRIX 테스트
  // ---------------------------------------------------------------------------

  describe('NUTRIENT_INTERACTION_MATRIX', () => {
    it('주요 영양소에 대한 매트릭스가 정의되어 있다', () => {
      const expectedNutrients = [
        'vitaminA',
        'vitaminC',
        'vitaminD',
        'vitaminE',
        'calcium',
        'zinc',
        'iron',
        'omega3',
        'collagen',
      ];

      for (const nutrient of expectedNutrients) {
        expect(NUTRIENT_INTERACTION_MATRIX[nutrient]).toBeDefined();
      }
    });

    it('비타민C-철분 시너지가 정의되어 있다', () => {
      expect(NUTRIENT_INTERACTION_MATRIX.vitaminC.iron).toBe(1.5);
    });

    it('칼슘-철분 길항이 정의되어 있다', () => {
      expect(NUTRIENT_INTERACTION_MATRIX.calcium.iron).toBe(0.6);
    });

    it('비타민D-칼슘 시너지가 정의되어 있다', () => {
      expect(NUTRIENT_INTERACTION_MATRIX.vitaminD.calcium).toBe(1.5);
    });

    it('모든 상호작용 계수가 0보다 크다', () => {
      for (const [, interactions] of Object.entries(NUTRIENT_INTERACTION_MATRIX)) {
        for (const [, factor] of Object.entries(interactions)) {
          expect(factor).toBeGreaterThan(0);
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getInteractionFactor 테스트
  // ---------------------------------------------------------------------------

  describe('getInteractionFactor', () => {
    it('정의된 상호작용의 계수를 반환한다', () => {
      expect(getInteractionFactor('vitaminC', 'iron')).toBe(1.5);
      expect(getInteractionFactor('calcium', 'iron')).toBe(0.6);
      expect(getInteractionFactor('vitaminD', 'calcium')).toBe(1.5);
    });

    it('정의되지 않은 상호작용은 1.0을 반환한다', () => {
      expect(getInteractionFactor('unknownNutrient', 'iron')).toBe(1.0);
      expect(getInteractionFactor('vitaminC', 'unknownNutrient')).toBe(1.0);
    });

    it('동일 영양소 쿼리도 기본값 1.0을 반환한다', () => {
      expect(getInteractionFactor('vitaminC', 'vitaminC')).toBe(1.0);
    });
  });

  // ---------------------------------------------------------------------------
  // getInteractionType 테스트
  // ---------------------------------------------------------------------------

  describe('getInteractionType', () => {
    it('1.05 초과는 synergy를 반환한다', () => {
      expect(getInteractionType(1.5)).toBe('synergy');
      expect(getInteractionType(1.1)).toBe('synergy');
      expect(getInteractionType(1.06)).toBe('synergy');
    });

    it('0.95 미만은 antagonist를 반환한다', () => {
      expect(getInteractionType(0.6)).toBe('antagonist');
      expect(getInteractionType(0.9)).toBe('antagonist');
      expect(getInteractionType(0.94)).toBe('antagonist');
    });

    it('0.95-1.05 범위는 independent를 반환한다', () => {
      expect(getInteractionType(1.0)).toBe('independent');
      expect(getInteractionType(0.95)).toBe('independent');
      expect(getInteractionType(1.05)).toBe('independent');
      expect(getInteractionType(0.99)).toBe('independent');
      expect(getInteractionType(1.01)).toBe('independent');
    });
  });

  // ---------------------------------------------------------------------------
  // applyInteractionFactor 테스트
  // ---------------------------------------------------------------------------

  describe('applyInteractionFactor', () => {
    it('시너지 관계에서 흡수율이 증가한다', () => {
      // 비타민C + 철분: 1.5배
      const adjusted = applyInteractionFactor('vitaminC', 'iron', 100);
      expect(adjusted).toBe(150);
    });

    it('길항 관계에서 흡수율이 감소한다', () => {
      // 칼슘 + 철분: 0.6배
      const adjusted = applyInteractionFactor('calcium', 'iron', 100);
      expect(adjusted).toBe(60);
    });

    it('정의되지 않은 관계에서 흡수율이 변하지 않는다', () => {
      const adjusted = applyInteractionFactor('unknown1', 'unknown2', 100);
      expect(adjusted).toBe(100);
    });

    it('0% 흡수율에서도 동작한다', () => {
      const adjusted = applyInteractionFactor('vitaminC', 'iron', 0);
      expect(adjusted).toBe(0);
    });

    it('소수점 흡수율도 처리한다', () => {
      const adjusted = applyInteractionFactor('vitaminD', 'calcium', 33.33);
      expect(adjusted).toBeCloseTo(49.995, 2);
    });
  });

  // ---------------------------------------------------------------------------
  // getSynergyNutrients 테스트
  // ---------------------------------------------------------------------------

  describe('getSynergyNutrients', () => {
    it('비타민C의 시너지 영양소를 반환한다', () => {
      const synergies = getSynergyNutrients('vitaminC');

      expect(synergies).toContain('vitaminE');
      expect(synergies).toContain('iron');
      expect(synergies).toContain('collagen');
    });

    it('비타민D의 시너지 영양소를 반환한다', () => {
      const synergies = getSynergyNutrients('vitaminD');

      expect(synergies).toContain('calcium');
      expect(synergies).toContain('magnesium');
      expect(synergies).toContain('vitaminK');
    });

    it('정의되지 않은 영양소는 빈 배열을 반환한다', () => {
      const synergies = getSynergyNutrients('unknownNutrient');
      expect(synergies).toEqual([]);
    });

    it('길항 관계 영양소는 포함하지 않는다', () => {
      const synergies = getSynergyNutrients('calcium');

      // 칼슘-철분은 길항 (0.6), 시너지 목록에 없어야 함
      expect(synergies).not.toContain('iron');
      expect(synergies).not.toContain('zinc');
    });

    it('반환값은 배열이다', () => {
      const synergies = getSynergyNutrients('iron');
      expect(Array.isArray(synergies)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getAntagonistNutrients 테스트
  // ---------------------------------------------------------------------------

  describe('getAntagonistNutrients', () => {
    it('칼슘의 길항 영양소를 반환한다', () => {
      const antagonists = getAntagonistNutrients('calcium');

      expect(antagonists).toContain('iron');
      expect(antagonists).toContain('zinc');
      expect(antagonists).toContain('magnesium');
    });

    it('철분의 길항 영양소를 반환한다', () => {
      const antagonists = getAntagonistNutrients('iron');

      expect(antagonists).toContain('calcium');
      expect(antagonists).toContain('zinc');
      expect(antagonists).toContain('tea');
    });

    it('아연의 길항 영양소를 반환한다', () => {
      const antagonists = getAntagonistNutrients('zinc');

      expect(antagonists).toContain('iron');
      expect(antagonists).toContain('copper');
      expect(antagonists).toContain('calcium');
    });

    it('정의되지 않은 영양소는 빈 배열을 반환한다', () => {
      const antagonists = getAntagonistNutrients('unknownNutrient');
      expect(antagonists).toEqual([]);
    });

    it('시너지 관계 영양소는 포함하지 않는다', () => {
      const antagonists = getAntagonistNutrients('vitaminC');

      // 비타민C-철분은 시너지 (1.5), 길항 목록에 없어야 함
      expect(antagonists).not.toContain('iron');
      expect(antagonists).not.toContain('vitaminE');
    });
  });

  // ---------------------------------------------------------------------------
  // getInteractionInfo 테스트
  // ---------------------------------------------------------------------------

  describe('getInteractionInfo', () => {
    it('시너지 관계의 상세 정보를 반환한다', () => {
      const info = getInteractionInfo('vitaminC', 'iron');

      expect(info.factor).toBe(1.5);
      expect(info.type).toBe('synergy');
    });

    it('길항 관계의 상세 정보를 반환한다', () => {
      const info = getInteractionInfo('calcium', 'iron');

      expect(info.factor).toBe(0.6);
      expect(info.type).toBe('antagonist');
    });

    it('설명이 정의된 관계는 description을 포함한다', () => {
      const info = getInteractionInfo('vitaminC', 'iron');

      expect(info.description).toBeDefined();
      expect(info.description).toContain('비헴철');
    });

    it('비타민D-칼슘 관계에 설명이 있다', () => {
      const info = getInteractionInfo('vitaminD', 'calcium');

      expect(info.description).toBeDefined();
      expect(info.description).toContain('칼슘 흡수');
    });

    it('설명이 없는 관계는 description이 undefined다', () => {
      const info = getInteractionInfo('omega3', 'vitaminE');

      expect(info.factor).toBe(1.2);
      expect(info.description).toBeUndefined();
    });

    it('정의되지 않은 관계는 기본값을 반환한다', () => {
      const info = getInteractionInfo('unknown1', 'unknown2');

      expect(info.factor).toBe(1.0);
      expect(info.type).toBe('independent');
      expect(info.description).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 통합 테스트
  // ---------------------------------------------------------------------------

  describe('통합 시나리오', () => {
    it('철분 흡수를 최적화하는 영양소 조합을 찾을 수 있다', () => {
      const ironSynergies = getSynergyNutrients('iron');
      const ironAntagonists = getAntagonistNutrients('iron');

      // 비타민C와 함께 섭취하면 좋음
      expect(ironSynergies).toContain('vitaminC');

      // 칼슘, 아연과 동시 섭취 피하기
      expect(ironAntagonists).toContain('calcium');
      expect(ironAntagonists).toContain('zinc');
    });

    it('콜라겐 흡수를 높이는 조합을 확인할 수 있다', () => {
      const info = getInteractionInfo('collagen', 'vitaminC');

      expect(info.type).toBe('synergy');
      expect(info.factor).toBeGreaterThan(1);
    });

    it('칼슘 보충제 섭취 시 주의할 영양소를 확인할 수 있다', () => {
      const antagonists = getAntagonistNutrients('calcium');

      // 철분, 아연과 동시 섭취 시 흡수 저하
      expect(antagonists.length).toBeGreaterThan(0);

      for (const ant of antagonists) {
        const factor = getInteractionFactor('calcium', ant);
        expect(factor).toBeLessThan(1);
      }
    });
  });
});
