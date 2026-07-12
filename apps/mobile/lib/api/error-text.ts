/**
 * 에러 메시지 정규화 (근본 방어)
 *
 * @module lib/api/error-text
 * @description
 *   왜 필요한가 (근본 원인 — 에뮬 실측):
 *     통합분석 온보딩 제출 실패 시 에러 배너에 문자 그대로 "[object Object]"가 렌더된 사례.
 *     서버가 flat 봉투({ error: "<문자열>" })가 아닌 예외 응답을 주면 — Next 500 JSON
 *     { error: { message, ... } }, Clerk 게이트웨이 { errors: [...] }, 프록시 객체 등 —
 *     API 클라이언트가 그 객체를 그대로 Error 메시지로 승격시킨다. `new Error({})`는
 *     message를 String({}) = "[object Object]"로 만들기 때문에, 비문자열 필드를 메시지로
 *     쓰면 배너에 "[object Object]"가 노출된다.
 *
 *   규칙: 사용자 대면 메시지는 **문자열만** 허용한다. 문자열이 아니거나 비어 있거나
 *   "[object Object]"이면 정직한 일반 문구(fallback)로 대체한다.
 */

/**
 * 임의의 값을 사용자 대면 메시지로 안전하게 정규화한다.
 *
 * @param value 서버 응답에서 뽑은 메시지 후보 (문자열이 아닐 수 있음)
 * @param fallback value가 유효한 문자열이 아닐 때 쓸 정직한 일반 문구
 * @returns 다듬은 문자열 또는 fallback
 */
export function toUserMessage(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  // 빈 문자열·객체 직렬화 흔적("[object Object]")은 메시지로 쓰지 않는다.
  if (trimmed === '' || trimmed === '[object Object]') return fallback;
  return trimmed;
}
