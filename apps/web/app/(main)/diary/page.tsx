import { redirect } from 'next/navigation';

/**
 * /diary → /analysis/skin/diary 리다이렉트
 *
 * 레거시 정리 (2026-07 감사): /diary는 피부 일기의 고아 이중 구현이었다
 * (인바운드 링크 0). 정본은 /analysis/skin/diary. _components 제거는 후속.
 */
export default function DiaryRedirect(): never {
  redirect('/analysis/skin/diary');
}
