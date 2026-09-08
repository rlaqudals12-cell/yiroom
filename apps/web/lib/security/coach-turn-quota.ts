import { createHash, randomUUID } from 'node:crypto';
import { getUpstashRedisClient } from './rate-limit';
import { COACH_TURN_LIMITS } from './coach-policy';
import { RESERVE_COACH_TURN, SETTLE_COACH_TURN } from './coach-quota-scripts';

const KST_OFFSET = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const STORE_DEADLINE_MS = 1_000;
type DenialReason = 'daily_limit' | 'monthly_limit' | 'quota_unavailable' | 'duplicate_request';
type Keys = [string, string, string];

interface ReservationBase {
  dailyRemaining: number;
  monthlyRemaining: number;
}
export type CoachTurnReservation = ReservationBase &
  (
    | { allowed: false; reason: DenialReason }
    | { allowed: true; keys: Keys; backend: 'redis' | 'memory' }
  );
export interface CoachTurnSettlement {
  modelCalled: boolean;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    cachedContentTokenCount?: number;
    totalTokenCount?: number;
  };
  modelVersion?: string;
}
interface RedisClient {
  eval: (script: string, keys: string[], args: (string | number)[]) => Promise<unknown>;
}
interface MemoryEntry {
  count: number;
  expires: number;
}
interface Receipt {
  settled: boolean;
  expires: number;
}
const counters = new Map<string, MemoryEntry>();
const receipts = new Map<string, Receipt>();

/** KST 날짜는 서버 시각에서 계산하고 테스트만 시각을 주입한다. */
export function getCoachQuotaPeriods(now: Date): {
  day: string;
  month: string;
  dayReset: number;
  monthReset: number;
} {
  const local = new Date(now.getTime() + KST_OFFSET);
  return {
    day: local.toISOString().slice(0, 10),
    month: local.toISOString().slice(0, 7),
    dayReset:
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1) - KST_OFFSET,
    monthReset: Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - KST_OFFSET,
  };
}

function denied(reason: DenialReason, day = 0, month = 0): CoachTurnReservation {
  return {
    allowed: false,
    reason,
    dailyRemaining: Math.max(0, COACH_TURN_LIMITS.daily - day),
    monthlyRemaining: Math.max(0, COACH_TURN_LIMITS.monthly - month),
  };
}

function denialReason(value: unknown): DenialReason {
  return value === 'daily_limit' || value === 'monthly_limit' || value === 'duplicate_request'
    ? value
    : 'quota_unavailable';
}

async function bounded<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Coach quota store deadline')),
          STORE_DEADLINE_MS
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function reserveMemory(
  keys: Keys,
  now: Date,
  dayReset: number,
  monthReset: number
): CoachTurnReservation {
  for (const [key, entry] of counters) if (entry.expires <= now.getTime()) counters.delete(key);
  for (const [key, receipt] of receipts) if (receipt.expires <= now.getTime()) receipts.delete(key);
  const day = counters.get(keys[0])?.count ?? 0;
  const month = counters.get(keys[1])?.count ?? 0;
  if (receipts.has(keys[2])) return denied('duplicate_request', day, month);
  if (day >= COACH_TURN_LIMITS.daily) return denied('daily_limit', day, month);
  if (month >= COACH_TURN_LIMITS.monthly) return denied('monthly_limit', day, month);
  // await 없는 임계구역. 단일 프로세스인 개발/테스트에만 사용한다.
  counters.set(keys[0], { count: day + 1, expires: dayReset });
  counters.set(keys[1], { count: month + 1, expires: monthReset });
  receipts.set(keys[2], { settled: false, expires: monthReset + DAY_MS });
  return {
    allowed: true,
    keys,
    backend: 'memory',
    dailyRemaining: COACH_TURN_LIMITS.daily - day - 1,
    monthlyRemaining: COACH_TURN_LIMITS.monthly - month - 1,
  };
}

