import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTodayWellnessScore,
  getWellnessScoreByDate,
  getWellnessHistory,
  getLatestWellnessScore,
  getAverageWellnessScore,
  getWellnessTrend,
} from '@/lib/wellness/queries';
import {
  saveWellnessScore,
  updateWellnessInsights,
  deleteWellnessScore,
  cleanupOldWellnessScores,
} from '@/lib/wellness/mutations';
import type { WellnessScoreRow, ScoreBreakdown } from '@/types/wellness';

// Supabase 체이닝 mock을 vi.hoisted로 선언
const { mockSupabase, mockChain } = vi.hoisted(() => {
  const mockChain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    lt: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };

  // 체이닝: 모든 중간 호출은 자기 자신 반환
  mockChain.select.mockReturnValue(mockChain);
  mockChain.insert.mockReturnValue(mockChain);
  mockChain.update.mockReturnValue(mockChain);
  mockChain.upsert.mockReturnValue(mockChain);
  mockChain.delete.mockReturnValue(mockChain);
  mockChain.eq.mockReturnValue(mockChain);
  mockChain.gte.mockReturnValue(mockChain);
  mockChain.lte.mockReturnValue(mockChain);
  mockChain.lt.mockReturnValue(mockChain);
  mockChain.order.mockReturnValue(mockChain);
  mockChain.limit.mockReturnValue(mockChain);

  const mockSupabase = {
    from: vi.fn().mockReturnValue(mockChain),
  };

  return { mockSupabase, mockChain };
});

