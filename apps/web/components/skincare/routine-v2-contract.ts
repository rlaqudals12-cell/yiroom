/**
 * ADR-117 루틴 v2 — UI ↔ 엔진 계약 브리지 (Agent S2)
 *
 * S1이 lib/skincare 배럴에 아래 함수/상수를 신설 중이다. 배럴에 아직 없어도
 * 컴파일·런타임이 안전하도록, 네임스페이스 임포트 + 부분 캐스팅으로 접근하고
 * 없으면 "중립 폴백"을 반환한다(사용자 문구를 지어내지 않음 — 문구 정본은 엔진).
 * S1 승격 후에는 실제 함수/상수로 그대로 해석된다.
 *
 * ⚠️ 여기서만 네임스페이스 캐스팅 escape-hatch를 격리한다(다른 파일은 이 브리지의
 *    타입 있는 공개 API만 소비). lib/skincare는 수정하지 않는다.
 */
import * as SkincareModule from '@/lib/skincare';
import type { ShelfItem } from '@/lib/scan/product-shelf';
import type { SkinConcernId } from '@/lib/mock/skin-analysis';

// =============================================================================
// 계약 타입 (S1 정본 승격 예정)
// =============================================================================

export type SkinGoalId = 'brightening' | 'wrinkle' | 'acne' | 'hydration' | 'sebum' | 'soothing';

export interface SkinGoal {
  id: SkinGoalId;
  label: string;
}

/** 저녁 사이클 포커스 — 각질/레티노이드/회복/액티브 */
export type EveningFocus = 'exfoliation' | 'retinoid' | 'recovery' | 'active';

export interface EveningCycle {
  focus: EveningFocus;
  label: string;
  reason: string;
}

export interface WeeklyCycleDay {
  /** 요일 인덱스 (0=일 … 6=토) */
  dow: number;
  focus: EveningFocus;
  label: string;
}

export interface WeeklyCycle {
  days: WeeklyCycleDay[];
}

/** 케어 단계 — barrier(장벽 회복 우선) / goal(목표 집중) */
export type CarePhaseId = 'barrier' | 'goal';

export interface CarePhase {
  phase: CarePhaseId;
  label: string;
  message: string;
}

export interface RedundantProduct {
  category: string;
  count: number;
  message: string;
}

export type DepletionConfidence = 'low' | 'medium' | 'high';

export interface ShelfDepletion {
  daysRemaining: number;
  confidence: DepletionConfidence;
}

// =============================================================================
// 엔진 함수 시그니처 (브리지 정본 — 호출부는 이 시그니처만 신뢰)
// =============================================================================

interface SkincareRoutineV2Contract {
  SKIN_GOALS: SkinGoal[];
  // ⚠️ 엔진 정본(cycling.ts)은 carePhase를 CarePhase '객체'로 받는다(carePhase.phase 판독).
  //    브리지 공개 API는 CarePhaseId 문자열을 받아 여기서 객체로 감싼다 — 문자열을 그대로
  //    넘기면 barrier 유보가 무력화되는 사일런트 버그가 된다(2026-07-10 통합 검증에서 발견).
  getEveningCycle: (
    date: Date,
    ownedActives: Set<string>,
    sensitivityScore: number,
    carePhase: CarePhase
  ) => EveningCycle;
  composeWeeklyCycle: (
    ownedActives: Set<string>,
    sensitivityScore: number,
    carePhase: CarePhase
  ) => WeeklyCycle;
  deriveCarePhase: (scores: Record<string, number>, userGoals: SkinGoalId[]) => CarePhase;
  detectOwnedActives: (shelfItems: ShelfItem[]) => Set<string>;
  findRedundantProducts: (shelfItems: ShelfItem[]) => RedundantProduct[];
  estimateShelfDepletion: (item: ShelfItem) => ShelfDepletion | null;
}

// 배럴에 신설 export가 있으면 사용, 없으면 undefined (컴파일 안전).
const engine = SkincareModule as unknown as Partial<SkincareRoutineV2Contract>;

/** 루틴 v2 엔진 준비 여부 — 핵심 함수 존재로 판단 (배포 전이면 false → v2 표면 숨김) */
export const isRoutineV2Ready: boolean =
  typeof engine.deriveCarePhase === 'function' && typeof engine.getEveningCycle === 'function';

/** 피부 목표 카탈로그 — 엔진 미배포 시 빈 배열(칩 미노출) */
export const SKIN_GOALS: SkinGoal[] = Array.isArray(engine.SKIN_GOALS) ? engine.SKIN_GOALS : [];

/** CarePhaseId → 엔진이 기대하는 CarePhase 객체 (label/message는 판독에 불사용) */
function toCarePhaseObject(id: CarePhaseId): CarePhase {
  return { phase: id, label: '', message: '' };
}

export function getEveningCycle(
  date: Date,
  ownedActives: Set<string>,
  sensitivityScore: number,
  carePhase: CarePhaseId
): EveningCycle {
  // 폴백은 빈 문구 — UI가 label 유무로 노출을 게이팅하므로 지어낸 카피가 없다.
  return (
    engine.getEveningCycle?.(
      date,
      ownedActives,
      sensitivityScore,
      toCarePhaseObject(carePhase)
    ) ?? {
      focus: 'recovery',
      label: '',
      reason: '',
    }
  );
}

export function composeWeeklyCycle(
  ownedActives: Set<string>,
  sensitivityScore: number,
  carePhase: CarePhaseId
): WeeklyCycle {
  return (
    engine.composeWeeklyCycle?.(ownedActives, sensitivityScore, toCarePhaseObject(carePhase)) ?? {
      days: [],
    }
  );
}

export function deriveCarePhase(
  scores: Record<string, number>,
  userGoals: SkinGoalId[]
): CarePhase {
  return (
    engine.deriveCarePhase?.(scores, userGoals) ?? {
      phase: 'goal',
      label: '',
      message: '',
    }
  );
}

export function detectOwnedActives(shelfItems: ShelfItem[]): Set<string> {
  return engine.detectOwnedActives?.(shelfItems) ?? new Set<string>();
}

export function findRedundantProducts(shelfItems: ShelfItem[]): RedundantProduct[] {
  return engine.findRedundantProducts?.(shelfItems) ?? [];
}

export function estimateShelfDepletion(item: ShelfItem): ShelfDepletion | null {
  return engine.estimateShelfDepletion?.(item) ?? null;
}

// =============================================================================
// 목표 → 고민 매핑 (페이지가 goals를 generateRoutine concerns union에 반영)
// =============================================================================

// 엔진이 정본 병합을 하되, 페이지는 선택 목표를 concerns에 union하기 위해 최소 매핑을 쓴다.
const GOAL_TO_CONCERN: Record<SkinGoalId, SkinConcernId> = {
  brightening: 'pigmentation',
  wrinkle: 'wrinkles',
  acne: 'acne',
  hydration: 'dryness',
  sebum: 'excess_oil',
  soothing: 'sensitivity',
};

/** 선택 목표를 대응 피부 고민으로 변환 (중복 없는 순서는 호출부 union에서 정렬) */
export function goalsToConcerns(goals: SkinGoalId[]): SkinConcernId[] {
  return goals.map((g) => GOAL_TO_CONCERN[g]);
}
