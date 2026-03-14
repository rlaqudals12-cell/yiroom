/**
 * AI 분석 + Mock 폴백 헬퍼 테스트
 * @description lib/api/analysis-helpers/ai-fallback.ts의 withAIFallback 함수 테스트
 * @see ADR-007 Mock Fallback 전략
 * @see ADR-085
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// FORCE_MOCK 환경변수 테스트를 위해 각 테스트에서 dynamic import
describe('withAIFallback', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe('정상 케이스 (AI 성공)', () => {
    it('AI 호출 성공 시 실제 결과를 반환한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

      const aiResult = { skinType: 'oily', confidence: 92 };
      const { result, usedFallback } = await withAIFallback(
        async () => aiResult,
        () => ({ skinType: 'mock', confidence: 0 })
      );

      expect(result).toEqual(aiResult);
      expect(usedFallback).toBe(false);
    });

    it('AI 호출 성공 시 Mock 함수를 호출하지 않는다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

      const mockCall = vi.fn().mockReturnValue({ type: 'mock' });
      await withAIFallback(async () => ({ type: 'real' }), mockCall);

      expect(mockCall).not.toHaveBeenCalled();
    });

    it('복잡한 분석 결과도 정확히 전달한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

      const complexResult = {
        season: 'spring',
        subType: 'light',
        palette: ['#FF5733', '#C70039'],
        scores: { warm: 85, cool: 15 },
        recommendations: ['밝은 코랄', '피치 핑크'],
      };

      const { result } = await withAIFallback(
        async () => complexResult,
        () => ({})
      );

      expect(result).toEqual(complexResult);
    });

    it('moduleId 옵션 없이도 정상 동작한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

      const { result, usedFallback } = await withAIFallback(
        async () => 'success',
        () => 'mock'
      );

      expect(result).toBe('success');
      expect(usedFallback).toBe(false);
    });
  });

  describe('AI 실패 시 Mock 폴백', () => {
    it('AI 호출 실패 시 Mock 결과를 반환한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result, usedFallback } = await withAIFallback(
        async () => {
          throw new Error('Gemini API timeout');
        },
        () => ({ skinType: 'combination', confidence: 50 }),
        { moduleId: 'S-1' }
      );

      expect(result).toEqual({ skinType: 'combination', confidence: 50 });
      expect(usedFallback).toBe(true);
      consoleSpy.mockRestore();
    });

    it('AI 실패 시 moduleId를 포함한 에러 로그를 출력한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await withAIFallback(
        async () => {
          throw new Error('Network error');
        },
        () => ({}),
        { moduleId: 'PC-1' }
      );

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PC-1'), expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('moduleId 미지정 시 "Unknown"을 사용한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await withAIFallback(
        async () => {
          throw new Error('fail');
        },
        () => ({})
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown'),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('네트워크 에러도 폴백 처리한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { usedFallback } = await withAIFallback(
        () => Promise.reject(new TypeError('Failed to fetch')),
        () => ({ fallback: true }),
        { moduleId: 'C-1' }
      );

      expect(usedFallback).toBe(true);
      consoleSpy.mockRestore();
    });

    it('비 Error 객체 throw에도 폴백 처리한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { usedFallback } = await withAIFallback(
        async () => {
          throw 'string error';
        },
        () => ({ recovered: true })
      );

      expect(usedFallback).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe('forceMock 옵션', () => {
    it('forceMock=true 시 AI 호출 없이 Mock 반환한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

      const aiCall = vi.fn();
      const mockResult = { forced: true, type: 'mock' };
      const { result, usedFallback } = await withAIFallback(aiCall, () => mockResult, {
        forceMock: true,
      });

      expect(result).toEqual(mockResult);
      expect(usedFallback).toBe(true);
      expect(aiCall).not.toHaveBeenCalled();
    });

    it('forceMock=false 시 AI 호출을 시도한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

      const aiCall = vi.fn().mockResolvedValue({ real: true });
      const { result, usedFallback } = await withAIFallback(aiCall, () => ({ mock: true }), {
        forceMock: false,
      });

      expect(result).toEqual({ real: true });
      expect(usedFallback).toBe(false);
      expect(aiCall).toHaveBeenCalled();
    });
  });

  describe('FORCE_MOCK_AI 환경변수', () => {
    it('FORCE_MOCK_AI=true 시 Mock 모드를 강제한다', async () => {
      vi.stubEnv('FORCE_MOCK_AI', 'true');
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

      const aiCall = vi.fn();
      const { result, usedFallback } = await withAIFallback(aiCall, () => ({ envForced: true }));

      expect(result).toEqual({ envForced: true });
      expect(usedFallback).toBe(true);
      expect(aiCall).not.toHaveBeenCalled();
    });

    it('FORCE_MOCK_AI 미설정 시 AI 호출을 시도한다', async () => {
      vi.stubEnv('FORCE_MOCK_AI', 'false');
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

      const aiCall = vi.fn().mockResolvedValue({ real: true });
      const { usedFallback } = await withAIFallback(aiCall, () => ({}));

      expect(usedFallback).toBe(false);
      expect(aiCall).toHaveBeenCalled();
    });
  });

  describe('엣지 케이스', () => {
    it('AI 호출이 undefined를 반환해도 성공으로 처리한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

      const { result, usedFallback } = await withAIFallback(
        async () => undefined as unknown,
        () => 'mock'
      );

      expect(result).toBeUndefined();
      expect(usedFallback).toBe(false);
    });

    it('Mock 함수가 동기적으로 동작한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const mockFn = vi.fn().mockReturnValue({ sync: true });
      const { result } = await withAIFallback(async () => {
        throw new Error('fail');
      }, mockFn);

      expect(result).toEqual({ sync: true });
      expect(mockFn).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });

    it('제네릭 타입 추론이 올바르게 동작한다', async () => {
      const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

      const { result } = await withAIFallback(
        async () => ({ score: 85, label: 'good' }),
        () => ({ score: 0, label: 'unknown' })
      );

      // TypeScript 타입이 { score: number; label: string }으로 추론됨
      expect(typeof result.score).toBe('number');
      expect(typeof result.label).toBe('string');
    });
  });
});
