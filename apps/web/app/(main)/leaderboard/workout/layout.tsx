import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';

/**
 * /leaderboard/workout — ADR-098: W/N 숨김 (WELLNESS_PHASE2)
 * 운동 순위는 W-1 보류 영역. 비활성 시 전체 순위로 리다이렉트.
 * 복원 시 WELLNESS_PHASE2=true 전환만 하면 됨.
 */
export default function LeaderboardWorkoutLayout({ children }: { children: React.ReactNode }) {
  if (!FEATURE_FLAGS.WELLNESS_PHASE2) {
    redirect('/leaderboard');
  }
  return <>{children}</>;
}
