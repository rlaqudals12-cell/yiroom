/**
 * 로케일 유틸리티
 * @description 쿠키 기반 로케일 관리
 */

export const LOCALE_COOKIE = 'NEXT_LOCALE';
export const DEFAULT_LOCALE = 'ko';

/** 클라이언트에서 로케일 쿠키 설정 */
export function setLocaleCookie(locale: string): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

/** 클라이언트에서 로케일 쿠키 읽기 */
export function getLocaleCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}
