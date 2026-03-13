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
import HomeRecentlyViewed from './HomeRecentlyViewed';
import HomeActivityBar from './HomeActivityBar';
import SortableWidgetList from './SortableWidgetList';

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
    <div data-testid="home-state-active">
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
