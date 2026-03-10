/**
 * 베스트 데이 하이라이트 카드
 * Phase 3: 가장 건강한 날 / 개선 필요한 날 표시
 */

'use client';

import { Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BestDayHighlightCardProps {
  bestDay: string | null;
  bestDayScore: number;
  worstDay: string | null;
  worstDayScore: number;
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = dayNames[date.getDay()];
  return `${month}/${day} (${dayName})`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '훌륭해요';
  if (score >= 60) return '좋아요';
  if (score >= 40) return '괜찮아요';
  return '아쉬워요';
}

export function BestDayHighlightCard({
  bestDay,
  bestDayScore,
  worstDay,
  worstDayScore,
}: BestDayHighlightCardProps): React.ReactElement | null {
  // 데이터가 없으면 렌더링하지 않음
  if (!bestDay) return null;

  return (
    <Card data-testid="best-day-highlight-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="font-medium text-sm">이번 주 하이라이트</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 베스트 데이 */}
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">가장 건강한 날</div>
            <div className="font-semibold text-sm">{formatDayLabel(bestDay)}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className={`text-sm font-bold ${getScoreColor(bestDayScore)}`}>
                {bestDayScore}점
              </span>
              <span className="text-xs text-muted-foreground">{getScoreLabel(bestDayScore)}</span>
            </div>
          </div>

          {/* 개선 필요한 날 */}
          {worstDay && worstDayScore < bestDayScore && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">다음엔 더 잘할 수 있어요</div>
              <div className="font-semibold text-sm">{formatDayLabel(worstDay)}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-sm font-bold ${getScoreColor(worstDayScore)}`}>
                  {worstDayScore}점
                </span>
                <span className="text-xs text-muted-foreground">
                  {getScoreLabel(worstDayScore)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
