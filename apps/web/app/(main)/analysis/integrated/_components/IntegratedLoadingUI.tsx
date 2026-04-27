'use client';

/**
 * 통합 분석 로딩 UI (5축 진행 체크리스트)
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §2.6, §4.5
 *
 * 주의: v1은 백엔드가 단발 응답이라 실제 축별 진행 상태를 알 수 없음.
 *       경과 시간 기반 추정 타이머로 체감 속도 개선.
 */

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

const AXES = [
  { code: 'personal_color', label: '퍼스널컬러', estimatedSec: 3 },
  { code: 'skin', label: '피부', estimatedSec: 5 },
  { code: 'body', label: '체형', estimatedSec: 7 },
  { code: 'hair', label: '헤어', estimatedSec: 8 },
  { code: 'makeup', label: '메이크업', estimatedSec: 9 },
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

  const showSlowWarning = elapsedSec > 12;

  return (
    <div
      className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-neutral-900 p-6"
      data-testid="integrated-loading"
    >
      <h2 className="mb-4 text-lg font-bold text-white">5축 분석 중...</h2>

      <ul className="space-y-3">
        {AXES.map((axis) => {
          const isDone = elapsedSec >= axis.estimatedSec;
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
        {showSlowWarning ? '조금 오래 걸릴 수 있어요. 거의 다 됐어요...' : '예상 소요: 약 10초'}
      </p>
    </div>
  );
}
