import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  calculateXpLeaderboard,
  calculateLevelLeaderboard,
  calculateWellnessLeaderboard,
  calculateWorkoutLeaderboard,
  calculateNutritionLeaderboard,
} from '@/lib/leaderboard';
import { LeaderboardList } from '@/components/leaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ArrowLeft, Trophy, Star, TrendingUp, Sparkles, Dumbbell, Utensils } from 'lucide-react';

export const metadata: Metadata = {
  title: '리더보드 | 이룸',
  description: '다른 사용자들과 순위를 비교해보세요',
};

export default async function LeaderboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = createClerkSupabaseClient();

  // 모든 리더보드 데이터 병렬 조회
  const [xpRankings, levelRankings, wellnessRankings, workoutRankings, nutritionRankings] =
    await Promise.all([
      calculateXpLeaderboard(supabase, 50),
      calculateLevelLeaderboard(supabase, 50),
      calculateWellnessLeaderboard(supabase, 50),
      calculateWorkoutLeaderboard(supabase, 50),
      calculateNutritionLeaderboard(supabase, 50),
    ]);

  // 내 순위 (XP 기준)
  const myRank = xpRankings.findIndex((r) => r.userId === userId) + 1;
  const myScore = xpRankings.find((r) => r.userId === userId)?.score ?? 0;

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="대시보드로 이동">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">리더보드</h1>
      </div>

      {/* 내 순위 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            내 순위
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {myRank > 0 ? `${myRank}위` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">현재 순위</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {myScore.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">XP</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {xpRankings.length > 0
                  ? `상위 ${Math.round((myRank / xpRankings.length) * 100)}%`
                  : '-'}
              </div>
              <div className="text-sm text-muted-foreground">퍼센타일</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 리더보드 탭 */}
      <Tabs defaultValue="xp" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="xp" className="flex items-center gap-1 text-xs sm:text-sm">
            <Star className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">경험치</span>
            <span className="sm:hidden">XP</span>
          </TabsTrigger>
          <TabsTrigger value="level" className="flex items-center gap-1 text-xs sm:text-sm">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">레벨</span>
            <span className="sm:hidden">Lv</span>
          </TabsTrigger>
          <TabsTrigger value="wellness" className="flex items-center gap-1 text-xs sm:text-sm">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">웰니스</span>
            <span className="sm:hidden">WS</span>
          </TabsTrigger>
          <TabsTrigger value="workout" className="flex items-center gap-1 text-xs sm:text-sm">
            <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">운동</span>
            <span className="sm:hidden">W</span>
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-1 text-xs sm:text-sm">
            <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">영양</span>
            <span className="sm:hidden">N</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="xp" className="mt-4">
          <LeaderboardList
            rankings={xpRankings}
            category="xp"
            currentUserId={userId}
            title="경험치 랭킹"
          />
        </TabsContent>

        <TabsContent value="level" className="mt-4">
          <LeaderboardList
            rankings={levelRankings}
            category="level"
            currentUserId={userId}
            title="레벨 랭킹"
          />
        </TabsContent>

        <TabsContent value="wellness" className="mt-4">
          <LeaderboardList
            rankings={wellnessRankings}
            category="wellness"
            currentUserId={userId}
            title="웰니스 스코어 랭킹"
          />
        </TabsContent>

        <TabsContent value="workout" className="mt-4">
          <LeaderboardList
            rankings={workoutRankings}
            category="workout"
            currentUserId={userId}
            title="주간 운동 시간 랭킹"
          />
        </TabsContent>

        <TabsContent value="nutrition" className="mt-4">
          <LeaderboardList
            rankings={nutritionRankings}
            category="nutrition"
            currentUserId={userId}
            title="주간 목표 달성 랭킹"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
