/**
 * AI Circuit Breaker 테스트
 *
 * @module tests/lib/ai/circuit-breaker
 * @see docs/adr/ADR-055-multi-ai-backup-strategy.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AICircuitBreaker,
  CircuitOpenError,
  getCircuitBreaker,
  resetAllCircuitBreakers,
  getAllCircuitStates,
} from '@/lib/ai/circuit-breaker';

describe('AICircuitBreaker', () => {
  let breaker: AICircuitBreaker;

  beforeEach(() => {
    breaker = new AICircuitBreaker('gemini');
    vi.clearAllMocks();
  });

  describe('초기 상태', () => {
    it('should start in CLOSED state', () => {
      expect(breaker.getState()).toBe('closed');
    });

    it('should have zero failures initially', () => {
      const metrics = breaker.getMetrics();
      expect(metrics.failures).toBe(0);
      expect(metrics.totalRequests).toBe(0);
    });

    it('should allow execution in CLOSED state', () => {
      expect(breaker.canExecute()).toBe(true);
    });
  });

  describe('성공 처리', () => {
    it('should return result on successful execution', async () => {
      const result = await breaker.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });

    it('should track successful requests', async () => {
      await breaker.execute(() => Promise.resolve('ok'));

      const metrics = breaker.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.totalSuccesses).toBe(1);
      expect(metrics.failures).toBe(0);
    });

    it('should reset failure count on success', async () => {
      // 몇 번 실패 후
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // expected
        }
      }

      // 성공하면 failures가 0으로 리셋
      await breaker.execute(() => Promise.resolve('ok'));

      const metrics = breaker.getMetrics();
      expect(metrics.failures).toBe(0);
    });
  });

  describe('실패 처리', () => {
    it('should propagate errors from failed execution', async () => {
      await expect(breaker.execute(() => Promise.reject(new Error('test error')))).rejects.toThrow(
        'test error'
      );
    });

    it('should track failed requests', async () => {
      try {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      } catch {
        // expected
      }

      const metrics = breaker.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.totalFailures).toBe(1);
      expect(metrics.failures).toBe(1);
    });
  });

  describe('OPEN 상태 전환', () => {
    it('should open after reaching failure threshold (5 failures)', async () => {
      // 5번 실패 (기본 임계값)
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // expected
        }
      }

      expect(breaker.getState()).toBe('open');
    });

    it('should not allow execution in OPEN state', async () => {
      // OPEN 상태로 만들기
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // expected
        }
      }

      expect(breaker.canExecute()).toBe(false);
    });

    it('should throw CircuitOpenError when OPEN', async () => {
      // OPEN 상태로 만들기
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // expected
        }
      }

      await expect(breaker.execute(() => Promise.resolve('test'))).rejects.toThrow(CircuitOpenError);
    });
  });

  describe('HALF-OPEN 상태', () => {
    it('should transition to HALF-OPEN after reset timeout', async () => {
      // 커스텀 짧은 타임아웃으로 브레이커 생성
      const fastBreaker = new AICircuitBreaker('gemini', {
        failureThreshold: 2,
        resetTimeoutMs: 100, // 100ms
        successThreshold: 1,
      });

      // OPEN 상태로 만들기
      for (let i = 0; i < 2; i++) {
        try {
          await fastBreaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // expected
        }
      }
      expect(fastBreaker.getState()).toBe('open');

      // 타임아웃 대기
      await new Promise((resolve) => setTimeout(resolve, 150));

      // canExecute 호출 시 상태 업데이트
      expect(fastBreaker.canExecute()).toBe(true);
      expect(fastBreaker.getState()).toBe('half-open');
    });

    it('should close on success in HALF-OPEN state', async () => {
      const fastBreaker = new AICircuitBreaker('gemini', {
        failureThreshold: 2,
        resetTimeoutMs: 50,
        successThreshold: 1,
      });

      // OPEN → HALF-OPEN
      for (let i = 0; i < 2; i++) {
        try {
          await fastBreaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // expected
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 60));
      fastBreaker.canExecute(); // 상태 업데이트 트리거

      // HALF-OPEN에서 성공
      await fastBreaker.execute(() => Promise.resolve('ok'));

      expect(fastBreaker.getState()).toBe('closed');
    });
  });

  describe('수동 리셋', () => {
    it('should reset to CLOSED state', async () => {
      // OPEN 상태로 만들기
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // expected
        }
      }
      expect(breaker.getState()).toBe('open');

      // 리셋
      breaker.reset();

      expect(breaker.getState()).toBe('closed');
      expect(breaker.getMetrics().failures).toBe(0);
    });
  });
});

describe('Circuit Breaker Factory', () => {
  beforeEach(() => {
    resetAllCircuitBreakers();
  });

  describe('getCircuitBreaker', () => {
    it('should return same instance for same provider', () => {
      const breaker1 = getCircuitBreaker('gemini');
      const breaker2 = getCircuitBreaker('gemini');

      expect(breaker1).toBe(breaker2);
    });

    it('should return different instances for different providers', () => {
      const geminiBreaker = getCircuitBreaker('gemini');
      const claudeBreaker = getCircuitBreaker('claude');

      expect(geminiBreaker).not.toBe(claudeBreaker);
    });
  });

  describe('getAllCircuitStates', () => {
    it('should return states for all providers', () => {
      const states = getAllCircuitStates();

      expect(states).toHaveProperty('gemini');
      expect(states).toHaveProperty('claude');
      expect(states).toHaveProperty('mock');
    });

    it('should reflect actual breaker states', async () => {
      const geminiBreaker = getCircuitBreaker('gemini');

      // OPEN 상태로 만들기
      for (let i = 0; i < 5; i++) {
        try {
          await geminiBreaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // expected
        }
      }

      const states = getAllCircuitStates();
      expect(states.gemini).toBe('open');
      expect(states.claude).toBe('closed'); // 아직 사용 안 함
    });
  });

  describe('resetAllCircuitBreakers', () => {
    it('should reset all breakers to CLOSED', async () => {
      const geminiBreaker = getCircuitBreaker('gemini');

      // OPEN 상태로 만들기
      for (let i = 0; i < 5; i++) {
        try {
          await geminiBreaker.execute(() => Promise.reject(new Error('fail')));
        } catch {
          // expected
        }
      }

      resetAllCircuitBreakers();

      const states = getAllCircuitStates();
      expect(states.gemini).toBe('closed');
    });
  });
});

describe('CircuitOpenError', () => {
  it('should include provider name', () => {
    const error = new CircuitOpenError('gemini', new Date());

    expect(error.providerName).toBe('gemini');
    expect(error.message).toContain('gemini');
  });

  it('should include last failure time', () => {
    const lastFailure = new Date();
    const error = new CircuitOpenError('claude', lastFailure);

    expect(error.lastFailure).toBe(lastFailure);
  });
});
