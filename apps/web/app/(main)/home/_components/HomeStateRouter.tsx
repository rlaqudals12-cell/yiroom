'use client';

/**
 * 홈 3-State 라우터
 *
 * analysisCount 기반 State 분기:
 * - New (0개): 신규 사용자 히어로
 * - Growing (1-3개): 발견 프로그레스 + 인과 추천
 * - Active (4+개): 오늘의 제안 + 대시보드
 *
 * @see docs/specs/SDD-HOME-3STATE.md
 */

import { useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackBriefingView } from '@/lib/analytics';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import { useOnboardingSync } from '@/hooks/useOnboardingSync';
import HomeStateNew from './HomeStateNew';
import HomeStateGrowing from './HomeStateGrowing';
import HomeStateActive from './HomeStateActive';

// State 분기 함수 (테스트 가능하도록 export)
export type HomeState = 'new' | 'growing' | 'active';

export function getHomeState(analysisCount: number): HomeState {
  if (analysisCount === 0) return 'new';
  if (analysisCount <= 3) return 'growing';
  return 'active';
}

// 스켈레톤 (로딩 중 표시)
function HomeStateSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" data-testid="home-state-skeleton">
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-6">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}

export default function HomeStateRouter() {
  // 온보딩 데이터 Supabase 동기화 (로그인 후 1회)
  useOnboardingSync();

  const { isLoading, hasError, analysisCount, analyses, refetch } = useAnalysisStatus();

  // 리텐션 계기판 신호 — 홈=브리핑 열람을 마운트당 1회 기록(코호트 D1/D7/D30 산출용).
  // 상태 확정(로딩/에러 아님) 후에만 발화해 스켈레톤·오류를 DAU로 오집계하지 않는다.
  const briefingLogged = useRef(false);
  useEffect(() => {
    if (isLoading || hasError || briefingLogged.current) return;
    briefingLogged.current = true;
    void trackBriefingView(getHomeState(analysisCount));
  }, [isLoading, hasError, analysisCount]);

  if (isLoading) {
    return <HomeStateSkeleton />;
  }

  // 분석 상태 조회 실패 시 에러 UI (신규 사용자로 잘못 표시하는 대신)
  if (hasError) {
    return (
      <div
        className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-6 text-center"
        data-testid="home-state-error"
      >
        <p className="text-muted-foreground mb-3">분석 정보를 불러오지 못했어요</p>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      </div>
    );
  }

  const state = getHomeState(analysisCount);

  // aria-live: 로딩→콘텐츠 전환 시 스크린리더에 알림
  // ADR-114: 홈 = 브리핑. 축 요약 정본은 [나] 탭(ProfileCardGrid) — 홈에서 제거.
  return (
    <div aria-live="polite" aria-atomic={false} className="space-y-5">
      {state === 'new' && <HomeStateNew />}
      {state === 'growing' && (
        <HomeStateGrowing analysisCount={analysisCount} analyses={analyses} />
      )}
      {state === 'active' && <HomeStateActive analyses={analyses} />}
    </div>
  );
}
