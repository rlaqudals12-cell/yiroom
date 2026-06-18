import { redirect } from 'next/navigation';

/**
 * /beauty/category/[slug] → /beauty 리다이렉트
 *
 * 기존 카테고리 페이지는 가짜(mock) 제품만 표시 + 어디서도 링크되지 않는 orphan 라우트였음.
 * 실 제품 DB 연동 전까지 실데이터 기반 /beauty(추천/케어 탭)로 일원화.
 * 외부/구 링크 호환을 위해 리다이렉트만 유지.
 */
export default function BeautyCategoryPage(): never {
  redirect('/beauty');
}
