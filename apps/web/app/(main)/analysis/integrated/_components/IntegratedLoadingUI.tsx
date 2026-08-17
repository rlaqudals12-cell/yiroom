'use client';

/**
 * 통합 분석 로딩 UI
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §2.6, §4.5
 *
 * 정직성 계약(가짜 진행률 금지): 백엔드는 단발 응답이라 축별 진행/완료를 알 수 없다.
 * 따라서 축별 체크마크·퍼센트 같은 "완료 단언"은 만들지 않는다.
 * 실패한 축까지 ✓로 표시되던 경과시간 기반 체크리스트를 폐지하고,
 * 단일 스피너 + 분석 범위(5축) 라벨만 보여준다. 라벨 강조는 순수 시각 효과이며
 * 특정 축이 진행/완료됐다는 뜻이 아니다(텍스트로 상태를 단언하지 않음).
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const AXES = [
  { code: 'personal_color', label: '퍼스널컬러' },
  { code: 'skin', label: '피부' },
  { code: 'body', label: '체형' },
  { code: 'hair', label: '헤어' },
  { code: 'makeup', label: '메이크업' },
] as const;

// 강조 라벨 순회 주기(초) — 대기 화면이 멈춘 것처럼 보이지 않게 하는 시각 효과
const HIGHLIGHT_CYCLE_SEC = 3;
// 서버 상한(maxDuration=60s)에 근접하면 안내 문구를 바꾼다
const SLOW_WARNING_SEC = 45;

export function IntegratedLoadingUI(): React.JSX.Element {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const showSlowWarning = elapsedSec > SLOW_WARNING_SEC;
  const highlightIndex = Math.floor(elapsedSec / HIGHLIGHT_CYCLE_SEC) % AXES.length;

  return (
    <div
      className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center"
      data-testid="integrated-loading"
      aria-busy="true"
    >
      <Loader2
        className="mx-auto mb-4 h-8 w-8 animate-spin text-primary"
        aria-hidden="true"
        data-testid="integrated-loading-spinner"
      />

      <h2 className="text-lg font-bold text-foreground">다섯 가지를 한 번에 분석하고 있어요</h2>

      <ul className="mt-4 flex flex-wrap justify-center gap-2">
        {AXES.map((axis, i) => (
          <li
            key={axis.code}
            data-testid={`loading-axis-${axis.code}`}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              i === highlightIndex
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground'
            }`}
          >
            {axis.label}
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs text-muted-foreground" role="status" data-testid="loading-hint">
        {showSlowWarning
          ? '거의 다 됐어요. 조금만 더 기다려주세요...'
          : '최대 1분 정도 걸려요. 창을 닫지 말고 기다려주세요.'}
      </p>
    </div>
  );
}
