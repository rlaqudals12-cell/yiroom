/**
 * i18n 서버 요청 설정
 * @description next-intl 서버 컴포넌트용 로케일 감지
 * 현재: 한국 출시 단계이므로 ko 고정 (사용자 쿠키 선택만 허용)
 * 글로벌 확장 시: Accept-Language 감지 + 언어 전환 UI 추가
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { locales, defaultLocale, type Locale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  // 쿠키에 유효한 로케일이 있으면 사용, 없으면 ko 고정
  const locale: Locale =
    cookieLocale && (locales as readonly string[]).includes(cookieLocale)
      ? (cookieLocale as Locale)
      : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
