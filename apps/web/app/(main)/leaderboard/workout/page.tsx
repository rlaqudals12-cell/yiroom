import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getLeaderboard, getMyRanking } from '@/lib/leaderboard';
import { LeaderboardList, LeaderboardPodium, MyRankCard } from '@/components/leaderboard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Dumbbell } from 'lucide-react';

export const metadata: Metadata = {
  title: '운동 리더보드 | 이룸',
  description: '운동 기록으로 다른 사용자들과 경쟁해보세요',
};

export default async function WorkoutLeaderboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = createClerkSupabaseClient();

  // 운동 리더보드 (주간)
  const leaderboard = await getLeaderboard(supabase, 'weekly', 'workout');
  const rankings = leaderboard?.rankings ?? [];

  // 내 순위
  const myRanking = await getMyRanking(supabase, userId, 'weekly', 'workout');

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/leaderboard" aria-label="리더보드로 이동">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-orange-500" />
            운동 리더보드
          </h1>
          <p className="text-sm text-muted-foreground">
            주간 운동 기록 경쟁
          </p>
        </div>
      </div>

      {/* 내 순위 */}
      <MyRankCard ranking={myRanking} />

      {/* 상위 3위 포디움 */}
      {rankings.length >= 3 && (
        <LeaderboardPodium
          rankings={rankings}
          category="workout"
          currentUserId={userId}
        />
      )}

      {/* 전체 랭킹 */}
      <LeaderboardList
        rankings={rankings.slice(3)}
        category="workout"
        currentUserId={userId}
        title="운동 랭킹"
        showHeader={rankings.length > 3}
      />

      {rankings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>아직 운동 기록이 없습니다</p>
          <p className="text-sm mt-2">운동을 기록하면 랭킹에 참여할 수 있습니다</p>
        </div>
      )}
    </div>
  );
}
