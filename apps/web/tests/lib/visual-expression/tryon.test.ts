/**
 * 표현 레이어 — 가상 착장 (tryon) FASHN 어댑터 테스트 (ADR-113)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const TRYON_INPUT = {
  modelImageBase64: 'data:image/jpeg;base64,AAAA',
  garmentImageUrl: 'https://example.com/garment.jpg',
  category: 'tops' as const,
};

describe('isTryonAvailable', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('FASHN_API_KEY가 없으면 false를 반환한다', async () => {
    vi.resetModules();
    delete process.env.FASHN_API_KEY;
    const mod = await import('@/lib/visual-expression/internal/tryon');
    expect(mod.isTryonAvailable()).toBe(false);
  });

  it('FASHN_API_KEY가 있으면 true를 반환한다', async () => {
    vi.resetModules();
    process.env.FASHN_API_KEY = 'test-key';
    const mod = await import('@/lib/visual-expression/internal/tryon');
    expect(mod.isTryonAvailable()).toBe(true);
    delete process.env.FASHN_API_KEY;
  });
});

describe('generateTryon', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.FASHN_API_KEY;
  });

  it('키가 없으면 오류를 던진다', async () => {
    delete process.env.FASHN_API_KEY;
    const { generateTryon } = await import('@/lib/visual-expression/internal/tryon');
    await expect(generateTryon(TRYON_INPUT)).rejects.toThrow('FASHN_API_KEY');
  });

  it('run이 완료되고 status가 completed면 착장 이미지를 반환한다', async () => {
    process.env.FASHN_API_KEY = 'test-key';
    vi.useFakeTimers();

    const fetchMock = vi
      .fn()
      // 1) run
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'job-1', error: null }),
      })
      // 2) status → completed
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-1',
          status: 'completed',
          output: ['https://cdn.fashn.ai/result.jpg'],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { generateTryon } = await import('@/lib/visual-expression/internal/tryon');
    const promise = generateTryon(TRYON_INPUT);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.aiGenerated).toBe(true);
    expect(result.imageUrl).toBe('https://cdn.fashn.ai/result.jpg');
    // run 호출 body에 카테고리/이미지가 담겼는지
    const runCall = fetchMock.mock.calls[0];
    expect(String(runCall[0])).toContain('/run');
  });

  it('status가 failed면 오류를 던진다', async () => {
    process.env.FASHN_API_KEY = 'test-key';
    vi.useFakeTimers();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'job-2' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'job-2', status: 'failed', error: 'bad input' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { generateTryon } = await import('@/lib/visual-expression/internal/tryon');
    const promise = generateTryon(TRYON_INPUT);
    const assertion = expect(promise).rejects.toThrow('bad input');
    await vi.runAllTimersAsync();
    await assertion;
  });
});
