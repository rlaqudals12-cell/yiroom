'use client';

/**
 * 홈 대시보드 위젯 통합 섹션
 *
 * /dashboard 페이지의 고유 위젯들을 홈에 통합:
 * - CompactActivityWidget: 오늘 칼로리/운동/수분
 * - CrossModuleCard: 크로스 모듈 인사이트
 * - GamificationWidget: 레벨 + 배지
 * - ChallengeWidget: 진행 중 챌린지
 * - ClosetWidget: 옷장 + 코디 추천
 *
 * compact=true (홈): 활동 + 게이미피케이션만 표시 (정보 과부하 방지)
 * compact=false (대시보드): 전체 위젯 표시
 */

import { useUser } from '@clerk/nextjs';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import { CrossModuleCard } from '@/components/insights';
import CompactActivityWidget from '../../dashboard/_components/CompactActivityWidget';
import GamificationWidget from '../../dashboard/_components/GamificationWidget';
import ChallengeWidget from '../../dashboard/_components/ChallengeWidget';
import ClosetWidget from '../../dashboard/_components/ClosetWidget';

// 위젯 로딩 스켈레톤
function WidgetSkeleton() {
  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-sm animate-pulse">
      <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
      <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  );
}

interface HomeDashboardWidgetsProps {
  compact?: boolean;
}

export default function HomeDashboardWidgets({ compact = false }: HomeDashboardWidgetsProps) {
  const { user, isLoaded } = useUser();
  const {
    isLoading: analysisLoading,
    analyses,
    isNewUser,
    hasPersonalColor,
    hasSkin,
    hasBody,
  } = useAnalysisStatus();

  // 비로그인 상태
  if (!isLoaded || !user) {
    return null;
  }

  // 분석 상태 로딩 중
  if (analysisLoading) {
    return (
      <div className="space-y-5">
        <WidgetSkeleton />
        <WidgetSkeleton />
      </div>
    );
  }

  return (
    <div
      className="space-y-5"
      data-testid="home-dashboard-widgets"
      role="region"
      aria-label="대시보드 위젯"
    >
      {/* 오늘 기록 (칼로리/운동/수분) */}
      <section className="animate-fade-in-up animation-delay-300">
        <CompactActivityWidget userId={user.id} />
      </section>

      {/* 나의 성장 (레벨 + 배지) */}
      <section className="animate-fade-in-up animation-delay-400">
        <GamificationWidget userId={user.id} />
      </section>

      {/* compact 모드(홈)에서는 핵심 위젯만, 전체 모드(대시보드)에서는 모두 표시 */}
      {!compact && (
        <>
          {/* 크로스 모듈 인사이트 (분석 1개 이상 완료 시) */}
          {!isNewUser && (
            <section className="animate-fade-in-up animation-delay-300">
              <CrossModuleCard
                analyses={analyses}
                hasPersonalColor={hasPersonalColor}
                hasSkin={hasSkin}
                hasBody={hasBody}
              />
            </section>
          )}

          {/* 챌린지 */}
          <section className="animate-fade-in-up animation-delay-500">
            <ChallengeWidget userId={user.id} />
          </section>

          {/* 옷장 & 코디 (분석 완료 사용자만) */}
          {!isNewUser && (
            <section className="animate-fade-in-up animation-delay-600">
              <ClosetWidget
                userId={user.id}
                personalColor={analyses.find((a) => a.type === 'personal-color')?.seasonType}
                bodyType={analyses.find((a) => a.type === 'body')?.bodyType}
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
