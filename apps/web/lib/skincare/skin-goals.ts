/**
 * 피부 목표(SkinGoal) — 명시적 사용자 선택 축 (ADR-117 루틴 v2)
 *
 * @module lib/skincare/skin-goals
 * @description
 *   분석 지표에서 자동 파생한 concerns(현재 상태)와 별개로, 사용자가 직접 고른 "목표"를
 *   담는다. 목표는 beauty_profiles.skin.userGoals JSONB에 저장되며, 루틴 개인화에서
 *   파생 concerns보다 우선(앞) 병합된다.
 *
 *   용어 안전(리서치 §7.3): "목표/케어"만 사용 — "처방·치료" 금지.
 */

import type { SkinConcernId } from '@/lib/mock/skin-analysis';

/** 사용자 선택 피부 목표 ID */
export type SkinGoalId = 'brightening' | 'wrinkle' | 'acne' | 'hydration' | 'sebum' | 'soothing';

/** zod enum·순회용 — SkinGoalId와 동기화 유지 */
export const SKIN_GOAL_IDS = [
  'brightening',
  'wrinkle',
  'acne',
  'hydration',
  'sebum',
  'soothing',
] as const;

/** 목표 선택 UI 정본 (id ↔ 표시 라벨). 라벨은 기능성화장품 인정 범위 내 톤 관리 표현 */
export const SKIN_GOALS: Array<{ id: SkinGoalId; label: string }> = [
  { id: 'brightening', label: '기미·잡티' },
  { id: 'wrinkle', label: '주름·탄력' },
  { id: 'acne', label: '트러블' },
  { id: 'hydration', label: '수분' },
  { id: 'sebum', label: '모공·피지' },
  { id: 'soothing', label: '진정' },
];

/** 목표 라벨 조회 (없는 id는 undefined) */
export function getSkinGoalLabel(id: SkinGoalId): string | undefined {
  return SKIN_GOALS.find((g) => g.id === id)?.label;
}

/**
 * 목표 → 대응 고민(SkinConcernId) 매핑.
 * 루틴 엔진(generateRoutine)은 concerns를 입력으로 받으므로, 사용자 목표를
 * 개인화에 반영하려면 concern 축으로 변환해야 한다.
 */
export const GOAL_TO_CONCERN: Record<SkinGoalId, SkinConcernId> = {
  brightening: 'pigmentation',
  wrinkle: 'wrinkles',
  acne: 'acne',
  hydration: 'dryness',
  sebum: 'excess_oil',
  soothing: 'sensitivity',
};

/**
 * 파생 concerns에 사용자 목표를 병합 — 목표를 앞에 둔다 (우선순위 반영, ADR-117).
 * 결정론적: 목표 concern들을 순서대로 먼저, 이어서 파생 concern 중 중복 아닌 것.
 *
 * @param derived deriveConcernsFromScores 결과 (현재 상태)
 * @param userGoals 사용자가 고른 목표
 */
export function mergeGoalsIntoConcerns(
  derived: SkinConcernId[],
  userGoals: SkinGoalId[]
): SkinConcernId[] {
  const merged: SkinConcernId[] = [];
  for (const goal of userGoals) {
    const concern = GOAL_TO_CONCERN[goal];
    if (concern && !merged.includes(concern)) merged.push(concern);
  }
  for (const concern of derived) {
    if (!merged.includes(concern)) merged.push(concern);
  }
  return merged;
}
