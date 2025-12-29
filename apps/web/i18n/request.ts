/**
 * i18n 서버 요청 설정
 * @description next-intl 서버 컴포넌트용 설정
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  // 1. 쿠키에서 언어 확인
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;

  // 2. Accept-Language 헤더에서 확인
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');

  let locale: Locale = defaultLocale;

  // 쿠키 우선
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    locale = localeCookie as Locale;
  }
  // Accept-Language 헤더 확인
  else if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().substring(0, 2))
      .find((lang) => locales.includes(lang as Locale));

    if (preferredLocale) {
      locale = preferredLocale as Locale;
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
