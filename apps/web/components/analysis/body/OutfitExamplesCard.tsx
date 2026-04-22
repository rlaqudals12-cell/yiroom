/**
 * 추천 코디 카드 — C-1 결과 3섹션 구조 ② (ADR-098)
 *
 * 체형 × 퍼스널컬러로 바로 실행 가능한 3세트 코디. 기존
 * `lib/color-recommendations.ts`의 `getOutfitExamples()` 데이터를 재활용.
 *
 * PC-1 결과가 없으면 "퍼스널 컬러를 먼저 분석하면 더 정확해요" 안내를
 * 붙이되, 중립 색상군으로라도 코디를 보여 주어 단기 실행을 막지 않는다.
 */

'use client';

import { Shirt, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { BodyType3 } from '@/lib/mock/body-analysis';
import { getOutfitExamples, type PersonalColorSeason } from '@/lib/color-recommendations';

interface OutfitExamplesCardProps {
  bodyType: BodyType3;
  // DB에는 string | null 로 저장되므로 string도 허용하고 내부에서 시즌 화이트리스트 검증
  personalColorSeason?: PersonalColorSeason | string | null;
  className?: string;
}

const SEASON_SET: Set<PersonalColorSeason> = new Set(['Spring', 'Summer', 'Autumn', 'Winter']);

function normalizeSeason(
  raw: PersonalColorSeason | string | null | undefined
): PersonalColorSeason | null {
  if (!raw) return null;
  return SEASON_SET.has(raw as PersonalColorSeason) ? (raw as PersonalColorSeason) : null;
}

// PC-1 미분석 사용자를 위한 중립 시즌 fallback (Autumn이 체형별 데이터가
// 가장 중립적인 뉴트럴 계열 톤으로 구성되어 있음)
const DEFAULT_SEASON: PersonalColorSeason = 'Autumn';

export function OutfitExamplesCard({
  bodyType,
  personalColorSeason,
  className,
}: OutfitExamplesCardProps) {
  const normalizedSeason = normalizeSeason(personalColorSeason);
  const season = normalizedSeason ?? DEFAULT_SEASON;
  const examples = getOutfitExamples(bodyType, season);
  const hasPersonalColor = normalizedSeason !== null;

  if (!examples || examples.length === 0) {
    return null;
  }

  return (
    <section
      data-testid="outfit-examples-card"
      className={`rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-slate-900 ${className ?? ''}`}
      aria-label="추천 코디 세트"
    >
      <header className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
          <Shirt className="h-4 w-4" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-base font-bold text-foreground">추천 코디</h3>
          <p className="text-xs text-muted-foreground">
            원칙을 바로 입어볼 수 있는 {examples.length}가지 세트
          </p>
        </div>
      </header>

      {!hasPersonalColor && (
        <div className="mb-4 rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
          <Link
            href="/analysis/personal-color"
            className="flex items-center justify-between gap-2 font-medium hover:underline"
          >
            <span>퍼스널 컬러를 분석하면 내 톤에 딱 맞는 코디로 바뀌어요</span>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {examples.map((outfit, idx) => (
          <li
            key={outfit.title}
            data-testid={`outfit-example-${idx}`}
            className="rounded-xl border border-blue-100/70 bg-white/70 p-4 dark:border-blue-900/30 dark:bg-slate-900/40"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">{outfit.title}</h4>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                {outfit.occasion}
              </span>
            </div>
            <ul className="space-y-1">
              {outfit.items.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-blue-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
