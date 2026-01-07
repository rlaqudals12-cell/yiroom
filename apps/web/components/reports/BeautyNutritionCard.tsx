/**
 * R-1 뷰티-영양 상관관계 카드 컴포넌트
 * H-1/M-1 → N-1 연동 인사이트 표시
 */

'use client';

import { Sparkles, Droplet, Scissors, Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { BeautyNutritionCorrelation, TrendDirection } from '@/types/report';

interface BeautyNutritionCardProps {
  correlation: BeautyNutritionCorrelation;
}

// 트렌드 아이콘
function TrendIcon({ trend }: { trend: TrendDirection }) {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

// 점수 색상
function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

// 프로그레스 색상
function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

// 임팩트 배지
function ImpactBadge({ impact }: { impact: 'positive' | 'neutral' | 'negative' }) {
  const styles = {
    positive: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    negative: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  };
  const labels = {
    positive: '좋음',
    neutral: '보통',
    negative: '부족',
  };

  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${styles[impact]}`}>{labels[impact]}</span>
  );
}

export function BeautyNutritionCard({ correlation }: BeautyNutritionCardProps) {
  const { hairHealth, skinHealth, nutrientImpacts, correlationSummary, recommendations } =
    correlation;

  return (
    <Card data-testid="beauty-nutrition-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pink-500" />
          뷰티-영양 상관관계
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 종합 점수 */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">뷰티-영양 조화도</p>
            <p className="text-2xl font-bold">{correlationSummary.overallScore}점</p>
          </div>
          <div className="flex items-center gap-2">
            <TrendIcon trend={correlationSummary.trend} />
            <span className="text-sm">{correlationSummary.message}</span>
          </div>
        </div>

        {/* 뷰티 건강 요약 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 헤어 건강 */}
          {hairHealth && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Scissors className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">헤어 건강</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">두피</span>
                  <span className={getScoreColor(hairHealth.scalpScore)}>
                    {hairHealth.scalpScore ?? '-'}점
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">밀도</span>
                  <span className={getScoreColor(hairHealth.densityScore)}>
                    {hairHealth.densityScore ?? '-'}점
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">종합</span>
                  <span className={`font-medium ${getScoreColor(hairHealth.overallScore)}`}>
                    {hairHealth.overallScore ?? '-'}점
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 피부 건강 */}
          {skinHealth && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-sm font-medium">피부 건강</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">수분</span>
                  <span className={getScoreColor(skinHealth.hydration)}>
                    {skinHealth.hydration ?? '-'}점
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">텍스처</span>
                  <span className={getScoreColor(skinHealth.texture)}>
                    {skinHealth.texture ?? '-'}점
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">종합</span>
                  <span className={`font-medium ${getScoreColor(skinHealth.overallScore)}`}>
                    {skinHealth.overallScore ?? '-'}점
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 영양소별 임팩트 */}
        {nutrientImpacts.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Droplet className="h-4 w-4 text-blue-500" />
              뷰티 영양소 섭취 현황
            </p>
            <div className="space-y-2">
              {nutrientImpacts.slice(0, 4).map((impact) => (
                <div key={impact.nutrient} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{impact.label}</span>
                    <div className="flex items-center gap-2">
                      <span>{impact.percentage}%</span>
                      <ImpactBadge impact={impact.impact} />
                    </div>
                  </div>
                  <Progress
                    value={impact.percentage}
                    className="h-1.5"
                    indicatorClassName={getProgressColor(impact.percentage)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 추천사항 */}
        {recommendations.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">영양 추천</p>
            <ul className="space-y-1.5">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-pink-500 mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
