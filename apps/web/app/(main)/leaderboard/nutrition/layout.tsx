import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

/**
 * /leaderboard/nutrition — ADR-098: W/N 숨김 (WELLNESS_PHASE2)
 * 영양 순위는 N-1 보류 영역. 비활성 시 전체 순위로 리다이렉트.
 * 복원 시 WELLNESS_PHASE2=true 전환만 하면 됨.
 */
export default function LeaderboardNutritionLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    redirect('/leaderboard');
  }
  return <>{children}</>;
}