// 로거 mock
vi.mock('@/lib/utils/logger', () => ({
  wellnessLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// 테스트용 DB Row 팩토리
function createMockScoreRow(overrides: Partial<WellnessScoreRow> = {}): WellnessScoreRow {
  return {
    id: 'score_123',
    clerk_user_id: 'user_test',
    date: '2026-03-14',
    total_score: 75,
    workout_score: 20,
    nutrition_score: 18,
    skin_score: 22,
    body_score: 15,
    score_breakdown: {
      workout: { streak: 6, frequency: 8, goal: 4 },
      nutrition: { calorie: 8, balance: 7, water: 3 },
      skin: { analysis: 10, routine: 8, matching: 4 },
      body: { analysis: 8, progress: 5, workout: 2 },
    },
    insights: [],
    created_at: '2026-03-14T00:00:00Z',
    updated_at: '2026-03-14T00:00:00Z',
    ...overrides,
  };
}

const TEST_USER_ID = 'user_test';

describe('웰니스 스코어 조회 (queries)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 체이닝 초기화
    mockChain.select.mockReturnValue(mockChain);
    mockChain.insert.mockReturnValue(mockChain);
    mockChain.update.mockReturnValue(mockChain);
    mockChain.upsert.mockReturnValue(mockChain);
    mockChain.delete.mockReturnValue(mockChain);
    mockChain.eq.mockReturnValue(mockChain);
    mockChain.gte.mockReturnValue(mockChain);
    mockChain.lte.mockReturnValue(mockChain);
    mockChain.lt.mockReturnValue(mockChain);
    mockChain.order.mockReturnValue(mockChain);
    mockChain.limit.mockReturnValue(mockChain);
    mockSupabase.from.mockReturnValue(mockChain);
  });

  // ============================================================
  // getWellnessScoreByDate
  // ============================================================
  describe('getWellnessScoreByDate', () => {
    it('특정 날짜의 스코어를 반환한다', async () => {
      const row = createMockScoreRow();
      mockChain.maybeSingle.mockResolvedValue({ data: row, error: null });

      const result = await getWellnessScoreByDate(mockSupabase as any, TEST_USER_ID, '2026-03-14');

      expect(result).not.toBeNull();
      expect(result!.totalScore).toBe(75);
      expect(result!.clerkUserId).toBe(TEST_USER_ID);
      expect(mockSupabase.from).toHaveBeenCalledWith('wellness_scores');
    });

    it('데이터가 없으면 null을 반환한다', async () => {
      mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await getWellnessScoreByDate(mockSupabase as any, TEST_USER_ID, '2026-01-01');

      expect(result).toBeNull();
    });

    it('에러 발생 시 null을 반환한다', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      const result = await getWellnessScoreByDate(mockSupabase as any, TEST_USER_ID, '2026-03-14');

      expect(result).toBeNull();
    });

    it('null 점수 필드를 0으로 변환한다', async () => {
      const row = createMockScoreRow({
        total_score: null,
        workout_score: null,
        nutrition_score: null,
        skin_score: null,
        body_score: null,
        score_breakdown: null,
        insights: null,
      });
      mockChain.maybeSingle.mockResolvedValue({ data: row, error: null });

      const result = await getWellnessScoreByDate(mockSupabase as any, TEST_USER_ID, '2026-03-14');

      expect(result!.totalScore).toBe(0);
      expect(result!.workoutScore).toBe(0);
      expect(result!.insights).toEqual([]);
    });
  });

  // ============================================================
  // getTodayWellnessScore
  // ============================================================
  describe('getTodayWellnessScore', () => {
    it('오늘 날짜로 스코어를 조회한다', async () => {
      const row = createMockScoreRow();
      mockChain.maybeSingle.mockResolvedValue({ data: row, error: null });

      const result = await getTodayWellnessScore(mockSupabase as any, TEST_USER_ID);

      expect(result).not.toBeNull();
      // 오늘 날짜를 eq에 전달하는지 확인
      const today = new Date().toISOString().split('T')[0];
      expect(mockChain.eq).toHaveBeenCalledWith('date', today);
    });

    it('오늘 스코어가 없으면 null을 반환한다', async () => {
      mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await getTodayWellnessScore(mockSupabase as any, TEST_USER_ID);

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // getWellnessHistory
  // ============================================================
  describe('getWellnessHistory', () => {
    it('최근 7일 히스토리를 반환한다', async () => {
      const rows = [
        createMockScoreRow({ date: '2026-03-14', total_score: 80 }),
        createMockScoreRow({ date: '2026-03-13', total_score: 70 }),
        createMockScoreRow({ date: '2026-03-12', total_score: 60 }),
      ];
      mockChain.order.mockResolvedValue({ data: rows, error: null });

      const result = await getWellnessHistory(mockSupabase as any, TEST_USER_ID, 7);

      expect(result).toHaveLength(3);
      expect(result[0].totalScore).toBe(80);
      expect(result[2].totalScore).toBe(60);
    });

    it('기본값으로 7일 조회한다', async () => {
      mockChain.order.mockResolvedValue({ data: [], error: null });

      await getWellnessHistory(mockSupabase as any, TEST_USER_ID);

      expect(mockChain.gte).toHaveBeenCalled();
    });

    it('에러 발생 시 빈 배열을 반환한다', async () => {
      mockChain.order.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      const result = await getWellnessHistory(mockSupabase as any, TEST_USER_ID);

      expect(result).toEqual([]);
    });

    it('데이터가 없으면 빈 배열을 반환한다', async () => {
      mockChain.order.mockResolvedValue({ data: [], error: null });

      const result = await getWellnessHistory(mockSupabase as any, TEST_USER_ID, 30);

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // getLatestWellnessScore
  // ============================================================
  describe('getLatestWellnessScore', () => {
    it('가장 최근 스코어를 반환한다', async () => {
      const row = createMockScoreRow({ total_score: 90 });
      mockChain.maybeSingle.mockResolvedValue({ data: row, error: null });

      const result = await getLatestWellnessScore(mockSupabase as any, TEST_USER_ID);

      expect(result).not.toBeNull();
      expect(result!.totalScore).toBe(90);
      expect(mockChain.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(mockChain.limit).toHaveBeenCalledWith(1);
    });

    it('스코어가 없으면 null을 반환한다', async () => {
      mockChain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await getLatestWellnessScore(mockSupabase as any, TEST_USER_ID);

      expect(result).toBeNull();
    });

    it('에러 발생 시 null을 반환한다', async () => {
      mockChain.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout' },
      });

      const result = await getLatestWellnessScore(mockSupabase as any, TEST_USER_ID);

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // getAverageWellnessScore
  // ============================================================
  describe('getAverageWellnessScore', () => {
    it('히스토리의 평균 점수를 계산한다', async () => {
      const rows = [
        createMockScoreRow({
          total_score: 80,
          workout_score: 20,
          nutrition_score: 20,
          skin_score: 20,
          body_score: 20,
        }),
        createMockScoreRow({
          total_score: 60,
          workout_score: 15,
          nutrition_score: 15,
          skin_score: 15,
          body_score: 15,
        }),
      ];
      mockChain.order.mockResolvedValue({ data: rows, error: null });

      const result = await getAverageWellnessScore(mockSupabase as any, TEST_USER_ID, 7);

      expect(result.totalScore).toBe(70); // (80+60)/2
      expect(result.workoutScore).toBe(18); // Math.round((20+15)/2)
      expect(result.count).toBe(2);
      expect(result.grade).toBe('B'); // 70점 = B등급
    });

    it('히스토리가 없으면 모든 점수 0과 F등급을 반환한다', async () => {
      mockChain.order.mockResolvedValue({ data: [], error: null });

      const result = await getAverageWellnessScore(mockSupabase as any, TEST_USER_ID);

      expect(result.totalScore).toBe(0);
      expect(result.workoutScore).toBe(0);
      expect(result.nutritionScore).toBe(0);
      expect(result.skinScore).toBe(0);
      expect(result.bodyScore).toBe(0);
      expect(result.grade).toBe('F');
      expect(result.count).toBe(0);
    });

    it('단일 기록의 평균은 해당 기록 값과 같다', async () => {
      const rows = [
        createMockScoreRow({
          total_score: 85,
          workout_score: 22,
          nutrition_score: 21,
          skin_score: 22,
          body_score: 20,
        }),
      ];
      mockChain.order.mockResolvedValue({ data: rows, error: null });

      const result = await getAverageWellnessScore(mockSupabase as any, TEST_USER_ID, 7);

      expect(result.totalScore).toBe(85);
      expect(result.count).toBe(1);
      expect(result.grade).toBe('A');
    });
  });

  // ============================================================
  // getWellnessTrend
  // ============================================================
  describe('getWellnessTrend', () => {
    it('주간 트렌드의 현재/이전 기간 평균을 계산한다', async () => {
      // 첫 번째 from 호출 (현재 기간)
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount <= 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: [{ total_score: 80 }, { total_score: 70 }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: [{ total_score: 60 }, { total_score: 50 }],
                  error: null,
                }),
              }),
            }),
          }),
        };
      });

      const result = await getWellnessTrend(mockSupabase as any, TEST_USER_ID, 'weekly');

      expect(result.current).toBe(75); // (80+70)/2
      expect(result.previous).toBe(55); // (60+50)/2
      expect(result.change).toBe(20); // 75-55
    });

    it('데이터가 없으면 모든 값 0을 반환한다', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }));

      const result = await getWellnessTrend(mockSupabase as any, TEST_USER_ID, 'weekly');

      expect(result.current).toBe(0);
      expect(result.previous).toBe(0);
      expect(result.change).toBe(0);
      expect(result.changePercent).toBe(0);
    });

    it('이전 기간 평균이 0이면 changePercent는 0이다', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount <= 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({
                    data: [{ total_score: 80 }],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        };
      });

      const result = await getWellnessTrend(mockSupabase as any, TEST_USER_ID);

      expect(result.changePercent).toBe(0);
    });

    it('월간 트렌드를 지원한다', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                data: [{ total_score: 70 }],
                error: null,
              }),
            }),
          }),
        }),
      }));

      const result = await getWellnessTrend(mockSupabase as any, TEST_USER_ID, 'monthly');

      // 30일 기간 사용 확인 (에러 없이 실행)
      expect(result.current).toBe(70);
    });
  });
});

