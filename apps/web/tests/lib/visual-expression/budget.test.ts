/**
 * 표현 레이어 — 비용 가드 (budget) 테스트 (ADR-113)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkAndConsumeBudget,
  DAILY_LIMIT,
  _resetBudget,
} from '@/lib/visual-expression/internal/budget';

describe('checkAndConsumeBudget', () => {
  beforeEach(() => {
    _resetBudget();
  });

  it('하루 상한(5회)까지는 허용하고 remaining이 감소한다', () => {
    const first = checkAndConsumeBudget('user-a');
    expect(first.allowed).toBe(true);
    expect(first.limit).toBe(DAILY_LIMIT);
    expect(first.remaining).toBe(DAILY_LIMIT - 1);

    for (let i = 2; i < DAILY_LIMIT; i++) {
      expect(checkAndConsumeBudget('user-a').allowed).toBe(true);
    }
    // 5번째까지 허용
    const fifth = checkAndConsumeBudget('user-a');
    expect(fifth.allowed).toBe(true);
    expect(fifth.remaining).toBe(0);
  });

  it('상한 초과(6번째)는 차단하고 카운트를 더 올리지 않는다', () => {
    for (let i = 0; i < DAILY_LIMIT; i++) {
      checkAndConsumeBudget('user-b');
    }
    const over = checkAndConsumeBudget('user-b');
    expect(over.allowed).toBe(false);
    expect(over.remaining).toBe(0);

    // 재차 초과해도 여전히 차단
    expect(checkAndConsumeBudget('user-b').allowed).toBe(false);
  });

  it('사용자별로 상한이 독립적이다', () => {
    for (let i = 0; i < DAILY_LIMIT; i++) {
      checkAndConsumeBudget('user-c');
    }
    expect(checkAndConsumeBudget('user-c').allowed).toBe(false);
    // 다른 사용자는 영향 없음
    expect(checkAndConsumeBudget('user-d').allowed).toBe(true);
  });
});
