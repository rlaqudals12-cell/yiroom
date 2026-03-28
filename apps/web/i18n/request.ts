/**
 * i18n 서버 요청 설정
 * @description next-intl 서버 컴포넌트용 로케일 감지
 * 우선순위: 쿠키 > Accept-Language > 기본값(ko)
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { locales, defaultLocale, type Locale } from './config';

// Accept-Language 헤더에서 지원 로케일 감지
function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const tags = header.split(',').map((s) => s.split(';')[0].trim().toLowerCase());
  for (const tag of tags) {
    const lang = tag.split('-')[0] as Locale;
    if ((locales as readonly string[]).includes(lang)) return lang;
  }
  return null;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  let locale: Locale = defaultLocale;

  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    // 쿠키에 저장된 사용자 선택 우선
    locale = cookieLocale as Locale;
  } else {
    // 쿠키 없으면 Accept-Language 헤더 감지
    const headerStore = await headers();
    const acceptLang = headerStore.get('accept-language');
    const detected = parseAcceptLanguage(acceptLang);
    if (detected) locale = detected;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
