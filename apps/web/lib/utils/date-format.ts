// next-intl 로캘 → BCP-47 로캘 매핑
const LOCALE_MAP: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
};

/** next-intl 로캘을 BCP-47 형식으로 변환 */
export function getDateLocale(locale: string): string {
  return LOCALE_MAP[locale] ?? 'ko-KR';
}

/** 로캘 기반 날짜 포맷 (toLocaleDateString 대체) */
export function formatDate(
  date: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(getDateLocale(locale), options);
}

/** 로캘 기반 날짜+시간 포맷 (toLocaleString 대체) */
export function formatDateTime(
  date: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(getDateLocale(locale), options);
}

/** 로캘 기반 시간 포맷 (toLocaleTimeString 대체) */
export function formatTime(
  date: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(getDateLocale(locale), options);
}