/** 모델 호출 직전에 사용자 턴을 예약한다. 저장소 장애는 호출 허가로 바꾸지 않는다. */
export async function reserveCoachTurn(
  userId: string,
  options: { now?: Date; requestId?: string; signal?: AbortSignal } = {}
): Promise<CoachTurnReservation> {
  if (!userId || options.signal?.aborted) return denied('quota_unavailable');
  const now = options.now ?? new Date();
  const period = getCoachQuotaPeriods(now);
  // Redis 클러스터에서도 세 키가 같은 슬롯에 놓이며 사용자 원문은 키에서 제거한다.
  const owner = createHash('sha256').update(userId).digest('hex');
  const prefix = `yiroom:coach:{${owner}}`;
  const keys: Keys = [
    `${prefix}:day:${period.day}`,
    `${prefix}:month:${period.month}`,
    `${prefix}:turn:${options.requestId ?? randomUUID()}`,
  ];
  const redis = getUpstashRedisClient() as RedisClient | null;
  if (!redis) {
    // 운영에서는 예산 상한 없이 모델을 호출하지 않는다(fail-closed).
    // 다만 무음 사망은 금지 — 원인이 '한도 소진'이 아니라 '저장소 미설정'임을 로그로 남긴다.
    // UPSTASH_REDIS_REST_URL / _TOKEN 미주입이 유일한 원인이며, 이때 코치는 전면 중단된다.
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[coach-quota] Upstash Redis가 설정되지 않아 코치 턴 예약을 거부합니다. ' +
          'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 환경변수를 확인하세요.'
      );
      return denied('quota_unavailable');
    }
    return reserveMemory(keys, now, period.dayReset, period.monthReset);
  }
  try {
    const result = await bounded(
      redis.eval(RESERVE_COACH_TURN, keys, [
        COACH_TURN_LIMITS.daily,
        COACH_TURN_LIMITS.monthly,
        Math.ceil(period.dayReset / 1000),
        Math.ceil(period.monthReset / 1000),
        Math.ceil((period.monthReset + DAY_MS) / 1000),
      ])
    );
    if (
      !Array.isArray(result) ||
      result.length !== 4 ||
      typeof result[2] !== 'number' ||
      typeof result[3] !== 'number'
    )
      return denied('quota_unavailable');
    if (result[0] !== 1) {
      return denied(denialReason(result[1]), result[2], result[3]);
    }
    const reservation: CoachTurnReservation = {
      allowed: true,
      keys,
      backend: 'redis',
      dailyRemaining: Math.max(0, COACH_TURN_LIMITS.daily - result[2]),
      monthlyRemaining: Math.max(0, COACH_TURN_LIMITS.monthly - result[3]),
    };
    if (options.signal?.aborted) {
      await settleCoachTurn(reservation, { modelCalled: false });
      return denied('quota_unavailable');
    }
    return reservation;
  } catch {
    // Redis 응답 유실 시 예약 결과는 알 수 없다. 메모리 재예약/모델 호출을 하지 않는다.
    return denied('quota_unavailable');
  }
}

function settleMemory(keys: Keys, modelCalled: boolean): void {
  const receipt = receipts.get(keys[2]);
  if (!receipt || receipt.settled) return;
  receipt.settled = true;
  if (modelCalled) return;
  for (const key of keys.slice(0, 2)) {
    const entry = counters.get(key);
    if (entry) entry.count = Math.max(0, entry.count - 1);
  }
}

/** 호출 시작 여부를 멱등 정산한다. 실패하더라도 예약 소진을 보존해 초과 과금을 막는다. */
export async function settleCoachTurn(
  reservation: CoachTurnReservation,
  settlement: CoachTurnSettlement
): Promise<void> {
  if (!reservation.allowed) return;
  const { keys } = reservation;
  if (reservation.backend === 'memory') {
    settleMemory(keys, settlement.modelCalled);
    return;
  }
  const redis = getUpstashRedisClient() as RedisClient | null;
  if (!redis) return;
  try {
    await bounded(
      redis.eval(SETTLE_COACH_TURN, keys, [
        settlement.modelCalled ? '1' : '0',
        JSON.stringify(settlement.usage ?? {}),
        settlement.modelVersion ?? '',
      ])
    );
  } catch {
    // 정산 실패는 환급으로 추측하지 않는다. 예약 소진이 남는 보수적 동작이다.
  }
}
