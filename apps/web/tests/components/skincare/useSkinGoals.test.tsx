/**
 * useSkinGoals — 목표 저장/롤백 (ADR-117 루틴 v2)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: toastError } }));

import { useSkinGoals } from '@/components/skincare/useSkinGoals';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('useSkinGoals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('마운트 시 GET으로 초기 선택을 로드한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ goals: ['hydration'] }) });
    const { result } = renderHook(() => useSkinGoals());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.selected).toContain('hydration');
  });

  it('토글 성공 시 선택을 유지하고 토스트를 띄우지 않는다', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ goals: [] }) }) // GET
      .mockResolvedValueOnce({ ok: true }); // PATCH
    const { result } = renderHook(() => useSkinGoals());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggle('acne'));
    expect(result.current.selected).toContain('acne'); // 낙관적 반영

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/user/skin-goals',
        expect.objectContaining({ method: 'PATCH' })
      )
    );
    expect(toastError).not.toHaveBeenCalled();
    expect(result.current.selected).toContain('acne');
  });

  it('토글 저장 실패 시 롤백하고 토스트를 띄운다', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ goals: [] }) }) // GET
      .mockResolvedValueOnce({ ok: false }); // PATCH 실패
    const { result } = renderHook(() => useSkinGoals());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggle('sebum'));
    expect(result.current.selected).toContain('sebum'); // 낙관적 반영

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(result.current.selected).not.toContain('sebum'); // 롤백
  });
});
