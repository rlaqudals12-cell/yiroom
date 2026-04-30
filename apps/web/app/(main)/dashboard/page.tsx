import { redirect } from 'next/navigation';

/**
 * /dashboard → /home 리다이렉트
 *
 * P0 #2: 홈과 대시보드 역할 혼란 해소.
 * 외부 링크 호환을 위해 리다이렉트만 유지.
 */
export default function DashboardPage(): never {
  redirect('/home');
}
