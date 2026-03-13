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
