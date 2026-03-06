'use client';

/**
 * Home State: Active (분석 4+개)
 *
 * 감정 목표: "없으면 불편한 앱" (Reflective)
 * 정보 블록: 5개 (인사이트 + 캡슐 + 분석 요약 + 활동 + 최근 본)
 */

import { useUser } from '@clerk/nextjs';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import ActiveInsightCard from './ActiveInsightCard';
import HomeDailyCapsuleWidget from './HomeDailyCapsuleWidget';
import HomeAnalysisSummary from './HomeAnalysisSummary';
import HomeRecentlyViewed from './HomeRecentlyViewed';
import HomeActivityBar from './HomeActivityBar';

interface HomeStateActiveProps {
  analyses: AnalysisSummary[];
}

export default function HomeStateActive({ analyses }: HomeStateActiveProps) {
  const { user } = useUser();

  return (
    <div className="space-y-5" data-testid="home-state-active">
      {/* 인과 체인 인사이트 (정보 블록 1) */}
      <ActiveInsightCard analyses={analyses} />

      {/* Daily Capsule 루틴 (정보 블록 2) */}
      <HomeDailyCapsuleWidget />

      {/* 분석 요약 (정보 블록 3) */}
      <HomeAnalysisSummary analyses={analyses} />

      {/* 활동 + 게이미피케이션 (정보 블록 4) */}
      {user?.id && <HomeActivityBar userId={user.id} />}

      {/* 최근 본 제품 (정보 블록 5) */}
      <HomeRecentlyViewed />
    </div>
  );
}
