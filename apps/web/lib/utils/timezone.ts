/**
 * 타임존 유틸리티
 *
 * 브라우저 타임존을 쿠키에 저장하고, 서버 컴포넌트에서 읽어 사용.
 * 해외 사용자의 날짜/시간 표시를 현지 시간으로 보여주기 위함.
 */

/** 타임존 쿠키 이름 */
export const TIMEZONE_COOKIE = 'NEXT_TIMEZONE';

/** 기본 타임존 (한국) */
export const DEFAULT_TIMEZONE = 'Asia/Seoul';

/**
 * 서버에서 사용자 타임존 가져오기
 * 쿠키가 없으면 기본 KST 반환
 */
export async function getUserTimezone(): Promise<string> {
  // dynamic import — server-only (next/headers)
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return cookieStore.get(TIMEZONE_COOKIE)?.value || DEFAULT_TIMEZONE;
}

/**
 * 특정 타임존의 현재 시간(시) 반환
 * @returns 0-23 정수
 */
export function getCurrentHourInTimezone(timezone: string): number {
  const now = new Date();
  const formatted = now.toLocaleString('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  return parseInt(formatted, 10) % 24;
}

/**
 * 특정 타임존의 현재 시간을 HH:00 형식으로 반환
 */
export function getCurrentHourString(timezone: string): string {
  const hour = getCurrentHourInTimezone(timezone);
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * 특정 타임존 기준 오늘 날짜 키(YYYY-MM-DD) 반환.
 *
 * 서버(Vercel)는 UTC로 도는데 `new Date().getFullYear()/getMonth()/getDate()`는 UTC 기준이라
 * 한국 자정 직후 "어제 날짜"가 나온다. en-CA 로케일 포맷은 YYYY-MM-DD를 그대로 주므로
 * Intl로 해당 타임존의 날짜를 안전하게 얻는다.
 */
export function getDateKeyInTimezone(timezone: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * 특정 타임존의 "현재 벽시계 시각"을 담은 Date 반환.
 *
 * 반환 Date의 로컬 게터(getHours/getFullYear/getMonth/getDate/getDay)가 해당 타임존의
 * 벽시계 값을 돌려주도록, 타임존 파츠로 로컬 생성자를 호출해 만든다. 요일·날짜가 타임존
 * 기준이어야 하는 계산(예: 요일 기반 스킨 사이클링)에 쓴다.
 *
 * ⚠️ 반환 Date의 getTime()(epoch)은 실제 UTC now와 다를 수 있으므로, 두 시각의 "경과 시간"
 *    계산에는 쓰지 말 것(그 경우엔 실제 new Date()를 사용).
 */
export function getZonedNow(timezone: string = DEFAULT_TIMEZONE): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((p) => p.type === type)?.value ?? '0';
    return parseInt(value, 10);
  };

  // hour12:false는 자정을 '24'로 줄 수 있으므로 0으로 정규화
  const hour = get('hour') % 24;
  return new Date(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
}
