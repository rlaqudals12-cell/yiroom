import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

/**
 * /badges — 게이미피케이션 배지. 기능 과잉 정리(2026-05-16)로 BADGES 게이팅.
 * 참여도 보상만, 정체성·수익 비기여. 코드/DB 유지, 비활성 시 /home으로 redirect.
 * 복원: BADGES=true.
 */
export default function BadgesLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.BADGES) {
    redirect('/home');
  }
  return children;
}
