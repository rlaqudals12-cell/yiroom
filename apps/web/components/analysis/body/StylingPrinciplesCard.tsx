/**
 * 스타일링 원칙 카드 — C-1 결과 3섹션 구조 ① (ADR-098)
 *
 * 체형을 "개선 대상"이 아니라 "이해와 표현의 대상"으로 다루는 장기 기준.
 * 각 원칙은 Why(왜)와 How(판단 기준)를 함께 제공해 쇼핑/매칭 시 스스로
 * 판단할 수 있도록 돕는다.
 */

'use client';

import { Sparkles, Check } from 'lucide-react';
import type { BodyType3 } from '@/lib/mock/body-analysis';
import { STYLING_PRINCIPLES } from '@/lib/styling-principles';

interface StylingPrinciplesCardProps {
  bodyType: BodyType3;
  bodyTypeLabel?: string;
  className?: string;
}

export function StylingPrinciplesCard({
  bodyType,
  bodyTypeLabel,
  className,
}: StylingPrinciplesCardProps) {
  const principles = STYLING_PRINCIPLES[bodyType];

  if (!principles || principles.length === 0) {
    return null;
  }

  return (
    <section
      data-testid="styling-principles-card"
      className={`rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 to-white p-5 dark:border-violet-900/40 dark:from-violet-950/20 dark:to-slate-900 ${className ?? ''}`}
      aria-label="체형별 스타일링 원칙"
    >
      <header className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-base font-bold text-foreground">스타일링 원칙</h3>
          <p className="text-xs text-muted-foreground">
            {bodyTypeLabel ? `${bodyTypeLabel} 체형` : '이 체형'}이 가진 기준 — 장기적으로 가져갈
            방향이에요
          </p>
        </div>
      </header>

      <ol className="space-y-3">
        {principles.map((principle, idx) => (
          <li
            key={principle.title}
            data-testid={`styling-principle-${idx}`}
            className="rounded-xl border border-violet-100/70 bg-white/70 p-4 dark:border-violet-900/30 dark:bg-slate-900/40"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white">
                {idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{principle.title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {principle.rationale}
                </p>
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-violet-50/80 px-2.5 py-1.5 dark:bg-violet-950/30">
                  <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-violet-500" aria-hidden />
                  <p className="text-[11px] leading-relaxed text-violet-900 dark:text-violet-200">
                    {principle.application}
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
