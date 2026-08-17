/**
 * 통합 분석 큐레이션 맥락 (source·session) 전달 규약
 *
 * 통합 분석 결과에서 "옷장에 옷을 넣어야 코디를 받을 수 있어요"로 넘어온 사용자는
 * 등록을 마친 뒤 원래 보던 코디 추천으로 돌아가야 한다. 그러려면 어느 세션에서 왔는지가
 * 등록 화면들(단건·일괄)까지 살아 있어야 한다 — 링크마다 손으로 이어붙이면 한 곳만
 * 빠져도 맥락이 끊기므로, 규약을 이 한 곳에 둔다.
 */

/** 큐레이션에서 넘어왔음을 표시하는 source 값 */
export const CURATION_SOURCE = 'integrated';

export interface CurationContext {
  isFromIntegrated: boolean;
  sessionId: string | null;
}

/** URL 쿼리에서 큐레이션 맥락을 읽는다 (없으면 비활성 맥락) */
export function readCurationContext(params: { get(name: string): string | null }): CurationContext {
  return {
    isFromIntegrated: params.get('source') === CURATION_SOURCE,
    sessionId: params.get('session'),
  };
}

/** 큐레이션 맥락을 경로에 이어붙인다(맥락이 없으면 원래 경로 그대로) */
export function withCurationContext(base: string, context: CurationContext): string {
  if (!context.isFromIntegrated) return base;
  const session = context.sessionId ? `&session=${encodeURIComponent(context.sessionId)}` : '';
  return `${base}?source=${CURATION_SOURCE}${session}`;
}

/** 등록을 마친 사용자가 돌아갈 코디 추천 경로 */
export function curationReturnHref(context: CurationContext): string {
  return withCurationContext('/closet/recommend', context);
}
