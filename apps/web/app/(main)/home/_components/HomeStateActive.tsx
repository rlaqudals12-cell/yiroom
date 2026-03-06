'use client';

/**
 * Home State: Active (분석 4+개)
 *
 * 감정 목표: "없으면 불편한 앱" (Reflective)
 * 정보 블록: 4-5개 (오늘의 제안 + 캡슐 + 분석 요약 + 위젯 + 최근 본)
 */

import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import ActiveDailyInsight from './ActiveDailyInsight';
import HomeDailyCapsuleWidget from './HomeDailyCapsuleWidget';
import HomeAnalysisSummary from './HomeAnalysisSummary';
import HomeRecentlyViewed from './HomeRecentlyViewed';
import HomeDashboardWidgets from './HomeDashboardWidgets';

interface HomeStateActiveProps {
  analyses: AnalysisSummary[];
}

export default function HomeStateActive({ analyses }: HomeStateActiveProps) {
  return (
    <div className="space-y-5" data-testid="home-state-active">
      {/* 오늘의 제안 (정보 블록 1) */}
      <ActiveDailyInsight analyses={analyses} />

      {/* Daily Capsule 루틴 (정보 블록 2) */}
      <HomeDailyCapsuleWidget />

      {/* 분석 요약 (정보 블록 3) */}
      <HomeAnalysisSummary analyses={analyses} />

      {/* 최근 본 제품 (정보 블록 4) */}
      <HomeRecentlyViewed />

      {/* 대시보드 위젯 — 경량 모드 (정보 블록 5) */}
      <HomeDashboardWidgets compact />
    </div>
  );
}
