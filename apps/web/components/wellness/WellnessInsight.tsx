'use client';

import {
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Dumbbell,
  Utensils,
  User,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { WellnessInsight as WellnessInsightType, WellnessArea } from '@/types/wellness';

interface WellnessInsightProps {
  insights: WellnessInsightType[];
  maxItems?: number;
}

// 인사이트 타입별 설정
const INSIGHT_TYPE_CONFIG = {
  improvement: {
    icon: AlertCircle,
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    textColor: 'text-amber-600 dark:text-amber-400',
    iconColor: 'text-amber-500',
  },
  achievement: {
    icon: CheckCircle2,
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    textColor: 'text-green-600 dark:text-green-400',
    iconColor: 'text-green-500',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    textColor: 'text-red-600 dark:text-red-400',
    iconColor: 'text-red-500',
  },
  tip: {
    icon: Lightbulb,
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    textColor: 'text-blue-600 dark:text-blue-400',
    iconColor: 'text-blue-500',
  },
};

// 영역별 설정
const AREA_CONFIG: Record<WellnessArea, { icon: typeof Dumbbell; color: string }> = {
  workout: { icon: Dumbbell, color: 'text-orange-500' },
  nutrition: { icon: Utensils, color: 'text-green-500' },
  skin: { icon: Sparkles, color: 'text-purple-500' },
  body: { icon: User, color: 'text-blue-500' },
  overall: { icon: Sparkles, color: 'text-primary' },
};

export function WellnessInsight({
  insights,
  maxItems = 5,
}: WellnessInsightProps) {
  // 빈 상태
  if (!insights || insights.length === 0) {
    return (
      <Card data-testid="wellness-insight-empty">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            웰니스 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              활동을 기록하면 맞춤 인사이트가 나타나요!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 우선순위별 정렬 (priority 낮을수록 먼저) + maxItems 적용
  const sortedInsights = [...insights]
    .sort((a, b) => (a.priority ?? 5) - (b.priority ?? 5))
    .slice(0, maxItems);

  return (
    <Card data-testid="wellness-insight">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          웰니스 인사이트
          {insights.length > maxItems && (
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {maxItems}/{insights.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedInsights.map((insight, index) => (
          <InsightItem key={index} insight={insight} />
        ))}
      </CardContent>
    </Card>
  );
}

function InsightItem({ insight }: { insight: WellnessInsightType }) {
  const typeConfig = INSIGHT_TYPE_CONFIG[insight.type];
  const areaConfig = AREA_CONFIG[insight.area];
  const TypeIcon = typeConfig.icon;
  const AreaIcon = areaConfig.icon;

  return (
    <div
      className={`p-3 rounded-lg ${typeConfig.bgColor}`}
      data-testid={`wellness-insight-item-${insight.type}`}
    >
      <div className="flex items-start gap-3">
        {/* 타입 아이콘 */}
        <div className="flex-shrink-0 mt-0.5">
          <TypeIcon className={`h-4 w-4 ${typeConfig.iconColor}`} />
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          {/* 영역 태그 */}
          <div className="flex items-center gap-1.5 mb-1">
            <AreaIcon className={`h-3 w-3 ${areaConfig.color}`} />
            <span className={`text-xs font-medium ${areaConfig.color}`}>
              {getAreaLabel(insight.area)}
            </span>
            {insight.priority && insight.priority <= 2 && (
              <span className="text-xs bg-primary/10 text-primary px-1.5 rounded">
                중요
              </span>
            )}
          </div>

          {/* 메시지 */}
          <p className={`text-sm ${typeConfig.textColor}`}>{insight.message}</p>
        </div>
      </div>
    </div>
  );
}

function getAreaLabel(area: WellnessArea): string {
  const labels: Record<WellnessArea, string> = {
    workout: '운동',
    nutrition: '영양',
    skin: '피부',
    body: '체형',
    overall: '전체',
  };
  return labels[area];
}
