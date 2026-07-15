/**
 * 표현 레이어 — 비용 가드 (budget) 테스트 (ADR-113, ADR-038)
 *
 * 2026-07-14: 인메모리 Map → Upstash 원자 카운터 승격. 두 경로를 모두 검증:
 *  - 인메모리 폴백(로컬·테스트): Upstash env 없음 → store 사용
 *  - Redis 경로: getUpstashRedisClient 모킹 → INCR/DECR/EXPIRE 계약 고정
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// getUpstashRedisClient을 테스트 케이스별로 갈아끼우기 위한 훅 상태
const { redisState } = vi.hoisted(() => ({
  redisState: { client: null as unknown },
}));

vi.mock('@/lib/security/rate-limit', () => ({
  getUpstashRedisClient: () => redisState.client,
}));

import {
  checkAndConsumeBudget,
  refundBudget,
  DAILY_LIMIT,
  _resetBudget,
} from '@/lib/visual-expression/internal/budget';

describe('checkAndConsumeBudget — 인메모리 폴백 (Upstash 미설정)', () => {
  beforeEach(() => {
    redisState.client = null; // 폴백 경로 강제
    _resetBudget();
  });

  it('하루 상한(5회)까지는 허용하고 remaining이 감소한다', async () => {
    const first = await checkAndConsumeBudget('user-a');
    expect(first.allowed).toBe(true);
    expect(first.limit).toBe(DAILY_LIMIT);
    expect(first.remaining).toBe(DAILY_LIMIT - 1);

    for (let i = 2; i < DAILY_LIMIT; i++) {
      expect((await checkAndConsumeBudget('user-a')).allowed).toBe(true);
    }
    const fifth = await checkAndConsumeBudget('user-a');
    expect(fifth.allowed).toBe(true);
    expect(fifth.remaining).toBe(0);
  });

  it('상한 초과(6번째)는 차단하고 카운트를 더 올리지 않는다', async () => {
    for (let i = 0; i < DAILY_LIMIT; i++) {
      await checkAndConsumeBudget('user-b');
    }
    const over = await checkAndConsumeBudget('user-b');
    expect(over.allowed).toBe(false);
    expect(over.remaining).toBe(0);
    expect((await checkAndConsumeBudget('user-b')).allowed).toBe(false);
  });

  it('사용자별로 상한이 독립적이다', async () => {
    for (let i = 0; i < DAILY_LIMIT; i++) {
      await checkAndConsumeBudget('user-c');
    }
    expect((await checkAndConsumeBudget('user-c')).allowed).toBe(false);
    expect((await checkAndConsumeBudget('user-d')).allowed).toBe(true);
  });

  it('환불하면 소비 1회가 되돌아간다', async () => {
    await checkAndConsumeBudget('user-e'); // remaining 4
    await refundBudget('user-e'); // remaining 5로 복구
    const after = await checkAndConsumeBudget('user-e');
    expect(after.remaining).toBe(DAILY_LIMIT - 1);
  });
});

describe('checkAndConsumeBudget — Redis 경로 (Upstash 설정)', () => {
  // 원자 카운터를 흉내내는 최소 인메모리 Redis 목
  function makeRedisMock() {
    const kv = new Map<string, number>();
    const expired = new Set<string>();
    return {
      kv,
      expired,
      async incr(k: string) {
        const next = (kv.get(k) ?? 0) + 1;
        kv.set(k, next);
        return next;
      },
      async decr(k: string) {
        const next = (kv.get(k) ?? 0) - 1;
        kv.set(k, next);
        return next;
      },
      async get(k: string) {
        return kv.has(k) ? kv.get(k)! : null;
      },
      async expire(k: string, _s: number) {
        expired.add(k);
        return 1;
      },
    };
  }

  let redis: ReturnType<typeof makeRedisMock>;

  beforeEach(() => {
    redis = makeRedisMock();
    redisState.client = redis;
  });

  afterEach(() => {
    redisState.client = null;
  });

  it('첫 소비에서만 TTL(expire)을 건다 — 자정 리셋 고정, sliding 방지', async () => {
    await checkAndConsumeBudget('u1');
    expect(redis.expired.has('visual-budget:u1')).toBe(true);
    redis.expired.clear();
    await checkAndConsumeBudget('u1'); // 두 번째 소비엔 expire 재호출 없음
    expect(redis.expired.has('visual-budget:u1')).toBe(false);
  });

  it('상한 초과 시 DECR로 롤백해 카운트를 LIMIT에 묶는다', async () => {
    for (let i = 0; i < DAILY_LIMIT; i++) {
      expect((await checkAndConsumeBudget('u2')).allowed).toBe(true);
    }
    const over = await checkAndConsumeBudget('u2');
    expect(over.allowed).toBe(false);
    // INCR로 6이 됐다가 DECR로 5(LIMIT)로 롤백돼야 함
    expect(redis.kv.get('visual-budget:u2')).toBe(DAILY_LIMIT);
  });

  it('환불은 양수일 때만 DECR (리셋 후/0은 음수로 안 내려감)', async () => {
    await checkAndConsumeBudget('u3'); // count 1
    await refundBudget('u3'); // count 0
    expect(redis.kv.get('visual-budget:u3')).toBe(0);
    await refundBudget('u3'); // 0에선 무시 — 음수 방지
    expect(redis.kv.get('visual-budget:u3')).toBe(0);
  });
});
