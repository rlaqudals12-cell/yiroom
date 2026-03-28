'use client';

/**
 * 로케일 전환 컴포넌트
 * @description 쿠키 기반 언어 전환. 설정 페이지 및 헤더에서 사용
 */

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { setLocaleCookie } from '@/lib/utils/locale';
import { cn } from '@/lib/utils';

interface LocaleSwitcherProps {
  currentLocale: string;
  /** 컴팩트 모드 (아이콘만 표시) */
  compact?: boolean;
}

export function LocaleSwitcher({ currentLocale, compact = false }: LocaleSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (newLocale: Locale): void => {
    setLocaleCookie(newLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  if (compact) {
    return (
      <select
        data-testid="locale-switcher-compact"
        value={currentLocale}
        onChange={(e) => handleChange(e.target.value as Locale)}
        disabled={isPending}
        className="bg-transparent text-sm border rounded-md px-2 py-1 cursor-pointer"
        aria-label="언어 선택"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex gap-2" data-testid="locale-switcher">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleChange(locale)}
          disabled={isPending || currentLocale === locale}
          className={cn(
            'flex-1 py-2 rounded-lg border transition-colors text-sm',
            currentLocale === locale
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
          )}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
