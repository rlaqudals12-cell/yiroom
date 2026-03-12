/**
 * useFaceLandmarker 훅 테스트
 *
 * @description 클라이언트 MediaPipe 통합 훅 검증
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFaceLandmarker } from '@/hooks/useFaceLandmarker';

// MediaPipe 로더를 mock (테스트 환경에서 WASM 로드 불가)
vi.mock('@/lib/image-engine/cie-2/mediapipe-loader', () => ({
  canUseMediaPipe: vi.fn().mockReturnValue(false),
  loadFaceLandmarker: vi.fn().mockResolvedValue(null),
  detectFaceLandmarks: vi.fn().mockResolvedValue(null),
}));

describe('useFaceLandmarker', () => {
  it('should start with isLoading true', () => {
    const { result } = renderHook(() => useFaceLandmarker());

    // 초기 상태: 로딩 중
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should resolve to not ready when MediaPipe unavailable', async () => {
    const { result } = renderHook(() => useFaceLandmarker());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // canUseMediaPipe() = false → isReady = false
    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return null from detect when not ready', async () => {
    const { result } = renderHook(() => useFaceLandmarker());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const imageData = new ImageData(100, 100);
    const detected = await result.current.detect(imageData);
    expect(detected).toBeNull();
  });

  it('should provide stable detect function reference', async () => {
    const { result, rerender } = renderHook(() => useFaceLandmarker());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const detect1 = result.current.detect;
    rerender();
    const detect2 = result.current.detect;

    // isReady가 변하지 않으면 detect 참조도 동일
    expect(detect1).toBe(detect2);
  });
});

describe('useFaceLandmarker with available MediaPipe', () => {
  it('should become ready when MediaPipe loads successfully', async () => {
    // 이 테스트에서만 mock 오버라이드
    const loaderModule = await import('@/lib/image-engine/cie-2/mediapipe-loader');
    vi.mocked(loaderModule.canUseMediaPipe).mockReturnValue(true);
    vi.mocked(loaderModule.loadFaceLandmarker).mockResolvedValue({
      detect: vi.fn(),
      close: vi.fn(),
    });

    const { result } = renderHook(() => useFaceLandmarker());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isReady).toBe(true);
    expect(result.current.error).toBeNull();

    // 복원
    vi.mocked(loaderModule.canUseMediaPipe).mockReturnValue(false);
    vi.mocked(loaderModule.loadFaceLandmarker).mockResolvedValue(null);
  });
});
