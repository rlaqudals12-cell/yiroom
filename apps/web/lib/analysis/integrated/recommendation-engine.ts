/**
 * 2층 추천 분류 (ADR-109 Phase 3 / SDD-PROFILE-CENTRIC-ANALYSIS §6)
 *
 * 교차 인사이트를 **"고정(정체성 기반)" vs "오늘(컨디션 기반)"** 으로 분류.
 * 목적: 피부(매일 변동)가 바뀌어도 "오늘 조정"만 변하고 "고정 베이스"(색·체형)는 유지됨을 사용자에게 명확히.
 *
 * 레이어 규칙 = 인사이트를 **움직이는 입력의 변동성**.
 * - 피부가 핵심 입력이면 condition(가변), 아니면 identity(고정).
 * - 주의: makeup '축'은 condition(피부 추종)이나, `pc_m` 인사이트는 PC 색 기반이라 identity.
 *   따라서 축 캐던스(AXIS_CADENCE)가 아니라 **인사이트별로 명시**한다.
 *
 * 순수 함수 — 무손실 보장(입력 = identity ∪ condition). cross-insights.ts의 5개 조합 id 기준.
 */

import type { CrossInsight } from './cross-insights';

export type RecLayer = 'identity' | 'condition';

/** 교차 인사이트 id → 레이어. (cross-insights.ts: pc_s·pc_m·c_h·s_m·pc_c) */
const INSIGHT_LAYER: Record<string, RecLayer> = {
  pc_s: 'condition', // 색×피부 — 피부 피니시 따라 변동
  s_m: 'condition', // 피부×메이크업 — 피부 상태 따라 변동
  pc_m: 'identity', // 색×메이크업 — PC 색 기반 (고정)
  c_h: 'identity', // 체형×헤어 — 골격·얼굴형 (고정)
  pc_c: 'identity', // 색×체형 — PC·체형 (고정)
};

/** 인사이트의 변동 레이어. 미상 id는 보수적으로 identity(고정) 취급. */
export function recLayerForInsight(id: string): RecLayer {
  return INSIGHT_LAYER[id] ?? 'identity';
}

export interface LayeredInsights {
  /** 고정 베이스 — 색·체형 등 정체성 기반 (거의 안 변함) */
  identity: CrossInsight[];
  /** 오늘 조정 — 피부 컨디션 기반 (자주 변함) */
  condition: CrossInsight[];
}

/**
 * 교차 인사이트를 2층으로 분리. 무손실: identity.length + condition.length === items.length.
 */
export function splitInsightsByCadence(items: CrossInsight[]): LayeredInsights {
  const identity: CrossInsight[] = [];
  const condition: CrossInsight[] = [];
  for (const item of items) {
    if (recLayerForInsight(item.id) === 'condition') condition.push(item);
    else identity.push(item);
  }
  return { identity, condition };
}
