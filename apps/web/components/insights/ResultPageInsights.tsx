'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Palette, Heart, ShoppingBag, Lightbulb, AlertCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import {
  generateInsightsForModule,
  analysisToDataBundle,
  type Insight,
  type InsightCategory,
  type AnalysisModule,
} from '@/lib/insights';

// 현재 모듈 → AnalysisModule 매핑 (URL 하이픈 → 인사이트 언더스코어)
const MODULE_MAP: Record<string, AnalysisModule> = {
  'personal-color': 'personal_color',
  skin: 'skin',
  body: 'body',
  hair: 'hair',
  makeup: 'face',
  posture: 'body',
  'oral-health': 'oral_health',
};

// 카테고리별 아이콘/색상
const CATEGORY_STYLE: Record<
  InsightCategory,
  { icon: typeof Sparkles; color: string; bgColor: string }
> = {
  color_match: {
    icon: Palette,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/50',
  },
  skin_care: {
    icon: Heart,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/50',
  },
  style_tip: {
    icon: Sparkles,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/50',
  },
  product_recommendation: {
    icon: ShoppingBag,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
  },
  health_alert: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/50',
  },
  routine_suggestion: {
    icon: Lightbulb,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/50',
  },
  synergy: {
    icon: Zap,
    color: 'text-fuchsia-600 dark:text-fuchsia-400',
    bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/50',
  },
};

interface ResultPageInsightsProps {
  /** 현재 결과 페이지의 모듈 (URL 형식: 'skin', 'personal-color' 등) */
  currentModule: string;
  className?: string;
}

/**
 * 분석 결과 페이지에 표시되는 크로스 모듈 인사이트
 * - 다른 모듈 분석 데이터와 결합하여 인사이트 생성
 * - 최소 2개 모듈 완료 시에만 표시
 */
export default function ResultPageInsights({ currentModule, className }: ResultPageInsightsProps) {
  const { analyses, analysisCount, isLoading } = useAnalysisStatus();

  // 현재 모듈에 대한 인사이트 생성
  const insights = useMemo(() => {
    // 2개 이상 분석 완료 시에만 크로스 모듈 인사이트 생성
    if (analysisCount < 2) return [];

    const moduleKey = MODULE_MAP[currentModule];
    if (!moduleKey) return [];

    const dataBundle = analysisToDataBundle(analyses);
    return generateInsightsForModule(dataBundle, moduleKey).slice(0, 3);
  }, [analyses, analysisCount, currentModule]);

  // 로딩 중이거나 인사이트 없으면 렌더링 안 함
  if (isLoading || insights.length === 0) return null;

  return (
    <div
      className={cn('bg-card rounded-2xl border border-border/50 p-5', className)}
      data-testid="result-page-insights"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">통합 인사이트</h3>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {insights.length}개
        </Badge>
      </div>

      {/* 인사이트 목록 */}
      <div className="space-y-3">
        {insights.map((insight) => (
          <InsightRow key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

/**
 * 인사이트 한 줄 표시
 */
function InsightRow({ insight }: { insight: Insight }) {
  const style = CATEGORY_STYLE[insight.category];
  const IconComponent = style.icon;

  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          style.bgColor
        )}
      >
        <IconComponent className={cn('w-4 h-4', style.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{insight.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
      </div>
    </div>
  );
}
