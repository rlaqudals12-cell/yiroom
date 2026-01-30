/**
 * Multi-AI Provider 테스트
 *
 * @module tests/lib/ai/multi-provider
 * @see docs/adr/ADR-055-multi-ai-backup-strategy.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyzeWithMultiAI, analyzeImageWithMultiAI } from '@/lib/ai/multi-provider';
import { resetAllCircuitBreakers } from '@/lib/ai/circuit-breaker';
import type { AIProvider, AIProviderName, ImageAnalysisInput } from '@/lib/ai/types';

// Mock providers
function createMockProvider<T>(
  name: AIProviderName,
  result: T,
  options: {
    shouldFail?: boolean;
    delay?: number;
    isEnabled?: boolean;
    priority?: number;
  } = {}
): AIProvider<unknown, T> {
  const { shouldFail = false, delay = 0, isEnabled = true, priority = 1 } = options;

  return {
    name,
    analyze: vi.fn().mockImplementation(async () => {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      if (shouldFail) {
        throw new Error(`${name} failed`);
      }
      return result;
    }),
    timeout: 1000,
    maxRetries: 1,
    priority,
    isEnabled: () => isEnabled,
  };
}

describe('analyzeWithMultiAI', () => {
  beforeEach(() => {
    resetAllCircuitBreakers();
    vi.clearAllMocks();
  });

  describe('단일 프로바이더 성공', () => {
    it('should return result from first successful provider', async () => {
      const mockResult = { score: 85 };
      const provider = createMockProvider('gemini', mockResult);

      const result = await analyzeWithMultiAI([provider], {}, () => ({ score: 0 }));

      expect(result.result).toEqual(mockResult);
      expect(result.provider).toBe('gemini');
      expect(result.usedFallback).toBe(false);
    });

    it('should track latency', async () => {
      const provider = createMockProvider('gemini', { data: 'test' }, { delay: 50 });

      const result = await analyzeWithMultiAI([provider], {}, () => ({ data: '' }));

      expect(result.latencyMs).toBeGreaterThanOrEqual(50);
    });

    it('should track attempted providers', async () => {
      const provider = createMockProvider('gemini', { data: 'test' });

      const result = await analyzeWithMultiAI([provider], {}, () => ({ data: '' }));

      expect(result.attemptedProviders).toEqual(['gemini']);
    });
  });

  describe('폴백 체인', () => {
    it('should fallback to second provider when first fails', async () => {
      const gemini = createMockProvider('gemini', { data: 'gemini' }, { shouldFail: true });
      const claude = createMockProvider('claude', { data: 'claude' }, { priority: 2 });

      const result = await analyzeWithMultiAI([gemini, claude], {}, () => ({ data: 'mock' }));

      expect(result.result).toEqual({ data: 'claude' });
      expect(result.provider).toBe('claude');
      expect(result.usedFallback).toBe(false);
      expect(result.attemptedProviders).toEqual(['gemini', 'claude']);
    });

    it('should use mock when all providers fail', async () => {
      const gemini = createMockProvider('gemini', { data: 'gemini' }, { shouldFail: true });
      const claude = createMockProvider(
        'claude',
        { data: 'claude' },
        { shouldFail: true, priority: 2 }
      );
      const mockData = { data: 'mock' };

      const result = await analyzeWithMultiAI([gemini, claude], {}, () => mockData);

      expect(result.result).toEqual(mockData);
      expect(result.provider).toBe('mock');
      expect(result.usedFallback).toBe(true);
    });

    it('should include errors in result when fallback used', async () => {
      const gemini = createMockProvider('gemini', { data: 'gemini' }, { shouldFail: true });
      const claude = createMockProvider(
        'claude',
        { data: 'claude' },
        { shouldFail: true, priority: 2 }
      );

      const result = await analyzeWithMultiAI([gemini, claude], {}, () => ({ data: 'mock' }));

      expect(result.errors).toBeDefined();
      // 에러 메시지는 타임아웃 또는 실제 에러 메시지가 될 수 있음
      expect(result.errors?.gemini).toBeDefined();
      expect(result.errors?.claude).toBeDefined();
    });
  });

  describe('우선순위 정렬', () => {
    it('should try providers in priority order (lower priority first)', async () => {
      const callOrder: string[] = [];

      const gemini = createMockProvider('gemini', { data: 'gemini' }, { priority: 1 });
      (gemini.analyze as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push('gemini');
        return { data: 'gemini' };
      });

      const claude = createMockProvider('claude', { data: 'claude' }, { priority: 2 });
      (claude.analyze as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push('claude');
        return { data: 'claude' };
      });

      // claude를 먼저 넣어도 gemini가 먼저 실행됨
      await analyzeWithMultiAI([claude, gemini], {}, () => ({ data: 'mock' }));

      expect(callOrder).toEqual(['gemini']);
    });
  });

  describe('비활성화된 프로바이더', () => {
    it('should skip disabled providers', async () => {
      const gemini = createMockProvider('gemini', { data: 'gemini' }, { isEnabled: false });
      const claude = createMockProvider('claude', { data: 'claude' }, { priority: 2 });

      const result = await analyzeWithMultiAI([gemini, claude], {}, () => ({ data: 'mock' }));

      expect(result.provider).toBe('claude');
      expect((gemini.analyze as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
    });

    it('should not include disabled provider in attemptedProviders', async () => {
      const gemini = createMockProvider('gemini', { data: 'gemini' }, { isEnabled: false });
      const claude = createMockProvider('claude', { data: 'claude' }, { priority: 2 });

      const result = await analyzeWithMultiAI([gemini, claude], {}, () => ({ data: 'mock' }));

      expect(result.attemptedProviders).not.toContain('gemini');
      expect(result.attemptedProviders).toContain('claude');
    });
  });

  describe('서킷 브레이커 통합', () => {
    it('should skip provider with open circuit', async () => {
      // Gemini 서킷을 OPEN 상태로 만들기
      const failingGemini = createMockProvider(
        'gemini',
        { data: 'gemini' },
        { shouldFail: true }
      );

      // 5번 실패시켜서 서킷 열기
      for (let i = 0; i < 5; i++) {
        try {
          await analyzeWithMultiAI([failingGemini], {}, () => ({ data: 'mock' }));
        } catch {
          // expected
        }
      }

      // 새로운 요청에서 claude로 바로 이동해야 함
      const newGemini = createMockProvider('gemini', { data: 'gemini new' });
      const claude = createMockProvider('claude', { data: 'claude' }, { priority: 2 });

      const result = await analyzeWithMultiAI([newGemini, claude], {}, () => ({ data: 'mock' }));

      // Gemini는 서킷이 열려있어서 스킵, Claude 사용
      expect(result.provider).toBe('claude');
    });
  });
});

describe('analyzeImageWithMultiAI', () => {
  beforeEach(() => {
    resetAllCircuitBreakers();
    vi.clearAllMocks();
  });

  // Mock Gemini and Claude providers
  vi.mock('@/lib/ai/providers/gemini', () => ({
    createGeminiProvider: vi.fn(() => ({
      name: 'gemini',
      analyze: vi.fn().mockResolvedValue({ skinType: 'combination' }),
      timeout: 3000,
      maxRetries: 2,
      priority: 1,
      isEnabled: () => true,
    })),
  }));

  vi.mock('@/lib/ai/providers/claude', () => ({
    createClaudeProvider: vi.fn(() => ({
      name: 'claude',
      analyze: vi.fn().mockResolvedValue({ skinType: 'dry' }),
      timeout: 4000,
      maxRetries: 1,
      priority: 2,
      isEnabled: () => false, // Claude는 비활성화 (SDK 미설치 시뮬레이션)
    })),
  }));

  it('should use correct analysis type', async () => {
    const input: ImageAnalysisInput = {
      imageBase64: 'data:image/jpeg;base64,test',
      analysisType: 'skin-v2',
    };

    const result = await analyzeImageWithMultiAI(
      input,
      'Analyze this skin image',
      () => ({ skinType: 'normal' })
    );

    // Gemini mock이 성공하므로 결과 반환
    expect(result.provider).toBe('gemini');
  });
});
