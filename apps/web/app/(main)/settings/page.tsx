import { redirect } from 'next/navigation';

/**
 * 설정 페이지 → /profile/settings로 통합 리다이렉트
 * 전체 설정(계정, 알림, 테마, 개인정보, 데이터) 기능은 /profile/settings에 구현됨
 */
export default function SettingsPage(): never {
  redirect('/profile/settings');
}
