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
});
