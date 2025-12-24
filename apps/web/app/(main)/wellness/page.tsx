import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { getLatestWellnessScore, getWellnessHistory, getAverageWellnessScore } from '@/lib/wellness';
import { WellnessScoreCard } from '@/components/wellness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: '웰니스 스코어 | 이룸',
  description: '나의 통합 건강 점수를 확인하세요',
};

export default async function WellnessPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = createClerkSupabaseClient();

  // 최신 웰니스 스코어 조회
  const latestScore = await getLatestWellnessScore(supabase, userId);

  // 최근 7일 기록
  const weeklyHistory = await getWellnessHistory(supabase, userId, 7);

  // 평균 점수
  const averageScore = await getAverageWellnessScore(supabase, userId, 7);

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard" aria-label="대시보드로 이동">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">웰니스 스코어</h1>
      </div>

      {/* 메인 스코어 카드 */}
      <WellnessScoreCard score={latestScore} showBreakdown />

      {/* 주간 평균 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            주간 평균
          </CardTitle>
        </CardHeader>
        <CardContent>
          {averageScore.count > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{averageScore.totalScore}</div>
                <div className="text-sm text-muted-foreground">평균 점수</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{averageScore.grade}</div>
                <div className="text-sm text-muted-foreground">평균 등급</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              최근 7일간 기록된 점수가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 히스토리 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyHistory.length > 0 ? (
            <div className="space-y-2">
              {weeklyHistory.map((score) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <span className="text-sm">{score.date}</span>
                  <span className="font-semibold">{score.totalScore}점</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              기록된 웰니스 스코어가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>웰니스 스코어는 운동, 영양, 피부, 체형 영역의</p>
            <p>활동을 종합하여 매일 자동으로 계산됩니다.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
