'use client';

/**
 * Home State: Active (분석 4+개)
 *
 * 감정 목표: "없으면 불편한 앱" (Reflective)
 * 정보 블록: 5개 (인사이트 + 캡슐 + 분석 요약 + 활동 + 최근 본)
 * KI-007 개선: 내재화 위젯을 HomeActivityBar 헤더에 통합하여 6→5블록 축소
 * WS-11: 위젯 드래그 순서 커스터마이징 (dnd-kit)
 */

import { useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import { FEATURE_FLAGS } from '@yiroom/shared';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import { useWidgetOrder } from '@/hooks/useWidgetOrder';
import type { WidgetId } from '@/hooks/useWidgetOrder';
import ActiveInsightCard from './ActiveInsightCard';
import HomeDailyCapsuleWidget from './HomeDailyCapsuleWidget';
import HomeAnalysisSummary from './HomeAnalysisSummary';
import dynamic from 'next/dynamic';

// 최근 본 제품 — 스크롤 하단이므로 지연 로드 (-20KB)
const HomeRecentlyViewed = dynamic(() => import('./HomeRecentlyViewed'), {
  loading: () => null,
  ssr: false,
});
import HomeActivityBar from './HomeActivityBar';
import HomeStreakWidget from './HomeStreakWidget';
import SortableWidgetList from './SortableWidgetList';
import { EnvironmentAdviceCard } from '@/components/common/EnvironmentAdviceCard';
import { IntegratedSessionPromptCard } from './IntegratedSessionPromptCard';

interface HomeStateActiveProps {
  analyses: AnalysisSummary[];
}

export default function HomeStateActive({ analyses }: HomeStateActiveProps) {
  const { user } = useUser();
  const { order, setOrder, resetOrder, isCustomized } = useWidgetOrder();

  // 위젯 ID → ReactNode 매핑
  // activity-bar는 운동/영양 활동 요약을 담고 있어 ADR-098 기준 WELLNESS_PHASE2에 게이팅
  const widgets: Record<WidgetId, ReactNode> = useMemo(
    () => ({
      insight: <ActiveInsightCard analyses={analyses} />,
      capsule: <HomeDailyCapsuleWidget />,
      'analysis-summary': <HomeAnalysisSummary analyses={analyses} />,
      'activity-bar':
        FEATURE_FLAGS.WELLNESS_PHASE2 && user?.id ? <HomeActivityBar userId={user.id} /> : null,
      'recently-viewed': <HomeRecentlyViewed />,
    }),
    [analyses, user?.id]
  );

  return (
    <div className="space-y-5" data-testid="home-state-active">
      {/* ADR-101: 통합 분석 결과 재방문 / 신규 진입 카드 (최상단) */}
      <IntegratedSessionPromptCard />

      {/* 환경 조언 — 날씨/UV/습도 기반 (WEATHER 게이팅, 기능 과잉 정리 2026-05-16) */}
      {FEATURE_FLAGS.WEATHER && <EnvironmentAdviceCard />}

      {/* 스트릭/뱃지 위젯 — Phase 2 보류 (ADR-098, FEATURE_FLAGS.WELLNESS_PHASE2) */}
      {FEATURE_FLAGS.WELLNESS_PHASE2 && <HomeStreakWidget />}

      <SortableWidgetList
        order={order}
        onOrderChange={setOrder}
        onReset={resetOrder}
        isCustomized={isCustomized}
        widgets={widgets}
      />
    </div>
  );
}
