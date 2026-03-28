'use client';

/**
 * i18n Provider
 * @description 클라이언트 컴포넌트용 다국어 Provider
 * 브라우저 타임존을 쿠키에 저장하여 서버 컴포넌트에서 사용
 */

import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { ReactNode, useEffect } from 'react';
import { TIMEZONE_COOKIE } from '@/lib/utils/timezone';
import { LOCALE_COOKIE } from '@/lib/utils/locale';

interface I18nProviderProps {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export function I18nProvider({ children, locale, messages }: I18nProviderProps) {
  useEffect(() => {
    // 브라우저 타임존을 쿠키에 저장 (서버 컴포넌트에서 읽어 사용)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && document.cookie.indexOf(`${TIMEZONE_COOKIE}=${tz}`) === -1) {
      document.cookie = `${TIMEZONE_COOKIE}=${tz};path=/;max-age=31536000;SameSite=Lax`;
    }
    // 현재 로케일을 쿠키에 저장 (서버 감지 결과와 동기화)
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
