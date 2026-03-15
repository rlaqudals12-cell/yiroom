import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockCaptureElementAsImage, mockCaptureElementAsDataUrl } = vi.hoisted(() => ({
  mockCaptureElementAsImage: vi.fn(),
  mockCaptureElementAsDataUrl: vi.fn(),
}));

vi.mock('@/lib/share', () => ({
  captureElementAsImage: (...args: unknown[]) => mockCaptureElementAsImage(...args),
  captureElementAsDataUrl: (...args: unknown[]) => mockCaptureElementAsDataUrl(...args),
}));

import { useShareCardCapture } from '@/hooks/useShareCardCapture';

describe('useShareCardCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('초기 상태가 올바르다', () => {
    const { result } = renderHook(() => useShareCardCapture());
    expect(result.current.isCapturing).toBe(false);
    expect(result.current.cardRef.current).toBeNull();
  });

  it('cardRef가 반환된다', () => {
    const { result } = renderHook(() => useShareCardCapture());
    expect(result.current.cardRef).toBeDefined();
  });

  it('ref가 없으면 captureAsBlob이 null을 반환한다', async () => {
    const { result } = renderHook(() => useShareCardCapture());

    let blob: Blob | null = null;
    await act(async () => {
      blob = await result.current.captureAsBlob();
    });

    expect(blob).toBeNull();
    expect(mockCaptureElementAsImage).not.toHaveBeenCalled();
  });

  it('ref가 없으면 captureAsDataUrl이 null을 반환한다', async () => {
    const { result } = renderHook(() => useShareCardCapture());

    let url: string | null = null;
    await act(async () => {
      url = await result.current.captureAsDataUrl();
    });

    expect(url).toBeNull();
    expect(mockCaptureElementAsDataUrl).not.toHaveBeenCalled();
  });

  it('ref가 있으면 captureAsBlob이 캡처를 실행한다', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockCaptureElementAsImage.mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useShareCardCapture());
    const div = document.createElement('div');
    Object.defineProperty(result.current.cardRef, 'current', { value: div, writable: true });

    let blob: Blob | null = null;
    await act(async () => {
      blob = await result.current.captureAsBlob();
    });

    expect(blob).toBe(mockBlob);
    expect(mockCaptureElementAsImage).toHaveBeenCalledWith(div);
  });

  it('ref가 있으면 captureAsDataUrl이 캡처를 실행한다', async () => {
    mockCaptureElementAsDataUrl.mockResolvedValue('data:image/png;base64,abc');

    const { result } = renderHook(() => useShareCardCapture());
    const div = document.createElement('div');
    Object.defineProperty(result.current.cardRef, 'current', { value: div, writable: true });

    let url: string | null = null;
    await act(async () => {
      url = await result.current.captureAsDataUrl();
    });

    expect(url).toBe('data:image/png;base64,abc');
    expect(mockCaptureElementAsDataUrl).toHaveBeenCalledWith(div);
  });
});
