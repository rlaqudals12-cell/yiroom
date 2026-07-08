'use client';

/**
 * Home State: Active (분석 4+개)
 *
 * ADR-114: 위젯 대시보드 → 전속 뷰티팀의 브리핑 홈.
 * 데이터가 많은 만큼 브리핑 문장이 풍부해진다(composeBriefing이 자연 처리).
 */

import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import DailyBriefing from './DailyBriefing';

interface HomeStateActiveProps {
  analyses: AnalysisSummary[];
}

export default function HomeStateActive({ analyses }: HomeStateActiveProps) {
  return (
    <div data-testid="home-state-active">
      <DailyBriefing analyses={analyses} />
    </div>
  );
}
