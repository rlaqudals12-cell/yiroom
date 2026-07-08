'use client';

/**
 * Active State: 인과 체인 기반 통합 인사이트
 *
 * lib/insights 엔진 + ConnectionAwareness 내재화 추적
 * - 인사이트 노출 시 자동 expose (내재화 카운트 증가)
 * - 사용자 확인 시 confirm (상태 전이 촉진)
 * - 상태에 따른 설명 깊이 분기 (full → brief → minimal → none)
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Palette,
  Droplets,
  User,
  Scissors,
  Heart,
  SmilePlus,
  Check,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import type { AnalysisModule, Insight } from '@/lib/insights';
import { generateInsights, analysisToDataBundle } from '@/lib/insights';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useUser } from '@clerk/nextjs';
import type { ConnectionStatus, ExplanationDepth } from '@/lib/connection-awareness';
import {
  exposeConnection,
  confirmConnection,
  getExplanationDepth,
  getUserConnections,
} from '@/lib/connection-awareness';
import { insightToExposeRequest } from '@/lib/connection-awareness/insight-bridge';

// 인과 체인: relatedModules → 한글 라벨 + 아이콘
const MODULE_META: Record<AnalysisModule, { label: string; icon: typeof Palette }> = {
  personal_color: { label: '퍼스널컬러', icon: Palette },
  face: { label: '메이크업', icon: Heart },
  skin: { label: '피부 분석', icon: Droplets },
  body: { label: '체형 분석', icon: User },
  hair: { label: '헤어 분석', icon: Scissors },
  oral_health: { label: '구강건강', icon: SmilePlus },
};

// 인사이트 카테고리 → 실행 링크 (카드가 정보만 주고 끝나지 않도록 — "그래서 어디서?"에 답)
const CATEGORY_ACTION: Record<string, { href: string; label: string }> = {
  color_match: { href: '/beauty', label: '맞는 제품 보러가기' },
  product_recommendation: { href: '/beauty', label: '추천 제품 보러가기' },
  skin_care: { href: '/capsule/daily', label: '오늘의 루틴 보러가기' },
  routine_suggestion: { href: '/capsule/daily', label: '오늘의 루틴 보러가기' },
  style_tip: { href: '/closet/recommend', label: '코디 추천 받으러 가기' },
  synergy: { href: '/analysis/integrated', label: '통합 분석 보러가기' },
};

function getInsightAction(insight: Insight): { href: string; label: string } | null {
  return CATEGORY_ACTION[insight.category] ?? null;
}

// 인사이트 카테고리별 아이콘 색상
function getInsightColor(insight: Insight): string {
  switch (insight.category) {
    case 'color_match':
      return 'text-violet-500';
    case 'skin_care':
      return 'text-rose-500';
    case 'style_tip':
      return 'text-blue-500';
    case 'product_recommendation':
      return 'text-amber-500';
    case 'health_alert':
      return 'text-red-500';
    case 'routine_suggestion':
      return 'text-emerald-500';
    case 'synergy':
      return 'text-indigo-500';
    default:
      return 'text-slate-500';
  }
}

interface ActiveInsightCardProps {
  analyses: AnalysisSummary[];
}

export default function ActiveInsightCard({ analyses }: ActiveInsightCardProps) {
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const userId = user?.id;

  // 각 인사이트의 내재화 상태
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionStatus>>(
    {}
  );
  // 확인 완료 표시
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  // 인사이트 생성
  const insights = useMemo(() => {
    const bundle = analysisToDataBundle(analyses);
    const result = generateInsights(bundle, {
      maxInsights: 2,
      minPriorityScore: 30,
      language: 'ko',
    });
    return result.insights;
  }, [analyses]);

  // 기존 내재화 상태 로드 + 노출 기록
  useEffect(() => {
    if (!userId || insights.length === 0) return;

    async function trackExposure(): Promise<void> {
      const statuses: Record<string, ConnectionStatus> = {};

      // 기존 상태 조회
      try {
        const connections = await getUserConnections(supabase, userId!);
        for (const conn of connections) {
          statuses[conn.connectionId] = conn.status;
        }
      } catch {
        // 첫 사용 시 테이블 없을 수 있음
      }

      // 각 인사이트에 대해 노출 기록
      for (const insight of insights) {
        const request = insightToExposeRequest(insight);
        try {
          const response = await exposeConnection(supabase, userId!, request);
          statuses[request.connectionId] = response.status;
        } catch {
          // 노출 기록 실패해도 UI는 정상 표시
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

  return (
    <div
      className="bg-gradient-to-br from-violet-50 via-indigo-50/50 to-blue-50/30 dark:from-violet-950/20 dark:via-indigo-950/15 dark:to-blue-950/10 rounded-2xl border border-violet-200/50 dark:border-violet-800/30 overflow-hidden"
      data-testid="home-active-insight-card"
      role="region"
      aria-label="나를 위한 인사이트"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-3">
        <Sparkles className="w-5 h-5 text-violet-500" />
        <h3 className="font-semibold text-sm text-foreground">나를 위한 인사이트</h3>
      </div>

      {/* 인사이트 목록 */}
      {insights.length > 0 ? (
        <div className="px-5 pb-5 space-y-3">
          {insights.map((insight) => {
            const connectionId = insightToExposeRequest(insight).connectionId;
            const status = connectionStatuses[connectionId] ?? 'exposed';
            const depth = getExplanationDepth(status);
            const isConfirmed = confirmedIds.has(connectionId);

            return (
              <InsightItem
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
      ) : (
        <div className="px-5 pb-5" data-testid="home-active-insight-empty">
          <p className="text-sm text-muted-foreground">
            분석 결과를 조합해서 인사이트를 준비하고 있어요
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            아직 완료하지 않은 분석이 있다면 추가해보세요
          </p>
          <Link
            href="/analysis/integrated"
            className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium min-h-[44px]"
          >
            분석하러 가기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// 내재화 상태 라벨
const STATUS_LABELS: Record<ConnectionStatus, string> = {
  exposed: '새로운 발견',
  recognized: '알아가는 중',
  internalized: '내 것이 되는 중',
  independent: '자립적 판단 가능',
};

// 개별 인사이트 아이템
function InsightItem({
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
  const colorClass = getInsightColor(insight);

  // 완전 내재화 — 제목만 표시
  if (depth === 'none') {
    return (
      <div className="bg-white/60 dark:bg-slate-800/40 rounded-xl px-4 py-3 flex items-center gap-3">
        <ArrowRight className={`w-4 h-4 ${colorClass} flex-shrink-0`} />
        <p className="text-sm font-medium text-foreground flex-1">{insight.title}</p>
        <span className="text-xs text-emerald-500 font-medium">{STATUS_LABELS[status]}</span>
      </div>
    );
  }

  return (
    <div className="bg-white/60 dark:bg-slate-800/40 rounded-xl p-4 space-y-2">
      {/* 내재화 상태 뱃지 */}
      {status !== 'exposed' && (
        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
          {STATUS_LABELS[status]}
        </span>
      )}

      {/* 제목 */}
      <p className="text-sm font-medium text-foreground">{insight.title}</p>

      {/* 설명 — depth에 따라 분기 */}
      {depth === 'full' && (
        <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
      )}
      {depth === 'brief' && (
        <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
      )}
      {/* minimal: 설명 생략 */}

      {/* 인과 체인 소스 필 */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {insight.relatedModules.map((mod) => {
          const meta = MODULE_META[mod];
          if (!meta) return null;
          const Icon = meta.icon;

          return (
            <span
              key={mod}
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-700/50 border border-slate-200/50 dark:border-slate-600/30 ${colorClass}`}
            >
              <Icon className="w-3 h-3" />
              {meta.label}
            </span>
          );
        })}
        <span className="text-xs text-muted-foreground">기반</span>
      </div>

      {/* 확인 버튼 + 실행 링크 — 정보로 끝나지 않고 바로 해볼 수 있게 */}
      {depth !== 'minimal' && (
        <div className="pt-1 flex items-center justify-between gap-2">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
              <Check className="w-3.5 h-3.5" />
              확인했어요
            </span>
          ) : (
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-1 text-xs text-violet-500 hover:text-violet-600 transition-colors min-h-[44px] px-2"
            >
              <Check className="w-3.5 h-3.5" />
              확인했어요
            </button>
          )}
          {(() => {
            const action = getInsightAction(insight);
            if (!action) return null;
            return (
              <Link
                href={action.href}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors min-h-[44px] px-2"
              >
                {action.label}
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            );
          })()}
        </div>
      )}
    </div>
  );
}
