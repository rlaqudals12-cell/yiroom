import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  headerGet: vi.fn(),
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getRequestConfig: <T>(factory: T): T => factory,
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
  headers: mocks.headers,
}));

import requestConfig from '@/i18n/request';

describe('i18n request locale 감지', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookies.mockResolvedValue({ get: mocks.cookieGet });
    mocks.headers.mockResolvedValue({ get: mocks.headerGet });
  });

  it('쿠키가 있으면 헤더를 읽지 않고 해당 로케일을 사용한다', async () => {
    mocks.cookieGet.mockReturnValue({ value: 'en' });
    mocks.headerGet.mockReturnValue('ja-JP,ko;q=0.8');

    const config = await requestConfig({
      locale: undefined,
      requestLocale: Promise.resolve(undefined),
    });

    expect(mocks.cookieGet).toHaveBeenCalledWith('NEXT_LOCALE');
    expect(mocks.headers).not.toHaveBeenCalled();
    expect(config.locale).toBe('en');
  });

  it('쿠키가 없으면 Accept-Language에서 지원 로케일을 선택한다', async () => {
    mocks.cookieGet.mockReturnValue(undefined);
    mocks.headerGet.mockReturnValue('fr-FR, zh-CN;q=0.9, en;q=0.8');

    const config = await requestConfig({
      locale: undefined,
      requestLocale: Promise.resolve(undefined),
    });

    expect(mocks.headerGet).toHaveBeenCalledWith('accept-language');
    expect(config.locale).toBe('zh');
  });

  it('쿠키와 헤더에 지원 로케일이 없으면 한국어를 사용한다', async () => {
    mocks.cookieGet.mockReturnValue({ value: 'fr' });
    mocks.headerGet.mockReturnValue('fr-FR,de;q=0.8');

    const config = await requestConfig({
      locale: undefined,
      requestLocale: Promise.resolve(undefined),
    });

    expect(config.locale).toBe('ko');
  });
});
