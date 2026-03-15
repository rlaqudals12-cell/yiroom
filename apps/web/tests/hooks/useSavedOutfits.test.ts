import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// fetch를 전역 mock
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { useSavedOutfits } from '@/hooks/useSavedOutfits';

describe('useSavedOutfits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useSavedOutfits());

    expect(result.current.savedOutfits).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.totalCount).toBe(0);
    expect(result.current.hasMore).toBe(false);
  });

  it('함수들이 반환된다', () => {
    const { result } = renderHook(() => useSavedOutfits());

    expect(result.current.fetchSavedOutfits).toBeInstanceOf(Function);
    expect(result.current.loadMore).toBeInstanceOf(Function);
    expect(result.current.saveOutfit).toBeInstanceOf(Function);
    expect(result.current.deleteOutfit).toBeInstanceOf(Function);
    expect(result.current.isOutfitSaved).toBeInstanceOf(Function);
    expect(result.current.toggleSaveOutfit).toBeInstanceOf(Function);
  });

  it('isOutfitSaved가 false를 반환한다 (빈 목록)', () => {
    const { result } = renderHook(() => useSavedOutfits());

    expect(result.current.isOutfitSaved('outfit_1')).toBe(false);
  });

  it('fetchSavedOutfits가 API를 호출한다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              id: '1',
              outfitId: 'outfit_1',
              savedAt: '2026-01-01T00:00:00Z',
            },
          ],
          count: 1,
        }),
    });

    const { result } = renderHook(() => useSavedOutfits());

    await act(async () => {
      await result.current.fetchSavedOutfits();
    });

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/outfits'));
    expect(result.current.savedOutfits).toHaveLength(1);
    expect(result.current.totalCount).toBe(1);
  });

  it('fetchSavedOutfits 실패 시 에러를 설정한다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useSavedOutfits());

    await act(async () => {
      await result.current.fetchSavedOutfits();
    });

    expect(result.current.error).not.toBeNull();
  });

  it('deleteOutfit이 API를 호출하고 목록에서 제거한다', async () => {
    // 먼저 목록에 데이터 로드
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ id: '1', outfitId: 'outfit_1', savedAt: '2026-01-01T00:00:00Z' }],
          count: 1,
        }),
    });

    const { result } = renderHook(() => useSavedOutfits());

    await act(async () => {
      await result.current.fetchSavedOutfits();
    });
    expect(result.current.savedOutfits).toHaveLength(1);

    // 삭제
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    let deleted = false;
    await act(async () => {
      deleted = await result.current.deleteOutfit('outfit_1');
    });

    expect(deleted).toBe(true);
    expect(result.current.savedOutfits).toHaveLength(0);
  });

  it('autoFetch=true 시 자동 조회한다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [], count: 0 }),
    });

    renderHook(() => useSavedOutfits({ autoFetch: true }));

    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
