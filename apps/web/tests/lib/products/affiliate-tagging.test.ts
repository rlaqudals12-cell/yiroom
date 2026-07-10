/**
 * 쿠팡 파트너스 클릭 시점 태깅 테스트 (수수료 귀속 게이트웨이)
 *
 * 배경(2026-07 감사): purchase_url이 네이버 쇼핑 item.link 그대로라
 * 쿠팡 링크조차 네이버 인입 리다이렉트(link.coupang.com/re/PCSNAVERPCSDP,
 * lptag=I... = 네이버 귀속)여서 구매가 발생해도 이룸 수수료가 0원이었다.
 *
 * 재발 방지 단언:
 * - 쿠팡 링크는 클릭 시점에 우리 파트너스 태그(lptag)로 귀속된다
 * - 네이버 귀속 태그(lptag=I...)가 결과 URL에 남지 않는다
 * - 태그 미설정·쿠팡 외 도메인·파싱 불가 링크는 절대 변조하지 않는다 (지어내지 않음)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// supabase 클라이언트는 lazy proxy지만, 트래킹 경로 mock을 위해 명시 mock
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

import {
  tagCoupangAffiliateUrl,
  buildAffiliateRedirectUrl,
  sanitizeCoupangSubId,
  openAffiliateLink,
} from '@/lib/products/affiliate';

const TAG = 'AF1075777';

// prod 실측 형태 그대로 (2026-07-11 cosmetic_products 105건 전수 이 패턴)
const NAVER_INBOUND_REDIRECT =
  'https://link.coupang.com/re/PCSNAVERPCSDP?pageKey=7796457341&ctag=7796457341&lptag=I23198520755&itemId=23198520755&vendorItemId=93219160443&spec=10305199';

describe('tagCoupangAffiliateUrl', () => {
  describe('네이버 인입 리다이렉트 → 직링크 재작성 + 파트너스 태깅', () => {
    it('PCSNAVER 리다이렉트를 www.coupang.com 상품 직링크로 재작성하고 우리 lptag를 부착한다', () => {
      const result = tagCoupangAffiliateUrl(NAVER_INBOUND_REDIRECT, TAG);
      const url = new URL(result);

      expect(url.host).toBe('www.coupang.com');
      expect(url.pathname).toBe('/vp/products/7796457341');
      expect(url.searchParams.get('itemId')).toBe('23198520755');
      expect(url.searchParams.get('vendorItemId')).toBe('93219160443');
      expect(url.searchParams.get('lptag')).toBe(TAG);
    });

    it('재발 방지: 결과 URL에 네이버 귀속 태그(lptag=I...)가 남지 않는다', () => {
      const result = tagCoupangAffiliateUrl(NAVER_INBOUND_REDIRECT, TAG);

      expect(result).not.toContain('lptag=I');
      expect(result).not.toContain('PCSNAVER');
      // lptag는 정확히 1회, 우리 태그로만
      expect(result.match(/lptag=/g)).toHaveLength(1);
    });

    it('subId를 함께 부착한다 (채널 귀속)', () => {
      const result = tagCoupangAffiliateUrl(NAVER_INBOUND_REDIRECT, TAG, '/beauty/abc-123');
      const url = new URL(result);

      expect(url.searchParams.get('subId')).toBe('beauty_abc-123');
    });

    it('pageKey/itemId가 숫자가 아니면 재작성하지 않고 원본을 유지한다 (귀속을 지어내지 않음)', () => {
      const weird = 'https://link.coupang.com/re/PCSNAVERPCSDP?pageKey=<script>&itemId=23198520755';
      expect(tagCoupangAffiliateUrl(weird, TAG)).toBe(weird);

      const missing = 'https://link.coupang.com/re/PCSNAVERPCSDP?ctag=123';
      expect(tagCoupangAffiliateUrl(missing, TAG)).toBe(missing);
    });

    it('vendorItemId가 없어도 pageKey+itemId만으로 재작성한다', () => {
      const noVendor = 'https://link.coupang.com/re/PCSNAVERPCSDP?pageKey=111&itemId=222';
      const result = tagCoupangAffiliateUrl(noVendor, TAG);
      const url = new URL(result);

      expect(url.pathname).toBe('/vp/products/111');
      expect(url.searchParams.get('itemId')).toBe('222');
      expect(url.searchParams.has('vendorItemId')).toBe(false);
      expect(url.searchParams.get('lptag')).toBe(TAG);
    });
  });

  describe('쿠팡 본 도메인 직접 태깅', () => {
    it('www.coupang.com 상품 URL에 lptag를 부착한다 (기존 파라미터 보존)', () => {
      const direct = 'https://www.coupang.com/vp/products/123?itemId=456&vendorItemId=789';
      const result = tagCoupangAffiliateUrl(direct, TAG, 'home');
      const url = new URL(result);

      expect(url.searchParams.get('itemId')).toBe('456');
      expect(url.searchParams.get('vendorItemId')).toBe('789');
      expect(url.searchParams.get('lptag')).toBe(TAG);
      expect(url.searchParams.get('subId')).toBe('home');
    });

    it('기존 타사 lptag가 있으면 우리 태그로 대체한다', () => {
      const tagged = 'https://www.coupang.com/vp/products/123?lptag=OTHER123';
      const result = tagCoupangAffiliateUrl(tagged, TAG);

      expect(new URL(result).searchParams.get('lptag')).toBe(TAG);
      expect(result.match(/lptag=/g)).toHaveLength(1);
    });

    it('m.coupang.com도 태깅한다', () => {
      const mobile = 'https://m.coupang.com/vm/products/123';
      const result = tagCoupangAffiliateUrl(mobile, TAG);

      expect(new URL(result).searchParams.get('lptag')).toBe(TAG);
    });
  });

  describe('변조 금지 (지어내지 않음)', () => {
    it('파트너스 태그 미설정이면 어떤 링크도 변조하지 않는다', () => {
      expect(tagCoupangAffiliateUrl(NAVER_INBOUND_REDIRECT, undefined)).toBe(
        NAVER_INBOUND_REDIRECT
      );
      expect(tagCoupangAffiliateUrl('https://www.coupang.com/vp/products/1', '')).toBe(
        'https://www.coupang.com/vp/products/1'
      );
    });

    it('쿠팡 외 도메인(네이버·올리브영 등 수수료 불가 링크)은 태깅 없이 원본 그대로 통과한다', () => {
      const naver = 'https://smartstore.naver.com/some/products/123';
      const olive = 'https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=toner';

      expect(tagCoupangAffiliateUrl(naver, TAG)).toBe(naver);
      expect(tagCoupangAffiliateUrl(olive, TAG)).toBe(olive);
      expect(tagCoupangAffiliateUrl(naver, TAG)).not.toContain('lptag');
    });

    it('이미 파트너스 단축링크(link.coupang.com/a/)면 재태깅하지 않는다', () => {
      const shortLink = 'https://link.coupang.com/a/abc123?subId=yiroom';
      expect(tagCoupangAffiliateUrl(shortLink, TAG)).toBe(shortLink);
    });

    it('URL 파싱 불가 문자열은 원본 그대로 반환한다', () => {
      expect(tagCoupangAffiliateUrl('not-a-url', TAG)).toBe('not-a-url');
      expect(tagCoupangAffiliateUrl('', TAG)).toBe('');
    });

    it('유사 도메인(coupang.com.evil.com)은 태깅하지 않는다', () => {
      const phishing = 'https://www.coupang.com.evil.com/vp/products/1';
      expect(tagCoupangAffiliateUrl(phishing, TAG)).toBe(phishing);
    });
  });
});

describe('sanitizeCoupangSubId', () => {
  it('경로를 허용 문자([a-zA-Z0-9_-])만 남긴 subId로 변환한다', () => {
    expect(sanitizeCoupangSubId('/beauty/abc-123')).toBe('beauty_abc-123');
    expect(sanitizeCoupangSubId('/products/cosmetic/uuid')).toBe('products_cosmetic_uuid');
  });

  it('한글 등 비허용 문자를 치환하고 50자로 제한한다', () => {
    const result = sanitizeCoupangSubId('/뷰티/' + 'a'.repeat(100));
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result).toMatch(/^[a-zA-Z0-9_-]*$/);
  });
});

describe('buildAffiliateRedirectUrl (환경변수 게이트)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('NEXT_PUBLIC_COUPANG_PARTNERS_TAG 설정 시 쿠팡 링크를 태깅한다', () => {
    vi.stubEnv('NEXT_PUBLIC_COUPANG_PARTNERS_TAG', TAG);
    const result = buildAffiliateRedirectUrl(NAVER_INBOUND_REDIRECT);

    expect(new URL(result).searchParams.get('lptag')).toBe(TAG);
  });

  it('환경변수 미설정이면 원본 그대로 (가짜 귀속 없음)', () => {
    vi.stubEnv('NEXT_PUBLIC_COUPANG_PARTNERS_TAG', '');
    expect(buildAffiliateRedirectUrl(NAVER_INBOUND_REDIRECT)).toBe(NAVER_INBOUND_REDIRECT);
  });
});

describe('openAffiliateLink (클릭 게이트웨이 통합)', () => {
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    openSpy = vi.fn().mockReturnValue(null);
    vi.stubGlobal('open', openSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('쿠팡 링크는 태깅된 URL로 새 탭을 연다 (수수료 귀속)', async () => {
    vi.stubEnv('NEXT_PUBLIC_COUPANG_PARTNERS_TAG', TAG);

    await openAffiliateLink(NAVER_INBOUND_REDIRECT, 'cosmetic', 'prod-1');

    expect(openSpy).toHaveBeenCalledTimes(1);
    const openedUrl = String(openSpy.mock.calls[0][0]);
    expect(new URL(openedUrl).host).toBe('www.coupang.com');
    expect(new URL(openedUrl).searchParams.get('lptag')).toBe(TAG);
    expect(openedUrl).not.toContain('PCSNAVER');
  });

  it('쿠팡 외 링크는 원본 그대로 연다', async () => {
    vi.stubEnv('NEXT_PUBLIC_COUPANG_PARTNERS_TAG', TAG);
    const naver = 'https://smartstore.naver.com/some/products/123';

    await openAffiliateLink(naver, 'supplement', 'prod-2');

    expect(openSpy).toHaveBeenCalledWith(naver, '_blank', 'noopener,noreferrer');
  });
});
