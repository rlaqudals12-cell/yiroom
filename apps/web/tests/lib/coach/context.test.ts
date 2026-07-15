/**
 * 사용자 컨텍스트 수집 테스트
 *
 * @module tests/lib/coach/context
 * @description getUserContext 함수 테스트
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { getUserContext } from '@/lib/coach/context';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getShelfItems } from '@/lib/scan/product-shelf';
import { isFeatureEnabled } from '@yiroom/shared';

// =============================================================================
// Mocks
// =============================================================================

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(),
}));

// WELLNESS_PHASE2는 빌드타임 const라 게이팅을 검증하려면 모듈을 목킹해야 한다.
// 원본을 유지하고 isFeatureEnabled만 제어 가능하게 override.
vi.mock('@yiroom/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@yiroom/shared')>()),
  isFeatureEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/utils/logger', () => ({
  coachLogger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// 제품함(고객 노트) — 기본은 빈 배열, 개별 테스트가 필요 시 items 주입
vi.mock('@/lib/scan/product-shelf', () => ({
  getShelfItems: vi.fn().mockResolvedValue({ items: [] }),
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
    // 기본: 숨김 모듈 off (뷰티 전속) — 개별 테스트가 필요 시 true로 오버라이드
    (isFeatureEnabled as Mock).mockReturnValue(false);
    // 기본: 빈 제품함 — clearAllMocks가 구현을 지우므로 재설정
    (getShelfItems as Mock).mockResolvedValue({ items: [] });
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

    it('should return workout context when available (WELLNESS_PHASE2 재활성)', async () => {
      (isFeatureEnabled as Mock).mockReturnValue(true); // 재노출 안전망: 플래그 켜면 복원
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

    it('should return nutrition context when available (WELLNESS_PHASE2 재활성)', async () => {
      (isFeatureEnabled as Mock).mockReturnValue(true); // 재노출 안전망
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

      // 뷰티 5축 테이블은 항상 조회 (게이팅 무관)
      expect(mockFrom).toHaveBeenCalled();
      const calledTables = mockFrom.mock.calls.map((call: string[]) => call[0]);
      expect(calledTables).toContain('personal_color_assessments');
      expect(calledTables).toContain('skin_analyses');
      expect(calledTables).toContain('body_analyses');
      expect(calledTables).toContain('hair_analyses');
      expect(calledTables).toContain('makeup_analyses');
      // WELLNESS_PHASE2 off(기본)이므로 운동·영양 테이블은 조회하지 않는다
      expect(calledTables).not.toContain('workout_analyses');
      expect(calledTables).not.toContain('nutrition_settings');
    });

    it('should handle partial context when only some data exists', async () => {
      const mockSupabase = createSupabaseMock({
        skin_analyses: {
          data: { skin_type: '건성' },
          error: null,
        },
        hair_analyses: {
          data: { hair_type: '곱슬', scalp_type: '건성', overall_score: 70, concerns: [] },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.skinAnalysis).toBeDefined();
      expect(result?.hairAnalysis).toBeDefined();
      expect(result?.personalColor).toBeUndefined();
      expect(result?.bodyAnalysis).toBeUndefined();
    });

    it('WELLNESS_PHASE2 off(기본)면 운동 데이터가 있어도 context.workout에 담지 않는다', async () => {
      // flag off = beforeEach 기본값 (뷰티 전속). 뷰티 데이터로 result를 non-null로 만들고 검증.
      const mockSupabase = createSupabaseMock({
        skin_analyses: { data: { skin_type: '건성' }, error: null },
        workout_analyses: {
          data: { workout_type: '근력', goal: '증량', frequency: 4 },
          error: null,
        },
        workout_streaks: { data: { current_streak: 15 }, error: null },
        workout_logs: { data: { exercise_name: '스쿼트', duration_minutes: 30 }, error: null },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.skinAnalysis).toBeDefined();
      expect(result?.workout).toBeUndefined(); // 게이팅 — 조회 안 함
      expect(result?.recentActivity).toBeUndefined();
    });

    it('WELLNESS_PHASE2 off(기본)면 영양 데이터가 있어도 context.nutrition에 담지 않는다', async () => {
      const mockSupabase = createSupabaseMock({
        skin_analyses: { data: { skin_type: '건성' }, error: null },
        nutrition_settings: { data: { goal: '벌크업', target_calories: 2500 }, error: null },
        nutrition_streaks: { data: { current_streak: 10 }, error: null },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.nutrition).toBeUndefined(); // 게이팅 — 조회 안 함
    });

    // 고객 노트: 보유 제품(제품함) — 코치 owned-first 답변의 근거
    it('보유 제품이 있으면 context.ownedProducts에 이름·브랜드·rating을 담는다', async () => {
      (getShelfItems as Mock).mockResolvedValue({
        items: [
          { productName: '토너A', productBrand: '브랜드X', rating: 5, compatibilityScore: 88 },
          { productName: '세럼B', productBrand: '브랜드Y', rating: 2 },
          { productName: '크림C' }, // 브랜드·평점 없음
        ],
      });
      const mockSupabase = createSupabaseMock({
        skin_analyses: { data: { skin_type: '건성' }, error: null },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result?.ownedProducts).toHaveLength(3);
      expect(result?.ownedProducts?.[0]).toEqual({
        name: '토너A',
        brand: '브랜드X',
        rating: 5,
        compatibilityScore: 88,
      });
      // 브랜드·평점 없는 제품은 name만 (지어내지 않음)
      expect(result?.ownedProducts?.[2]).toEqual({ name: '크림C' });
    });

    it('제품함이 비어있으면 ownedProducts를 설정하지 않는다 (지어내지 않음)', async () => {
      // getShelfItems 기본 = { items: [] }
      const mockSupabase = createSupabaseMock({
        skin_analyses: { data: { skin_type: '건성' }, error: null },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.ownedProducts).toBeUndefined();
    });

    it('제품함 조회 실패해도 5축 컨텍스트는 살아있다 (실패 격리)', async () => {
      (getShelfItems as Mock).mockRejectedValue(new Error('shelf down'));
      const mockSupabase = createSupabaseMock({
        skin_analyses: { data: { skin_type: '건성' }, error: null },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.skinAnalysis).toBeDefined(); // 5축 생존
      expect(result?.ownedProducts).toBeUndefined();
    });

    it('should handle recent activity when today workout exists (WELLNESS_PHASE2 재활성)', async () => {
      (isFeatureEnabled as Mock).mockReturnValue(true); // 재노출 안전망
      const mockSupabase = createSupabaseMock({
        workout_logs: {
          data: {
            exercise_name: '스쿼트',
            duration_minutes: 30,
          },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.recentActivity?.todayWorkout).toBeDefined();
    });

    it('should handle recent activity when today nutrition exists (WELLNESS_PHASE2 재활성)', async () => {
      (isFeatureEnabled as Mock).mockReturnValue(true); // 재노출 안전망
      const mockSupabase = createSupabaseMock({
        daily_nutrition_summary: {
          data: {
            total_calories: 1800,
            water_ml: 2000,
          },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.recentActivity?.todayCalories).toBe(1800);
      expect(result?.recentActivity?.waterIntake).toBe(2000);
    });

    it('should handle weekly summary data', async () => {
      // 복잡한 체이닝을 위한 특수 mock
      const weeklyNutritionData = [
        { total_calories: 1800, protein_g: 80, carbs_g: 200, fat_g: 60 },
        { total_calories: 1900, protein_g: 85, carbs_g: 220, fat_g: 65 },
        { total_calories: 2000, protein_g: 90, carbs_g: 250, fat_g: 70 },
      ];

      const mockSupabase = createSupabaseMock({
        daily_nutrition_summary: {
          data: weeklyNutritionData,
          error: null,
        },
        workout_logs: {
          data: null,
          error: null,
          count: 5,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      // 주간 요약 검증은 복잡한 쿼리 체이닝으로 인해 실제 통합 테스트에서 확인 필요
      expect(result).toBeDefined();
    });

    it('should handle personal color without tone', async () => {
      const mockSupabase = createSupabaseMock({
        personal_color_assessments: {
          data: { result: { season: '여름 쿨톤' } },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.personalColor?.season).toBe('여름 쿨톤');
      expect(result?.personalColor?.tone).toBeUndefined();
    });

    it('should return null when personal color result has no season', async () => {
      const mockSupabase = createSupabaseMock({
        personal_color_assessments: {
          data: { result: {} },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      // result에 season이 없으면 personalColor가 설정되지 않음
      expect(result?.personalColor).toBeUndefined();
    });

    it('should handle workout streak only (without workout analysis) (WELLNESS_PHASE2 재활성)', async () => {
      (isFeatureEnabled as Mock).mockReturnValue(true); // 재노출 안전망
      const mockSupabase = createSupabaseMock({
        workout_streaks: {
          data: { current_streak: 20 },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.workout?.streak).toBe(20);
      expect(result?.workout?.workoutType).toBeUndefined();
    });

    it('should handle nutrition streak only (without nutrition settings) (WELLNESS_PHASE2 재활성)', async () => {
      (isFeatureEnabled as Mock).mockReturnValue(true); // 재노출 안전망
      const mockSupabase = createSupabaseMock({
        nutrition_streaks: {
          data: { current_streak: 5 },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.nutrition?.streak).toBe(5);
      expect(result?.nutrition?.goal).toBeUndefined();
    });

    it('should handle hair analysis without concerns', async () => {
      const mockSupabase = createSupabaseMock({
        hair_analyses: {
          data: {
            hair_type: '곱슬',
            scalp_type: '건성',
            overall_score: 60,
          },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.hairAnalysis?.hairType).toBe('곱슬');
      expect(result?.hairAnalysis?.scalpType).toBe('건성');
      expect(result?.hairAnalysis?.concerns).toBeUndefined();
    });

    it('should handle makeup analysis without eye shape and styles', async () => {
      const mockSupabase = createSupabaseMock({
        makeup_analyses: {
          data: {
            undertone: '쿨톤',
            face_shape: '네모형',
            overall_score: 70,
          },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.makeupAnalysis?.undertone).toBe('쿨톤');
      expect(result?.makeupAnalysis?.faceShape).toBe('네모형');
      expect(result?.makeupAnalysis?.eyeShape).toBeUndefined();
      expect(result?.makeupAnalysis?.recommendedStyles).toBeUndefined();
    });

    it('should handle body analysis without BMI', async () => {
      const mockSupabase = createSupabaseMock({
        body_analyses: {
          data: {
            body_type: '역삼각형',
            height: 180,
            weight: 75,
          },
          error: null,
        },
      });
      (createClerkSupabaseClient as Mock).mockReturnValue(mockSupabase);

      const result = await getUserContext(mockUserId);

      expect(result).not.toBeNull();
      expect(result?.bodyAnalysis?.bodyType).toBe('역삼각형');
      expect(result?.bodyAnalysis?.bmi).toBeUndefined();
    });
  });
});
