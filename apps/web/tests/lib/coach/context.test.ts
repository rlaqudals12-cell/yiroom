/**
 * 사용자 컨텍스트 수집 테스트
 *
 * @module tests/lib/coach/context
 * @description getUserContext 함수 테스트
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { getUserContext } from '@/lib/coach/context';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  coachLogger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// =============================================================================
// Helper: 체이닝 가능한 Supabase Mock 빌더
// =============================================================================

interface MockQueryResponse {
  data: unknown;
  error: unknown;
  count?: number;
}

function createChainableMock(response: MockQueryResponse) {
  const chain: Record<string, Mock> = {};

  // 모든 메서드가 자기 자신을 반환하면서 최종적으로 response 반환
  const methods = ['select', 'eq', 'order', 'limit', 'gte', 'lte'];

  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });

  chain.maybeSingle = vi.fn().mockResolvedValue(response);
  // count 쿼리용 - Promise 반환
  chain.then = vi.fn().mockImplementation((resolve) => resolve(response));

  // select가 count 쿼리일 때 바로 Promise 반환되도록
  const originalSelect = chain.select;
  chain.select = vi.fn().mockImplementation((...args) => {
    if (args[1]?.count === 'exact' && args[1]?.head === true) {
      // count 쿼리
      return {
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue(response),
          }),
        }),
      };
    }
    return originalSelect(...args);
  });

  return chain;
}

function createSupabaseMock(tableResponses: Record<string, MockQueryResponse>) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const response = tableResponses[table] || { data: null, error: null, count: 0 };
      return createChainableMock(response);
    }),
  };
}

// =============================================================================
// 테스트
// =============================================================================

describe('lib/coach/context', () => {
  const mockUserId = 'user_test_123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserContext', () => {
    it('should return null when all queries return empty data', async () => {
      const mockSupabase = createSupabaseMock({});
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).toBeNull();
    });

    it('should return personal color context when available', async () => {
      const mockSupabase = createSupabaseMock({
        personal_color_assessments: {
          data: { result: { season: '봄 웜톤', tone: 'bright' } },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.personalColor).toEqual({
        season: '봄 웜톤',
        tone: 'bright',
      });
    });

    it('should return skin analysis context when available', async () => {
      const mockSupabase = createSupabaseMock({
        skin_analyses: {
          data: {
            skin_type: '복합성',
            concerns: ['모공', '피지'],
            scores: { hydration: 65, oiliness: 70 },
          },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.skinAnalysis?.skinType).toBe('복합성');
      expect(result?.skinAnalysis?.concerns).toEqual(['모공', '피지']);
    });

    it('should return body analysis context when available', async () => {
      const mockSupabase = createSupabaseMock({
        body_analyses: {
          data: {
            body_type: '직사각형',
            bmi: 22.5,
            height: 170,
            weight: 65,
          },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.bodyAnalysis).toEqual({
        bodyType: '직사각형',
        bmi: 22.5,
        height: 170,
        weight: 65,
      });
    });

    it('should return hair analysis context when available', async () => {
      const mockSupabase = createSupabaseMock({
        hair_analyses: {
          data: {
            hair_type: '직모',
            scalp_type: '지성',
            overall_score: 75,
            concerns: ['탈모', '비듬'],
          },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.hairAnalysis).toEqual({
        hairType: '직모',
        scalpType: '지성',
        overallScore: 75,
        concerns: ['탈모', '비듬'],
      });
    });

    it('should return makeup analysis context when available', async () => {
      const mockSupabase = createSupabaseMock({
        makeup_analyses: {
          data: {
            undertone: '웜톤',
            face_shape: '계란형',
            eye_shape: '쌍꺼풀',
            overall_score: 80,
            recommendations: { styles: ['내추럴', '코랄'] },
          },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.makeupAnalysis?.undertone).toBe('웜톤');
      expect(result?.makeupAnalysis?.faceShape).toBe('계란형');
      expect(result?.makeupAnalysis?.recommendedStyles).toEqual(['내추럴', '코랄']);
    });

    it('should return workout context when available', async () => {
      const mockSupabase = createSupabaseMock({
        workout_analyses: {
          data: {
            workout_type: '근력 운동',
            goal: '근육 증가',
            frequency: 4,
          },
          error: null,
        },
        workout_streaks: {
          data: { current_streak: 15 },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.workout?.workoutType).toBe('근력 운동');
      expect(result?.workout?.goal).toBe('근육 증가');
      expect(result?.workout?.streak).toBe(15);
    });

    it('should return nutrition context when available', async () => {
      const mockSupabase = createSupabaseMock({
        nutrition_settings: {
          data: { goal: '벌크업', target_calories: 2500 },
          error: null,
        },
        nutrition_streaks: {
          data: { current_streak: 10 },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.nutrition?.goal).toBe('벌크업');
      expect(result?.nutrition?.targetCalories).toBe(2500);
      expect(result?.nutrition?.streak).toBe(10);
    });

    it('should return null when error occurs', async () => {
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => {
          throw new Error('Database connection failed');
        }),
      };
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).toBeNull();
    });

    it('should handle missing skin type gracefully', async () => {
      const mockSupabase = createSupabaseMock({
        skin_analyses: {
          data: { skin_type: null, concerns: [] },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.skinAnalysis?.skinType).toBe('알 수 없음');
    });

    it('should call createClerkSupabaseClient', async () => {
      const mockSupabase = createSupabaseMock({});
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      await getUserContext(mockUserId);

      expect(createClerkSupabaseClient).toHaveBeenCalled();
    });

    it('should query all required tables', async () => {
      const mockFrom = vi.fn().mockReturnValue(createChainableMock({ data: null, error: null }));
      const mockSupabase = { from: mockFrom };
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      await getUserContext(mockUserId);

      // 14개 테이블 쿼리 확인
      expect(mockFrom).toHaveBeenCalled();
      const calledTables = mockFrom.mock.calls.map((call: string[]) => call[0]);
      expect(calledTables).toContain('personal_color_assessments');
      expect(calledTables).toContain('skin_analyses');
      expect(calledTables).toContain('body_analyses');
      expect(calledTables).toContain('hair_analyses');
      expect(calledTables).toContain('makeup_analyses');
      expect(calledTables).toContain('workout_analyses');
    });

    it('should handle partial context when only some data exists', async () => {
      const mockSupabase = createSupabaseMock({
        skin_analyses: {
          data: { skin_type: '건성' },
          error: null,
        },
        workout_analyses: {
          data: { workout_type: '유산소' },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.skinAnalysis).toBeDefined();
      expect(result?.workout).toBeDefined();
      expect(result?.personalColor).toBeUndefined();
      expect(result?.bodyAnalysis).toBeUndefined();
    });
  });
});
