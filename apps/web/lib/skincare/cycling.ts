/**
 * 스킨 사이클링 엔진 — 주간 야간 주기 스케줄 (ADR-117 루틴 v2)
 *
 * @module lib/skincare/cycling
 * @description
 *   보유 활성(레티노이드·산)·민감도·케어 단계를 입력으로, 결정론적 주간 캘린더를 만든다.
 *   자극성 활성의 사용 빈도를 의도적으로 분산해 장벽 무결성을 보호한다(리서치 §2 스킨 사이클링).
 *
 *   규칙(문헌 기반, §1.3·§2.2):
 *   - 레티노이드 보유 → 주 2~3회 "레티노이드의 날"
 *   - 산(AHA/BHA) 보유 → 주 1~2회 "각질의 날" (레티노이드의 날과 같은 날 금지)
 *   - 나머지 → "회복의 날" (진정·보습)
 *   - 민감 점수 < 40 → 활성 일수 축소(회복일 확장)
 *   - 장벽 회복 단계 → 전부 회복의 날 (활성 유보)
 *   - 보유하지 않은 활성의 날은 지어내지 않는다
 *
 *   용어 안전(§7.3): "권장·문헌" 프레이밍만 — "치료·처방" 금지.
 */

import type { ActiveCategory } from './active-categories';
import type { CarePhase } from './care-phase';

/** 야간 주기 포커스 */
export type CyclingFocus = 'exfoliation' | 'retinoid' | 'recovery' | 'active';

/** 오늘 저녁 주기 */
export interface EveningCycle {
  focus: CyclingFocus;
  label: string;
  reason: string;
}

/** 주간 주기 (dow 0=일요일 … 6=토요일, JS Date.getDay 규약) */
export interface WeeklyCycle {
  days: Array<{ dow: number; focus: CyclingFocus; label: string }>;
}

/** 포커스 표시 라벨 */
export const CYCLE_LABELS: Record<CyclingFocus, string> = {
  exfoliation: '각질 케어의 날',
  retinoid: '레티노이드의 날',
  recovery: '회복의 날',
  active: '집중 관리의 날',
};

/** 포커스별 근거 문구 (문헌 인용형, '치료/처방' 금지) */
const CYCLE_REASONS: Record<CyclingFocus, string> = {
  retinoid:
    '피부과 문헌에서 권장하는 주기예요 — 레티노이드는 매일보다 주 2~3회가 장벽에 부담이 적어요',
  exfoliation: '각질 케어는 주 1~2회가 문헌에서 권장돼요 — 너무 잦으면 장벽이 약해질 수 있어요',
  recovery: '장벽이 회복하는 날이에요 — 진정·보습에 집중해요',
  active: '보유한 활성 성분에 집중하는 날이에요',
};

// 요일 고정 배정(결정론) — 레티노이드/각질 슬롯이 겹치지 않도록 분리
const RETINOID_SLOTS = [1, 4, 6]; // 월·목·토
const EXFOLIATION_SLOTS = [3, 0]; // 수·일

/** 민감 점수 임계 — 미만이면 활성 일수 축소 */
const SENSITIVE_THRESHOLD = 40;

/**
 * 주간 사이클 구성 (결정론적).
 *
 * @param ownedActives 보유 활성 카테고리 (detectOwnedActives)
 * @param sensitivityScore 민감 지표(0-100, 낮을수록 민감) — 정보 없으면 100 전달 권장
 * @param carePhase 케어 단계 (barrier면 전부 회복)
 */
export function composeWeeklyCycle(
  ownedActives: Set<ActiveCategory>,
  sensitivityScore: number,
  carePhase: CarePhase
): WeeklyCycle {
  const days: Array<{ dow: number; focus: CyclingFocus; label: string }> = [];
  for (let dow = 0; dow < 7; dow++) {
    days.push({ dow, focus: 'recovery', label: CYCLE_LABELS.recovery });
  }

  // 장벽 회복 단계 = 활성 유보, 전부 회복의 날
  if (carePhase.phase === 'barrier') {
    return { days };
  }

  const sensitive = sensitivityScore < SENSITIVE_THRESHOLD;
  const hasRetinoid = ownedActives.has('retinoid');
  const hasAcid = ownedActives.has('exfoliantAHA') || ownedActives.has('exfoliantBHA');

  // 민감 시 활성 일수 축소 (회복일 확장). 미보유 활성의 날은 배정하지 않는다 (0일).
  const retinoidWhenOwned = sensitive ? 2 : 3;
  const exfoliationWhenOwned = sensitive ? 1 : 2;
  const retinoidCount = hasRetinoid ? retinoidWhenOwned : 0;
  const exfoliationCount = hasAcid ? exfoliationWhenOwned : 0;

  for (const dow of RETINOID_SLOTS.slice(0, retinoidCount)) {
    days[dow] = { dow, focus: 'retinoid', label: CYCLE_LABELS.retinoid };
  }
  // 각질 슬롯은 레티노이드 슬롯과 겹치지 않음(고정 분리) — 같은 날 금지 규칙 자동 충족
  for (const dow of EXFOLIATION_SLOTS.slice(0, exfoliationCount)) {
    days[dow] = { dow, focus: 'exfoliation', label: CYCLE_LABELS.exfoliation };
  }

  return { days };
}

/**
 * 특정 날짜의 오늘 저녁 주기 (근거 문구 포함).
 *
 * @param date 대상 날짜 (getDay로 요일 판정)
 * @param ownedActives 보유 활성
 * @param sensitivityScore 민감 지표
 * @param carePhase 케어 단계
 */
export function getEveningCycle(
  date: Date,
  ownedActives: Set<ActiveCategory>,
  sensitivityScore: number,
  carePhase: CarePhase
): EveningCycle {
  const weekly = composeWeeklyCycle(ownedActives, sensitivityScore, carePhase);
  const dow = date.getDay();
  const day = weekly.days.find((d) => d.dow === dow) ?? weekly.days[0];
  return {
    focus: day.focus,
    label: day.label,
    reason: CYCLE_REASONS[day.focus],
  };
}

/** 어제 대비 오늘 저녁 포커스 변화 (같으면 null) */
export interface CycleChange {
  today: CyclingFocus;
  yesterday: CyclingFocus;
  /** "어제(회복의 날)와 달라졌어요" — 오늘 라벨은 배지가 이미 보여주므로 어제만 짚는다 */
  message: string;
}

/**
 * 어제 대비 오늘 저녁 포커스가 달라졌는지 파생 (G4 일변화 체감).
 *
 * 사이클링은 요일 고정 배정이라 결정론적이다 — 어제 날짜의 포커스와 비교해
 * 달라졌으면 변화를 반환하고, 같으면 null(지어내지 않음 — 변화 없는데 있다고 하지 않는다).
 *
 * @param date 오늘 날짜 (getDay로 요일 판정)
 * @param ownedActives 보유 활성
 * @param sensitivityScore 민감 지표
 * @param carePhase 케어 단계
 */
export function getCycleChange(
  date: Date,
  ownedActives: Set<ActiveCategory>,
  sensitivityScore: number,
  carePhase: CarePhase
): CycleChange | null {
  const todayCycle = getEveningCycle(date, ownedActives, sensitivityScore, carePhase);
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayCycle = getEveningCycle(yesterday, ownedActives, sensitivityScore, carePhase);
  if (todayCycle.focus === yesterdayCycle.focus) return null;
  return {
    today: todayCycle.focus,
    yesterday: yesterdayCycle.focus,
    message: `어제(${CYCLE_LABELS[yesterdayCycle.focus]})와 달라졌어요`,
  };
}
