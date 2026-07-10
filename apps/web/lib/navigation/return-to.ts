/**
 * returnTo 체인 유틸리티
 *
 * 가입=첫 미팅 퍼널(ADR-114): 가입 직후 /analysis/integrated?onboarding=1로 보내지만
 * AgreementGuard(약관)·AgeVerificationProvider(연령)가 신규 가입자를 가로챈다.
 * 각 가드가 인터셉트 시 원 목적지를 returnTo 쿼리로 보존하고,
 * 동의/생년월일 완료 시 원 목적지로 복귀시켜 온보딩 도달을 보장한다.
 *
 * 보안: returnTo는 내부 경로만 허용 (오픈 리다이렉트 방지).
 */

export const RETURN_TO_PARAM = 'returnTo';

/**
 * 내부 경로만 허용하는 검증 (오픈 리다이렉트 방지)
 *
 * 허용: '/'로 시작하는 상대 경로 (예: '/analysis/integrated?onboarding=1')
 * 거부: 절대 URL('https://...'), 프로토콜 상대 URL('//evil.com'),
 *       백슬래시 변형('/\\evil.com' — 브라우저가 '//'로 정규화할 수 있음)
 */
export function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path) return false;
  if (!path.startsWith('/')) return false;
  // '//host'와 '/\host'는 프로토콜 상대 URL로 해석될 수 있어 거부
  if (path.startsWith('//') || path.startsWith('/\\')) return false;
  return true;
}

/**
 * returnTo 원시값 검증 — 유효한 내부 경로면 그대로, 아니면 null
 */
export function sanitizeReturnTo(raw: string | null | undefined): string | null {
  return isSafeInternalPath(raw) ? raw : null;
}

/**
 * 가드 인터셉트 시 원 목적지를 returnTo 쿼리로 붙인 경로 생성
 *
 * @param basePath - 가드 목적지 (예: '/agreement', '/complete-profile')
 * @param destination - 보존할 원 목적지 (pathname + search)
 * @returns destination이 유효하면 `${basePath}?returnTo=...`, 아니면 basePath 그대로
 */
export function withReturnTo(basePath: string, destination: string | null | undefined): string {
  if (!isSafeInternalPath(destination)) return basePath;
  return `${basePath}?${RETURN_TO_PARAM}=${encodeURIComponent(destination)}`;
}

/**
 * 현재 위치(pathname + search)를 목적지 문자열로 조합 — 클라이언트 전용
 *
 * usePathname은 search를 포함하지 않으므로 window.location.search를 결합한다.
 * (useSearchParams는 정적 렌더링 페이지에서 Suspense 경계를 요구하므로 회피)
 */
export function currentDestination(pathname: string | null | undefined): string {
  const path = pathname ?? '/';
  const search = typeof window !== 'undefined' ? window.location.search : '';
  return `${path}${search}`;
}

/**
 * 현재 location의 returnTo 파라미터를 검증해 읽기 — 클라이언트 전용
 *
 * @returns 유효한 내부 경로면 해당 경로, 없거나 위험하면 null
 */
export function readReturnToFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  return sanitizeReturnTo(new URLSearchParams(window.location.search).get(RETURN_TO_PARAM));
}
