/**
 * A/B 실험 런너 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  runExperiment,
  runAllExperiments,
  createExposureEvent,
  validateVariantWeights,
  validateControlVariant,
  validateExperiment,
  simulateDistribution,
} from '@/lib/experiments/runner';
import type { Experiment, Variant } from '@/lib/experiments/types';

function mockVariant(overrides: Partial<Variant> = {}): Variant {
  return {
    id: 'control',
    name: 'Control',
    weight: 50,
    config: {},
    isControl: true,
    ...overrides,
  };
}

function mockExperiment(overrides: Partial<Experiment> = {}): Experiment {
  return {
    id: 'exp-1',
    key: 'test-experiment',
    name: '테스트 실험',
    status: 'active',
    variants: [
      mockVariant({ id: 'control', name: 'Control', weight: 50, isControl: true }),
      mockVariant({ id: 'variant-a', name: 'Variant A', weight: 50, isControl: false }),
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('experiments/runner', () => {
  // ============================================
  // runExperiment
  // ============================================
  describe('runExperiment', () => {
    it('활성 실험 → 할당 결과 반환', () => {
      const result = runExperiment(mockExperiment(), 'user-123');
      expect(result.isActive).toBe(true);
      expect(result.assignment).not.toBeNull();
      expect(result.assignment?.userId).toBe('user-123');
    });

    it('비활성 실험 → null 할당', () => {
      const result = runExperiment(mockExperiment({ status: 'draft' }), 'user-123');
      expect(result.isActive).toBe(false);
      expect(result.assignment).toBeNull();
    });

    it('동일 사용자 → 동일 변형 (일관성)', () => {
      const exp = mockExperiment();
      const r1 = runExperiment(exp, 'user-abc');
      const r2 = runExperiment(exp, 'user-abc');
      expect(r1.assignment?.variantId).toBe(r2.assignment?.variantId);
    });

    it('다른 사용자 → 다른 변형 가능', () => {
      const exp = mockExperiment();
      const variants = new Set<string>();
      // 100명 테스트하면 두 변형 모두 할당될 것
      for (let i = 0; i < 100; i++) {
        const r = runExperiment(exp, `user-${i}`);
        if (r.assignment) variants.add(r.assignment.variantId);
      }
      expect(variants.size).toBe(2);
    });

    it('만료된 실험 → 비활성', () => {
      const result = runExperiment(mockExperiment({ endDate: '2025-01-01T00:00:00Z' }), 'user-123');
      expect(result.isActive).toBe(false);
    });
  });

  // ============================================
  // runAllExperiments
  // ============================================
  describe('runAllExperiments', () => {
    it('여러 실험 동시 실행', () => {
      const experiments = [mockExperiment({ key: 'exp-a' }), mockExperiment({ key: 'exp-b' })];
      const results = runAllExperiments(experiments, 'user-123');
      expect(results.size).toBe(2);
      expect(results.get('exp-a')?.isActive).toBe(true);
      expect(results.get('exp-b')?.isActive).toBe(true);
    });

    it('빈 배열 → 빈 Map', () => {
      const results = runAllExperiments([], 'user-123');
      expect(results.size).toBe(0);
    });
  });

  // ============================================
  // createExposureEvent
  // ============================================
  describe('createExposureEvent', () => {
    it('impression 이벤트 생성', () => {
      const event = createExposureEvent('exp-1', 'variant-a', 'impression');
      expect(event.experimentKey).toBe('exp-1');
      expect(event.variantId).toBe('variant-a');
      expect(event.eventType).toBe('impression');
    });

    it('metadata 포함', () => {
      const event = createExposureEvent('exp-1', 'variant-a', 'conversion', {
        revenue: 1000,
      });
      expect(event.metadata?.revenue).toBe(1000);
    });
  });

  // ============================================
  // validateVariantWeights
  // ============================================
  describe('validateVariantWeights', () => {
    it('합계 100 → valid', () => {
      const variants = [mockVariant({ weight: 50 }), mockVariant({ weight: 50 })];
      const result = validateVariantWeights(variants);
      expect(result.valid).toBe(true);
      expect(result.totalWeight).toBe(100);
    });

    it('합계 != 100 → invalid', () => {
      const variants = [mockVariant({ weight: 30 }), mockVariant({ weight: 30 })];
      const result = validateVariantWeights(variants);
      expect(result.valid).toBe(false);
      expect(result.totalWeight).toBe(60);
    });
  });

  // ============================================
  // validateControlVariant
  // ============================================
  describe('validateControlVariant', () => {
    it('control 존재 → true', () => {
      expect(
        validateControlVariant([
          mockVariant({ isControl: true }),
          mockVariant({ isControl: false }),
        ])
      ).toBe(true);
    });

    it('control 없음 → false', () => {
      expect(
        validateControlVariant([
          mockVariant({ isControl: false }),
          mockVariant({ isControl: false }),
        ])
      ).toBe(false);
    });
  });

  // ============================================
  // validateExperiment
  // ============================================
  describe('validateExperiment', () => {
    it('유효한 실험 → valid', () => {
      const result = validateExperiment(mockExperiment());
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('키 없음 → 에러', () => {
      const result = validateExperiment(mockExperiment({ key: '' }));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('실험 키가 없습니다.');
    });

    it('변형 1개 → 에러', () => {
      const result = validateExperiment(mockExperiment({ variants: [mockVariant()] }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('2개 이상'))).toBe(true);
    });

    it('가중치 불일치 → 에러', () => {
      const result = validateExperiment(
        mockExperiment({
          variants: [mockVariant({ weight: 30 }), mockVariant({ weight: 30, isControl: false })],
        })
      );
      expect(result.valid).toBe(false);
    });
  });

  // ============================================
  // simulateDistribution
  // ============================================
  describe('simulateDistribution', () => {
    it('50/50 분배 → 대략 50% 근처', () => {
      const exp = mockExperiment();
      const dist = simulateDistribution(exp, 10000);

      // ±10% 오차 허용
      expect(dist['control']).toBeGreaterThan(35);
      expect(dist['control']).toBeLessThan(65);
      expect(dist['variant-a']).toBeGreaterThan(35);
      expect(dist['variant-a']).toBeLessThan(65);
    });

    it('80/20 분배', () => {
      const exp = mockExperiment({
        variants: [
          mockVariant({ id: 'control', weight: 80, isControl: true }),
          mockVariant({ id: 'variant-a', weight: 20, isControl: false }),
        ],
      });
      const dist = simulateDistribution(exp, 10000);

      expect(dist['control']).toBeGreaterThan(65);
      expect(dist['variant-a']).toBeLessThan(35);
    });
  });
});
