import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';

// Mock dependencies
const mockUser = { id: 'test-user-id' };
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(() => ({ user: mockUser, isLoaded: true })),
}));

const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
};

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => mockSupabaseClient,
}));

describe('useAnalysisStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.limit.mockResolvedValue({ data: [], error: null });
  });

  it('초기 로딩 상태를 반환한다', async () => {
    const { result } = renderHook(() => useAnalysisStatus());

    // 처음에는 로딩 상태
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('분석 데이터가 없으면 isNewUser가 true', async () => {
    const { result } = renderHook(() => useAnalysisStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isNewUser).toBe(true);
    expect(result.current.analysisCount).toBe(0);
    expect(result.current.analyses).toHaveLength(0);
  });

  it('hasPersonalColor 플래그가 정확히 설정된다', async () => {
    // 퍼스널 컬러가 없는 경우
    mockSupabaseClient.limit.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useAnalysisStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPersonalColor).toBe(false);
  });

  it('hasSkin, hasBody, hasHair, hasMakeup 플래그가 존재한다', async () => {
    const { result } = renderHook(() => useAnalysisStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toHaveProperty('hasSkin');
    expect(result.current).toHaveProperty('hasBody');
    expect(result.current).toHaveProperty('hasHair');
    expect(result.current).toHaveProperty('hasMakeup');
  });

  it('analysisCount가 analyses 배열 길이와 일치한다', async () => {
    const { result } = renderHook(() => useAnalysisStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.analysisCount).toBe(result.current.analyses.length);
  });

  it('사용자 상태 판단 플래그가 정확하다', async () => {
    const { result } = renderHook(() => useAnalysisStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 분석 0개 → isNewUser = true
    expect(result.current.isNewUser).toBe(true);
    expect(result.current.isPartialUser).toBe(false);
    expect(result.current.isActiveUser).toBe(false);
  });
});
