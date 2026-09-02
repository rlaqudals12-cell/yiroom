/**
 * v2 분석 Gemini 호출 예산 테스트
 *
 * 2026-08 외부 리뷰 확정 결함 #4의 회귀 방지:
 * - 이 파일이 정본 타임아웃 유틸을 복제해, 성공 시 타이머를 해제하지 않았다
 * - 30초 × 2시도 + 1초 = 61초 > 라우트 maxDuration(60초) → 재시도가 완주하기 전에 504
 * - 타임아웃으로 포기한 원 요청을 중단하지 않아 함수 예산을 계속 먹었다
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const generateContentMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/gemini/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gemini/client')>();
  return {
    ...actual,
    isGeminiAvailable: () => true,
    generateContent: generateContentMock,
  };
});

import { extractSkinColorWithGemini, V2_CALL_BUDGET_MS } from '@/lib/gemini/v2-analysis';
import { createExecutionDeadline } from '@/lib/utils/timeout';

/** 라우트 상한 (app/api/analyze/integrated/route.ts의 maxDuration) */
const ROUTE_MAX_DURATION_MS = 60_000;

const VALID_PC_RESPONSE = JSON.stringify({
  skinRgb: { r: 200, g: 170, b: 150 },
  undertone: 'warm',
  undertoneConfidence: 80,
  brightnessLevel: 'medium',
  saturationLevel: 'medium',
  imageQuality: { lightingCondition: 'natural', makeupDetected: false, colorAccuracy: 'high' },
});

const IMAGE = 'data:image/jpeg;base64,AAAA';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('v2 분석 호출 예산', () => {
  it('축당 총 예산이 라우트 상한(maxDuration)보다 작다', () => {
    expect(V2_CALL_BUDGET_MS).toBeLessThan(ROUTE_MAX_DURATION_MS);
  });

  it('성공 응답이면 타임아웃 타이머를 남기지 않는다 (함수 종료 지연 제거)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    generateContentMock.mockResolvedValue({ text: VALID_PC_RESPONSE });

    const promise = extractSkinColorWithGemini(IMAGE);
    await vi.runOnlyPendingTimersAsync();
    const result = await promise;

    expect(result.usedFallback).toBe(false);
    // 미해제 타이머가 남아 있으면 서버리스 함수 종료가 최대 타임아웃만큼 지연된다
    expect(vi.getTimerCount()).toBe(0);
  });

  it('호출마다 AbortSignal을 넘겨 포기한 요청을 중단할 수 있게 한다', async () => {
    generateContentMock.mockResolvedValue({ text: VALID_PC_RESPONSE });

    await extractSkinColorWithGemini(IMAGE);

    const config = generateContentMock.mock.calls[0][0].config;
    expect(config.abortSignal).toBeInstanceOf(AbortSignal);
    expect(config.temperature).toBe(0);
    expect(generateContentMock.mock.calls[0][0].model).toBe('gemini-3.5-flash');
  });

  it('완료된 호출의 AbortSignal은 정리 단계에서 abort된다', async () => {
    generateContentMock.mockResolvedValue({ text: VALID_PC_RESPONSE });

    await extractSkinColorWithGemini(IMAGE);

    const config = generateContentMock.mock.calls[0][0].config;
    expect(config.abortSignal.aborted).toBe(true);
  });

  it('실패는 1회만 재시도한다 (총 2시도 — 예산 초과 방지)', async () => {
    generateContentMock.mockRejectedValue(new Error('boom'));

    const result = await extractSkinColorWithGemini(IMAGE);

    expect(generateContentMock).toHaveBeenCalledTimes(2);
    // 실패해도 폴백 계약은 유지 (ADR-007)
    expect(result.usedFallback).toBe(true);
    expect(result.data).toBeNull();
  });

  it('상위 절대 deadline의 잔여 시간만 쓰고 재시도 대기까지 넘기지 않는다', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    generateContentMock.mockImplementation(() => new Promise(() => {}));
    const deadline = createExecutionDeadline(10_000);

    const promise = extractSkinColorWithGemini(IMAGE, deadline);
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await promise;

    expect(result.usedFallback).toBe(true);
    expect(result.data).toBeNull();
    // 첫 시도가 남은 전 예산을 썼으므로 새 25초 타이머로 재시작하면 안 된다.
    expect(generateContentMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    deadline.clear();
  });

  it('두 번째 시도는 25초를 리셋하지 않고 첫 시도와 대기 뒤 남은 4초만 쓴다', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    generateContentMock.mockImplementation(() => new Promise(() => {}));
    const deadline = createExecutionDeadline(30_000);

    const promise = extractSkinColorWithGemini(IMAGE, deadline);
    await vi.advanceTimersByTimeAsync(30_000);
    const result = await promise;

    expect(result.usedFallback).toBe(true);
    expect(generateContentMock).toHaveBeenCalledTimes(2);
    expect(performance.now()).toBe(30_000);
    expect(vi.getTimerCount()).toBe(0);
    deadline.clear();
  });
});
