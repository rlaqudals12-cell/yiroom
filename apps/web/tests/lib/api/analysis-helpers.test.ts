/**
 * 분석 API 조합형 헬퍼 단위 테스트
 *
 * @see ADR-085
 * @see lib/api/analysis-helpers/
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- withAIFallback ---
describe('withAIFallback', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('AI 호출 성공 시 결과를 반환한다', async () => {
    const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

    const aiCall = vi.fn().mockResolvedValue({ skinType: 'oily' });
    const mockCall = vi.fn().mockReturnValue({ skinType: 'mock' });

    const { result, usedFallback } = await withAIFallback(aiCall, mockCall, { moduleId: 'S-1' });

    expect(result).toEqual({ skinType: 'oily' });
    expect(usedFallback).toBe(false);
    expect(aiCall).toHaveBeenCalled();
    expect(mockCall).not.toHaveBeenCalled();
  });

  it('AI 호출 실패 시 Mock 폴백한다', async () => {
    const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const aiCall = vi.fn().mockRejectedValue(new Error('Gemini timeout'));
    const mockCall = vi.fn().mockReturnValue({ skinType: 'mock-fallback' });

    const { result, usedFallback } = await withAIFallback(aiCall, mockCall, { moduleId: 'S-1' });

    expect(result).toEqual({ skinType: 'mock-fallback' });
    expect(usedFallback).toBe(true);
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('S-1'), expect.any(Error));
    consoleError.mockRestore();
  });

  it('forceMock 옵션 시 AI 호출 없이 Mock 반환', async () => {
    const { withAIFallback } = await import('@/lib/api/analysis-helpers/ai-fallback');

    const aiCall = vi.fn();
    const mockCall = vi.fn().mockReturnValue({ forced: true });

    const { result, usedFallback } = await withAIFallback(aiCall, mockCall, { forceMock: true });

    expect(result).toEqual({ forced: true });
    expect(usedFallback).toBe(true);
    expect(aiCall).not.toHaveBeenCalled();
  });
});

// --- saveWithFallback ---
describe('saveWithFallback', () => {
  it('DB 저장 성공 시 데이터를 반환한다', async () => {
    const { saveWithFallback } = await import('@/lib/api/analysis-helpers/db-save');

    const dbRow = { id: 'real-id', clerk_user_id: 'user_1' };
    const { data, dbSaveFailed } = await saveWithFallback(
      async () => dbRow,
      () => ({ id: 'synthetic', clerk_user_id: 'user_1' })
    );

    expect(data).toEqual(dbRow);
    expect(dbSaveFailed).toBe(false);
  });

  it('DB 저장 실패 시 합성 응답을 반환한다', async () => {
    const { saveWithFallback } = await import('@/lib/api/analysis-helpers/db-save');

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { data, dbSaveFailed } = await saveWithFallback(
      async () => {
        throw new Error('DB connection lost');
      },
      () => ({ id: 'synthetic-id', clerk_user_id: 'user_1' })
    );

    expect(data).toEqual({ id: 'synthetic-id', clerk_user_id: 'user_1' });
    expect(dbSaveFailed).toBe(true);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

// --- withGamification ---
// vi.mock은 hoisted되므로 파일 레벨에서 한 번만 선언
vi.mock('@/lib/gamification', () => ({
  addXp: vi.fn().mockResolvedValue(undefined),
  awardAnalysisBadge: vi.fn().mockResolvedValue({ badgeCode: 'skin_first', isNew: true }),
  checkAndAwardAllAnalysisBadge: vi.fn().mockResolvedValue(null),
}));

describe('withGamification', () => {
  const mockSupabase = {} as any;

  it('XP와 뱃지를 수여한다', async () => {
    const { withGamification } = await import('@/lib/api/analysis-helpers/gamification');

    const result = await withGamification(mockSupabase, 'user_1', 'skin');

    expect(result.xpAwarded).toBe(10);
    expect(result.badgeResults).toHaveLength(1);
    expect(result.badgeResults[0]).toEqual({ badgeCode: 'skin_first', isNew: true });
  });

  it('게이미피케이션 실패해도 에러를 던지지 않는다', async () => {
    // addXp를 이번 호출만 실패하도록 변경
    const gamification = await import('@/lib/gamification');
    vi.mocked(gamification.addXp).mockRejectedValueOnce(new Error('XP service down'));

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { withGamification } = await import('@/lib/api/analysis-helpers/gamification');

    const result = await withGamification(mockSupabase, 'user_1', 'skin');

    expect(result.xpAwarded).toBe(0);
    expect(result.badgeResults).toEqual([]);
    consoleWarn.mockRestore();
  });
});

// --- Barrel export ---
describe('index barrel export', () => {
  it('모든 헬퍼를 re-export한다', async () => {
    const mod = await import('@/lib/api/analysis-helpers');

    expect(mod.withAnalysisAuth).toBeDefined();
    expect(mod.withAIFallback).toBeDefined();
    expect(mod.saveWithFallback).toBeDefined();
    expect(mod.withGamification).toBeDefined();
    expect(mod.uploadAnalysisImage).toBeDefined();
  });
});
