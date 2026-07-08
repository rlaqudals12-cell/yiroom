/**
 * 비용 가드 (Budget) — 사용자·일 단위 생성 상한 (ADR-113)
 *
 * 보정+착장 합산 하루 5회 상한. 파산 방지용 단순 가드.
 *
 * ⚠️ 서버리스 한계: 인메모리 카운터라 Vercel 서버리스 인스턴스 간에는
 * 공유되지 않는다(인스턴스별 카운트). 이는 기존 rate-limit 유틸
 * (`lib/security/rate-limit`)의 인메모리 폴백과 동일한 트레이드오프이며,
 * 표현 레이어는 저비용·저빈도(공유/착장)라 실질 상한 우회 리스크가 낮아
 * DB 테이블 신설(P4 위반) 대신 인메모리로 충분하다. 정밀 상한이 필요해지면
 * Upstash 일일 한도(rate-limit 모듈)로 승격한다.
 *
 * @module lib/visual-expression/internal/budget
 * @see ADR-113, SDD-VISUAL-EXPRESSION §4
 */

import type { BudgetResult } from '../types';

/** 사용자·일 단위 보정+착장 합산 상한 */
export const DAILY_LIMIT = 5;

interface DailyEntry {
  count: number;
  resetTime: number; // 다음 자정(UTC) ms
}

const store = new Map<string, DailyEntry>();

/** 다음 자정(UTC) — 기존 rate-limit 유틸과 동일 리셋 기준 */
function getNextMidnightUTC(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
}

/**
 * 상한 확인 + 1회 소비 (원자적)
 *
 * 허용되면 카운트를 증가시키고 `allowed:true`를, 초과면 카운트를 올리지 않고
 * `allowed:false`를 반환한다.
 */
export function checkAndConsumeBudget(userId: string): BudgetResult {
  const key = `visual:${userId}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: getNextMidnightUTC() };
  }

  if (entry.count >= DAILY_LIMIT) {
    store.set(key, entry);
    return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
  }

  entry.count += 1;
  store.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, DAILY_LIMIT - entry.count),
    limit: DAILY_LIMIT,
  };
}

/** 테스트 전용 — 카운터 초기화 @internal */
export function _resetBudget(): void {
  store.clear();
}
