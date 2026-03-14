import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  getLatestWellnessScore,
  getWellnessHistory,
  getAverageWellnessScore,
} from '@/lib/wellness';
import { WellnessScoreCard } from '@/components/wellness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Moon, Zap, SmilePlus, Brain } from 'lucide-react';

export const metadata: Metadata = {
  title: '웰니스 스코어 | 이룸',
  description: '나의 통합 건강 점수를 확인하세요',
};

// 오늘의 컨디션 체크인 조회
interface TodayCondition {
  moodScore: number;
  stressLevel: number;
  sleepHours: number;
  sleepQuality: number;
  energyLevel: number;
}

async function getTodayCondition(
  supabase: ReturnType<typeof createClerkSupabaseClient>,
  userId: string
): Promise<TodayCondition | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('mental_health_logs')
    .select('mood_score, stress_level, sleep_hours, sleep_quality, energy_level')
    .eq('clerk_user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (!data) return null;
  return {
    moodScore: data.mood_score ?? 3,
    stressLevel: data.stress_level ?? 5,
    sleepHours: data.sleep_hours ?? 7,
    sleepQuality: data.sleep_quality ?? 3,
    energyLevel: data.energy_level ?? 3,
  };
}

// 컨디션→웰니스 연결 인사이트 생성
function getConditionInsights(condition: TodayCondition): string[] {
  const insights: string[] = [];

  if (condition.sleepHours < 6) {
    insights.push('수면이 부족해요. 수면 부족은 피부 재생에 영향을 줄 수 있어요.');
  }
  if (condition.sleepQuality <= 2) {
    insights.push('수면의 질이 낮아요. 취침 전 스마트폰 사용을 줄여보세요.');
  }
  if (condition.stressLevel >= 7) {
    insights.push('스트레스가 높아요. 가벼운 스트레칭이나 산책을 추천해요.');
  }
  if (condition.energyLevel <= 2) {
    insights.push('에너지가 부족해요. 오늘은 가벼운 운동으로 시작해보세요.');
  }
  if (condition.moodScore >= 4 && condition.energyLevel >= 4) {
    insights.push('컨디션이 좋아요! 오늘 운동 강도를 높여도 좋겠어요.');
  }

  return insights;
}

// 점수에 따른 라벨
function getConditionLabel(score: number, max: number): string {
  const ratio = score / max;
  if (ratio >= 0.8) return '좋음';
  if (ratio >= 0.6) return '보통';
  if (ratio >= 0.4) return '낮음';
  return '주의';
}

// 스트레스는 역방향 (낮을수록 좋음)
function getStressLabel(level: number): string {
  if (level <= 3) return '낮음';
  if (level <= 5) return '보통';
  if (level <= 7) return '높음';
  return '매우 높음';
}

export default async function WellnessPage(): Promise<React.ReactElement> {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const supabase = createClerkSupabaseClient();

  // 병렬 조회
  const [latestScore, weeklyHistory, averageScore, todayCondition] = await Promise.all([
    getLatestWellnessScore(supabase, userId),
    getWellnessHistory(supabase, userId, 7),
    getAverageWellnessScore(supabase, userId, 7),
    getTodayCondition(supabase, userId),
  ]);

  const conditionInsights = todayCondition ? getConditionInsights(todayCondition) : [];

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

      {/* 오늘의 컨디션 */}
      <Card data-testid="today-condition-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            오늘의 컨디션
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayCondition ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <SmilePlus className="h-4 w-4 text-yellow-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">기분</div>
                    <div className="text-sm font-medium">
                      {todayCondition.moodScore}/5 ({getConditionLabel(todayCondition.moodScore, 5)}
                      )
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Brain className="h-4 w-4 text-red-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">스트레스</div>
                    <div className="text-sm font-medium">
                      {todayCondition.stressLevel}/10 ({getStressLabel(todayCondition.stressLevel)})
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <div>
                    <div className="text-xs text-muted-foreground">수면</div>
                    <div className="text-sm font-medium">
                      {todayCondition.sleepHours}시간 (질 {todayCondition.sleepQuality}/5)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">에너지</div>
                    <div className="text-sm font-medium">
                      {todayCondition.energyLevel}/5 (
                      {getConditionLabel(todayCondition.energyLevel, 5)})
                    </div>
                  </div>
                </div>
              </div>

              {/* 컨디션→웰니스 연결 인사이트 */}
              {conditionInsights.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t">
                  {conditionInsights.map((insight, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {insight}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">
                오늘의 컨디션을 기록하면 맞춤 웰니스 조언을 받을 수 있어요.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/mental-health">컨디션 체크인하기</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
            <p className="mt-1">컨디션 체크인을 하면 맞춤 조언을 받을 수 있어요.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
