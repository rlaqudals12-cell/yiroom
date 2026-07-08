import { redirect } from 'next/navigation';

/**
 * /chat → /coach 리다이렉트
 *
 * 레거시 정리 (2026-07 감사): /chat은 /coach(AI 코치)와 이중화된 고아 페이지였고
 * (인바운드 링크 0), 인메모리 세션이라 대화가 유실됐다. 대화 저장/이어보기가
 * 배선된 /coach가 정본. _components와 /api/chat 제거는 후속.
 */
export default function ChatRedirect(): never {
  redirect('/coach');
}
