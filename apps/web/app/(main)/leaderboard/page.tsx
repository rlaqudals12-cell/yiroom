import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { calculateXpLeaderboard, calculateLevelLeaderboard } from '@/lib/leaderboard';
import { LeaderboardList } from '@/components/leaderboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ArrowLeft, Trophy, Star, TrendingUp } from 'lucide-react';

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

  // XP 리더보드
  const xpRankings = await calculateXpLeaderboard(supabase, 50);

  // 레벨 리더보드
  const levelRankings = await calculateLevelLeaderboard(supabase, 50);

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="xp" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            경험치
          </TabsTrigger>
          <TabsTrigger value="level" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            레벨
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
      </Tabs>
    </div>
  );
}
