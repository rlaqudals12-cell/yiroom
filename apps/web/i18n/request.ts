/**
 * i18n 서버 요청 설정
 * @description next-intl 서버 컴포넌트용 로케일 감지
 * 사용자 쿠키를 우선하고, 첫 방문에는 Accept-Language를 사용한다.
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { isSupportedLocale, LOCALE_COOKIE, resolveRequestLocale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  // 명시적으로 고른 쿠키가 있으면 브라우저 헤더보다 항상 우선한다.
  const acceptLanguage = isSupportedLocale(cookieLocale)
    ? null
    : (await headers()).get('accept-language');
  const locale = resolveRequestLocale(cookieLocale, acceptLanguage);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
