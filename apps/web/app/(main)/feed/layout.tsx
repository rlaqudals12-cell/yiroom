import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

/**
 * /feed — 소셜 피드(UGC). 기능 과잉 정리(2026-05-16)로 SOCIAL_FEED 게이팅.
 * 정체성·수익 비기여 부가 기능. 코드/DB 유지, 비활성 시 홈으로 redirect.
 * 복원: SOCIAL_FEED=true.
 */
export default function FeedLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.SOCIAL_FEED) {
    redirect('/home');
  }
  return children;
}
