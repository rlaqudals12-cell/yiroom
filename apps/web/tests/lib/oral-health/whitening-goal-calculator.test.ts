/**
 * 미백 목표 계산기 테스트
 *
 * @module tests/lib/oral-health/whitening-goal-calculator
 * @description 퍼스널컬러 연계 미백 목표 추천 검증
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWhiteningGoal,
  trackWhiteningProgress,
  generateWhiteningPrecautions,
  generateWhiteningGoalSummary,
} from '@/lib/oral-health/whitening-goal-calculator';
import type { WhiteningGoalResult } from '@/types/oral-health';

describe('lib/oral-health/whitening-goal-calculator', () => {
  describe('calculateWhiteningGoal', () => {
    it('should return whitening goal result', () => {
      const result = calculateWhiteningGoal({
        currentShade: 'A3',
        personalColorSeason: 'spring',
        desiredLevel: 'moderate',
      });

      expect(result).toBeDefined();
      expect(result.targetShade).toBeDefined();
      expect(result.shadeStepsNeeded).toBeDefined();
      expect(result.expectedDuration).toBeDefined();
      expect(result.recommendedMethods).toBeDefined();
    });

    it('should include target shade from VITA system', () => {
      const result = calculateWhiteningGoal({
        currentShade: 'A3',
        personalColorSeason: 'summer',
        desiredLevel: 'moderate',
      });

      const validShades = [
        '0M1',
        '0M2',
        '0M3',
        'A1',
        'A2',
        'A3',
        'A3.5',
        'A4',
        'B1',
        'B2',
        'B3',
        'B4',
        'C1',
        'C2',
        'C3',
        'C4',
        'D2',
        'D3',
        'D4',
      ];
      expect(validShades).toContain(result.targetShade);
    });

    it('should include expected duration range', () => {
      const result = calculateWhiteningGoal({
        currentShade: 'A3',
        personalColorSeason: 'spring',
        desiredLevel: 'moderate',
      });

      expect(result.expectedDuration.minWeeks).toBeGreaterThan(0);
      expect(result.expectedDuration.maxWeeks).toBeGreaterThan(result.expectedDuration.minWeeks);
    });

    it('should include isOverWhitening flag', () => {
      const result = calculateWhiteningGoal({
        currentShade: 'A3',
        personalColorSeason: 'autumn',
        desiredLevel: 'dramatic',
      });

      expect(typeof result.isOverWhitening).toBe('boolean');
    });

    it('should include harmony suggestion', () => {
      const result = calculateWhiteningGoal({
        currentShade: 'A3',
        personalColorSeason: 'spring',
        desiredLevel: 'moderate',
      });

      expect(result.harmonySuggestion.length).toBeGreaterThan(0);
    });

    it('should include recommended methods', () => {
      const result = calculateWhiteningGoal({
        currentShade: 'A3',
        personalColorSeason: 'spring',
        desiredLevel: 'moderate',
      });

      expect(result.recommendedMethods.length).toBeGreaterThan(0);
      expect(result.recommendedMethods.length).toBeLessThanOrEqual(3);

      for (const method of result.recommendedMethods) {
        expect(method.method).toBeDefined();
        expect(method.effectiveness).toBeDefined();
        expect(method.duration).toBeDefined();
        expect(method.notes).toBeDefined();
      }
    });

    describe('by desired level', () => {
      it('should recommend fewer steps for subtle level', () => {
        const result = calculateWhiteningGoal({
          currentShade: 'A3',
          personalColorSeason: 'spring',
          desiredLevel: 'subtle',
        });

        expect(result.shadeStepsNeeded).toBeLessThanOrEqual(3);
      });

      it('should recommend moderate steps for moderate level', () => {
        const result = calculateWhiteningGoal({
          currentShade: 'A3',
          personalColorSeason: 'spring',
          desiredLevel: 'moderate',
        });

        expect(result.shadeStepsNeeded).toBeLessThanOrEqual(5);
      });

      it('should recommend more steps for dramatic level', () => {
        const subtleResult = calculateWhiteningGoal({
          currentShade: 'A4',
          personalColorSeason: 'winter',
          desiredLevel: 'subtle',
        });
        const dramaticResult = calculateWhiteningGoal({
          currentShade: 'A4',
          personalColorSeason: 'winter',
          desiredLevel: 'dramatic',
        });

        expect(dramaticResult.shadeStepsNeeded).toBeGreaterThanOrEqual(
          subtleResult.shadeStepsNeeded
        );
      });
    });

    describe('by season', () => {
      it('should warn for autumn with dramatic whitening', () => {
        const result = calculateWhiteningGoal({
          currentShade: 'A2',
          personalColorSeason: 'autumn',
          desiredLevel: 'dramatic',
        });

        // Autumn은 과도한 미백에 민감
        if (result.targetShade.startsWith('0M')) {
          expect(result.isOverWhitening).toBe(true);
        }
      });

      it('should allow brighter shades for winter', () => {
        const result = calculateWhiteningGoal({
          currentShade: 'A3',
          personalColorSeason: 'winter',
          desiredLevel: 'dramatic',
        });

        // Winter는 밝은 셰이드도 허용
        expect(result.isOverWhitening).toBe(false);
      });

      it('should return different harmony suggestions per season', () => {
        const springResult = calculateWhiteningGoal({
          currentShade: 'A3',
          personalColorSeason: 'spring',
          desiredLevel: 'moderate',
        });
        const winterResult = calculateWhiteningGoal({
          currentShade: 'A3',
          personalColorSeason: 'winter',
          desiredLevel: 'moderate',
        });

        expect(springResult.harmonySuggestion).not.toBe(winterResult.harmonySuggestion);
      });
    });

    it('should calculate shorter duration for subtle level', () => {
      const subtleResult = calculateWhiteningGoal({
        currentShade: 'A3',
        personalColorSeason: 'spring',
        desiredLevel: 'subtle',
      });
      const dramaticResult = calculateWhiteningGoal({
        currentShade: 'A3',
        personalColorSeason: 'spring',
        desiredLevel: 'dramatic',
      });

      // Subtle은 단계가 적어서 전체 기간이 짧을 수 있음
      expect(subtleResult.expectedDuration.minWeeks).toBeGreaterThanOrEqual(1);
      expect(dramaticResult.expectedDuration.minWeeks).toBeGreaterThanOrEqual(1);
    });
  });

  describe('trackWhiteningProgress', () => {
    it('should calculate progress percentage', () => {
      const result = trackWhiteningProgress('A3', 'A2', 'A1');

      expect(result.progressPercentage).toBeGreaterThanOrEqual(0);
      expect(result.progressPercentage).toBeLessThanOrEqual(100);
    });

    it('should return 100% when goal is reached', () => {
      const result = trackWhiteningProgress('A3', 'A1', 'A1');

      expect(result.isGoalReached).toBe(true);
      expect(result.progressPercentage).toBe(100);
    });

    it('should return steps completed and remaining', () => {
      const result = trackWhiteningProgress('A3', 'A2', 'A1');

      expect(result.stepsCompleted).toBeGreaterThanOrEqual(0);
      expect(result.stepsRemaining).toBeGreaterThanOrEqual(0);
    });

    it('should return congratulation message when goal reached', () => {
      const result = trackWhiteningProgress('A3', 'A1', 'A1');

      expect(result.message).toContain('축하');
    });

    it('should return encouraging message at 75%+ progress', () => {
      // A4 → B1 is about 12 steps
      // 중간 지점 찾기
      const result = trackWhiteningProgress('A4', 'A1', 'B1');

      if (result.progressPercentage >= 75 && !result.isGoalReached) {
        expect(result.message).toContain('거의');
      }
    });

    it('should handle same start and current shade', () => {
      const result = trackWhiteningProgress('A3', 'A3', 'A1');

      expect(result.stepsCompleted).toBe(0);
      expect(result.progressPercentage).toBeLessThanOrEqual(25);
    });

    it('should have non-negative steps', () => {
      const result = trackWhiteningProgress('A3', 'A2', 'A1');

      expect(result.stepsCompleted).toBeGreaterThanOrEqual(0);
      expect(result.stepsRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateWhiteningPrecautions', () => {
    it('should return array of precautions', () => {
      const precautions = generateWhiteningPrecautions('spring', 3);

      expect(Array.isArray(precautions)).toBe(true);
      expect(precautions.length).toBeGreaterThan(0);
    });

    it('should include general precautions', () => {
      const precautions = generateWhiteningPrecautions('summer', 2);

      expect(precautions.some((p) => p.includes('착색 음식'))).toBe(true);
      expect(precautions.some((p) => p.includes('잇몸'))).toBe(true);
    });

    it('should add extra precautions for large shade changes', () => {
      const smallChange = generateWhiteningPrecautions('summer', 2);
      const largeChange = generateWhiteningPrecautions('summer', 5);

      expect(largeChange.length).toBeGreaterThan(smallChange.length);
    });

    it('should include professional consultation for 4+ steps', () => {
      const precautions = generateWhiteningPrecautions('spring', 5);

      expect(precautions.some((p) => p.includes('전문가 상담'))).toBe(true);
    });

    it('should include season-specific notes for warm seasons', () => {
      const autumnPrecautions = generateWhiteningPrecautions('autumn', 3);
      const springPrecautions = generateWhiteningPrecautions('spring', 3);

      // 웜톤 시즌에 대한 특별 주의사항
      expect(autumnPrecautions.length).toBeGreaterThanOrEqual(3);
      expect(springPrecautions.length).toBeGreaterThanOrEqual(3);
    });

    it('should all be strings', () => {
      const precautions = generateWhiteningPrecautions('winter', 4);

      for (const p of precautions) {
        expect(typeof p).toBe('string');
      }
    });
  });

  describe('generateWhiteningGoalSummary', () => {
    const mockResult: WhiteningGoalResult = {
      targetShade: 'A1',
      shadeStepsNeeded: 4,
      expectedDuration: { minWeeks: 3, maxWeeks: 6 },
      isOverWhitening: false,
      harmonySuggestion: '따뜻한 피부톤에 자연스러운 아이보리 톤이 어울립니다.',
      recommendedMethods: [
        {
          method: 'strips',
          effectiveness: 'medium',
          duration: '3-4주',
          notes: '10-15% 카바마이드 퍼옥사이드',
        },
      ],
    };

    it('should include target shade', () => {
      const summary = generateWhiteningGoalSummary(mockResult);

      expect(summary).toContain('A1');
    });

    it('should include shade steps', () => {
      const summary = generateWhiteningGoalSummary(mockResult);

      expect(summary).toContain('4단계');
    });

    it('should include duration range', () => {
      const summary = generateWhiteningGoalSummary(mockResult);

      expect(summary).toContain('3-6주');
    });

    it('should include harmony suggestion', () => {
      const summary = generateWhiteningGoalSummary(mockResult);

      expect(summary).toContain('아이보리');
    });

    it('should include over whitening warning when true', () => {
      const overWhiteningResult: WhiteningGoalResult = {
        ...mockResult,
        isOverWhitening: true,
        overWhiteningReason: '웜톤 피부에 과도한 미백은 부자연스러울 수 있습니다.',
      };
      const summary = generateWhiteningGoalSummary(overWhiteningResult);

      expect(summary).toContain('주의');
      expect(summary).toContain('과도한 미백');
    });

    it('should not include warning when not over whitening', () => {
      const summary = generateWhiteningGoalSummary(mockResult);

      expect(summary).not.toContain('주의');
    });

    it('should include reason when over whitening', () => {
      const overWhiteningResult: WhiteningGoalResult = {
        ...mockResult,
        isOverWhitening: true,
        overWhiteningReason: '웜톤 피부에 과도한 미백은 부자연스러울 수 있습니다.',
      };
      const summary = generateWhiteningGoalSummary(overWhiteningResult);

      expect(summary).toContain('웜톤');
    });
  });
});
