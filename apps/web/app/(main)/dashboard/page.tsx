import { redirect } from 'next/navigation';

/**
 * /dashboard → /home 리다이렉트
 *
 * P0 #2: 홈과 대시보드 역할 혼란 해소
 * - 기존 대시보드의 고유 위젯은 /home에 통합됨 (HomeDashboardWidgets)
 * - 기존 링크 호환을 위해 리다이렉트 유지
 * - _components/ 폴더는 테스트 및 홈에서 import 용도로 유지
 */
export default function DashboardPage(): never {
  redirect('/home');
}
