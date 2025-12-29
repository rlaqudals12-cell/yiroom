'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { MyRanking } from '@/types/leaderboard';
import { getCategoryLabel, getPeriodLabel, formatChange, getChangeColor } from '@/types/leaderboard';
import { formatScore } from '@/lib/leaderboard/constants';
import { TrendingUp, Medal, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MyRankCardProps {
  ranking: MyRanking | null;
  isLoading?: boolean;
}

export function MyRankCard({ ranking, isLoading = false }: MyRankCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="my-rank-card-loading">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Medal className="h-4 w-4" />
            내 순위
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24 animate-pulse">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ranking) {
    return (
      <Card data-testid="my-rank-card-empty">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Medal className="h-4 w-4" />
            내 순위
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>활동을 기록하면 순위가 표시됩니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="my-rank-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Medal className="h-4 w-4" />
            내 순위
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            {getPeriodLabel(ranking.period)} · {getCategoryLabel(ranking.category)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          {/* 순위 */}
          <div>
            <div className="text-3xl font-bold text-primary">
              {ranking.rank}
              <span className="text-lg">위</span>
            </div>
            {ranking.change !== undefined && ranking.change !== 0 && (
              <div className={cn('text-sm', getChangeColor(ranking.change))}>
                {formatChange(ranking.change)}
              </div>
            )}
          </div>

          {/* 점수 */}
          <div>
            <div className="text-2xl font-bold">
              {formatScore(ranking.score, ranking.category)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {getCategoryLabel(ranking.category)}
            </div>
          </div>

          {/* 상위 % */}
          <div>
            <div className="text-2xl font-bold text-green-500">
              {ranking.percentile.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              상위
            </div>
          </div>
        </div>

        {/* 퍼센타일 프로그레스 바 */}
        <div className="mt-4 space-y-1">
          <Progress value={100 - ranking.percentile} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-primary font-medium">
              상위 {ranking.percentile.toFixed(1)}%
            </span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
