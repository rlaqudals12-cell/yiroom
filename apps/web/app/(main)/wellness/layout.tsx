import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

/**
 * /wellness — ADR-098: 폐기된 갈래 C(웰니스 통합) 잔재. W/N 숨김 정책 적용.
 * 웰니스 스코어는 운동·영양 종합 → 시각 정체성 5축과 무관. 비활성 시 홈으로.
 * 복원 시 WELLNESS_PHASE2=true 전환만 하면 됨.
 */
export default function WellnessLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    redirect('/home');
  }
  return <>{children}</>;
}
