'use client';

import {
  Lightbulb,
  Scale,
  TrendingUp,
  Flame,
  Users,
  Sparkles,
  Star,
} from 'lucide-react';
import { GeminiWorkoutInsightResult } from '@/lib/gemini';

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
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-200',
  },
  progress: {
    icon: <TrendingUp className="w-5 h-5" />,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-500',
    borderColor: 'border-green-200',
  },
  streak: {
    icon: <Flame className="w-5 h-5" />,
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500',
    borderColor: 'border-orange-200',
  },
  comparison: {
    icon: <Users className="w-5 h-5" />,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-200',
  },
  tip: {
    icon: <Lightbulb className="w-5 h-5" />,
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    borderColor: 'border-yellow-200',
  },
};

// 우선순위별 라벨 스타일
const PRIORITY_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  high: { label: '중요', className: 'bg-red-100 text-red-700' },
  medium: { label: '참고', className: 'bg-gray-100 text-gray-600' },
  low: { label: '팁', className: 'bg-gray-50 text-gray-500' },
};

export default function WorkoutInsightCard({ insights }: WorkoutInsightCardProps) {
  const { insights: insightItems, weeklyHighlight, motivationalMessage } = insights;

  return (
    <div
      data-testid="workout-insight-card"
      className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100"
    >
      {/* 헤더 */}
      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        AI 인사이트
      </h3>

      {/* 주간 하이라이트 */}
      {weeklyHighlight && (
        <div className="bg-white/70 rounded-xl p-4 mb-4 border border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-indigo-600 mb-1">
                이번 주 하이라이트
              </p>
              <p className="text-sm text-gray-800 font-medium">
                {weeklyHighlight}
              </p>
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
                    className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 ${style.iconColor}`}
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
                    <p className="text-sm text-gray-800">{insight.message}</p>

                    {/* 추가 데이터 표시 */}
                    {insight.data && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        {insight.data.trend && (
                          <span
                            className={`flex items-center gap-1 ${
                              insight.data.trend === 'up'
                                ? 'text-green-600'
                                : insight.data.trend === 'down'
                                  ? 'text-red-600'
                                  : 'text-gray-500'
                            }`}
                          >
                            {insight.data.trend === 'up' && '↑'}
                            {insight.data.trend === 'down' && '↓'}
                            {insight.data.trend === 'stable' && '→'}
                            {insight.data.percentage !== undefined &&
                              `${insight.data.percentage}%`}
                          </span>
                        )}
                        {insight.data.targetArea && (
                          <span className="text-gray-400">
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
          <p className="text-sm font-medium text-center">
            {motivationalMessage}
          </p>
        </div>
      )}

      {/* 인사이트가 없는 경우 */}
      {insightItems.length === 0 && !weeklyHighlight && !motivationalMessage && (
        <div className="text-center py-6 text-gray-400">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">아직 인사이트가 없습니다</p>
          <p className="text-xs mt-1">운동 기록을 쌓으면 맞춤 인사이트를 제공해드려요</p>
        </div>
      )}
    </div>
  );
}
