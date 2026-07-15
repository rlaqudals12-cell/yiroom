/**
 * 비용 가드 (Budget) — 사용자·일 단위 생성 상한 (ADR-113)
 *
 * 보정+착장+트윈 합산 하루 5회 상한. 파산 방지용 가드.
 *
 * 저장소 전략 (2026-07-14 승격):
 * - **Upstash 설정 시**: 원자적 Redis 카운터(INCR/DECR). Vercel 서버리스는 요청마다
 *   다른 인스턴스에서 실행될 수 있어 인메모리 Map은 인스턴스별로 갈려 상한이 사실상
 *   우회됐다 — ADR-038이 바로 이 이유로 인메모리 Map을 "프로덕션 부적합"으로 기각하고
 *   Upstash를 채택했는데, 이 가드만 그 기각된 패턴을 쓰고 있었다. 이제 정합.
 * - **Upstash 미설정 시(로컬·테스트)**: 인메모리 폴백. 단일 프로세스라 정확.
 *
 * ⚠️ Redis도 청구서 레벨 백스톱을 대체하지 않는다 — Gemini 지출 한도가 최종 방어선.
 * 이 가드는 "정상 사용자의 폭주"를 막는 앱 레벨 상한이다.
 *
 * @module lib/visual-expression/internal/budget
 * @see ADR-113, ADR-038, SDD-VISUAL-EXPRESSION §4
 */

import type { BudgetResult } from '../types';
import { getUpstashRedisClient } from '@/lib/security/rate-limit';

/** 사용자·일 단위 보정+착장+트윈 합산 상한 */
export const DAILY_LIMIT = 5;

/** Redis/인메모리 공통 키 — Redis TTL이 자정 리셋을 담당 */
function keyFor(userId: string): string {
  return `visual-budget:${userId}`;
}

/** 다음 자정(UTC) ms — 기존 rate-limit 유틸과 동일 리셋 기준 */
function getNextMidnightUTC(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
}

// ============================================
// Upstash Redis 경로 (프로덕션 — 인스턴스 간 공유)
// ============================================

/**
 * 상한 확인 + 1회 소비 (원자적).
 *
 * INCR은 원자적이므로 동시 요청이 같은 카운트를 겹쳐 읽는 경합이 없다.
 * 첫 소비(count===1)에서만 TTL을 걸어 자정 리셋을 고정한다(sliding 방지).
 * 초과분(count>LIMIT)은 DECR로 롤백해 카운트를 LIMIT에 묶는다.
 */
async function checkAndConsumeRedis(
  redis: {
    incr: (k: string) => Promise<number>;
    decr: (k: string) => Promise<number>;
    expire: (k: string, s: number) => Promise<unknown>;
  },
  userId: string
): Promise<BudgetResult> {
  const key = keyFor(userId);
  const count = await redis.incr(key);

  if (count === 1) {
    // 자정까지 남은 초 (최소 1초 보장)
    const ttlSeconds = Math.max(1, Math.ceil((getNextMidnightUTC() - Date.now()) / 1000));
    await redis.expire(key, ttlSeconds);
  }

  if (count > DAILY_LIMIT) {
    await redis.decr(key); // 초과분 롤백 — 실제 카운트는 LIMIT 유지
    return { allowed: false, remaining: 0, limit: DAILY_LIMIT };
  }

  return {
    allowed: true,
    remaining: Math.max(0, DAILY_LIMIT - count),
    limit: DAILY_LIMIT,
  };
}

/**
 * 소비 1회 환불 (Redis). 리셋 후(키 없음)면 무시하고 음수로 내려가지 않게 한다.
 * refund는 생성 실패 경로에서만 호출되는 드문 케이스라 get→decr 사이 경합은 무시.
 */
async function refundRedis(
  redis: { get: (k: string) => Promise<unknown>; decr: (k: string) => Promise<number> },
  userId: string
): Promise<void> {
  const key = keyFor(userId);
  const current = await redis.get(key);
  if (current !== null && current !== undefined && Number(current) > 0) {
    await redis.decr(key);
  }
}

// ============================================
// 인메모리 폴백 (로컬·테스트 — 단일 프로세스)
// ============================================

interface DailyEntry {
  count: number;
  resetTime: number; // 다음 자정(UTC) ms
}

const store = new Map<string, DailyEntry>();

function checkAndConsumeInMemory(userId: string): BudgetResult {
  const key = keyFor(userId);
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

function refundInMemory(userId: string): void {
  const key = keyFor(userId);
  const entry = store.get(key);
  if (!entry) return;
  entry.count = Math.max(0, entry.count - 1);
  store.set(key, entry);
}

// ============================================
// 공개 API — Redis 있으면 Redis, 없으면 인메모리
// ============================================

/**
 * 상한 확인 + 1회 소비.
 *
 * 허용되면 카운트를 증가시키고 `allowed:true`를, 초과면 카운트를 (실질적으로)
 * 올리지 않고 `allowed:false`를 반환한다. 상한 확인은 비싼 생성 호출 "전"에
 * 이뤄져야 초과 시 생성을 건너뛸 수 있으므로 선(先)소비 구조다 — 실패 경로에서
 * `refundBudget`으로 되돌린다.
 */
export async function checkAndConsumeBudget(userId: string): Promise<BudgetResult> {
  const redis = getUpstashRedisClient();
  if (redis) return checkAndConsumeRedis(redis, userId);
  return checkAndConsumeInMemory(userId);
}

/**
 * 소비 1회 환불 — 생성이 실패했을 때 호출한다(실패한 시도는 상한에 계산하지 않음).
 */
export async function refundBudget(userId: string): Promise<void> {
  const redis = getUpstashRedisClient();
  if (redis) return refundRedis(redis, userId);
  refundInMemory(userId);
}

/** 테스트 전용 — 인메모리 카운터 초기화 @internal */
export function _resetBudget(): void {
  store.clear();
}
