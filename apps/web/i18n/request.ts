/**
 * i18n 서버 요청 설정
 * @description next-intl 서버 컴포넌트용 설정
 */

import { getRequestConfig } from 'next-intl/server';
import { defaultLocale } from './config';

export default getRequestConfig(async () => {
  // 한국 시장 전용: 항상 한국어 사용 (Accept-Language 무시)
  const locale = defaultLocale; // 'ko'

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
