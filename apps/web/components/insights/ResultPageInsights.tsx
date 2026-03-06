'use client';

/**
 * 분석 결과 페이지 크로스 모듈 인사이트 + ConnectionAwareness 내재화 추적
 *
 * - 인사이트 노출 시 자동 expose (내재화 카운트 증가)
 * - "이해했어요" 버튼으로 confirm (상태 전이 촉진)
 * - 내재화 상태에 따라 설명 깊이 분기 (full → brief → minimal → none)
 * - 7개 모든 결과 페이지에서 자동 적용 (import 변경 없음)
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Palette,
  Heart,
  ShoppingBag,
  Lightbulb,
  AlertCircle,
  Zap,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import {
  generateInsightsForModule,
  analysisToDataBundle,
  type Insight,
  type InsightCategory,
  type AnalysisModule,
} from '@/lib/insights';
import type { ConnectionStatus, ExplanationDepth } from '@/lib/connection-awareness';
import {
  exposeConnection,
  confirmConnection,
  getExplanationDepth,
  insightToExposeRequest,
} from '@/lib/connection-awareness';

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

// 내재화 상태 라벨
const STATUS_LABELS: Record<ConnectionStatus, string> = {
  exposed: '새로운 발견',
  recognized: '알아가는 중',
  internalized: '내 것이 되는 중',
  independent: '자립적 판단 가능',
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
 * - ConnectionAwareness로 내재화 추적
 */
export default function ResultPageInsights({ currentModule, className }: ResultPageInsightsProps) {
  const { analyses, analysisCount, isLoading } = useAnalysisStatus();
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const userId = user?.id;

  // 각 인사이트의 내재화 상태
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionStatus>>(
    {}
  );
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  // 현재 모듈에 대한 인사이트 생성
  const insights = useMemo(() => {
    if (analysisCount < 2) return [];

    const moduleKey = MODULE_MAP[currentModule];
    if (!moduleKey) return [];

    const dataBundle = analysisToDataBundle(analyses);
    return generateInsightsForModule(dataBundle, moduleKey).slice(0, 3);
  }, [analyses, analysisCount, currentModule]);

  // 인사이트 노출 시 ConnectionAwareness 기록
  useEffect(() => {
    if (!userId || insights.length === 0) return;

    async function trackExposure(): Promise<void> {
      const statuses: Record<string, ConnectionStatus> = {};

      for (const insight of insights) {
        const request = insightToExposeRequest(insight);
        try {
          const response = await exposeConnection(supabase, userId!, request);
          statuses[request.connectionId] = response.status;
        } catch {
          // 노출 기록 실패해도 UI 정상 표시
        }
      }

      setConnectionStatuses(statuses);
    }

    trackExposure();
  }, [userId, insights, supabase]);

  // 사용자 확인 핸들러
  const handleConfirm = useCallback(
    async (insight: Insight) => {
      if (!userId) return;

      const request = insightToExposeRequest(insight);
      try {
        const response = await confirmConnection(supabase, userId, request.connectionId);
        setConnectionStatuses((prev) => ({
          ...prev,
          [request.connectionId]: response.status,
        }));
        setConfirmedIds((prev) => new Set(prev).add(request.connectionId));
      } catch {
        // 확인 실패 시 무시
      }
    },
    [userId, supabase]
  );

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
        {insights.map((insight) => {
          const connectionId = insightToExposeRequest(insight).connectionId;
          const status = connectionStatuses[connectionId] ?? 'exposed';
          const depth = getExplanationDepth(status);
          const isConfirmed = confirmedIds.has(connectionId);

          return (
            <InsightRow
              key={insight.id}
              insight={insight}
              depth={depth}
              status={status}
              isConfirmed={isConfirmed}
              onConfirm={() => handleConfirm(insight)}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * 인사이트 한 줄 표시 (내재화 상태 반영)
 */
function InsightRow({
  insight,
  depth,
  status,
  isConfirmed,
  onConfirm,
}: {
  insight: Insight;
  depth: ExplanationDepth;
  status: ConnectionStatus;
  isConfirmed: boolean;
  onConfirm: () => void;
}) {
  const style = CATEGORY_STYLE[insight.category];
  const IconComponent = style.icon;

  // 완전 내재화 — 제목만 간결하게
  if (depth === 'none') {
    return (
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            style.bgColor
          )}
        >
          <IconComponent className={cn('w-4 h-4', style.color)} />
        </div>
        <p className="text-sm font-medium text-foreground flex-1">{insight.title}</p>
        <span className="text-xs text-emerald-500 font-medium">{STATUS_LABELS[status]}</span>
      </div>
    );
  }

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
        {/* 내재화 상태 뱃지 */}
        {status !== 'exposed' && (
          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 mb-1">
            {STATUS_LABELS[status]}
          </span>
        )}

        <p className="text-sm font-medium text-foreground">{insight.title}</p>

        {/* 설명 — depth에 따라 분기 */}
        {depth === 'full' && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
        )}
        {depth === 'brief' && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            {insight.description}
          </p>
        )}
        {/* minimal: 설명 생략 */}

        {/* 확인 버튼 — depth가 minimal이 아닐 때만 표시 */}
        {depth !== 'minimal' && (
          <div className="mt-1">
            {isConfirmed ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500">
                <Check className="w-3 h-3" />
                이해했어요
              </span>
            ) : (
              <button
                onClick={onConfirm}
                className="inline-flex items-center gap-1 text-[11px] text-violet-500 hover:text-violet-600 transition-colors"
              >
                <Check className="w-3 h-3" />
                이해했어요
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
