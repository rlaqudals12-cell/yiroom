/**
 * A/B 테스트 실험 시스템
 * - 사용자 ID 기반 일관된 변형 할당
 * - Feature Flag 확장
 */

import type { Experiment, ExperimentAssignment, Variant } from './types';

/**
 * 사용자 ID를 해시하여 0-100 사이 값 반환
 * 동일 사용자는 항상 같은 값을 받음
 */
function hashUserId(userId: string, experimentKey: string): number {
  const str = `${userId}-${experimentKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 100);
}

/**
 * 변형 할당
 * weight 기반으로 사용자를 변형에 할당
 */
export function assignVariant(
  experiment: Experiment,
  userId: string
): { variant: Variant; isNewAssignment: boolean } {
  const hashValue = hashUserId(userId, experiment.key);

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (hashValue < cumulative) {
      return { variant, isNewAssignment: true };
    }
  }

  // 기본값: 첫 번째 변형 (control)
  const control = experiment.variants.find((v) => v.isControl) || experiment.variants[0];
  return { variant: control, isNewAssignment: true };
}

/**
 * 실험 할당 결과 생성
 */
export function createAssignment(
  experiment: Experiment,
  userId: string,
  variant: Variant
): ExperimentAssignment {
  return {
    experimentId: experiment.id,
    experimentKey: experiment.key,
    userId,
    variantId: variant.id,
    variantName: variant.name,
    assignedAt: new Date().toISOString(),
    config: variant.config,
  };
}

/**
 * 실험 활성 여부 확인
 */
export function isExperimentActive(experiment: Experiment): boolean {
  if (experiment.status !== 'active') return false;

  const now = new Date();

  if (experiment.startDate && new Date(experiment.startDate) > now) {
    return false;
  }

  if (experiment.endDate && new Date(experiment.endDate) < now) {
    return false;
  }

  return true;
}

export * from './types';
