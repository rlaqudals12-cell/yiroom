import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOutfitShare } from '@/hooks/useOutfitShare';

// html-to-image 동적 import를 mock할 필요 없이, cardRef가 없는 경우만 테스트
describe('useOutfitShare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useOutfitShare(null, null));
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('cardRef가 반환된다', () => {
    const { result } = renderHook(() => useOutfitShare(null, null));
    expect(result.current.cardRef).toBeDefined();
    expect(result.current.cardRef.current).toBeNull();
  });

  it('canShare는 boolean이다', () => {
    const { result } = renderHook(() => useOutfitShare(null, null));
    expect(typeof result.current.canShare).toBe('boolean');
  });

  it('함수들이 반환된다', () => {
    const { result } = renderHook(() => useOutfitShare(null, null));
    expect(result.current.generateImage).toBeInstanceOf(Function);
    expect(result.current.shareOutfit).toBeInstanceOf(Function);
    expect(result.current.downloadImage).toBeInstanceOf(Function);
    expect(result.current.copyToClipboard).toBeInstanceOf(Function);
  });

  it('cardRef가 없으면 generateImage가 null을 반환하고 에러를 설정한다', async () => {
    const { result } = renderHook(() => useOutfitShare(null, null));

    let imageUrl: string | null = 'not-null';
    await act(async () => {
      imageUrl = await result.current.generateImage();
    });

    expect(imageUrl).toBeNull();
    expect(result.current.error).toBe('카드 요소를 찾을 수 없습니다');
  });
});
