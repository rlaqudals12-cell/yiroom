'use client';

/**
 * 통합 분석 로딩 UI (5축 진행 체크리스트)
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §2.6, §4.5
 *
 * 주의: v1은 백엔드가 단발 응답이라 실제 축별 진행 상태를 알 수 없음.
 *       경과 시간 기반 추정 타이머로 체감 진행만 보여주되, 실제 소요(대체로 1분 안팎,
 *       최대 2분)에 맞춰 천천히 진행한다. 완료 위장 금지 원칙:
 *       - 체크는 60초 이상에 걸쳐 순차로만 채운다 (9초에 전부 완료 X).
 *       - 마지막 축(메이크업)은 타이머로 완료 처리하지 않는다 — 실제 응답이 도착해
 *         부모가 이 UI를 언마운트할 때까지 스피너를 유지한다.
 */

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

// estimatedSec = null 이면 타이머로 절대 완료되지 않음(응답 도착 = 언마운트까지 스피너 유지)
const AXES = [
  { code: 'personal_color', label: '퍼스널컬러', estimatedSec: 14 },
  { code: 'skin', label: '피부', estimatedSec: 30 },
  { code: 'body', label: '체형', estimatedSec: 46 },
  { code: 'hair', label: '헤어', estimatedSec: 62 },
  { code: 'makeup', label: '메이크업', estimatedSec: null },
] as const;

export function IntegratedLoadingUI(): React.JSX.Element {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const showSlowWarning = elapsedSec > 75;

  return (
    <div
      className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-neutral-900 p-6"
      data-testid="integrated-loading"
    >
      <h2 className="mb-4 text-lg font-bold text-white">다섯 가지를 분석하고 있어요...</h2>

      <ul className="space-y-3">
        {AXES.map((axis) => {
          const isDone = axis.estimatedSec !== null && elapsedSec >= axis.estimatedSec;
          return (
            <li
              key={axis.code}
              className="flex items-center justify-between gap-3"
              data-testid={`loading-axis-${axis.code}`}
            >
              <span
                className={`text-sm transition-colors ${isDone ? 'text-white' : 'text-zinc-400'}`}
              >
                {axis.label}
              </span>
              {isDone ? (
                <Check className="h-4 w-4 text-green-400" aria-label="완료" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-pink-400" aria-label="진행 중" />
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-center text-xs text-zinc-500">
        {showSlowWarning
          ? '거의 다 됐어요. 조금만 더 기다려주세요...'
          : '최대 1~2분 걸릴 수 있어요'}
      </p>
    </div>
  );
}
