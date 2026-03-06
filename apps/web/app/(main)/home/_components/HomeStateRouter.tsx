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

import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
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
  const { isLoading, analysisCount, analyses } = useAnalysisStatus();

  if (isLoading) {
    return <HomeStateSkeleton />;
  }

  const state = getHomeState(analysisCount);

  switch (state) {
    case 'new':
      return <HomeStateNew />;
    case 'growing':
      return <HomeStateGrowing analysisCount={analysisCount} analyses={analyses} />;
    case 'active':
      return <HomeStateActive analyses={analyses} />;
  }
}
