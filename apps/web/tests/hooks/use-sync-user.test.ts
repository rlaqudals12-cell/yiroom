/**
 * useSyncUser 훅 테스트
 * @description Clerk 사용자를 Supabase에 동기화하는 훅
 *
 * 회귀 방지(2026-08 외부 리뷰 #7): 이 동기화는 `users` 행을 만드는 **선행조건**이고,
 * 생체분석 라우트의 연령 게이트는 fail-closed다. 1회 시도 후 영구 포기하면
 * 순간 장애 한 번에 성인 사용자도 분석 전체가 403으로 막혔다.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Clerk useAuth 모킹
const mockUseAuth = vi.fn();
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => mockUseAuth(),
}));

// console.error 모킹
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// fetch 모킹 - 테스트 전에 설정
const mockFetch = vi.fn();

describe('useSyncUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockConsoleError.mockClear();

    // 매 테스트마다 fetch 모킹
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.resetModules();
  });

  // 동적 import를 사용하여 훅 로드
  const loadHook = async () => {
    const hookModule = await import('@/hooks/use-sync-user');
    return hookModule.useSyncUser;
  };

  describe('로딩 상태', () => {
    it('isLoaded가 false면 동기화하지 않는다', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: false,
        userId: null,
      });

      const useSyncUser = await loadHook();
      renderHook(() => useSyncUser());

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('isLoaded가 true지만 userId가 없으면 동기화하지 않는다', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        userId: null,
      });

      const useSyncUser = await loadHook();
      renderHook(() => useSyncUser());

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('동기화 실행', () => {
    it('isLoaded가 true이고 userId가 있으면 동기화를 실행한다', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        userId: 'user_123',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const useSyncUser = await loadHook();
      const { result } = renderHook(() => useSyncUser());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/sync-user', {
        method: 'POST',
      });
      await waitFor(() => expect(result.current.isSynced).toBe(true));
      expect(result.current.hasFailed).toBe(false);
    });

    it('동기화 성공 후 다시 호출하지 않는다', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        userId: 'user_123',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const useSyncUser = await loadHook();
      const { rerender } = renderHook(() => useSyncUser());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // 리렌더 트리거
      rerender();

      // 짧은 지연 후에도 여전히 1번만 호출
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('유한 재시도', () => {
    it('네트워크 실패는 재시도하고, 성공하면 동기화를 완료한다', async () => {
      mockUseAuth.mockReturnValue({ isLoaded: true, userId: 'user_123' });

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

      const useSyncUser = await loadHook();
      const { result } = renderHook(() => useSyncUser());

      await waitFor(() => expect(result.current.isSynced).toBe(true), { timeout: 3000 });
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.hasFailed).toBe(false);
    });

    it('5xx는 재시도하고, 모두 실패하면 3회에서 멈춘 뒤 실패를 노출한다', async () => {
      mockUseAuth.mockReturnValue({ isLoaded: true, userId: 'user_123' });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const useSyncUser = await loadHook();
      const { result } = renderHook(() => useSyncUser());

      await waitFor(() => expect(result.current.hasFailed).toBe(true), { timeout: 5000 });
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.current.isSynced).toBe(false);
    });

    it('4xx는 반복해도 같은 결과이므로 재시도하지 않는다', async () => {
      mockUseAuth.mockReturnValue({ isLoaded: true, userId: 'user_123' });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const useSyncUser = await loadHook();
      const { result } = renderHook(() => useSyncUser());

      await waitFor(() => expect(result.current.hasFailed).toBe(true), { timeout: 3000 });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('실패 후 retry()로 다시 시도할 수 있다', async () => {
      mockUseAuth.mockReturnValue({ isLoaded: true, userId: 'user_123' });

      mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' });

      const useSyncUser = await loadHook();
      const { result } = renderHook(() => useSyncUser());

      await waitFor(() => expect(result.current.hasFailed).toBe(true), { timeout: 3000 });

      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
      act(() => result.current.retry());

      await waitFor(() => expect(result.current.isSynced).toBe(true), { timeout: 3000 });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('에러 처리', () => {
    it('응답이 ok가 아니면 에러를 로그한다', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        userId: 'user_123',
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const useSyncUser = await loadHook();
      renderHook(() => useSyncUser());

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Failed to sync user:', 'Unauthorized');
      });
    });

    it('fetch가 실패하면 에러를 로그한다', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        userId: 'user_123',
      });

      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const useSyncUser = await loadHook();
      renderHook(() => useSyncUser());

      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error syncing user:', networkError);
      });
    });

    it('에러 발생 후에도 앱은 정상 동작한다', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        userId: 'user_123',
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      const useSyncUser = await loadHook();

      // 에러가 발생해도 훅은 정상적으로 실행 완료
      expect(() => {
        renderHook(() => useSyncUser());
      }).not.toThrow();
    });
  });

  describe('상태 변경', () => {
    it('로그아웃 후 재로그인 시 새로운 훅 인스턴스에서 동기화', async () => {
      // 첫 번째 로그인
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        userId: 'user_123',
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      const useSyncUser = await loadHook();
      const { unmount } = renderHook(() => useSyncUser());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // 언마운트 (페이지 이동 또는 로그아웃 시뮬레이션)
      unmount();

      // 모듈 리셋으로 새 인스턴스 시뮬레이션
      vi.resetModules();

      // 새로운 훅 인스턴스 로드
      const useSyncUser2 = await loadHook();
      renderHook(() => useSyncUser2());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
