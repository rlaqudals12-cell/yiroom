'use client';

/**
 * 프로필 카드 그리드 (ADR-109 / SDD-PROFILE-CENTRIC-ANALYSIS Phase 1)
 *
 * 홈을 "분석 도구 메뉴"에서 "채워지는 5축 정체성 프로필"로. 데이터는 useAnalysisStatus(latest-per-axis).
 * - 완료 칸 → 개별 깊은 결과(축 심화, getResultHref) = 무손실 깊이 진입
 * - 빈 칸 = CTA(그 축 분석)
 * - 변동 아이콘: 🔒 identity / 🔄 slow / 📅 condition (AXIS_CADENCE, lucide)
 */

import Link from 'next/link';
import { track } from '@vercel/analytics';
import {
  Lock,
  RefreshCw,
  CalendarDays,
  Plus,
  Check,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { CADENCE_META, shouldShowCadenceBadge, type CadenceGroup } from '@yiroom/shared';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import {
  ANALYSIS_META,
  ANALYSIS_ORDER,
  TOTAL_ANALYSIS_TYPES,
  getResultHref,
  getCadenceForType,
} from './analysis-meta';

const CADENCE_ICON: Record<CadenceGroup, typeof Lock> = {
  identity: Lock,
  slow: RefreshCw,
  condition: CalendarDays,
};
// 라벨/힌트는 @yiroom/shared CADENCE_META로 일원화 (웹·앱 문구 드리프트 방지)

// 간단 상대시간 (외부 의존 없이): 오늘/N일 전/N개월 전
function relativeTime(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return '오늘';
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

interface ProfileCardGridProps {
  analyses: AnalysisSummary[];
  /** 최신 통합 분석 페르소나 한 줄("당신은 ○○한 사람") — 있으면 상단 노출 */
  personaOneLine?: string | null;
}

export default function ProfileCardGrid({ analyses, personaOneLine }: ProfileCardGridProps) {
  const byType = new Map(analyses.map((a) => [a.type, a]));
  const completedCount = analyses.length;
  const pct = Math.round((completedCount / TOTAL_ANALYSIS_TYPES) * 100);

  return (
    <section
      className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-xl shadow-slate-200/50 dark:shadow-none"
      data-testid="profile-card-grid"
      aria-label="내 정체성 프로필"
    >
      {/* 페르소나 한 줄 — "살아있는 나" (있을 때만, ADR-109 A-visual) */}
      {personaOneLine && (
        <p
          className="flex items-center gap-1.5 mb-3 text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500"
          data-testid="profile-persona-line"
        >
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" aria-hidden="true" />
          {personaOneLine}
        </p>
      )}

      {/* 헤더 + 완성도 미터 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">내 정체성</h3>
          <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
            {pct === 100 ? '완성' : `나를 ${pct}% 알아냈어요`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
          {completedCount}/{TOTAL_ANALYSIS_TYPES} · 셀카 한 장으로 채워가요
        </p>
      </div>

      {/* 5축 카드 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ANALYSIS_ORDER.map((type) => {
          const analysis = byType.get(type);
          const meta = ANALYSIS_META[type];
          const Icon = meta.icon;

          // 빈 칸 = CTA(해당 축 분석)
          if (!analysis) {
            return (
              <Link
                key={type}
                href={meta.analysisHref}
                onClick={() => track('profile_card_cta', { axis: type })}
                className="group flex flex-col gap-1.5 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 transition-colors"
                data-testid={`profile-card-empty-${type}`}
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">{meta.label}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  채우기
                </p>
              </Link>
            );
          }

          // 완료 칸 = 개별 깊은 결과로 진입
          const cadence = getCadenceForType(type);
          const CadenceIcon = CADENCE_ICON[cadence];
          return (
            <Link
              key={type}
              href={getResultHref(analysis)}
              onClick={() => track('profile_card_open', { axis: type })}
              className="group flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors"
              data-testid={`profile-card-${type}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-md ${meta.shadow}`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {/* 변동 뱃지 = 양 극단(PC·피부)만 — 체형/헤어/메이크업은 과한 주장이라 미노출 */}
                {shouldShowCadenceBadge(type) && (
                  <span
                    className="flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500"
                    title={CADENCE_META[cadence].hint}
                  >
                    <CadenceIcon className="w-3 h-3" aria-hidden="true" />
                    {CADENCE_META[cadence].label}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{meta.label}</p>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white truncate">
                <span className="truncate">{analysis.summary}</span>
                {/* 피부 = 오늘의 컨디션: 직전 분석 대비 추이 (ADR-109 Phase 3) */}
                {analysis.type === 'skin' && analysis.skinTrend && (
                  <SkinTrendChip trend={analysis.skinTrend} delta={analysis.skinDelta ?? 0} />
                )}
              </p>
              <p className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                <Check className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                {relativeTime(analysis.createdAt)}
              </p>
            </Link>
          );
        })}
      </div>

      {/* 통합 분석 진입 (전체 채우기) */}
      {completedCount < TOTAL_ANALYSIS_TYPES && (
        <Link
          href="/analysis/integrated"
          onClick={() => track('profile_integrated_cta', { completed: completedCount })}
          className="mt-3 flex items-center justify-center gap-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-bold shadow-md shadow-pink-500/20 hover:from-pink-400 hover:to-purple-400 transition-all"
          data-testid="profile-card-integrated-cta"
        >
          셀카 한 장으로 채우기
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

/** 피부 점수 추이 칩 — 직전 분석 대비 (↑ 개선 / ↓ 하락 / 유지) */
function SkinTrendChip({ trend, delta }: { trend: 'up' | 'down' | 'flat'; delta: number }) {
  const config = {
    up: {
      Icon: TrendingUp,
      cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      label: `+${Math.abs(delta)}`,
    },
    down: {
      Icon: TrendingDown,
      cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      label: `-${Math.abs(delta)}`,
    },
    flat: { Icon: Minus, cls: 'bg-slate-500/15 text-slate-500 dark:text-slate-400', label: '유지' },
  }[trend];
  const { Icon, cls, label } = config;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0 ${cls}`}
      title="직전 분석 대비 변화"
      data-testid="skin-trend-chip"
    >
      <Icon className="w-2.5 h-2.5" aria-hidden="true" />
      {label}
    </span>
  );
}
