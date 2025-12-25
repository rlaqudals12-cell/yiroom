'use client';

import { Heart, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { YearlyStats } from '@/lib/reports/yearlyTypes';

interface WellnessJourneyProps {
  stats: YearlyStats;
}

export function WellnessJourney({ stats }: WellnessJourneyProps) {
  const { wellness } = stats;
  const improvementText = getImprovementText(wellness.scoreImprovement);
  const ImprovementIcon = getImprovementIcon(wellness.scoreImprovement);

  // 점수에 따른 색상
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card data-testid="wellness-journey">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="w-5 h-5 text-pink-500" />
          웰니스 여정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 평균 점수 */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-1">올해 평균 웰니스 점수</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-5xl font-bold ${getScoreColor(wellness.averageScore)}`}>
              {wellness.averageScore}
            </span>
            <span className="text-2xl text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-3 max-w-xs mx-auto">
            <Progress
              value={wellness.averageScore}
              className={`h-2 ${getProgressColor(wellness.averageScore)}`}
            />
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 최고 점수 */}
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">최고 점수</p>
            <p className={`text-2xl font-bold ${getScoreColor(wellness.bestScore)}`}>
              {wellness.bestScore}
            </p>
            {wellness.bestWeek && (
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                {formatWeek(wellness.bestWeek)}
              </p>
            )}
          </div>

          {/* 점수 변화 */}
          <div className="p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">점수 변화</p>
            <div className="flex items-center justify-center gap-1">
              <ImprovementIcon
                className={`w-5 h-5 ${
                  wellness.scoreImprovement > 0
                    ? 'text-green-500'
                    : wellness.scoreImprovement < 0
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-2xl font-bold ${
                  wellness.scoreImprovement > 0
                    ? 'text-green-600 dark:text-green-400'
                    : wellness.scoreImprovement < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground'
                }`}
              >
                {wellness.scoreImprovement > 0 ? '+' : ''}
                {wellness.scoreImprovement}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{improvementText}</p>
          </div>
        </div>

        {/* 메시지 */}
        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-lg">
          <p className="text-sm text-center">
            {getWellnessMessage(wellness.averageScore, wellness.scoreImprovement)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function getImprovementText(improvement: number): string {
  if (improvement > 10) return '큰 성장!';
  if (improvement > 0) return '조금씩 성장';
  if (improvement === 0) return '유지 중';
  if (improvement > -10) return '조금 하락';
  return '관리 필요';
}

function getImprovementIcon(improvement: number) {
  if (improvement > 0) return TrendingUp;
  if (improvement < 0) return TrendingDown;
  return Minus;
}

function formatWeek(weekStart: string): string {
  const date = new Date(weekStart);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day} 주`;
}

function getWellnessMessage(score: number, improvement: number): string {
  if (score >= 80 && improvement > 0) {
    return '정말 대단해요! 올해 최고의 웰니스 여정을 보냈어요. 내년에도 이 기세를 이어가세요!';
  }
  if (score >= 80) {
    return '훌륭해요! 높은 웰니스 점수를 유지하며 건강한 한 해를 보냈어요.';
  }
  if (score >= 60 && improvement > 0) {
    return '좋은 성장을 보여줬어요! 꾸준한 노력이 빛을 발하고 있어요.';
  }
  if (score >= 60) {
    return '안정적인 웰니스를 유지하고 있어요. 조금만 더 노력하면 더 높은 곳에 도달할 수 있어요!';
  }
  if (improvement > 0) {
    return '성장하고 있어요! 작은 변화가 모여 큰 결과를 만들어요. 계속 화이팅!';
  }
  return '아직 성장할 기회가 많아요! 내년에는 더 건강한 한 해를 만들어봐요.';
}
