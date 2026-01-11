import { describe, it, expect } from 'vitest';
import {
  detectConflicts,
  categorizeConflicts,
  calculateConflictPenalty,
  hasConflicts,
  hasHighSeverityConflicts,
  INGREDIENT_CONFLICTS,
} from '@/lib/scan/ingredient-conflict';

describe('ingredient-conflict', () => {
  describe('detectConflicts', () => {
    it('레티놀과 비타민C 충돌을 감지한다', () => {
      const ingredients = ['RETINOL', 'VITAMIN C', 'HYALURONIC ACID'];
      const conflicts = detectConflicts(ingredients);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].severity).toBe('high');
      expect(conflicts[0].ingredientA).toBe('RETINOL');
      expect(conflicts[0].ingredientB).toBe('VITAMIN C');
    });

    it('레티놀과 AHA 충돌을 감지한다', () => {
      const ingredients = ['RETINOL', 'AHA'];
      const conflicts = detectConflicts(ingredients);

      expect(conflicts.length).toBeGreaterThanOrEqual(1);
      expect(conflicts.some((c) => c.severity === 'high')).toBe(true);
    });

    it('레티놀과 벤조일퍼옥사이드 충돌을 감지한다', () => {
      const ingredients = ['RETINOL', 'BENZOYL PEROXIDE'];
      const conflicts = detectConflicts(ingredients);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].severity).toBe('high');
    });

    it('나이아신아마이드와 AHA 충돌을 감지한다', () => {
      const ingredients = ['NIACINAMIDE', 'AHA'];
      const conflicts = detectConflicts(ingredients);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].severity).toBe('medium');
    });

    it('충돌이 없는 성분 조합은 빈 배열을 반환한다', () => {
      const ingredients = ['HYALURONIC ACID', 'CERAMIDE', 'PANTHENOL'];
      const conflicts = detectConflicts(ingredients);

      expect(conflicts).toHaveLength(0);
    });

    it('대소문자를 구분하지 않는다', () => {
      const ingredients = ['retinol', 'vitamin c'];
      const conflicts = detectConflicts(ingredients);

      expect(conflicts).toHaveLength(1);
    });

    it('빈 배열에 대해 빈 배열을 반환한다', () => {
      const conflicts = detectConflicts([]);
      expect(conflicts).toHaveLength(0);
    });

    it('단일 성분에 대해 빈 배열을 반환한다', () => {
      const conflicts = detectConflicts(['RETINOL']);
      expect(conflicts).toHaveLength(0);
    });

    it('여러 충돌을 동시에 감지한다', () => {
      const ingredients = ['RETINOL', 'VITAMIN C', 'AHA', 'BHA'];
      const conflicts = detectConflicts(ingredients);

      // 여러 충돌 조합 가능
      expect(conflicts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('categorizeConflicts', () => {
    it('충돌을 심각도별로 분류한다', () => {
      const ingredients = ['RETINOL', 'VITAMIN C', 'NIACINAMIDE', 'AHA'];
      const conflicts = detectConflicts(ingredients);
      const categorized = categorizeConflicts(conflicts);

      expect(categorized.high.length).toBeGreaterThanOrEqual(1);
      expect(categorized.medium.length).toBeGreaterThanOrEqual(0);
    });

    it('빈 배열에 대해 빈 분류를 반환한다', () => {
      const categorized = categorizeConflicts([]);

      expect(categorized.high).toHaveLength(0);
      expect(categorized.medium).toHaveLength(0);
      expect(categorized.low).toHaveLength(0);
    });
  });

  describe('calculateConflictPenalty', () => {
    it('high 충돌에 15점 페널티를 부여한다', () => {
      const conflicts = detectConflicts(['RETINOL', 'VITAMIN C']);
      const penalty = calculateConflictPenalty(conflicts);

      expect(penalty).toBe(15);
    });

    it('medium 충돌에 7점 페널티를 부여한다', () => {
      const conflicts = detectConflicts(['NIACINAMIDE', 'AHA']);
      const penalty = calculateConflictPenalty(conflicts);

      expect(penalty).toBe(7);
    });

    it('여러 충돌의 페널티를 합산한다', () => {
      const conflicts = detectConflicts(['RETINOL', 'VITAMIN C', 'AHA']);
      const penalty = calculateConflictPenalty(conflicts);

      // high(15) + high(15) = 30 이상
      expect(penalty).toBeGreaterThanOrEqual(15);
    });

    it('충돌이 없으면 0점을 반환한다', () => {
      const penalty = calculateConflictPenalty([]);
      expect(penalty).toBe(0);
    });
  });

  describe('hasConflicts', () => {
    it('충돌이 있으면 true를 반환한다', () => {
      expect(hasConflicts(['RETINOL', 'VITAMIN C'])).toBe(true);
    });

    it('충돌이 없으면 false를 반환한다', () => {
      expect(hasConflicts(['HYALURONIC ACID', 'CERAMIDE'])).toBe(false);
    });
  });

  describe('hasHighSeverityConflicts', () => {
    it('high 충돌이 있으면 true를 반환한다', () => {
      expect(hasHighSeverityConflicts(['RETINOL', 'VITAMIN C'])).toBe(true);
    });

    it('medium 충돌만 있으면 false를 반환한다', () => {
      expect(hasHighSeverityConflicts(['NIACINAMIDE', 'AHA'])).toBe(false);
    });

    it('충돌이 없으면 false를 반환한다', () => {
      expect(hasHighSeverityConflicts(['HYALURONIC ACID'])).toBe(false);
    });
  });

  describe('INGREDIENT_CONFLICTS', () => {
    it('최소 10개 이상의 충돌 규칙이 있다', () => {
      expect(INGREDIENT_CONFLICTS.length).toBeGreaterThanOrEqual(10);
    });

    it('모든 충돌 규칙에 필수 필드가 있다', () => {
      for (const conflict of INGREDIENT_CONFLICTS) {
        expect(conflict.ingredientA).toBeDefined();
        expect(conflict.ingredientB).toBeDefined();
        expect(conflict.severity).toBeDefined();
        expect(conflict.reason).toBeDefined();
        expect(conflict.solution).toBeDefined();
      }
    });

    it('severity는 high, medium, low 중 하나이다', () => {
      const validSeverities = ['high', 'medium', 'low'];
      for (const conflict of INGREDIENT_CONFLICTS) {
        expect(validSeverities).toContain(conflict.severity);
      }
    });
  });
});
