/**
 * 나 프로필 내러티브 카드 (결과 페이지 최상단)
 *
 * @description
 *   ADR-104 체크리스트 #1 — "1명의 나로 통합"의 UI 구현체.
 *   5축 결과를 합성한 페르소나(oneLine + narrative + keyInsights)를 상단 히어로로 노출.
 *   persona가 null이면 렌더링 안 함 (성공 축 0개 케이스).
 *
 *   에디토리얼 리스킨(2026-07-15, memory design-taste-moat): 트라이휴 그라데·글로우·
 *   Sparkles(AI-slop 3신호)를 소거하고 웜 크림 카드 + 세리프 헤드라인으로 —
 *   "AI 대시보드"가 아니라 "전속 뷰티팀의 진단 리포트" 톤.
 *
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1
 * @see lib/analysis/integrated/internal/persona-composer.ts
 */

import { getTranslations } from 'next-intl/server';
import type { PersonaProfile } from '@/lib/analysis/integrated';

export interface PersonaNarrativeCardProps {
  persona: PersonaProfile | null;
}

export async function PersonaNarrativeCard({
  persona,
}: PersonaNarrativeCardProps): Promise<React.JSX.Element | null> {
  if (!persona) return null;

  const t = await getTranslations('analysis.integratedResult');

  return (
    <section
      className="rounded-2xl border bg-card p-6 md:p-8"
      data-testid="persona-narrative-card"
      aria-label={t('persona.ariaLabel')}
    >
      <div className="space-y-4">
        {/* 라벨 — 세리프 이탤릭 로즈 액센트(E+ 공유카드 시즌 라벨과 동일 문법) */}
        <p className="font-serif text-[13px] italic text-primary">{t('persona.badge')}</p>

        {/* 한 줄 페르소나 — 화보 표제(세리프 = 에디토리얼 시그니처) */}
        <h2 className="break-keep font-serif text-2xl leading-snug text-foreground md:text-3xl">
          {persona.oneLine}
        </h2>

        {/* 내러티브 */}
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          {persona.narrative}
        </p>

        {/* 핵심 인사이트 3개 */}
        {persona.keyInsights.length > 0 && (
          <ul className="space-y-1.5 pt-2">
            {persona.keyInsights.map((insight) => (
              <li
                key={insight}
                className="flex items-start gap-2 text-xs text-foreground/80 md:text-sm"
              >
                <span className="mt-0.5 text-primary" aria-hidden="true">
                  ·
                </span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Fallback 표시 (투명하게) */}
        {persona.usedFallback && (
          <p className="pt-2 text-[11px] text-muted-foreground">ⓘ {t('persona.fallbackNote')}</p>
        )}
      </div>
    </section>
  );
}
