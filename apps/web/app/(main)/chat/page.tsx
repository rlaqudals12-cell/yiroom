import { redirect } from 'next/navigation';

/**
 * /chat → /coach 리다이렉트
 *
 * 레거시 정리 (2026-07 감사): /chat은 /coach(AI 코치)와 이중화된 고아 페이지였고
 * (인바운드 링크 0), 인메모리 세션이라 대화가 유실됐다. 대화 저장/이어보기가
 * 배선된 /coach가 정본. _components·/api/chat·lib/chat·types/chat은 2026-08 고아 정리에서 제거됨.
 * 이 스텁은 sitemap/robots에 색인된 레거시 URL을 살리기 위해 유지한다.
 */
export default function ChatRedirect(): never {
  redirect('/coach');
}
