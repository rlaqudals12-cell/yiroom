import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shareToX,
  shareToKakao,
  isKakaoReady,
  downloadShareImage,
  getHashtagsForResult,
  DEFAULT_HASHTAGS,
} from '@/lib/share/social';

describe('Social Share Utils', () => {
  const mockContent = {
    title: '테스트 제목',
    description: '테스트 설명',
    url: 'https://yiroom.app/test',
    hashtags: ['테스트'],
  };

  describe('shareToX', () => {
    beforeEach(() => {
      vi.stubGlobal('open', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('X 공유 창을 연다', () => {
      shareToX(mockContent);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.any(String)
      );
    });

    it('URL에 제목과 링크가 포함된다', () => {
      shareToX(mockContent);

      const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0];
      // URL.searchParams는 공백을 +로 인코딩함
      expect(url).toContain('text=');
      expect(url).toContain('url=');
      // URL에 제목과 링크 값이 포함되어야 함
      const parsedUrl = new URL(url);
      expect(parsedUrl.searchParams.get('text')).toBe(mockContent.title);
      expect(parsedUrl.searchParams.get('url')).toBe(mockContent.url);
    });

    it('해시태그가 포함된다', () => {
      shareToX(mockContent);

      const [url] = (window.open as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain('hashtags=');
    });
  });

  describe('shareToKakao', () => {
    const mockKakao = {
      init: vi.fn(),
      isInitialized: vi.fn().mockReturnValue(true),
      Share: {
        sendDefault: vi.fn(),
      },
    };

    beforeEach(() => {
      vi.stubGlobal('Kakao', mockKakao);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('Kakao SDK가 없으면 false를 반환한다', async () => {
      vi.stubGlobal('Kakao', undefined);

      const result = await shareToKakao(mockContent);
      expect(result).toBe(false);
    });

    it('Kakao.Share.sendDefault를 호출한다', async () => {
      await shareToKakao(mockContent);

      expect(mockKakao.Share.sendDefault).toHaveBeenCalledWith(
        expect.objectContaining({
          objectType: 'feed',
          content: expect.objectContaining({
            title: mockContent.title,
            description: mockContent.description,
          }),
        })
      );
    });

    it('초기화되지 않았으면 init을 호출한다', async () => {
      mockKakao.isInitialized.mockReturnValueOnce(false);
      vi.stubEnv('NEXT_PUBLIC_KAKAO_JS_KEY', 'test-key');

      await shareToKakao(mockContent);

      expect(mockKakao.init).toHaveBeenCalledWith('test-key');
    });
  });

  describe('isKakaoReady', () => {
    it('Kakao가 초기화되지 않았으면 false를 반환한다', () => {
      vi.stubGlobal('Kakao', undefined);
      expect(isKakaoReady()).toBe(false);
    });

    it('Kakao가 초기화되었으면 true를 반환한다', () => {
      vi.stubGlobal('Kakao', {
        isInitialized: vi.fn().mockReturnValue(true),
      });
      expect(isKakaoReady()).toBe(true);
    });
  });

  describe('downloadShareImage', () => {
    beforeEach(() => {
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = vi.fn();
      global.fetch = vi.fn().mockResolvedValue({
        blob: vi.fn().mockResolvedValue(new Blob(['test'])),
      });
    });

    it('이미지를 다운로드한다', async () => {
      const mockClick = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        click: mockClick,
        href: '',
        download: '',
      } as unknown as HTMLAnchorElement);

      const result = await downloadShareImage('https://test.com/image.png', 'test');

      expect(result).toBe(true);
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('getHashtagsForResult', () => {
    it('피부 분석 해시태그를 반환한다', () => {
      const hashtags = getHashtagsForResult('skin');

      expect(hashtags).toContain('피부분석');
      expect(hashtags).toContain('스킨케어');
      // 기본 해시태그 포함
      DEFAULT_HASHTAGS.forEach((tag) => {
        expect(hashtags).toContain(tag);
      });
    });

    it('퍼스널 컬러 해시태그를 반환한다', () => {
      const hashtags = getHashtagsForResult('personal-color');

      expect(hashtags).toContain('퍼스널컬러');
      expect(hashtags).toContain('웜톤쿨톤');
    });

    it('운동 해시태그를 반환한다', () => {
      const hashtags = getHashtagsForResult('workout');

      expect(hashtags).toContain('운동');
      expect(hashtags).toContain('홈트');
    });
  });

  describe('DEFAULT_HASHTAGS', () => {
    it('기본 해시태그가 포함되어 있다', () => {
      expect(DEFAULT_HASHTAGS).toContain('이룸');
      expect(DEFAULT_HASHTAGS).toContain('Yiroom');
    });
  });
});
