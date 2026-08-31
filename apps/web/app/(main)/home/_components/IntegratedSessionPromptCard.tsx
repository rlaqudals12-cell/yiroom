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
import { ChevronRight, Check, Palette } from 'lucide-react';
import { useLatestIntegratedSession } from '@/hooks/useLatestIntegratedSession';
import { cn } from '@/lib/utils';

interface IntegratedSessionPromptCardProps {
  /** 접힌 홈 후속 영역 안에서는 중첩 카드와 브랜드 CTA 색을 줄인다. */
  embedded?: boolean;
}

export function IntegratedSessionPromptCard({
  embedded = false,
}: IntegratedSessionPromptCardProps = {}): React.JSX.Element {
  const { session, isLoading, error } = useLatestIntegratedSession();

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div
        data-testid="integrated-prompt-skeleton"
        className={cn(
          'h-[72px] animate-pulse border',
          embedded
            ? 'rounded-xl border-border bg-secondary/50'
            : 'rounded-2xl border-border bg-secondary/50'
        )}
      />
    );
  }

  // 왜: 에러 시에도 세션 없는 경우처럼 렌더링 (안전한 기본값, 진입 경로 확보)
  const hasSession = !error && session !== null;

  if (hasSession && session) {
    // "N개 축"은 개발 용어(축) + 프로필 완성도와 혼동 유발 — 담긴 분석을 구체적으로 나열
    const AXIS_LABELS: Record<string, string> = {
      personal_color: '퍼스널컬러',
      skin: '피부',
      body: '체형',
      hair: '헤어',
      makeup: '메이크업',
    };
    const labels = (session.axes_completed ?? []).map((code) => AXIS_LABELS[code]).filter(Boolean);
    const contentText =
      labels.length === 0
        ? ''
        : labels.length <= 3
          ? `${labels.join('·')} 분석이 담겨 있어요 · `
          : `${labels[0]} 외 ${labels.length - 1}가지 분석이 담겨 있어요 · `;
    return (
      <Link
        href={`/analysis/integrated/result/${session.id}`}
        data-testid="integrated-prompt-existing"
        className={cn(
          'flex items-center gap-3 border transition-colors',
          embedded
            ? 'rounded-xl border-border bg-secondary/40 p-3 hover:bg-secondary'
            : 'rounded-2xl border-border bg-card p-4 hover:bg-secondary/30'
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            embedded ? 'bg-card' : 'bg-secondary'
          )}
        >
          <Check className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          {/* "카드"를 라벨에 명시 — 공유카드 존재를 이 링크가 알리지 않으면 유저가 모름(7/18 감사) */}
          <p className="text-sm font-semibold text-foreground">내 정체성 카드·리포트 보기</p>
          <p className="text-xs text-muted-foreground">
            {contentText}카드로 저장하고 공유할 수 있어요
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
      className={cn(
        'flex items-center gap-3 transition-colors',
        embedded
          ? 'rounded-xl border border-border bg-secondary/40 p-3 hover:bg-secondary'
          : 'rounded-2xl bg-primary p-4 shadow-sm hover:bg-primary/90'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          embedded ? 'bg-card' : 'bg-white/20'
        )}
      >
        <Palette
          className={cn('h-5 w-5', embedded ? 'text-foreground/60' : 'text-white')}
          aria-hidden="true"
        />
      </div>
      <div className={cn('min-w-0 flex-1', embedded ? 'text-foreground' : 'text-white')}>
        <p className="text-sm font-bold">내 정체성 5가지 한 번에 알아보기</p>
        <p className={cn('text-xs', embedded ? 'text-muted-foreground' : 'text-white/80')}>
          색 · 피부 · 체형 · 헤어 · 메이크업 · 최대 1분
        </p>
      </div>
      <ChevronRight
        className={cn('h-4 w-4 shrink-0', embedded ? 'text-muted-foreground' : 'text-white/80')}
        aria-hidden="true"
      />
    </Link>
  );
}
