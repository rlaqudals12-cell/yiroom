'use client';

import { Lightbulb, Scale, TrendingUp, Flame, Users, Sparkles, Star } from 'lucide-react';
import { GeminiWorkoutInsightResult } from '@/lib/gemini';
import { mapToClass } from '@/lib/utils/conditional-helpers';
import { useTranslations } from 'next-intl';

interface WorkoutInsightCardProps {
  insights: GeminiWorkoutInsightResult;
}

// 인사이트 타입별 스타일 설정
const INSIGHT_TYPE_STYLES: Record<
  string,
  {
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
    borderColor: string;
  }
> = {
  balance: {
    icon: <Scale className="w-5 h-5" />,
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  progress: {
    icon: <TrendingUp className="w-5 h-5" />,
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    iconColor: 'text-green-500',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  streak: {
    icon: <Flame className="w-5 h-5" />,
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    iconColor: 'text-orange-500',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  comparison: {
    icon: <Users className="w-5 h-5" />,
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  tip: {
    icon: <Lightbulb className="w-5 h-5" />,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    iconColor: 'text-yellow-600',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
};

// 우선순위별 라벨 스타일
const PRIORITY_STYLES: Record<string, { label: string; className: string }> = {
  high: {
    label: '중요',
    className: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  },
  medium: { label: '참고', className: 'bg-muted text-muted-foreground' },
  low: { label: '팁', className: 'bg-muted/50 text-muted-foreground' },
};

export default function WorkoutInsightCard({ insights }: WorkoutInsightCardProps) {
  const t = useTranslations('workoutUI');
  const { insights: insightItems, weeklyHighlight, motivationalMessage } = insights;

  return (
    <div
      data-testid="workout-insight-card"
      className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800"
    >
      {/* 헤더 */}
      <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        AI 인사이트
      </h3>

      {/* 주간 하이라이트 */}
      {weeklyHighlight && (
        <div className="bg-card/70 rounded-xl p-4 mb-4 border border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-600 mb-1">{t('workoutInsightCard0')}</p>
              <p className="text-sm text-foreground font-medium">{weeklyHighlight}</p>
            </div>
          </div>
        </div>
      )}

      {/* 인사이트 리스트 */}
      {insightItems.length > 0 && (
        <div className="space-y-3 mb-4">
          {insightItems.map((insight, index) => {
            const style = INSIGHT_TYPE_STYLES[insight.type] || INSIGHT_TYPE_STYLES.tip;
            const priority = PRIORITY_STYLES[insight.priority] || PRIORITY_STYLES.low;

            return (
              <div
                key={index}
                data-testid={`insight-item-${insight.type}`}
                className={`${style.bgColor} rounded-xl p-4 border ${style.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  {/* 아이콘 */}
                  <div
                    className={`w-8 h-8 bg-card rounded-lg flex items-center justify-center flex-shrink-0 ${style.iconColor}`}
                  >
                    {style.icon}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {insight.priority === 'high' && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${priority.className}`}
                        >
                          {priority.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{insight.message}</p>

                    {/* 추가 데이터 표시 */}
                    {insight.data && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {insight.data.trend && (
                          <span
                            className={`flex items-center gap-1 ${mapToClass(
                              insight.data.trend,
                              {
                                up: 'text-green-600',
                                down: 'text-red-600',
                                stable: 'text-muted-foreground',
                              },
                              'text-muted-foreground'
                            )}`}
                          >
                            {insight.data.trend === 'up' && '↑'}
                            {insight.data.trend === 'down' && '↓'}
                            {insight.data.trend === 'stable' && '→'}
                            {insight.data.percentage !== undefined && `${insight.data.percentage}%`}
                          </span>
                        )}
                        {insight.data.targetArea && (
                          <span className="text-muted-foreground">
                            집중 부위: {insight.data.targetArea}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 동기부여 메시지 */}
      {motivationalMessage && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white">
          <p className="text-sm font-medium text-center">{motivationalMessage}</p>
        </div>
      )}

      {/* 인사이트가 없는 경우 */}
      {insightItems.length === 0 && !weeklyHighlight && !motivationalMessage && (
        <div className="text-center py-6 text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('workoutInsightCard1')}</p>
          <p className="text-xs mt-1">{t('workoutInsightCard2')}</p>
        </div>
      )}
    </div>
  );
}
