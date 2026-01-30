'use client';

import { useUser } from '@clerk/nextjs';
import UserProfile from './_components/UserProfile';
import GamificationWidget from './_components/GamificationWidget';
import ChallengeWidget from './_components/ChallengeWidget';
import ClosetWidget from './_components/ClosetWidget';
import AnalysisPromptSection from './_components/AnalysisPromptSection';
import AnalysisSummarySection from './_components/AnalysisSummarySection';
import CompactActivityWidget from './_components/CompactActivityWidget';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import { CrossModuleCard } from '@/components/insights';

export default function DashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isLoading, analyses, isNewUser, hasPersonalColor, hasSkin, hasBody } = useAnalysisStatus();

  // 로딩 상태
  if (!isUserLoaded || isLoading) {
    return <DashboardSkeleton />;
  }

  // 비로그인 상태
  if (!user) {
    return (
      <div
        className="min-h-[calc(100vh-80px)] flex items-center justify-center"
        data-testid="dashboard-login-required"
      >
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground">분석 결과를 확인하려면 먼저 로그인해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8" data-testid="dashboard-page">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Zone 1: User Profile (축소형) */}
        <div className="opacity-0 animate-fade-in-up">
          <UserProfile name={user.fullName || user.username || '사용자'} imageUrl={user.imageUrl} />
        </div>

        {/* Zone 2: Analysis Section (조건부 - 핵심 영역) */}
        <div className="opacity-0 animate-fade-in-up animation-delay-100">
          {isNewUser ? (
            // 신규 사용자: 분석 시작 유도 CTA
            <AnalysisPromptSection />
          ) : (
            // 기존 사용자: 분석 요약 + 추가 분석 유도
            <AnalysisSummarySection analyses={analyses} />
          )}
        </div>

        {/* Zone 2.5: Cross Module Insights (분석 1개 이상 완료 시) */}
        {!isNewUser && (
          <div className="opacity-0 animate-fade-in-up animation-delay-150">
            <CrossModuleCard
              analyses={analyses}
              hasPersonalColor={hasPersonalColor}
              hasSkin={hasSkin}
              hasBody={hasBody}
            />
          </div>
        )}

        {/* Zone 3: Activity Summary (축소형) */}
        <div className="opacity-0 animate-fade-in-up animation-delay-200">
          <CompactActivityWidget userId={user.id} />
        </div>

        {/* Zone 4: Gamification (레벨 + 배지) */}
        <div className="opacity-0 animate-fade-in-up animation-delay-300">
          <GamificationWidget userId={user.id} />
        </div>

        {/* Zone 5: 진행 중인 챌린지 */}
        <div className="opacity-0 animate-fade-in-up animation-delay-400">
          <ChallengeWidget userId={user.id} />
        </div>

        {/* Zone 6: Closet & Style (분석 완료 사용자만) */}
        {!isNewUser && (
          <div className="opacity-0 animate-fade-in-up animation-delay-500">
            <ClosetWidget
              userId={user.id}
              personalColor={analyses.find((a) => a.type === 'personal-color')?.seasonType}
              bodyType={analyses.find((a) => a.type === 'body')?.bodyType}
            />
          </div>
        )}
      </div>
    </main>
  );
}
