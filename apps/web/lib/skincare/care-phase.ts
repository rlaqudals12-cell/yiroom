/**
 * 단계 계획 — 장벽 회복 → 목표 케어 (ADR-117 루틴 v2)
 *
 * @module lib/skincare/care-phase
 * @description
 *   실측 지표에서 "지금이 장벽 회복 단계인지, 목표 케어 단계인지"를 순수 파생한다.
 *   저장하지 않는다 — 분석이 갱신될 때마다 자동으로 다시 계산되는 함수형 상태.
 *
 *   근거(리서치 §1 장벽 우선): 수분·장벽이 무너진 상태에서 활성(레티노이드·산)을
 *   밀어붙이면 자극·조기 이탈을 부른다. 장벽부터 안정화한 뒤 목표로 진행한다.
 *
 *   용어 안전(§7.3): "치료·처방·보장" 금지. 기간은 "보통/문헌상 ~안팎"으로만 표현(단정 금지).
 */

import type { SkinGoalId } from './skin-goals';
import { getSkinGoalLabel, GOAL_TO_CONCERN } from './skin-goals';
import { deriveConcernsFromScores } from './concerns';

/** 케어 단계 */
export interface CarePhase {
  phase: 'barrier' | 'goal';
  label: string;
  message: string;
}

/**
 * 장벽 우선 임계 — 수분/민감 지표가 이 값 미만이면 장벽 회복 단계.
 * (concern 파생 임계와 같은 방향: 낮을수록 케어 필요)
 */
const BARRIER_THRESHOLD = 40;

/** SkinConcernId → 목표 라벨 역매핑 (파생 고민에서 목표 문구를 뽑기 위함) */
const CONCERN_TO_GOAL_LABEL: Partial<Record<string, string>> = (() => {
  const map: Record<string, string> = {};
  for (const [goal, concern] of Object.entries(GOAL_TO_CONCERN)) {
    const label = getSkinGoalLabel(goal as SkinGoalId);
    if (label) map[concern] = label;
  }
  return map;
})();

/**
 * 목표 라벨 결정 — 사용자 목표 우선, 없으면 파생 고민에서 유추, 그래도 없으면 일반 문구.
 */
function resolveGoalLabel(scores: Record<string, number>, userGoals: SkinGoalId[]): string {
  const firstGoal = userGoals[0];
  if (firstGoal) return getSkinGoalLabel(firstGoal) ?? '피부 목표';

  const derived = deriveConcernsFromScores(scores);
  for (const concern of derived) {
    const label = CONCERN_TO_GOAL_LABEL[concern];
    if (label) return label;
  }
  return '피부 목표';
}

/**
 * 실측 지표 + 사용자 목표 → 케어 단계 파생 (순수·결정론적, 저장 없음).
 *
 * @param scores skin_analyses 지표 (hydration·sensitivity 등)
 * @param userGoals 사용자가 고른 목표 (문구 조립용, 없으면 파생 고민에서 유추)
 */
export function deriveCarePhase(
  scores: Record<string, number>,
  userGoals: SkinGoalId[] = []
): CarePhase {
  const hydration = scores.hydration;
  const sensitivity = scores.sensitivity;

  const barrierNeeded =
    (typeof hydration === 'number' && hydration < BARRIER_THRESHOLD) ||
    (typeof sensitivity === 'number' && sensitivity < BARRIER_THRESHOLD);

  const goalLabel = resolveGoalLabel(scores, userGoals);

  if (barrierNeeded) {
    return {
      phase: 'barrier',
      label: '장벽 회복 단계',
      // 기간 단정 금지 — "임상 문헌상 보통 ~안팎" 표현으로 완화 (§7.3)
      message: `지금은 장벽 회복이 먼저예요 — 임상 문헌상 보통 4주 안팎이면 회복돼요. 그다음 ${goalLabel}로 넘어가요`,
    };
  }

  return {
    phase: 'goal',
    label: `${goalLabel} 단계`,
    message: `${goalLabel} 집중 단계예요`,
  };
}
