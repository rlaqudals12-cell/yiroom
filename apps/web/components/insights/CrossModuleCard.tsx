'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles,
  Palette,
  Scan,
  Activity,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

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

// 크로스 인사이트 생성
function generateCrossInsights(analyses: AnalysisSummary[]): {
  title: string;
  description: string;
  icon: typeof Sparkles;
}[] {
  const insights: { title: string; description: string; icon: typeof Sparkles }[] = [];

  const pc = analyses.find((a) => a.type === 'personal-color');
  const skin = analyses.find((a) => a.type === 'skin');
  const body = analyses.find((a) => a.type === 'body');

  // PC + Skin 조합
  if (pc && skin) {
    const isCool = pc.seasonType?.toLowerCase().includes('summer') ||
                   pc.seasonType?.toLowerCase().includes('winter');
    const skinScore = skin.skinScore || 50;

    if (isCool && skinScore < 60) {
      insights.push({
        title: '쿨톤 + 민감 피부',
        description: '차분한 핑크, 라벤더 계열이 피부 붉은기를 커버해요',
        icon: Palette,
      });
    } else if (!isCool && skinScore >= 70) {
      insights.push({
        title: '웜톤 + 건강 피부',
        description: '코랄, 피치 계열로 화사함을 강조해보세요',
        icon: Sparkles,
      });
    }
  }

  // PC + Body 조합
  if (pc && body) {
    const seasonLabel = pc.seasonType?.toLowerCase() || '';
    const bodyType = body.bodyType?.toLowerCase() || '';

    if (seasonLabel && bodyType) {
      insights.push({
        title: '컬러 + 체형 스타일링',
        description: `${pc.summary} 톤의 ${body.summary} 체형에 맞는 스타일을 확인해보세요`,
        icon: Activity,
      });
    }
  }

  // 기본 인사이트 (분석이 2개 이상일 때)
  if (insights.length === 0 && analyses.length >= 2) {
    insights.push({
      title: '통합 분석 완료',
      description: '여러 분석 결과를 바탕으로 맞춤 추천을 받아보세요',
      icon: Lightbulb,
    });
  }

  return insights;
}

/**
 * 크로스모듈 인사이트 카드
 * - 분석 진행률 표시
 * - 모듈 간 통합 인사이트
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

  // 크로스 인사이트 생성
  const crossInsights = useMemo(
    () => generateCrossInsights(analyses),
    [analyses]
  );

  // 다음 추천 분석
  const nextAnalysis = useMemo(() => {
    // 순서: PC → Skin → Body
    if (!hasPersonalColor) return ANALYSIS_MODULES[0];
    if (!hasSkin) return ANALYSIS_MODULES[1];
    if (!hasBody) return ANALYSIS_MODULES[2];
    return null;
  }, [hasPersonalColor, hasSkin, hasBody]);

  // 모든 분석 완료 시 간단한 완료 상태 표시
  if (completedModules === totalModules) {
    return (
      <Card className={cn('overflow-hidden', className)} data-testid="cross-module-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            통합 분석 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 크로스 인사이트 */}
          {crossInsights.length > 0 && (
            <div className="space-y-3">
              {crossInsights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                    <insight.icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 분석 완료 상태 */}
          <div className="flex items-center justify-between text-sm">
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
                  isCompleted
                    ? 'bg-muted/50'
                    : 'bg-muted/30 hover:bg-muted/50'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    isCompleted ? module.bgColor : 'bg-muted'
                  )}
                >
                  <ModuleIcon
                    className={cn(
                      'w-4 h-4',
                      isCompleted ? module.color : 'text-muted-foreground'
                    )}
                  />
                </div>
                <span className="text-xs text-center">{module.label}</span>
                <span
                  className={cn(
                    'text-[10px]',
                    isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {isCompleted ? '완료' : '미완료'}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 크로스 인사이트 (2개 이상 완료 시) */}
        {crossInsights.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">통합 인사이트</p>
            {crossInsights.slice(0, 2).map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm"
              >
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">{insight.description}</p>
              </div>
            ))}
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
