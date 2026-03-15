import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const { mockUseUser } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
}));

vi.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
}));

// fetch를 전역 mock
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { useExperiment } from '@/hooks/useExperiment';

describe('useExperiment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          assignment: {
            variantId: 'v1',
            variantName: 'treatment',
            config: { buttonColor: 'blue' },
          },
        }),
    });
  });

  it('로딩 중 defaultVariant를 반환한다', () => {
    mockUseUser.mockReturnValue({ user: null, isLoaded: false });

    const { result } = renderHook(() =>
      useExperiment({ experimentKey: 'test_exp', defaultVariant: 'control' })
    );

    expect(result.current.variant).toBe('control');
    expect(result.current.isLoading).toBe(true);
  });

  it('trackExposure 함수가 반환된다', () => {
    mockUseUser.mockReturnValue({ user: null, isLoaded: false });

    const { result } = renderHook(() => useExperiment({ experimentKey: 'test_exp' }));

    expect(result.current.trackExposure).toBeInstanceOf(Function);
  });

  it('사용자 로드 후 API를 호출한다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });

    const { result } = renderHook(() => useExperiment({ experimentKey: 'test_exp' }));

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/experiments/assign', expect.anything());
    expect(result.current.variant).toBe('treatment');
    expect(result.current.config).toEqual({ buttonColor: 'blue' });
  });

  it('API 실패 시 에러를 설정한다', async () => {
    mockUseUser.mockReturnValue({ user: { id: 'user_123' }, isLoaded: true });
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useExperiment({ experimentKey: 'test_exp' }));

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.variant).toBeNull();
  });

  it('기본 config는 빈 객체이다', () => {
    mockUseUser.mockReturnValue({ user: null, isLoaded: false });

    const { result } = renderHook(() => useExperiment({ experimentKey: 'test_exp' }));

    expect(result.current.config).toEqual({});
  });
});
