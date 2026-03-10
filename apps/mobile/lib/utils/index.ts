/**
 * 유틸리티 배럴 export (웹 호환)
 *
 * 웹의 @/lib/utils 경로 호환을 위한 모듈
 */

/**
 * 클래스명 병합 유틸리티 (NativeWind 호환)
 * 웹에서는 clsx + tailwind-merge, 모바일에서는 단순 문자열 결합
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

export { formatError } from './logger';
