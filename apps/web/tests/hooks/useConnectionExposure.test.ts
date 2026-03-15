import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockUseUser, mockSupabaseFrom, mockExposeConnection, mockConfirmConnection } = vi.hoisted(
  () => ({
    mockUseUser: vi.fn(),
    mockSupabaseFrom: vi.fn(),
    mockExposeConnection: vi.fn(),
    mockConfirmConnection: vi.fn(),
  })
);

vi.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
}));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: mockSupabaseFrom }),
}));

vi.mock('@/lib/connection-awareness', () => ({
  exposeConnection: (...args: unknown[]) => mockExposeConnection(...args),
  confirmConnection: (...args: unknown[]) => mockConfirmConnection(...args),
  getExplanationDepth: (status: string) => {
    if (status === 'exposed') return 'full';
    if (status === 'confirmed') return 'summary';
    return 'minimal';
  },
}));

import { useConnectionExposure } from '@/hooks/useConnectionExposure';
import type { ExposeRequest } from '@/lib/connection-awareness';

const mockRequest: ExposeRequest = {
  connectionId: 'skin_care::personal_color_skin',
  sourceModule: 'skin',
  targetDomain: 'personal-color',
  connectionRule: '피부 분석 + 퍼스널컬러 기반 — 스킨케어 추천',
};

describe('useConnectionExposure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('사용자 없을 때 기본 상태를 반환한다', () => {
    mockUseUser.mockReturnValue({ user: null });

    const { result } = renderHook(() => useConnectionExposure(mockRequest));

    expect(result.current.status).toBe('exposed');
    expect(result.current.depth).toBe('full');
    expect(result.current.isConfirmed).toBe(false);
    expect(result.current.exposureCount).toBe(0);
  });

  it('confirm 함수가 반환된다', () => {
    mockUseUser.mockReturnValue({ user: null });

    const { result } = renderHook(() => useConnectionExposure(mockRequest));

    expect(result.current.confirm).toBeInstanceOf(Function);
  });

  it('사용자 없으면 confirm이 무시된다', async () => {
    mockUseUser.mockReturnValue({ user: null });

    const { result } = renderHook(() => useConnectionExposure(mockRequest));

    await act(async () => {
      await result.current.confirm();
    });

    expect(mockConfirmConnection).not.toHaveBeenCalled();
  });

  it('사용자가 있으면 마운트 시 exposeConnection 호출된다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' } });
    mockExposeConnection.mockResolvedValue({
      status: 'exposed',
      exposureCount: 1,
    });

    const { result } = renderHook(() => useConnectionExposure(mockRequest));

    await vi.waitFor(() => {
      expect(result.current.exposureCount).toBe(1);
    });

    expect(mockExposeConnection).toHaveBeenCalled();
  });

  it('confirm 호출 시 confirmConnection이 실행된다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' } });
    mockExposeConnection.mockResolvedValue({ status: 'exposed', exposureCount: 1 });
    mockConfirmConnection.mockResolvedValue({ status: 'confirmed' });

    const { result } = renderHook(() => useConnectionExposure(mockRequest));

    await vi.waitFor(() => {
      expect(mockExposeConnection).toHaveBeenCalled();
    });

    await act(async () => {
      await result.current.confirm();
    });

    expect(mockConfirmConnection).toHaveBeenCalledWith(
      expect.anything(),
      'user_123',
      'skin_care::personal_color_skin'
    );
    expect(result.current.isConfirmed).toBe(true);
    expect(result.current.status).toBe('confirmed');
  });
});
