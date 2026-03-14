/**
 * A/B 테스트 실험 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import { assignVariant, createAssignment, isExperimentActive } from '@/lib/experiments';
import type { Experiment, Variant } from '@/lib/experiments/types';

// --- 팩토리 ---

function createExperiment(overrides: Partial<Experiment> = {}): Experiment {
  return {
    id: 'exp_1',
    key: 'test-experiment',
    name: '테스트 실험',
    status: 'active',
    variants: [
      { id: 'v_control', name: 'Control', weight: 50, config: {}, isControl: true },
      {
        id: 'v_treatment',
        name: 'Treatment',
        weight: 50,
        config: { showNew: true },
        isControl: false,
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- 테스트 ---

describe('assignVariant', () => {
  describe('결정적 해싱', () => {
    it('동일한 userId는 항상 같은 변형을 받는다', () => {
      const experiment = createExperiment();
      const result1 = assignVariant(experiment, 'user_abc');
      const result2 = assignVariant(experiment, 'user_abc');
      const result3 = assignVariant(experiment, 'user_abc');

      expect(result1.variant.id).toBe(result2.variant.id);
      expect(result2.variant.id).toBe(result3.variant.id);
    });

    it('다른 userId는 다른 변형을 받을 수 있다', () => {
      const experiment = createExperiment();
      const results = new Set<string>();

      // 충분히 많은 사용자를 테스트하면 두 변형 모두 나타나야 함
      for (let i = 0; i < 100; i++) {
        const { variant } = assignVariant(experiment, `user_${i}`);
        results.add(variant.id);
      }

      expect(results.size).toBe(2);
    });

    it('다른 실험 키에서는 동일 사용자도 일관된 결과를 반환한다', () => {
      const exp1 = createExperiment({ key: 'experiment-a' });
      const exp2 = createExperiment({ key: 'experiment-b' });

      // 동일 사용자+동일 실험 키 = 동일 결과 (결정적)
      const r1a = assignVariant(exp1, 'user_42');
      const r1b = assignVariant(exp1, 'user_42');
      expect(r1a.variant.id).toBe(r1b.variant.id);

      const r2a = assignVariant(exp2, 'user_42');
      const r2b = assignVariant(exp2, 'user_42');
      expect(r2a.variant.id).toBe(r2b.variant.id);
    });
  });

  describe('가중치 기반 분배', () => {
    it('weight가 100인 단일 변형에 모든 사용자를 할당한다', () => {
      const experiment = createExperiment({
        variants: [{ id: 'v_only', name: 'Only', weight: 100, config: {}, isControl: true }],
      });

      for (let i = 0; i < 20; i++) {
        const { variant } = assignVariant(experiment, `user_${i}`);
        expect(variant.id).toBe('v_only');
      }
    });

    it('3개 변형의 weight 비율에 대략 맞게 분배한다', () => {
      const experiment = createExperiment({
        variants: [
          { id: 'v_a', name: 'A', weight: 33, config: {}, isControl: true },
          { id: 'v_b', name: 'B', weight: 34, config: {}, isControl: false },
          { id: 'v_c', name: 'C', weight: 33, config: {}, isControl: false },
        ],
      });

      const counts: Record<string, number> = { v_a: 0, v_b: 0, v_c: 0 };
      const total = 1000;

      for (let i = 0; i < total; i++) {
        const { variant } = assignVariant(experiment, `user_stress_${i}`);
        counts[variant.id]++;
      }

      // 각 변형이 전체의 15% 이상은 할당받아야 함 (대략적 검증)
      expect(counts.v_a).toBeGreaterThan(total * 0.15);
      expect(counts.v_b).toBeGreaterThan(total * 0.15);
      expect(counts.v_c).toBeGreaterThan(total * 0.15);
    });

    it('isNewAssignment을 true로 반환한다', () => {
      const experiment = createExperiment();
      const { isNewAssignment } = assignVariant(experiment, 'user_new');
      expect(isNewAssignment).toBe(true);
    });
  });

  describe('엣지 케이스', () => {
    it('해시 값이 모든 weight 합을 초과하면 control 변형을 반환한다', () => {
      // weight 합이 100 미만인 경우 → fallback
      const experiment = createExperiment({
        variants: [
          { id: 'v_control', name: 'Control', weight: 10, config: {}, isControl: true },
          { id: 'v_treatment', name: 'Treatment', weight: 10, config: {}, isControl: false },
        ],
      });

      // 해시 값이 20-99 범위인 사용자는 control을 받아야 함
      let controlFallbackCount = 0;
      for (let i = 0; i < 100; i++) {
        const { variant } = assignVariant(experiment, `user_fallback_${i}`);
        if (variant.isControl) controlFallbackCount++;
      }

      // weight 합이 20이므로 약 80%가 fallback control이어야 함
      expect(controlFallbackCount).toBeGreaterThan(50);
    });

    it('control이 없으면 첫 번째 변형을 fallback으로 반환한다', () => {
      const experiment = createExperiment({
        variants: [
          { id: 'v_first', name: 'First', weight: 5, config: {}, isControl: false },
          { id: 'v_second', name: 'Second', weight: 5, config: {}, isControl: false },
        ],
      });

      // fallback은 isControl이 있는 변형 또는 첫 번째 변형
      // weight 합이 10이므로 대부분 fallback 경로를 탐
      let fallbackCount = 0;
      for (let i = 0; i < 100; i++) {
        const { variant } = assignVariant(experiment, `user_nc_${i}`);
        if (variant.id === 'v_first') fallbackCount++;
      }
      expect(fallbackCount).toBeGreaterThan(0);
    });

    it('빈 문자열 userId도 처리한다', () => {
      const experiment = createExperiment();
      const { variant } = assignVariant(experiment, '');
      expect(variant).toBeDefined();
      expect(variant.id).toBeTruthy();
    });
  });
});

describe('createAssignment', () => {
  it('실험 할당 결과 객체를 올바르게 생성한다', () => {
    const experiment = createExperiment();
    const variant: Variant = {
      id: 'v_treatment',
      name: 'Treatment',
      weight: 50,
      config: { showNew: true },
      isControl: false,
    };

    const assignment = createAssignment(experiment, 'user_123', variant);

    expect(assignment.experimentId).toBe('exp_1');
    expect(assignment.experimentKey).toBe('test-experiment');
    expect(assignment.userId).toBe('user_123');
    expect(assignment.variantId).toBe('v_treatment');
    expect(assignment.variantName).toBe('Treatment');
    expect(assignment.config).toEqual({ showNew: true });
  });

  it('assignedAt에 유효한 ISO 8601 날짜 문자열을 포함한다', () => {
    const experiment = createExperiment();
    const variant = experiment.variants[0];

    const assignment = createAssignment(experiment, 'user_456', variant);

    expect(assignment.assignedAt).toBeTruthy();
    const parsed = new Date(assignment.assignedAt);
    expect(parsed.getTime()).not.toBeNaN();
  });

  it('빈 config 객체도 그대로 전달한다', () => {
    const experiment = createExperiment();
    const variant: Variant = {
      id: 'v_empty',
      name: 'Empty Config',
      weight: 50,
      config: {},
      isControl: true,
    };

    const assignment = createAssignment(experiment, 'user_789', variant);
    expect(assignment.config).toEqual({});
  });
});

describe('isExperimentActive', () => {
  describe('상태 기반 판단', () => {
    it('status가 active이면 활성으로 판단한다', () => {
      const experiment = createExperiment({ status: 'active' });
      expect(isExperimentActive(experiment)).toBe(true);
    });

    it('status가 draft이면 비활성으로 판단한다', () => {
      const experiment = createExperiment({ status: 'draft' });
      expect(isExperimentActive(experiment)).toBe(false);
    });

    it('status가 paused이면 비활성으로 판단한다', () => {
      const experiment = createExperiment({ status: 'paused' });
      expect(isExperimentActive(experiment)).toBe(false);
    });

    it('status가 completed이면 비활성으로 판단한다', () => {
      const experiment = createExperiment({ status: 'completed' });
      expect(isExperimentActive(experiment)).toBe(false);
    });
  });

  describe('날짜 기반 판단', () => {
    it('startDate가 미래이면 비활성으로 판단한다', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const experiment = createExperiment({
        status: 'active',
        startDate: futureDate.toISOString(),
      });

      expect(isExperimentActive(experiment)).toBe(false);
    });

    it('endDate가 과거이면 비활성으로 판단한다', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const experiment = createExperiment({
        status: 'active',
        endDate: pastDate.toISOString(),
      });

      expect(isExperimentActive(experiment)).toBe(false);
    });

    it('startDate가 과거이고 endDate가 미래이면 활성으로 판단한다', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const experiment = createExperiment({
        status: 'active',
        startDate: pastDate.toISOString(),
        endDate: futureDate.toISOString(),
      });

      expect(isExperimentActive(experiment)).toBe(true);
    });

    it('startDate와 endDate가 없으면 status만으로 판단한다', () => {
      const experiment = createExperiment({
        status: 'active',
        startDate: undefined,
        endDate: undefined,
      });

      expect(isExperimentActive(experiment)).toBe(true);
    });
  });
});
