/**
 * 웹 API base URL 해석 정본 (모바일 thin client)
 *
 * @module lib/api/base-url
 * @description
 *   모바일은 분석·브리핑·코치 등 거의 모든 기능을 웹 API 재사용으로 처리한다(ADR-118 thin client).
 *   그 base URL을 어떻게 구하느냐가 파일마다 3갈래로 갈라져 있었다:
 *     - `lib/api/*`          : `EXPO_PUBLIC_YIROOM_API_URL`만 보고, 없으면 CONFIG_ERROR로 즉시 실패
 *     - `lib/capsule`·`lib/coach` : `EXPO_PUBLIC_API_URL` → 프로덕션 웹 폴백
 *     - `lib/monitoring`·`lib/push` : 폴백 없이 `${undefined}/api/...` 문자열 조립
 *
 *   왜 출시 블로커였나 (2026-08 실측):
 *   **두 env 어느 것도 실제로 설정된 적이 없다** — `.env.local`·`.env.example`·`eas.json`
 *   ·`app.json` 어디에도 없다. 그래서 EAS 빌드에서는 `lib/api/*` 경로가 전부 CONFIG_ERROR로
 *   죽고(=분석 전멸), `lib/monitoring`·`lib/push`는 "undefined/api/..."로 요청을 날렸다.
 *   개발 중에는 baseUrl 인자를 넘기는 테스트만 돌아서 아무도 눈치채지 못했다.
 *
 *   그래서 정책을 하나로 통일한다:
 *   **명시 인자 → `EXPO_PUBLIC_YIROOM_API_URL` → `EXPO_PUBLIC_API_URL` → 프로덕션 웹.**
 *   설정 누락은 더 이상 에러가 아니다. 설정을 빠뜨렸다고 앱의 핵심 기능을 통째로 죽이는 것보다,
 *   실제로 서비스 중인 프로덕션 웹으로 붙는 편이 언제나 낫기 때문이다. 반대로 env가 명시돼
 *   있으면(로컬 dev 서버·프리뷰 배포) 그것이 항상 우선한다.
 */

/**
 * 최종 폴백 — 프로덕션 웹.
 *
 * 이 리터럴은 **이 파일에만** 존재해야 한다(도메인 교체 시 한 곳만 고치면 되도록).
 * 잔존 0은 `__tests__/lib/api/base-url.test.ts`의 소스 스캔이 회귀 방지한다.
 */
export const DEFAULT_API_BASE_URL = 'https://yiroom.vercel.app';

/**
 * 후보 값 정규화.
 *
 * 왜 필요한가:
 *   - `??`만 쓰면 **빈 문자열도 "설정됨"으로 통과**한다. EAS/CI에서 env를 빈 값으로 두는 일은
 *     흔하고, 그 경우 `"/api/analyze/hair"`처럼 호스트 없는 URL이 조립돼 조용히 실패한다.
 *   - 끝의 `/`를 남겨두면 호출부의 `${url}/api/...`가 `//api/...`가 된다.
 */
function normalizeCandidate(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, '');
}

/**
 * 웹 API base URL을 해석한다. 어떤 경우에도 실패하지 않는다(항상 사용 가능한 URL 반환).
 *
 * @param override 명시 지정 — 테스트 주입·로컬 dev 서버용. 지정되면 env보다 우선한다.
 * @returns 끝에 `/`가 없는 base URL (예: `https://yiroom.vercel.app`)
 *
 * @example
 * const res = await fetch(`${getApiBaseUrl()}/api/analyze/hair`, { ... });
 */
export function getApiBaseUrl(override?: string): string {
  return (
    normalizeCandidate(override) ??
    normalizeCandidate(process.env.EXPO_PUBLIC_YIROOM_API_URL) ??
    normalizeCandidate(process.env.EXPO_PUBLIC_API_URL) ??
    DEFAULT_API_BASE_URL
  );
}

/**
 * 사용자 대면 문구에 넣을 웹 호스트 표기 (스킴 제거).
 *
 * 왜 별도 함수인가: "웹(yiroom.vercel.app)에서 로그인해주세요" 같은 안내에 호스트를 **직접
 * 적어두면** 도메인을 바꾸는 순간 사용자에게 거짓말이 된다. 실제 붙는 서버에서 파생시킨다.
 *
 * @example getWebHostLabel() // 'yiroom.vercel.app'
 */
export function getWebHostLabel(override?: string): string {
  return getApiBaseUrl(override).replace(/^https?:\/\//, '');
}
