/**
 * 타임아웃 및 재시도 유틸리티 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import {
  withTimeout,
  withRetry,
  withTimeoutAndFallback,
  createAbortTimeout,
  AI_TIMEOUT,
  RETRY_CONFIG,
} from '@/lib/utils/timeout';

describe('AI_TIMEOUT 상수', () => {
  it('기본 타임아웃은 3초이다', () => {
    expect(AI_TIMEOUT.DEFAULT).toBe(3000);
  });

  it('복잡한 분석 타임아웃은 10초이다', () => {
    expect(AI_TIMEOUT.COMPLEX).toBe(10000);
  });

  it('빠른 응답 타임아웃은 1.5초이다', () => {
    expect(AI_TIMEOUT.FAST).toBe(1500);
  });
});

describe('RETRY_CONFIG 상수', () => {
  it('기본 최대 재시도 횟수는 2이다', () => {
    expect(RETRY_CONFIG.MAX_RETRIES).toBe(2);
  });

  it('기본 대기 시간은 1000ms이다', () => {
    expect(RETRY_CONFIG.DELAY_MS).toBe(1000);
  });
});

describe('withTimeout', () => {
  it('타임아웃 내에 완료된 Promise를 반환한다', async () => {
    const result = await withTimeout(Promise.resolve('success'), 1000);
    expect(result).toBe('success');
  });

  it('타임아웃 시 에러를 던진다', async () => {
    const slowPromise = new Promise((resolve) => setTimeout(resolve, 5000));
    await expect(withTimeout(slowPromise, 50, '시간 초과')).rejects.toThrow('시간 초과');
  });

  it('Promise 자체가 에러를 던지면 그대로 전파한다', async () => {
    const failingPromise = Promise.reject(new Error('원본 에러'));
    await expect(withTimeout(failingPromise, 1000)).rejects.toThrow('원본 에러');
  });

  it('기본 에러 메시지가 있다', async () => {
    const slowPromise = new Promise((resolve) => setTimeout(resolve, 5000));
    await expect(withTimeout(slowPromise, 50)).rejects.toThrow('Request timeout');
  });
});

describe('withRetry', () => {
  it('성공하면 즉시 결과를 반환한다', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const result = await withRetry(fn, { maxRetries: 2, delayMs: 10 });
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('실패 후 재시도하여 성공한다', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('success');
    const result = await withRetry(fn, { maxRetries: 2, delayMs: 10 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('최대 재시도 후에도 실패하면 에러를 던진다', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('계속 실패'));
    await expect(withRetry(fn, { maxRetries: 1, delayMs: 10 })).rejects.toThrow('계속 실패');
    expect(fn).toHaveBeenCalledTimes(2); // 1번 + 1번 재시도
  });

  it('shouldRetry가 false를 반환하면 즉시 에러를 던진다', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('치명적 에러'));
    await expect(
      withRetry(fn, { maxRetries: 3, delayMs: 10, shouldRetry: () => false })
    ).rejects.toThrow('치명적 에러');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('onRetry 콜백이 재시도마다 호출된다', async () => {
    const onRetry = vi.fn();
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('ok');
    await withRetry(fn, { maxRetries: 2, delayMs: 10, onRetry });
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('지수 백오프를 비활성화할 수 있다', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('ok');
    const result = await withRetry(fn, {
      maxRetries: 1,
      delayMs: 10,
      exponential: false,
    });
    expect(result).toBe('ok');
  });
});

describe('withTimeoutAndFallback', () => {
  it('주 함수 성공 시 결과와 usedFallback: false를 반환한다', async () => {
    const primary = vi.fn().mockResolvedValue('primary result');
    const fallback = vi.fn().mockReturnValue('fallback result');
    const result = await withTimeoutAndFallback(primary, fallback, {
      timeout: 1000,
      maxRetries: 0,
      delayMs: 10,
    });
    expect(result.result).toBe('primary result');
    expect(result.usedFallback).toBe(false);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('주 함수 실패 시 폴백을 사용하고 usedFallback: true를 반환한다', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('AI 실패'));
    const fallback = vi.fn().mockReturnValue('mock result');
    const result = await withTimeoutAndFallback(primary, fallback, {
      timeout: 1000,
      maxRetries: 0,
      delayMs: 10,
    });
    expect(result.result).toBe('mock result');
    expect(result.usedFallback).toBe(true);
    expect(result.error).toBeDefined();
  });

  it('onFallback 콜백이 호출된다', async () => {
    const onFallback = vi.fn();
    const primary = vi.fn().mockRejectedValue(new Error('fail'));
    const fallback = vi.fn().mockReturnValue('fallback');
    await withTimeoutAndFallback(primary, fallback, {
      timeout: 1000,
      maxRetries: 0,
      delayMs: 10,
      onFallback,
    });
    expect(onFallback).toHaveBeenCalledTimes(1);
  });

  it('비동기 폴백 함수도 지원한다', async () => {
    const primary = vi.fn().mockRejectedValue(new Error('fail'));
    const fallback = vi.fn().mockResolvedValue('async fallback');
    const result = await withTimeoutAndFallback(primary, fallback, {
      timeout: 1000,
      maxRetries: 0,
      delayMs: 10,
    });
    expect(result.result).toBe('async fallback');
    expect(result.usedFallback).toBe(true);
  });
});

describe('createAbortTimeout', () => {
  it('AbortController와 clear 함수를 반환한다', () => {
    const { controller, clear } = createAbortTimeout(5000);
    expect(controller).toBeInstanceOf(AbortController);
    expect(typeof clear).toBe('function');
    clear(); // 타이머 정리
  });

  it('clear 호출 시 abort되지 않는다', () => {
    const { controller, clear } = createAbortTimeout(50);
    clear();
    expect(controller.signal.aborted).toBe(false);
  });

  it('타임아웃 후 signal이 abort된다', async () => {
    const { controller } = createAbortTimeout(30);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(controller.signal.aborted).toBe(true);
  });
});
