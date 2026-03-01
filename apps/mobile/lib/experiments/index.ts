/**
 * A/B 테스트 실험 모듈
 *
 * 클라이언트 사이드 실험 플래그, 변형 할당
 *
 * @module lib/experiments
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── 타입 ────────────────────────────────────────────

export type ExperimentVariant = 'control' | 'variant_a' | 'variant_b';

export interface Experiment {
  key: string;
  name: string;
  description: string;
  variants: ExperimentVariant[];
  weights: number[];
  isActive: boolean;
}

export interface UserExperimentAssignment {
  experimentKey: string;
  variant: ExperimentVariant;
  assignedAt: string;
}

// ─── 상수 ─────────────────────────────────────────────

const STORAGE_KEY = '@yiroom/experiments';

/**
 * 등록된 실험 목록
 *
 * 새 실험 추가 시 여기에 등록
 */
export const EXPERIMENTS: Record<string, Experiment> = {
  onboarding_flow: {
    key: 'onboarding_flow',
    name: '온보딩 플로우',
    description: '새 온보딩 vs 기존 온보딩',
    variants: ['control', 'variant_a'],
    weights: [50, 50],
    isActive: false,
  },
  analysis_result_layout: {
    key: 'analysis_result_layout',
    name: '분석 결과 레이아웃',
    description: '카드형 vs 리스트형 결과 표시',
    variants: ['control', 'variant_a'],
    weights: [50, 50],
    isActive: false,
  },
  home_dashboard: {
    key: 'home_dashboard',
    name: '홈 대시보드',
    description: '위젯형 vs 피드형 대시보드',
    variants: ['control', 'variant_a', 'variant_b'],
    weights: [34, 33, 33],
    isActive: false,
  },
};

// ─── 변형 할당 ───────────────────────────────────────

/**
 * 가중치 기반 변형 할당
 *
 * userId를 시드로 결정적(deterministic) 할당
 */
export function assignVariant(
  experiment: Experiment,
  userId: string
): ExperimentVariant {
  if (!experiment.isActive) return 'control';

  // userId 해시 → 0~99 범위
  const hash = simpleHash(userId + experiment.key);
  const bucket = Math.abs(hash) % 100;

  let cumulative = 0;
  for (let i = 0; i < experiment.variants.length; i++) {
    cumulative += experiment.weights[i];
    if (bucket < cumulative) {
      return experiment.variants[i];
    }
  }

  return 'control';
}

/**
 * 모든 활성 실험에 대해 변형 할당
 */
export function assignAllExperiments(
  userId: string
): UserExperimentAssignment[] {
  return Object.values(EXPERIMENTS)
    .filter((exp) => exp.isActive)
    .map((exp) => ({
      experimentKey: exp.key,
      variant: assignVariant(exp, userId),
      assignedAt: new Date().toISOString(),
    }));
}

// ─── 영속 저장 ───────────────────────────────────────

/**
 * 실험 할당 결과 저장 (AsyncStorage)
 */
export async function saveExperimentAssignments(
  assignments: UserExperimentAssignment[]
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

/**
 * 저장된 실험 할당 로드
 */
export async function loadExperimentAssignments(): Promise<UserExperimentAssignment[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as UserExperimentAssignment[];
  } catch {
    return [];
  }
}

/**
 * 특정 실험의 할당된 변형 조회
 */
export async function getExperimentVariant(
  experimentKey: string
): Promise<ExperimentVariant> {
  const assignments = await loadExperimentAssignments();
  const assignment = assignments.find((a) => a.experimentKey === experimentKey);
  return assignment?.variant ?? 'control';
}

/**
 * 실험 할당 초기화
 */
export async function clearExperimentAssignments(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ─── 유틸리티 ─────────────────────────────────────────

/**
 * 실험이 활성화되어 있는지 확인
 */
export function isExperimentActive(experimentKey: string): boolean {
  return EXPERIMENTS[experimentKey]?.isActive ?? false;
}

/**
 * 특정 변형인지 확인 (조건부 렌더링용)
 */
export function isVariant(
  assignments: UserExperimentAssignment[],
  experimentKey: string,
  variant: ExperimentVariant
): boolean {
  const assignment = assignments.find((a) => a.experimentKey === experimentKey);
  return assignment?.variant === variant;
}

// ─── 내부 함수 ───────────────────────────────────────

// 간단한 해시 (결정적)
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer
  }
  return hash;
}
