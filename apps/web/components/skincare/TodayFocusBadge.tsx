'use client';

/**
 * 오늘의 저녁 포커스 배지 — 상단 승격 (G4 일변화 체감)
 *
 * 루틴이 매일(스킨 사이클링·요일 배정) 바뀌는데 화면에서 체감되지 않던 문제를 해소한다.
 * - 요일 + "오늘 저녁 포커스: {label}"을 페이지 상단에 항상 노출(아침/저녁 탭 무관)
 * - 어제와 달라졌으면 "어제(회복의 날)와 달라졌어요" 1줄 (결정론 조립, 같으면 미표시)
 *
 * 엔진 미배포/데이터 없음(label 빈값)이면 미노출 — 지어내지 않는다.
 */

import type { EveningCycle, CycleChange } from './routine-v2-contract';

const DOW_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

interface TodayFocusBadgeProps {
  eveningCycle: EveningCycle;
  /** 어제 대비 변화 (없으면 null — 줄 미표시) */
  cycleChange: CycleChange | null;
  /** 기준 날짜(테스트 고정용). 미지정 시 오늘 */
  date?: Date;
}

export function TodayFocusBadge({ eveningCycle, cycleChange, date }: TodayFocusBadgeProps) {
  // 엔진 미배포/데이터 없음 — 미노출
  if (!eveningCycle.label) return null;

  const d = date ?? new Date();
  const dow = DOW_KO[d.getDay()] ?? '';

  return (
    <section
      data-testid="today-focus-badge"
      aria-label="오늘의 저녁 포커스"
      className="mb-4 rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {dow && (
          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {dow}
          </span>
        )}
        <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
          🌙 오늘 저녁 포커스: {eveningCycle.label}
        </p>
      </div>
      {cycleChange && (
        <p
          className="mt-1 text-xs text-indigo-600 dark:text-indigo-300"
          data-testid="today-focus-change"
        >
          {cycleChange.message}
        </p>
      )}
    </section>
  );
}
