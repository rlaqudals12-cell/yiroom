'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ScoreBreakdown } from '@/types/wellness';
import { Dumbbell, Utensils, Sparkles, User } from 'lucide-react';

interface WellnessBreakdownProps {
  breakdown: ScoreBreakdown;
  showDetails?: boolean;
}

// 영역별 설정
const AREA_CONFIG = {
  workout: {
    label: '운동',
    icon: Dumbbell,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    progressColor: 'bg-orange-500',
    items: [
      { key: 'streak', label: '스트릭 유지', max: 10 },
      { key: 'frequency', label: '운동 빈도', max: 10 },
      { key: 'goal', label: '목표 달성률', max: 5 },
    ],
  },
  nutrition: {
    label: '영양',
    icon: Utensils,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    progressColor: 'bg-green-500',
    items: [
      { key: 'calorie', label: '칼로리 목표', max: 10 },
      { key: 'balance', label: '영양소 균형', max: 10 },
      { key: 'water', label: '수분 섭취', max: 5 },
    ],
  },
  skin: {
    label: '피부',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    progressColor: 'bg-purple-500',
    items: [
      { key: 'analysis', label: '분석 완료', max: 10 },
      { key: 'routine', label: '루틴 준수', max: 10 },
      { key: 'matching', label: '제품 매칭도', max: 5 },
    ],
  },
  body: {
    label: '체형',
    icon: User,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    progressColor: 'bg-blue-500',
    items: [
      { key: 'analysis', label: '분석 완료', max: 10 },
      { key: 'progress', label: '목표 진행률', max: 10 },
      { key: 'workout', label: '운동 연동', max: 5 },
    ],
  },
} as const;

type AreaKey = keyof typeof AREA_CONFIG;

export function WellnessBreakdown({
  breakdown,
  showDetails = true,
}: WellnessBreakdownProps) {
  const areas: AreaKey[] = ['workout', 'nutrition', 'skin', 'body'];

  // 영역별 총점 계산
  const getAreaTotal = (area: AreaKey): number => {
    const config = AREA_CONFIG[area];
    const areaData = breakdown[area];
    return config.items.reduce((sum, item) => {
      const value = areaData[item.key as keyof typeof areaData] as number;
      return sum + (value || 0);
    }, 0);
  };

  return (
    <div className="space-y-4" data-testid="wellness-breakdown">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {areas.map((area) => {
          const config = AREA_CONFIG[area];
          const Icon = config.icon;
          const areaData = breakdown[area];
          const total = getAreaTotal(area);

          return (
            <Card key={area} data-testid={`wellness-breakdown-${area}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <span>{config.label}</span>
                  <span className={`ml-auto font-bold ${config.color}`}>
                    {total}/25
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 총점 프로그레스 */}
                <Progress
                  value={(total / 25) * 100}
                  className="h-2 mb-3"
                />

                {/* 세부 항목 */}
                {showDetails && (
                  <div className="space-y-2">
                    {config.items.map((item) => {
                      const value = areaData[item.key as keyof typeof areaData] as number;
                      const percentage = item.max > 0 ? (value / item.max) * 100 : 0;

                      return (
                        <div key={item.key} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground w-20 truncate">
                            {item.label}
                          </span>
                          <div className="flex-1">
                            <Progress
                              value={percentage}
                              className="h-1.5"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {value}/{item.max}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