describe('웰니스 스코어 저장 (mutations)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChain.select.mockReturnValue(mockChain);
    mockChain.insert.mockReturnValue(mockChain);
    mockChain.update.mockReturnValue(mockChain);
    mockChain.upsert.mockReturnValue(mockChain);
    mockChain.delete.mockReturnValue(mockChain);
    mockChain.eq.mockReturnValue(mockChain);
    mockChain.gte.mockReturnValue(mockChain);
    mockChain.lte.mockReturnValue(mockChain);
    mockChain.lt.mockReturnValue(mockChain);
    mockChain.order.mockReturnValue(mockChain);
    mockChain.limit.mockReturnValue(mockChain);
    mockSupabase.from.mockReturnValue(mockChain);
  });

  const mockBreakdown: ScoreBreakdown = {
    workout: { streak: 6, frequency: 8, goal: 4 },
    nutrition: { calorie: 8, balance: 7, water: 3 },
    skin: { analysis: 10, routine: 8, matching: 4 },
    body: { analysis: 8, progress: 5, workout: 2 },
  };

  // ============================================================
  // saveWellnessScore
  // ============================================================
  describe('saveWellnessScore', () => {
    it('스코어를 성공적으로 저장한다', async () => {
      mockChain.upsert.mockResolvedValue({ data: null, error: null });

      const result = await saveWellnessScore(
        mockSupabase as any,
        TEST_USER_ID,
        {
          totalScore: 75,
          workoutScore: 20,
          nutritionScore: 18,
          skinScore: 22,
          bodyScore: 15,
          scoreBreakdown: mockBreakdown,
        },
        '2026-03-14'
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('wellness_scores');
    });

    it('날짜를 지정하지 않으면 오늘 날짜를 사용한다', async () => {
      mockChain.upsert.mockResolvedValue({ data: null, error: null });

      await saveWellnessScore(mockSupabase as any, TEST_USER_ID, {
        totalScore: 75,
        workoutScore: 20,
        nutritionScore: 18,
        skinScore: 22,
        bodyScore: 15,
        scoreBreakdown: mockBreakdown,
      });

      // upsert가 호출됨 (날짜는 오늘)
      expect(mockChain.upsert).toHaveBeenCalled();
      const upsertArg = mockChain.upsert.mock.calls[0][0];
      const today = new Date().toISOString().split('T')[0];
      expect(upsertArg.date).toBe(today);
    });

    it('인사이트를 함께 저장할 수 있다', async () => {
      mockChain.upsert.mockResolvedValue({ data: null, error: null });

      const insights = [
        { type: 'achievement' as const, area: 'workout' as const, message: '7일 연속 운동!' },
      ];

      await saveWellnessScore(mockSupabase as any, TEST_USER_ID, {
        totalScore: 75,
        workoutScore: 20,
        nutritionScore: 18,
        skinScore: 22,
        bodyScore: 15,
        scoreBreakdown: mockBreakdown,
        insights,
      });

      const upsertArg = mockChain.upsert.mock.calls[0][0];
      expect(upsertArg.insights).toEqual(insights);
    });

    it('인사이트가 없으면 빈 배열로 저장한다', async () => {
      mockChain.upsert.mockResolvedValue({ data: null, error: null });

      await saveWellnessScore(mockSupabase as any, TEST_USER_ID, {
        totalScore: 75,
        workoutScore: 20,
        nutritionScore: 18,
        skinScore: 22,
        bodyScore: 15,
        scoreBreakdown: mockBreakdown,
      });

      const upsertArg = mockChain.upsert.mock.calls[0][0];
      expect(upsertArg.insights).toEqual([]);
    });

    it('DB 에러 시 실패 결과를 반환한다', async () => {
      mockChain.upsert.mockResolvedValue({
        data: null,
        error: { message: 'Unique constraint violation' },
      });

      const result = await saveWellnessScore(
        mockSupabase as any,
        TEST_USER_ID,
        {
          totalScore: 75,
          workoutScore: 20,
          nutritionScore: 18,
          skinScore: 22,
          bodyScore: 15,
          scoreBreakdown: mockBreakdown,
        },
        '2026-03-14'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unique constraint violation');
    });

    it('onConflict 옵션을 clerk_user_id,date로 설정한다', async () => {
      mockChain.upsert.mockResolvedValue({ data: null, error: null });

      await saveWellnessScore(mockSupabase as any, TEST_USER_ID, {
        totalScore: 75,
        workoutScore: 20,
        nutritionScore: 18,
        skinScore: 22,
        bodyScore: 15,
        scoreBreakdown: mockBreakdown,
      });

      const upsertOptions = mockChain.upsert.mock.calls[0][1];
      expect(upsertOptions).toEqual({ onConflict: 'clerk_user_id,date' });
    });
  });

  // ============================================================
  // updateWellnessInsights
  // ============================================================
  describe('updateWellnessInsights', () => {
    it('인사이트를 성공적으로 업데이트한다', async () => {
      // update().eq('clerk_user_id').eq('date') 체이닝: 두 번째 eq가 terminal
      mockChain.eq
        .mockReturnValueOnce(mockChain) // .eq('clerk_user_id', ...)
        .mockResolvedValueOnce({ data: null, error: null }); // .eq('date', ...)

      const insights = [
        { type: 'tip' as const, area: 'nutrition' as const, message: '수분 섭취를 늘려보세요' },
      ];

      const result = await updateWellnessInsights(
        mockSupabase as any,
        TEST_USER_ID,
        insights,
        '2026-03-14'
      );

      expect(result.success).toBe(true);
      expect(mockChain.update).toHaveBeenCalled();
    });

    it('날짜를 지정하지 않으면 오늘 날짜를 사용한다', async () => {
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: null, error: null });

      await updateWellnessInsights(mockSupabase as any, TEST_USER_ID, []);

      const today = new Date().toISOString().split('T')[0];
      expect(mockChain.eq).toHaveBeenCalledWith('date', today);
    });

    it('에러 발생 시 실패 결과를 반환한다', async () => {
      mockChain.eq.mockReturnValueOnce(mockChain).mockResolvedValueOnce({
        data: null,
        error: { message: 'Record not found' },
      });

      const result = await updateWellnessInsights(
        mockSupabase as any,
        TEST_USER_ID,
        [],
        '2026-03-14'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Record not found');
    });
  });

  // ============================================================
  // deleteWellnessScore
  // ============================================================
  describe('deleteWellnessScore', () => {
    it('스코어를 성공적으로 삭제한다', async () => {
      // delete().eq('clerk_user_id').eq('date') 체이닝
      mockChain.eq
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce({ data: null, error: null });

      const result = await deleteWellnessScore(mockSupabase as any, TEST_USER_ID, '2026-03-14');

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('wellness_scores');
      expect(mockChain.delete).toHaveBeenCalled();
    });

    it('에러 발생 시 실패 결과를 반환한다', async () => {
      mockChain.eq.mockReturnValueOnce(mockChain).mockResolvedValueOnce({
        data: null,
        error: { message: 'Permission denied' },
      });

      const result = await deleteWellnessScore(mockSupabase as any, TEST_USER_ID, '2026-03-14');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  // ============================================================
  // cleanupOldWellnessScores
  // ============================================================
  describe('cleanupOldWellnessScores', () => {
    it('90일 이상 된 스코어를 삭제하고 삭제 수를 반환한다', async () => {
      mockChain.select.mockResolvedValue({
        data: [{ id: '1' }, { id: '2' }, { id: '3' }],
        error: null,
      });

      const result = await cleanupOldWellnessScores(mockSupabase as any, TEST_USER_ID);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);
      expect(mockChain.lt).toHaveBeenCalled();
    });

    it('커스텀 보존 기간을 지정할 수 있다', async () => {
      mockChain.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await cleanupOldWellnessScores(mockSupabase as any, TEST_USER_ID, 30);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
    });

    it('삭제할 데이터가 없으면 deletedCount 0을 반환한다', async () => {
      mockChain.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await cleanupOldWellnessScores(mockSupabase as any, TEST_USER_ID);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
    });

    it('data가 null이면 deletedCount 0을 반환한다', async () => {
      mockChain.select.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await cleanupOldWellnessScores(mockSupabase as any, TEST_USER_ID);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
    });

    it('에러 발생 시 실패 결과를 반환한다', async () => {
      mockChain.select.mockResolvedValue({
        data: null,
        error: { message: 'Timeout' },
      });

      const result = await cleanupOldWellnessScores(mockSupabase as any, TEST_USER_ID);

      expect(result.success).toBe(false);
      expect(result.deletedCount).toBe(0);
      expect(result.error).toBe('Timeout');
    });
  });
});
