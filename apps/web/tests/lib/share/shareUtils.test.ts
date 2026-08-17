/**
 * shareUtils — 공유물 "돌아올 링크" 계약 테스트
 *
 * 왜 중요한가: 이미지만 공유하면 클릭 가능한 링크가 없어 공유 100건 = 유입 0건이 된다.
 * url 인자는 navigator.share의 url과 text 양쪽에 실려야 한다
 * (files 동반 시 url을 버리는 공유 타깃이 실재).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shareImage, SHARE_LANDING_URL } from '@/lib/share/shareUtils';

describe('SHARE_LANDING_URL', () => {
  it('카드발 유입 귀속 파라미터(ref=card)를 포함한다', () => {
    expect(SHARE_LANDING_URL).toContain('?ref=card');
  });

  it('절대 URL이다 (상대 경로는 외부 앱에서 열리지 않는다)', () => {
    expect(SHARE_LANDING_URL).toMatch(/^https?:\/\//);
  });
});

describe('shareImage', () => {
  const originalShare = navigator.share;
  const originalCanShare = navigator.canShare;
  let mockShare: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(true),
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'share', {
      value: originalShare,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: originalCanShare,
      configurable: true,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it('url을 주면 navigator.share의 url 필드에 싣는다', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });

    await shareImage(blob, '이룸-퍼스널컬러-결과', '확인해보세요', SHARE_LANDING_URL);

    expect(mockShare).toHaveBeenCalledTimes(1);
    expect(mockShare.mock.calls[0][0].url).toBe(SHARE_LANDING_URL);
  });

  it('url을 text에도 함께 싣는다 (files 동반 시 url을 버리는 타깃 대비)', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });

    await shareImage(blob, '이룸-퍼스널컬러-결과', '확인해보세요', SHARE_LANDING_URL);

    expect(mockShare.mock.calls[0][0].text).toContain(SHARE_LANDING_URL);
    expect(mockShare.mock.calls[0][0].text).toContain('확인해보세요');
  });

  it('url이 없으면 url 필드를 넣지 않는다 (기존 호출부 회귀 방지)', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });

    await shareImage(blob, '제목', '본문');

    expect(mockShare.mock.calls[0][0]).not.toHaveProperty('url');
    expect(mockShare.mock.calls[0][0].text).toBe('본문');
  });

  it('text가 없어도 기본 문구 뒤에 링크를 붙인다', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });

    await shareImage(blob, '제목', undefined, SHARE_LANDING_URL);

    expect(mockShare.mock.calls[0][0].text).toContain('제목');
    expect(mockShare.mock.calls[0][0].text).toContain(SHARE_LANDING_URL);
  });

  it('파일도 함께 공유한다 (카드 이미지 유실 방지)', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });

    await shareImage(blob, '제목', '본문', SHARE_LANDING_URL);

    expect(mockShare.mock.calls[0][0].files).toHaveLength(1);
  });

  it('공유 시트로 넘어가면 method=web-share (고지 불필요)', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });

    const outcome = await shareImage(blob, '제목', '본문', SHARE_LANDING_URL);

    expect(outcome).toEqual({ ok: true, method: 'web-share', linkCopied: false });
  });

  it('사용자가 공유를 취소하면 method=cancelled (실패 토스트 금지)', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    const abort = new Error('aborted');
    abort.name = 'AbortError';
    mockShare.mockRejectedValueOnce(abort);

    const outcome = await shareImage(blob, '제목', '본문', SHARE_LANDING_URL);

    expect(outcome.method).toBe('cancelled');
    expect(outcome.ok).toBe(false);
  });
});

/**
 * 데스크톱 폴백 — 파일 공유를 지원하지 않는 브라우저.
 *
 * 왜 중요한가: 데스크톱은 canShare({files})가 대부분 false라 저장만 되고 끝났다.
 * 카드에 클릭 가능한 링크가 없으니 SHARE_LANDING_URL(유입 루프)이 통째로 빠진 셈.
 * 링크를 복사하되, 클립보드를 조용히 덮지 않도록 결과로 사실을 알린다.
 */
describe('shareImage — 파일 공유 미지원 폴백', () => {
  const originalShare = navigator.share;
  const originalCanShare = navigator.canShare;
  const originalClipboard = navigator.clipboard;
  let writeText: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // navigator.share는 있지만 파일은 못 쓰는 브라우저 (가장 흔한 데스크톱 형태)
    Object.defineProperty(navigator, 'share', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
      writable: true,
    });
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });
    // 다운로드 링크 클릭은 jsdom에서 네비게이션 경고를 내므로 막는다
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {}) as ReturnType<typeof vi.spyOn>;
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'share', {
      value: originalShare,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: originalCanShare,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
      writable: true,
    });
    clickSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('이미지를 저장하고 돌아올 링크를 클립보드에 복사한다', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });

    const outcome = await shareImage(blob, '제목', '본문', SHARE_LANDING_URL);

    expect(clickSpy).toHaveBeenCalledTimes(1); // 저장됨
    expect(writeText).toHaveBeenCalledWith(SHARE_LANDING_URL);
    expect(outcome.method).toBe('download');
    expect(outcome.ok).toBe(true);
  });

  it('복사 사실과 링크를 결과로 알린다 (조용한 클립보드 덮어쓰기 금지)', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });

    const outcome = await shareImage(blob, '제목', '본문', SHARE_LANDING_URL);

    // 호출부가 "링크도 복사했어요"를 고지할 수 있어야 한다
    expect(outcome.linkCopied).toBe(true);
    expect(outcome.link).toBe(SHARE_LANDING_URL);
  });

  it('클립보드가 막혀 복사에 실패하면 linkCopied=false로 정직하게 보고한다', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    writeText.mockRejectedValue(new Error('denied'));
    // execCommand 폴백도 실패
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
      writable: true,
    });

    const outcome = await shareImage(blob, '제목', '본문', SHARE_LANDING_URL);

    expect(outcome.linkCopied).toBe(false);
    // 링크는 남겨 호출부가 화면에 보여줄 수 있게 한다
    expect(outcome.link).toBe(SHARE_LANDING_URL);
  });

  it('url이 없으면 클립보드를 건드리지 않는다', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });

    const outcome = await shareImage(blob, '제목', '본문');

    expect(writeText).not.toHaveBeenCalled();
    expect(outcome.linkCopied).toBe(false);
    expect(outcome.link).toBeUndefined();
  });
});
