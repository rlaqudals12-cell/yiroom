'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Palette,
  Scan,
  Activity,
  ChevronRight,
  Lightbulb,
  Heart,
  ShoppingBag,
  Zap,
  AlertCircle,
} from 'lucide-react';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import {
  generateInsights,
  analysisToDataBundle,
  type Insight,
  type InsightCategory,
  type InsightPriority,
} from '@/lib/insights';

interface CrossModuleCardProps {
  analyses: AnalysisSummary[];
  hasPersonalColor: boolean;
  hasSkin: boolean;
  hasBody: boolean;
  className?: string;
}

// 분석 모듈 설정
const ANALYSIS_MODULES = [
  {
    key: 'personal-color',
    label: '퍼스널 컬러',
    icon: Palette,
    href: '/analysis/personal-color',
    color: 'text-violet-500',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  {
    key: 'skin',
    label: '피부 분석',
    icon: Scan,
    href: '/analysis/skin',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    key: 'body',
    label: '체형 분석',
    icon: Activity,
    href: '/analysis/body',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
] as const;

// 카테고리별 아이콘/색상 매핑
const CATEGORY_CONFIG: Record<
  InsightCategory,
  { icon: typeof Sparkles; color: string; bgColor: string; label: string }
> = {
  color_match: {
    icon: Palette,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/50',
    label: '컬러 매칭',
  },
  skin_care: {
    icon: Heart,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/50',
    label: '스킨케어',
  },
  style_tip: {
    icon: Sparkles,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/50',
    label: '스타일 팁',
  },
  product_recommendation: {
    icon: ShoppingBag,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
    label: '제품 추천',
  },
  health_alert: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
    label: '건강 알림',
  },
  routine_suggestion: {
    icon: Lightbulb,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/50',
    label: '루틴 제안',
  },
  synergy: {
    icon: Zap,
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/50',
    label: '시너지',
  },
};

// 우선순위 배지 색상
const PRIORITY_BADGE_COLORS: Record<InsightPriority, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

/**
 * 인사이트 카드 컴포넌트
 */
function InsightItem({ insight }: { insight: Insight }) {
  const config = CATEGORY_CONFIG[insight.category];
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors',
        'bg-gradient-to-r from-muted/50 to-muted/30',
        'hover:from-muted/70 hover:to-muted/50'
      )}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
          config.bgColor
        )}
      >
        <IconComponent className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm text-foreground truncate">{insight.title}</p>
          <Badge
            variant="secondary"
            className={cn('text-[10px] px-1.5 py-0 h-4', PRIORITY_BADGE_COLORS[insight.priority])}
          >
            {insight.priorityScore}점
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
      </div>
    </div>
  );
}

/**
 * 크로스모듈 인사이트 카드
 * - 분석 진행률 표시
 * - lib/insights 모듈 기반 통합 인사이트
 * - 미완료 분석 CTA
 */
export default function CrossModuleCard({
  analyses,
  hasPersonalColor,
  hasSkin,
  hasBody,
  className,
}: CrossModuleCardProps) {
  // 진행률 계산
  const completedModules = [hasPersonalColor, hasSkin, hasBody].filter(Boolean).length;
  const totalModules = 3;
  const progressPercent = Math.round((completedModules / totalModules) * 100);

  // 완료된 모듈 상태
  const moduleStatus = useMemo(
    () => ({
      'personal-color': hasPersonalColor,
      skin: hasSkin,
      body: hasBody,
    }),
    [hasPersonalColor, hasSkin, hasBody]
  );

  // lib/insights 모듈을 통한 인사이트 생성
  const insights = useMemo(() => {
    const dataBundle = analysisToDataBundle(analyses);
    const result = generateInsights(dataBundle, {
      maxInsights: 4,
      minPriorityScore: 20,
      language: 'ko',
    });
    return result.insights;
  }, [analyses]);

  // 다음 추천 분석
  const nextAnalysis = useMemo(() => {
    // 순서: PC → Skin → Body
    if (!hasPersonalColor) return ANALYSIS_MODULES[0];
    if (!hasSkin) return ANALYSIS_MODULES[1];
    if (!hasBody) return ANALYSIS_MODULES[2];
    return null;
  }, [hasPersonalColor, hasSkin, hasBody]);

  // 모든 분석 완료 시 인사이트 중심 표시
  if (completedModules === totalModules) {
    return (
      <Card className={cn('overflow-hidden', className)} data-testid="cross-module-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            통합 분석 인사이트
            {insights.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {insights.length}개 발견
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 인사이트 목록 */}
          {insights.length > 0 ? (
            <div className="space-y-2">
              {insights.map((insight) => (
                <InsightItem key={insight.id} insight={insight} />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              분석 데이터를 기반으로 인사이트를 생성 중입니다...
            </div>
          )}

          {/* 분석 완료 상태 */}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">모든 분석 완료</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {completedModules}/{totalModules} 완료
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="cross-module-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-500" />
          </div>
          통합 분석 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 진행률 바 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">분석 진행률</span>
            <span className="font-medium">
              {completedModules}/{totalModules} 완료
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* 모듈 상태 */}
        <div className="grid grid-cols-3 gap-2">
          {ANALYSIS_MODULES.map((module) => {
            const isCompleted = moduleStatus[module.key];
            const ModuleIcon = module.icon;

            return (
              <Link
                key={module.key}
                href={isCompleted ? `/analysis/${module.key}/result` : module.href}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors',
                  isCompleted ? 'bg-muted/50' : 'bg-muted/30 hover:bg-muted/50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    isCompleted ? module.bgColor : 'bg-muted'
                  )}
                >
                  <ModuleIcon
                    className={cn('w-4 h-4', isCompleted ? module.color : 'text-muted-foreground')}
                  />
                </div>
                <span className="text-xs text-center">{module.label}</span>
                <span
                  className={cn(
                    'text-[10px]',
                    isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                  )}
                >
                  {isCompleted ? '완료' : '미완료'}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 인사이트 (2개 이상 완료 시) */}
        {insights.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">발견된 인사이트</p>
            {insights.slice(0, 2).map((insight) => {
              const config = CATEGORY_CONFIG[insight.category];
              return (
                <div key={insight.id} className="flex items-start gap-2 text-sm">
                  <config.icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', config.color)} />
                  <p className="text-muted-foreground line-clamp-2">{insight.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* 다음 분석 CTA */}
        {nextAnalysis && (
          <div className="pt-2 border-t">
            <Link href={nextAnalysis.href}>
              <Button variant="outline" className="w-full justify-between group">
                <span className="flex items-center gap-2">
                  <nextAnalysis.icon className={cn('w-4 h-4', nextAnalysis.color)} />
                  {nextAnalysis.label} 시작하기
                </span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {!hasPersonalColor
                ? '퍼스널컬러를 먼저 분석하면 다른 분석도 더 정확해져요'
                : '분석을 완료하면 통합 인사이트를 받을 수 있어요'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
