/**
 * 베스트 위크 하이라이트 카드 (월간 리포트 전용)
 * Phase 4: 가장 건강한 주 / 개선 필요한 주 표시
 */

'use client';

import { Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface BestWeekHighlightCardProps {
  bestWeek: number | null;
  bestWeekScore: number;
  worstWeek: number | null;
  worstWeekScore: number;
}

function formatWeekLabel(week: number): string {
  return `${week}주차`;
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

export function BestWeekHighlightCard({
  bestWeek,
  bestWeekScore,
  worstWeek,
  worstWeekScore,
}: BestWeekHighlightCardProps): React.ReactElement | null {
  const t = useTranslations('reportsUI');
  if (!bestWeek) return null;

  return (
    <Card data-testid="best-week-highlight-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="font-medium text-sm">{t('bestWeekHighlightCard0')}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 베스트 위크 */}
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">{t('bestWeekHighlightCard1')}</div>
            <div className="font-semibold text-sm">{formatWeekLabel(bestWeek)}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className={`text-sm font-bold ${getScoreColor(bestWeekScore)}`}>
                {bestWeekScore}점
              </span>
              <span className="text-xs text-muted-foreground">{getScoreLabel(bestWeekScore)}</span>
            </div>
          </div>

          {/* 개선 필요한 주 */}
          {worstWeek && worstWeekScore < bestWeekScore && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">
                {t('bestWeekHighlightCard2')}
              </div>
              <div className="font-semibold text-sm">{formatWeekLabel(worstWeek)}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-sm font-bold ${getScoreColor(worstWeekScore)}`}>
                  {worstWeekScore}점
                </span>
                <span className="text-xs text-muted-foreground">
                  {getScoreLabel(worstWeekScore)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
