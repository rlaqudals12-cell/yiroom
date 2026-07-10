/**
 * 오늘의 맞춤 루틴 조립 — 웹 루틴 페이지와 모바일(/api/routine/daily)이 공유하는 정본 (ADR-117 / ADR-118)
 *
 * @module lib/skincare/daily-routine
 * @description
 *   피부 지표·사용자 목표·내 화장대(보유 제품)를 입력으로, 아침/저녁 루틴을 조립한다.
 *   조립 단계(고민 파생 → 케어 단계 → 루틴 생성 → shelf-우선 제품 배치 → 스킨 사이클링)를
 *   한 곳에 모아 웹 루틴 페이지(analysis/skin/routine)와 API 라우트가 동일한 결과를 쓴다.
 *   "조립 로직"은 이 파일 1곳에만 존재한다 — 모바일은 라우트 결과를 렌더만 한다(브리핑 전례).
 *
 *   순수 오케스트레이션이지만 enrichRoutineWithProducts가 어필리에이트 제품을 조회하므로
 *   async다. 지어내지 않는다 — 보유 제품이 없으면 ownedProduct는 비고, 대응 고민이 없으면
 *   기본 스텝명이 유지된다(하위 함수들의 정직성 가드를 그대로 승계).
 *
 * @see docs/adr/ADR-117-custom-routine-engine.md
 * @see docs/adr/ADR-118-mobile-parity-thin-client.md
 * @see apps/web/app/(main)/analysis/skin/routine/page.tsx
 */

import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';
import type { RoutineStep } from '@/types/skincare-routine';
import type { ShelfItem } from '@/lib/scan/product-shelf';
import { generateRoutine, enrichRoutineWithProducts } from './routine';
import { deriveConcernsFromScores } from './concerns';
import { GOAL_TO_CONCERN, type SkinGoalId } from './skin-goals';
import { deriveCarePhase, type CarePhase } from './care-phase';
import { detectOwnedActives } from './active-categories';
import {
  getEveningCycle,
  composeWeeklyCycle,
  type EveningCycle,
  type WeeklyCycle,
} from './cycling';

/** 조립 입력 — 실측 지표 + 사용자 목표 + 보유 제품 */
export interface DailyRoutineInput {
  skinType: SkinTypeId;
  /** skin_analyses 지표 맵 (hydration·oil_level·pores·pigmentation·wrinkles·sensitivity) */
  scores: Record<string, number>;
  /** 사용자가 고른 피부 목표 (없으면 빈 배열) */
  goals: SkinGoalId[];
  /** 내 화장대 보유 제품 (없으면 빈 배열 — 카탈로그 추천으로 폴백) */
  shelfItems: ShelfItem[];
  /** 기준 시각(테스트/서버 고정 주입). 미지정 시 현재 시각 */
  now?: Date;
}

/** 오늘의 저녁 포커스 + 주간 사이클 */
export interface DailyRoutineEveningFocus {
  cycle: EveningCycle;
  weekly: WeeklyCycle;
}

/** 조립 결과 — 아침/저녁 루틴 + 케어 단계 + 사이클 */
export interface DailyRoutineResult {
  /** 파생 고민 + 목표(union, 정렬) — 스텝 스펙 우선순위 입력 */
  concerns: SkinConcernId[];
  carePhase: CarePhase;
  /** 개인화 노트(아침 기준 — 아침/저녁 동일 규칙이라 하나만 노출) */
  personalizationNote: string;
  morning: RoutineStep[];
  evening: RoutineStep[];
  eveningFocus: DailyRoutineEveningFocus;
}

/**
 * 사용자 목표를 대응 피부 고민으로 변환 (bridge goalsToConcerns와 동일 매핑 — lib 정본 사용).
 */
function goalsToConcerns(goals: SkinGoalId[]): SkinConcernId[] {
  return goals.map((g) => GOAL_TO_CONCERN[g]);
}

/**
 * 오늘의 맞춤 루틴 조립.
 *
 * 웹 루틴 페이지가 하던 조립과 동일한 순서:
 *   1) 지표 → 고민 파생(deriveConcernsFromScores) + 선택 목표 union(정렬)
 *   2) 케어 단계 파생(deriveCarePhase) — barrier면 세럼·크림이 진정·보습으로 강제됨
 *   3) 아침/저녁 루틴 생성(generateRoutine, includeOptional·carePhase 반영)
 *   4) shelf-우선 제품 배치(enrichRoutineWithProducts) — 보유 제품이 있으면 ownedProduct 세팅
 *   5) 스킨 사이클링(오늘 저녁 포커스 + 주간 7일 캘린더)
 */
export async function assembleDailyRoutine(input: DailyRoutineInput): Promise<DailyRoutineResult> {
  const { skinType, scores, goals, shelfItems } = input;
  const now = input.now ?? new Date();

  // 1) 파생 고민 + 선택 목표 union (결정론적 정렬 — 웹 페이지와 동일)
  const derived = deriveConcernsFromScores(scores);
  const concerns = Array.from(
    new Set<SkinConcernId>([...derived, ...goalsToConcerns(goals)])
  ).sort();

  // 2) 케어 단계 (barrier / goal)
  const carePhase = deriveCarePhase(scores, goals);

  // 3) 아침/저녁 루틴 생성 (선택 스텝 포함 — 심화 페이지 기준)
  const morningResult = generateRoutine({
    skinType,
    concerns,
    timeOfDay: 'morning',
    includeOptional: true,
    carePhase: carePhase.phase,
  });
  const eveningResult = generateRoutine({
    skinType,
    concerns,
    timeOfDay: 'evening',
    includeOptional: true,
    carePhase: carePhase.phase,
  });

  // 4) shelf-우선 제품 배치 (보유 없으면 카탈로그 추천 — enrich 내부에서 처리)
  const [morning, evening] = await Promise.all([
    enrichRoutineWithProducts(morningResult.routine, skinType, concerns, shelfItems),
    enrichRoutineWithProducts(eveningResult.routine, skinType, concerns, shelfItems),
  ]);

  // 5) 스킨 사이클링 — 보유 활성·민감도·케어 단계 기준
  const ownedActives = detectOwnedActives(shelfItems);
  const sensitivity = typeof scores.sensitivity === 'number' ? scores.sensitivity : 100;
  const eveningFocus: DailyRoutineEveningFocus = {
    cycle: getEveningCycle(now, ownedActives, sensitivity, carePhase),
    weekly: composeWeeklyCycle(ownedActives, sensitivity, carePhase),
  };

  return {
    concerns,
    carePhase,
    personalizationNote: morningResult.personalizationNote,
    morning,
    evening,
    eveningFocus,
  };
}
