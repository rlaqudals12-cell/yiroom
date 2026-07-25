'use client';

/**
 * 분석 결과 페이지 크로스 모듈 인사이트 + ConnectionAwareness 내재화 추적
 * + 다음 행동 다리 (구 ContextLinkingCard 흡수 — 결과 페이지 하단 다음행동 정본 1곳, ADR-111)
 *
 * - 인사이트 노출 시 자동 expose (내재화 카운트 증가)
 * - "이해했어요" 버튼으로 confirm (상태 전이 촉진)
 * - 내재화 상태에 따라 설명 깊이 분기 (full → brief → minimal → none)
 * - 하단 고정 행: 오늘의 루틴 다리(관계 5단계 '첫 미팅 → 매일 브리핑' 고리) + 다음 분석 1행
 * - 7개 모든 결과 페이지에서 자동 적용 (import 변경 없음)
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
  CalendarCheck,
  ChevronRight,
  Wand2,
  Scissors,
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

// 다음 분석 추천 링크 (구 ContextLinkingCard의 도메인 연결 논리 이식)
interface NextAnalysisLink {
  id: string;
  title: string;
  reason: string;
  href: string;
}

// 모듈별 다음 분석 후보 — 순서 = 우선순위 (완료한 분석은 건너뛰고 첫 후보만 1행 노출)
const NEXT_ANALYSIS: Record<string, NextAnalysisLink[]> = {
  'personal-color': [
    {
      id: 'makeup',
      title: '메이크업 분석',
      reason: '퍼스널 컬러에 맞는 메이크업을 찾아보세요',
      href: '/analysis/makeup',
    },
    {
      id: 'hair',
      title: '헤어 분석',
      reason: '어울리는 헤어 컬러를 추천받아보세요',
      href: '/analysis/hair',
    },
  ],
  skin: [
    {
      id: 'makeup',
      title: '메이크업 분석',
      reason: '피부 상태에 맞는 메이크업 팁을 받아보세요',
      href: '/analysis/makeup',
    },
  ],
  body: [
    {
      id: 'personal-color',
      title: '퍼스널 컬러',
      reason: '체형에 어울리는 코디 색까지 함께 찾아보세요',
      href: '/analysis/personal-color',
    },
    {
      id: 'hair',
      title: '헤어 분석',
      reason: '전체 인상을 완성하는 헤어스타일을 추천받아보세요',
      href: '/analysis/hair',
    },
  ],
  hair: [
    {
      id: 'personal-color',
      title: '퍼스널 컬러',
      reason: '어울리는 헤어 컬러의 근거를 확인해보세요',
      href: '/analysis/personal-color',
    },
  ],
  makeup: [
    {
      id: 'personal-color',
      title: '퍼스널 컬러',
      reason: '메이크업 컬러 선택의 기준이 되는 분석이에요',
      href: '/analysis/personal-color',
    },
    {
      id: 'skin',
      title: '피부 분석',
      reason: '피부 상태에 맞는 메이크업 제품을 찾아보세요',
      href: '/analysis/skin',
    },
  ],
};

// 다음 분석 행 아이콘 (추천 대상 모듈 기준)
const NEXT_ANALYSIS_ICONS: Record<string, typeof Sparkles> = {
  'personal-color': Palette,
  skin: Sparkles,
  makeup: Wand2,
  hair: Scissors,
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

  // 다음 분석 1행 — 이미 완료한 분석은 건너뛰고 첫 후보만 (구 ContextLinkingCard 필터 논리)
  const completedTypes = useMemo(() => new Set<string>(analyses.map((a) => a.type)), [analyses]);
  const nextAnalysis =
    (NEXT_ANALYSIS[currentModule] ?? []).find((link) => !completedTypes.has(link.id)) ?? null;
  // 다음 행동 다리는 분석 모듈로 식별되는 페이지에서만 (posture 등 비연결 모듈은 기존대로 미노출)
  const hasNextActions = currentModule in NEXT_ANALYSIS;

  // 로딩 중이거나 표시할 것이 없으면 렌더링 안 함
  if (isLoading || (insights.length === 0 && !hasNextActions)) return null;

  const hasInsights = insights.length > 0;

  return (
    <div
      className={cn('mt-8 bg-card rounded-2xl border border-border/50 p-5', className)}
      data-testid="result-page-insights"
    >
      {hasInsights && (
        <>
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
        </>
      )}

      {/* 다음 행동 다리 — 인사이트 유무와 무관하게 유지 (루틴 다리는 리텐션 고리라 항상 보존) */}
      {hasNextActions && (
        <div
          className={cn('space-y-2', hasInsights && 'mt-4 pt-4 border-t border-border/50')}
          aria-label="다음 행동"
        >
          <Link
            href="/capsule/daily"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            data-testid="context-link-daily-routine"
            aria-label="오늘의 루틴 — 이 분석으로 만든 오늘의 루틴을 확인해보세요"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">오늘의 루틴</p>
              <p className="text-xs text-muted-foreground truncate">
                이 분석으로 만든 오늘의 루틴을 확인해보세요
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          </Link>
          {nextAnalysis &&
            (() => {
              const NextIcon = NEXT_ANALYSIS_ICONS[nextAnalysis.id] ?? ChevronRight;
              return (
                <Link
                  href={nextAnalysis.href}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  data-testid={`context-link-${nextAnalysis.id}`}
                  aria-label={`${nextAnalysis.title} — ${nextAnalysis.reason}`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `var(--module-${nextAnalysis.id}-light)`,
                      color: `var(--module-${nextAnalysis.id})`,
                    }}
                  >
                    <NextIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{nextAnalysis.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{nextAnalysis.reason}</p>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              );
            })()}
        </div>
      )}
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
              <span className="inline-flex items-center gap-1 min-h-[44px] min-w-[44px] px-3 py-2 text-xs text-emerald-500">
                <Check className="w-4 h-4" />
                이해했어요
              </span>
            ) : (
              <button
                onClick={onConfirm}
                className="inline-flex items-center gap-1 min-h-[44px] min-w-[44px] px-3 py-2 text-xs text-violet-500 hover:text-violet-600 transition-colors"
              >
                <Check className="w-4 h-4" />
                이해했어요
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
