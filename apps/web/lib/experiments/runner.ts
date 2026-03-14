/**
 * A/B 실험 런너
 * @description 실험 실행, 이벤트 기록, 결과 분석 유틸리티
 */

import type {
  Experiment,
  ExperimentAssignment,
  ExposureEvent,
  ExposureEventType,
  Variant,
} from './types';
import { assignVariant, createAssignment, isExperimentActive } from './index';

// ============================================
// 타입
// ============================================

export interface ExperimentRunResult {
  assignment: ExperimentAssignment | null;
  /** 실험이 비활성이면 null */
  isActive: boolean;
  /** 이전에 할당된 변형이 있었는지 */
  isNewAssignment: boolean;
}

export interface ExperimentMetrics {
  experimentKey: string;
  totalAssignments: number;
  variantDistribution: Record<string, number>;
  conversionRate: Record<string, number>;
}

// ============================================
// 실험 실행
// ============================================

/**
 * 실험 실행 (활성 여부 확인 + 변형 할당)
 */
export function runExperiment(experiment: Experiment, userId: string): ExperimentRunResult {
  if (!isExperimentActive(experiment)) {
    return { assignment: null, isActive: false, isNewAssignment: false };
  }

  const { variant, isNewAssignment } = assignVariant(experiment, userId);
  const assignment = createAssignment(experiment, userId, variant);

  return { assignment, isActive: true, isNewAssignment };
}

/**
 * 여러 실험을 한번에 실행
 */
export function runAllExperiments(
  experiments: Experiment[],
  userId: string
): Map<string, ExperimentRunResult> {
  const results = new Map<string, ExperimentRunResult>();

  for (const experiment of experiments) {
    results.set(experiment.key, runExperiment(experiment, userId));
  }

  return results;
}

// ============================================
// 이벤트 생성
// ============================================

/**
 * 노출 이벤트 생성
 */
export function createExposureEvent(
  experimentKey: string,
  variantId: string,
  eventType: ExposureEventType,
  metadata?: Record<string, unknown>
): ExposureEvent {
  return {
    experimentKey,
    variantId,
    eventType,
    metadata,
  };
}

// ============================================
// 변형 배분 검증
// ============================================

/**
 * 변형 가중치 합계가 100인지 검증
 */
export function validateVariantWeights(variants: Variant[]): {
  valid: boolean;
  totalWeight: number;
  message: string;
} {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const valid = totalWeight === 100;

  return {
    valid,
    totalWeight,
    message: valid
      ? '가중치 합계가 100%입니다.'
      : `가중치 합계가 ${totalWeight}%입니다. 100%여야 합니다.`,
  };
}

/**
 * Control 변형이 존재하는지 검증
 */
export function validateControlVariant(variants: Variant[]): boolean {
  return variants.some((v) => v.isControl);
}

/**
 * 실험 전체 유효성 검증
 */
export function validateExperiment(experiment: Experiment): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!experiment.key) errors.push('실험 키가 없습니다.');
  if (!experiment.name) errors.push('실험 이름이 없습니다.');
  if (experiment.variants.length < 2) errors.push('최소 2개 이상의 변형이 필요합니다.');

  const weightCheck = validateVariantWeights(experiment.variants);
  if (!weightCheck.valid) errors.push(weightCheck.message);

  if (!validateControlVariant(experiment.variants)) errors.push('Control 변형이 없습니다.');

  return { valid: errors.length === 0, errors };
}

/**
 * 실험 할당 분포 시뮬레이션 (테스트/검증용)
 * N명의 가상 사용자로 분포 확인
 */
export function simulateDistribution(
  experiment: Experiment,
  sampleSize: number = 1000
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const variant of experiment.variants) {
    counts[variant.id] = 0;
  }

  for (let i = 0; i < sampleSize; i++) {
    const userId = `sim-user-${i}`;
    const { variant } = assignVariant(experiment, userId);
    counts[variant.id] = (counts[variant.id] || 0) + 1;
  }

  // 비율로 변환
  const distribution: Record<string, number> = {};
  for (const [id, count] of Object.entries(counts)) {
    distribution[id] = Math.round((count / sampleSize) * 100);
  }

  return distribution;
}
