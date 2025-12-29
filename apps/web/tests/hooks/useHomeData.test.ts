/**
 * useHomeData 훅 테스트
 * @description 홈 페이지 데이터 훅
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Clerk useUser 모킹
const mockUseUser = vi.fn();
vi.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
}));

// Supabase 클라이언트 모킹
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => mockSupabaseClient,
}));

describe('useHomeData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.gte.mockReturnThis();
    mockSupabaseClient.lte.mockReturnThis();
  });

  const loadHook = async () => {
    const hookModule = await import('@/hooks/useHomeData');
    return hookModule.useHomeData;
  };

  describe('초기 상태', () => {
    it('유저가 없으면 로딩 완료 후 null 반환', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: null,
      });

      const useHomeData = await loadHook();
      const { result } = renderHook(() => useHomeData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(null);
    });
  });

  describe('데이터 로드', () => {
    it('사용자 홈 데이터를 로드한다', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: {
          id: 'user_123',
          firstName: '테스터',
          username: 'tester',
        },
      });

      // Supabase 응답 모킹 - Promise.all 순서대로
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: { total_calories: 1500, target_calories: 2000 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { cups: 5 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { rank: 15, previous_rank: 20 },
          error: null,
        });

      // 운동 로그는 배열로 반환
      mockSupabaseClient.lte.mockResolvedValueOnce({
        data: [{ duration_minutes: 20 }, { duration_minutes: 15 }],
        error: null,
      });

      const useHomeData = await loadHook();
      const { result } = renderHook(() => useHomeData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).not.toBe(null);
      expect(result.current.data?.userName).toBe('테스터');
      expect(result.current.data?.recordSummary.calories.current).toBe(1500);
      expect(result.current.data?.recordSummary.calories.target).toBe(2000);
      expect(result.current.data?.recordSummary.water.cups).toBe(5);
      expect(result.current.data?.rankInfo.rank).toBe(15);
      expect(result.current.data?.rankInfo.change).toBe(5); // 20 - 15 = 5 (상승)
    });

    it('미션 완료 수를 올바르게 계산한다', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: {
          id: 'user_123',
          firstName: null,
          username: 'user',
        },
      });

      // 물 8잔 달성, 운동 30분 이상
      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: { total_calories: 2100, target_calories: 2000 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { cups: 8 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { rank: 1, previous_rank: 1 },
          error: null,
        });

      mockSupabaseClient.lte.mockResolvedValueOnce({
        data: [{ duration_minutes: 35 }],
        error: null,
      });

      const useHomeData = await loadHook();
      const { result } = renderHook(() => useHomeData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 물 8잔, 30분 운동, 식사 기록, 칼로리 달성 = 4개 완료
      expect(result.current.data?.missionsCompleted).toBe(4);
      expect(result.current.data?.missionsTotal).toBe(5);
    });

    it('데이터 없으면 기본값 사용', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: {
          id: 'user_123',
          firstName: null,
          username: null,
        },
      });

      // 모든 데이터 없음
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      mockSupabaseClient.lte.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const useHomeData = await loadHook();
      const { result } = renderHook(() => useHomeData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.userName).toBe('사용자');
      expect(result.current.data?.recordSummary.calories.current).toBe(0);
      expect(result.current.data?.recordSummary.water.cups).toBe(0);
      expect(result.current.data?.recordSummary.workout.minutes).toBe(0);
    });
  });

  describe('에러 처리', () => {
    it('에러 발생 시 error 상태 설정', async () => {
      mockUseUser.mockReturnValue({
        isLoaded: true,
        user: { id: 'user_123', firstName: 'Test' },
      });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockSupabaseClient.single.mockRejectedValue(new Error('Database error'));

      const useHomeData = await loadHook();
      const { result } = renderHook(() => useHomeData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Database error');

      consoleError.mockRestore();
    });
  });
});
