'use client';

/**
 * Home State: Growing (분석 1-3개)
 *
 * ADR-114: 위젯/발견 칩 나열 → 전속 뷰티팀의 브리핑 홈.
 * 데이터가 적어 문장이 단순한 것이 정직하다(쓸수록 사람다워지는 구조).
 *
 * ConnectionAwareness 연동: 완료된 각 분석 도메인을 expose(발견 추적).
 */

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import type { AnalysisSummary, AnalysisType } from '@/hooks/useAnalysisStatus';
import DailyBriefing from './DailyBriefing';
import { exposeConnection } from '@/lib/connection-awareness';
import type { ConnectionModule } from '@/lib/connection-awareness';

// AnalysisType → ConnectionModule 매핑
const ANALYSIS_TYPE_TO_CONNECTION: Record<AnalysisType, ConnectionModule> = {
  'personal-color': 'personal-color',
  skin: 'skin',
  body: 'body',
  hair: 'hair',
  makeup: 'makeup',
};

const ANALYSIS_LABELS: Record<AnalysisType, string> = {
  'personal-color': '퍼스널 컬러',
  skin: '피부',
  body: '체형',
  hair: '헤어',
  makeup: '메이크업',
};

interface HomeStateGrowingProps {
  analysisCount: number;
  analyses: AnalysisSummary[];
}

export default function HomeStateGrowing({ analyses }: HomeStateGrowingProps) {
  const { user } = useUser();
  const userId = user?.id;
  const supabase = useClerkSupabaseClient();

  // 완료된 각 분석 도메인 expose (발견 추적)
  useEffect(() => {
    if (!userId || analyses.length === 0) return;

    async function trackDiscoveryExposure(): Promise<void> {
      for (const analysis of analyses) {
        const connectionModule = ANALYSIS_TYPE_TO_CONNECTION[analysis.type];
        if (!connectionModule) continue;
        try {
          await exposeConnection(supabase, userId!, {
            connectionId: `discovery::${connectionModule}`,
            sourceModule: connectionModule,
            targetDomain: 'self-understanding',
            connectionRule: `${ANALYSIS_LABELS[analysis.type] ?? analysis.type} 결과 — 자기 이해의 한 조각`,
          });
        } catch {
          // 추적 실패 시 무시
        }
      }
    }

    trackDiscoveryExposure();
  }, [userId, analyses, supabase]);

  return (
    <div data-testid="home-state-growing">
      <DailyBriefing analyses={analyses} />
    </div>
  );
}
