'use client';

import type { SynergyInsightCardProps, ColorAdjustment } from '@/types/visual-analysis';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 컬러 조정 방향별 설정
 */
const ADJUSTMENT_CONFIG: Record<
  ColorAdjustment,
  {
    icon: string;
    label: string;
    bgClass: string;
    textClass: string;
  }
> = {
  muted: {
    icon: '🎨',
    label: '뮤트 컬러 추천',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    textClass: 'text-slate-700 dark:text-slate-300',
  },
  bright: {
    icon: '✨',
    label: '브라이트 컬러 추천',
    bgClass: 'bg-yellow-50 dark:bg-yellow-900/30',
    textClass: 'text-yellow-800 dark:text-yellow-200',
  },
  neutral: {
    icon: '💫',
    label: '다양한 컬러 가능',
    bgClass: 'bg-purple-50 dark:bg-purple-900/30',
    textClass: 'text-purple-800 dark:text-purple-200',
  },
};

/**
 * Phase 3: 시너지 인사이트 카드
 * - S-1 피부 분석 + PC-1 퍼스널컬러 연동 인사이트
 * - 피부 상태에 따른 컬러 추천 조정
 */
export default function SynergyInsightCard({
  insight,
  bestColors,
  avoidColors,
  className,
}: SynergyInsightCardProps) {
  const config = ADJUSTMENT_CONFIG[insight.colorAdjustment];

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="synergy-insight-card">
      {/* 헤더 */}
      <CardHeader className={cn('py-3', config.bgClass)}>
        <CardTitle className={cn('text-sm font-medium flex items-center gap-2', config.textClass)}>
          <span className="text-lg">{config.icon}</span>
          {config.label}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* 인사이트 메시지 */}
        <p className="text-sm leading-relaxed">{insight.message}</p>

        {/* 베스트 컬러 */}
        {bestColors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">추천 컬러</h4>
            <div className="flex gap-2">
              {bestColors.slice(0, 5).map((result, index) => (
                <div key={result.color} className="relative">
                  <div
                    className="w-8 h-8 rounded-md border shadow-sm"
                    style={{ backgroundColor: result.color }}
                    title={`${index + 1}위: ${result.color}`}
                  />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 피해야 할 컬러 */}
        {avoidColors && avoidColors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">주의할 컬러</h4>
            <div className="flex gap-2">
              {avoidColors.map((color) => (
                <div key={color} className="relative">
                  <div
                    className="w-6 h-6 rounded border opacity-60"
                    style={{ backgroundColor: color }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-white font-bold drop-shadow">✕</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 분석 근거 */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">{getReasonDescription(insight.reason)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 이유별 설명 텍스트
 */
function getReasonDescription(reason: string): string {
  const descriptions: Record<string, string> = {
    high_redness: '피부 붉은기를 고려한 추천이에요',
    low_hydration: '밝은 피부톤을 고려한 추천이에요',
    high_oiliness: '깊은 피부톤을 고려한 추천이에요',
    normal: '균형 잡힌 피부 상태에요',
  };
  return descriptions[reason] || '피부 분석 결과 기반 추천이에요';
}

/**
 * 시너지 점수 배지
 */
export function SynergyScoreBadge({ score, className }: { score: number; className?: string }) {
  const getScoreConfig = (s: number) => {
    if (s >= 80) return { label: '최적', color: 'bg-green-500' };
    if (s >= 60) return { label: '좋음', color: 'bg-blue-500' };
    if (s >= 40) return { label: '보통', color: 'bg-yellow-500' };
    return { label: '개선 필요', color: 'bg-red-500' };
  };

  const config = getScoreConfig(score);

  return (
    <div className={cn('flex items-center gap-2', className)} data-testid="synergy-score-badge">
      <div className={cn('w-2 h-2 rounded-full', config.color)} />
      <span className="text-sm font-medium">{score}점</span>
      <span className="text-xs text-muted-foreground">({config.label})</span>
    </div>
  );
}

/**
 * 간단한 인라인 시너지 표시
 */
export function SynergyInline({
  insight,
  className,
}: {
  insight: { message: string; colorAdjustment: ColorAdjustment };
  className?: string;
}) {
  const config = ADJUSTMENT_CONFIG[insight.colorAdjustment];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
        config.bgClass,
        config.textClass,
        className
      )}
      data-testid="synergy-inline"
    >
      <span>{config.icon}</span>
      <span className="font-medium">{insight.message}</span>
    </div>
  );
}
