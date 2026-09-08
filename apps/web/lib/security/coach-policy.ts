/** 코치 AI 상담 사용자 턴 한도. 웹/모바일 전송 경로와 무관하게 공유한다. */
export const COACH_TURN_LIMITS = { daily: 20, monthly: 100 } as const;

/** 이 두 경로의 비용 예약은 코치 오케스트레이터만 담당한다. */
export function isCoachTurnPath(pathname: string): boolean {
  const normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return normalized === '/api/coach/chat' || normalized === '/api/coach/stream';
}
