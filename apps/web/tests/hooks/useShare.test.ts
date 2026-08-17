import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// 외부 의존성 모킹 (vi.hoisted로 hoisting 안전하게 처리)
// SHARE_LANDING_URL도 hoisted에 둔다 — vi.mock 팩토리는 파일 최상단으로 끌어올려지므로
// 일반 top-level const를 참조하면 초기화 전 접근(TDZ)으로 터진다.
const { mockCaptureElementAsImage, mockShareImage, mockToast, SHARE_LANDING_URL } = vi.hoisted(
  () => ({
    mockCaptureElementAsImage: vi.fn(),
    mockShareImage: vi.fn(),
    mockToast: { error: vi.fn(), success: vi.fn() },
    SHARE_LANDING_URL: 'https://yiroom.app/?ref=card',
  })
);

vi.mock('@/lib/share', () => ({
  captureElementAsImage: (...args: unknown[]) => mockCaptureElementAsImage(...args),
  shareImage: (...args: unknown[]) => mockShareImage(...args),
  SHARE_LANDING_URL,
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

/**
 * shareImage 결과 헬퍼 — 2026-08 외부 리뷰 수리로 계약이 boolean → ShareOutcome이 됐다.
 *
 * 왜 바뀌었나(의도된 변경): 데스크톱 브라우저는 대부분 파일 공유를 지원하지 않아
 * 저장만 되고 끝났고, 그래서 카드에 클릭 가능한 링크가 없어 유입이 0이었다.
 * 이제 폴백에서 이미지 저장 + 돌아올 링크 복사를 하고, **클립보드를 조용히 덮지 않도록**
 * 무슨 일이 있었는지 결과로 알려 호출부가 고지한다.
 * 옛 판정 조건(`!navigator.share`)은 share는 있고 파일만 못 쓰는 브라우저를 놓쳐
 * 정작 고지가 필요한 경우에 무음이었다 → `outcome.method === 'download'`로 대체.
 */
const webShared = { ok: true, method: 'web-share' as const, linkCopied: false };
const savedWithLink = {
  ok: true,
  method: 'download' as const,
  linkCopied: true,
  link: SHARE_LANDING_URL,
};
const savedWithoutCopy = { ok: true, method: 'download' as const, linkCopied: false };

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

  it('캡처 성공 후 돌아올 링크와 함께 shareImage를 호출한다', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockCaptureElementAsImage.mockResolvedValue(mockBlob);
    mockShareImage.mockResolvedValue(webShared);

    const { result } = renderHook(() => useShare('분석 결과'));
    const div = document.createElement('div');
    Object.defineProperty(result.current.ref, 'current', { value: div, writable: true });

    await act(async () => {
      await result.current.share();
    });

    // 4번째 인자(SHARE_LANDING_URL)가 추가된 이유 → 파일 상단 주석(유입 루프)
    expect(mockShareImage).toHaveBeenCalledWith(
      mockBlob,
      '분석 결과',
      '분석 결과 - 이룸에서 확인하세요!',
      SHARE_LANDING_URL
    );
  });

  it('공유 시트로 넘어가면 토스트를 띄우지 않는다 (시트가 곧 피드백)', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockCaptureElementAsImage.mockResolvedValue(mockBlob);
    mockShareImage.mockResolvedValue(webShared);

    const { result } = renderHook(() => useShare('테스트'));
    const div = document.createElement('div');
    Object.defineProperty(result.current.ref, 'current', { value: div, writable: true });

    await act(async () => {
      await result.current.share();
    });

    expect(mockToast.success).not.toHaveBeenCalled();
  });

  it('저장 폴백에서 링크를 복사했으면 그 사실을 고지한다 (조용한 클립보드 금지)', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockCaptureElementAsImage.mockResolvedValue(mockBlob);
    mockShareImage.mockResolvedValue(savedWithLink);

    const { result } = renderHook(() => useShare('테스트'));
    const div = document.createElement('div');
    Object.defineProperty(result.current.ref, 'current', { value: div, writable: true });

    await act(async () => {
      await result.current.share();
    });

    // 현행 카피: share.imageSavedLinkCopied + 링크를 눈으로 확인할 수 있게 함께 노출
    expect(mockToast.success).toHaveBeenCalledWith(
      '이미지를 저장하고 링크도 클립보드에 복사했어요',
      { description: SHARE_LANDING_URL }
    );
  });

  it('복사가 안 됐으면 저장 사실만 고지한다 (없는 일을 말하지 않는다)', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    mockCaptureElementAsImage.mockResolvedValue(mockBlob);
    mockShareImage.mockResolvedValue(savedWithoutCopy);

    const { result } = renderHook(() => useShare('테스트'));
    const div = document.createElement('div');
    Object.defineProperty(result.current.ref, 'current', { value: div, writable: true });

    await act(async () => {
      await result.current.share();
    });

    // 현행 카피: share.imageSaved
    expect(mockToast.success).toHaveBeenCalledWith(
      '이미지가 저장되었습니다. Instagram에서 공유해주세요!',
      { description: undefined }
    );
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
    mockShareImage.mockResolvedValue(webShared);

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
