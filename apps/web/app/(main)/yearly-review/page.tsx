import { redirect } from 'next/navigation';

/**
 * /yearly-review → /year-review 리다이렉트
 * WS-5: 라우트 중복 정리
 */
export default function YearlyReviewRedirect(): never {
  redirect('/year-review');
}
