'use client';

/**
 * 통합 분석 세션 프롬프트 카드
 *
 * @description
 *   홈에서 통합 분석 진입 유도 / 최신 통합 결과 링크를 제공하는 공용 카드.
 *   - 세션 있음 → 최신 결과로 바로가기 링크
 *   - 세션 없음 → "5축 한 번에 알아보기" CTA
 *   - 로딩 중 → 스켈레톤 (세션 없을 때와 동일한 footprint)
 *
 * @see docs/adr/ADR-101-integrated-cta-unification.md §2.4
 * @see docs/specs/SDD-PHASE-C-CTA-UNIFICATION.md §2.5
 */

import Link from 'next/link';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import { useLatestIntegratedSession } from '@/hooks/useLatestIntegratedSession';

export function IntegratedSessionPromptCard(): React.JSX.Element {
  const { session, isLoading, error } = useLatestIntegratedSession();

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div
        data-testid="integrated-prompt-skeleton"
        className="h-[72px] animate-pulse rounded-2xl bg-white/5 border border-zinc-800"
      />
    );
  }

  // 왜: 에러 시에도 세션 없는 경우처럼 렌더링 (안전한 기본값, 진입 경로 확보)
  const hasSession = !error && session !== null;

  if (hasSession && session) {
    const completedCount = session.axes_completed?.length ?? 0;
    return (
      <Link
        href={`/analysis/integrated/result/${session.id}`}
        data-testid="integrated-prompt-existing"
        className="flex items-center gap-3 rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-500/10 to-purple-500/10 p-4 hover:border-pink-500/50 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/20">
          <Check className="h-5 w-5 text-pink-400" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">최신 통합 결과 보기</p>
          <p className="text-xs text-muted-foreground">
            이 결과에 {completedCount}개 축이 담겨 있어요 · 언제든 다시 열어볼 수 있어요
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    );
  }

  // 세션 없음 (또는 에러) → 통합 진입 CTA
  return (
    <Link
      href="/analysis/integrated"
      data-testid="integrated-prompt-cta"
      className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 p-4 shadow-md shadow-pink-500/20 transition-all hover:from-pink-400 hover:to-purple-400"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
        <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0 text-white">
        <p className="text-sm font-bold">내 정체성 5축 한 번에 알아보기</p>
        <p className="text-xs text-white/80">색 · 피부 · 체형 · 헤어 · 메이크업 · 약 2분</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/80" aria-hidden="true" />
    </Link>
  );
}
