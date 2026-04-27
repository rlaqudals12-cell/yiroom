/**
 * 나 프로필 내러티브 카드 (결과 페이지 최상단)
 *
 * @description
 *   ADR-104 체크리스트 #1 — "1명의 나로 통합"의 UI 구현체.
 *   5축 결과를 합성한 페르소나(oneLine + narrative + keyInsights)를 상단 히어로로 노출.
 *   persona가 null이면 렌더링 안 함 (성공 축 0개 케이스).
 *
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1
 * @see lib/analysis/integrated/internal/persona-composer.ts
 */

import { Sparkles } from 'lucide-react';
import type { PersonaProfile } from '@/lib/analysis/integrated';

export interface PersonaNarrativeCardProps {
  persona: PersonaProfile | null;
}

export function PersonaNarrativeCard({
  persona,
}: PersonaNarrativeCardProps): React.JSX.Element | null {
  if (!persona) return null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 p-6 md:p-8"
      data-testid="persona-narrative-card"
      aria-label="나 프로필"
    >
      {/* 배경 글로우 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl"
      />

      <div className="relative space-y-4">
        {/* 라벨 */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-pink-400/40 bg-pink-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-pink-300">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          <span>나 프로필</span>
        </div>

        {/* 한 줄 페르소나 */}
        <h2 className="text-2xl font-bold leading-tight text-white md:text-3xl">
          {persona.oneLine}
        </h2>

        {/* 내러티브 */}
        <p className="text-sm leading-relaxed text-zinc-200 md:text-base">{persona.narrative}</p>

        {/* 핵심 인사이트 3개 */}
        {persona.keyInsights.length > 0 && (
          <ul className="space-y-1.5 pt-2">
            {persona.keyInsights.map((insight) => (
              <li key={insight} className="flex items-start gap-2 text-xs text-zinc-300 md:text-sm">
                <span className="mt-0.5 text-pink-400" aria-hidden="true">
                  ·
                </span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Fallback 표시 (투명하게) */}
        {persona.usedFallback && (
          <p className="pt-2 text-[11px] text-zinc-500">
            ⓘ AI 합성 대신 요약으로 생성된 프로필이에요.
          </p>
        )}
      </div>
    </section>
  );
}
