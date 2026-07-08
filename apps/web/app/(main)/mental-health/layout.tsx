import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

/**
 * /mental-health — W/N(웰니스) 인접 모듈. 시각 정체성 5축 외 + 도달 불가 고아 라우트
 * (2026-07 감사: 인바운드 링크 0). ADR-098 W/N 숨김 정책과 동일하게 게이팅.
 * 복원 시 WELLNESS_PHASE2=true 전환만 하면 됨.
 */
export default function MentalHealthLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    redirect('/home');
  }
  return <>{children}</>;
}
