import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

/**
 * /reports (주간/월간 리포트) — Phase 2 보류 (ADR-098)
 * 리포트는 W-1/N-1 데이터 기반이므로 WELLNESS_PHASE2=false 상태에서는 홈으로 리다이렉트
 */
export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    redirect('/home');
  }
  return children;
}
