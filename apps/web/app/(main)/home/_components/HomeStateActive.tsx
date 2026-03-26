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

interface HomeStateActiveProps {
  analyses: AnalysisSummary[];
}

export default function HomeStateActive({ analyses }: HomeStateActiveProps) {
  const { user } = useUser();
  const { order, setOrder, resetOrder, isCustomized } = useWidgetOrder();

  // 위젯 ID → ReactNode 매핑
  const widgets: Record<WidgetId, ReactNode> = useMemo(
    () => ({
      insight: <ActiveInsightCard analyses={analyses} />,
      capsule: <HomeDailyCapsuleWidget />,
      'analysis-summary': <HomeAnalysisSummary analyses={analyses} />,
      'activity-bar': user?.id ? <HomeActivityBar userId={user.id} /> : null,
      'recently-viewed': <HomeRecentlyViewed />,
    }),
    [analyses, user?.id]
  );

  return (
    <div className="space-y-5" data-testid="home-state-active">
      {/* 환경 조언 — 날씨/UV/습도 기반 크로스 조언 */}
      <EnvironmentAdviceCard />

      {/* 스트릭/뱃지 위젯 — 고정 위치 (정렬 대상 아님) */}
      <HomeStreakWidget />

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
