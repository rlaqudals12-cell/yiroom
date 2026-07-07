import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// 외부 의존성 모킹 (vi.hoisted로 hoisting 안전하게 처리)
const { mockCaptureElementAsImage, mockShareImage, mockToast } = vi.hoisted(() => ({
  mockCaptureElementAsImage: vi.fn(),
  mockShareImage: vi.fn(),
  mockToast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/lib/share', () => ({
  captureElementAsImage: (...args: unknown[]) => mockCaptureElementAsImage(...args),
  shareImage: (...args: unknown[]) => mockShareImage(...args),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

// 현행 훅은 next-intl 키(share.*)를 사용 — setup.ts의 "키 그대로 반환" mock 대신
// 실제 한국어 메시지(ko.json)로 해석해 사용자 대면 텍스트 기준 검증을 유지한다.
vi.mock('next-intl', async () => {
  const ko = (await import('@/messages/ko.json')).default as Record<string, unknown>;
  const resolve = (
    ns: string | undefined,
    key: string,
    values?: Record<string, unknown>
  ): string => {
    const path = ns ? `${ns}.${key}` : key;
    const value = path
      .split('.')
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown> | undefined)?.[part], ko);
    if (typeof value !== 'string') return key;
    // {title} 등 ICU 단순 변수 보간
    return value.replace(/\{(\w+)\}/g, (_, name) => String(values?.[name] ?? `{${name}}`));
  };
  return {
    useTranslations:
      (ns?: string) =>
      (key: string, values?: Record<string, unknown>): string =>
        resolve(ns, key, values),
    useLocale: () => 'ko',
    useMessages: () => ko,
    useNow: () => new Date(),
    useTimeZone: () => 'Asia/Seoul',
    useFormatter: () => ({
      number: (n: number) => String(n),
      dateTime: (d: Date) => d.toISOString(),
      relativeTime: (d: Date) => d.toISOString(),
    }),
    NextIntlClientProvider: ({ children }: { children?: unknown }) => children,
  };
});

import { useShare } from '@/hooks/useShare';

describe('useShare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('초기 loading은 false이다', () => {
    const { result } = renderHook(() => useShare('테스트'));
    expect(result.current.loading).toBe(false);
  });

  it('ref가 반환된다', () => {
    const { result } = renderHook(() => useShare('테스트'));
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('ref가 없으면 에러 토스트를 표시한다', async () => {
    const { result } = renderHook(() => useShare('테스트'));

    await act(async () => {
      await result.current.share();
    });

    // 현행 카피: share.sharePrepareFailed
    expect(mockToast.error).toHaveBeenCalledWith('공유 준비 중 오류가 발생했습니다');
    expect(mockCaptureElementAsImage).not.toHaveBeenCalled();
  });

  it('캡처 결과가 null이면 에러 토스트를 표시한다', async () => {
    mockCaptureElementAsImage.mockResolvedValue(null);

    const { result } = renderHook(() => useShare('테스트'));
    // ref에 요소 연결
    const div = document.createElement('div');
    Object.defineProperty(result.current.ref, 'current', { value: div, writable: true });

    await act(async () => {
      await result.current.share();
    });

    // 현행 카피: share.imageFailed
    expect(mockToast.error).toHaveBeenCalledWith('이미지 저장에 실패했습니다');
  });

  it('캡처 성공 후 shareImage를 호출한다', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockCaptureElementAsImage.mockResolvedValue(mockBlob);
    mockShareImage.mockResolvedValue(true);

    const { result } = renderHook(() => useShare('분석 결과'));
    const div = document.createElement('div');
    Object.defineProperty(result.current.ref, 'current', { value: div, writable: true });

    await act(async () => {
      await result.current.share();
    });

    expect(mockShareImage).toHaveBeenCalledWith(
      mockBlob,
      '분석 결과',
      '분석 결과 - 이룸에서 확인하세요!'
    );
  });

  it('Web Share API가 없으면 성공 토스트를 표시한다', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockCaptureElementAsImage.mockResolvedValue(mockBlob);
    mockShareImage.mockResolvedValue(true);

    // navigator.share 없음
    const originalShare = navigator.share;
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });

    const { result } = renderHook(() => useShare('테스트'));
    const div = document.createElement('div');
    Object.defineProperty(result.current.ref, 'current', { value: div, writable: true });

    await act(async () => {
      await result.current.share();
    });

    // 현행 카피: share.imageSaved
    expect(mockToast.success).toHaveBeenCalledWith(
      '이미지가 저장되었습니다. Instagram에서 공유해주세요!'
    );

    // 복원
    Object.defineProperty(navigator, 'share', { value: originalShare, configurable: true });
  });

  it('예외 발생 시 에러 토스트를 표시한다', async () => {
    mockCaptureElementAsImage.mockRejectedValue(new Error('캡처 실패'));

    const { result } = renderHook(() => useShare('테스트'));
    const div = document.createElement('div');
    Object.defineProperty(result.current.ref, 'current', { value: div, writable: true });

    await act(async () => {
      await result.current.share();
    });

    expect(mockToast.error).toHaveBeenCalledWith('공유 중 오류가 발생했습니다');
  });

  it('옵션이 captureElementAsImage에 전달된다', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockCaptureElementAsImage.mockResolvedValue(mockBlob);
    mockShareImage.mockResolvedValue(true);

    const options = { quality: 0.8, scale: 3, backgroundColor: '#000' };
    const { result } = renderHook(() => useShare('테스트', options));
    const div = document.createElement('div');
    Object.defineProperty(result.current.ref, 'current', { value: div, writable: true });

    await act(async () => {
      await result.current.share();
    });

    expect(mockCaptureElementAsImage).toHaveBeenCalledWith(div, {
      quality: 0.8,
      scale: 3,
      backgroundColor: '#000',
    });
  });
});
