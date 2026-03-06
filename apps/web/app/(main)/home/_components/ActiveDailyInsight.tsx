'use client';

/**
 * Active State: 맥락 기반 오늘의 제안
 *
 * P-UX3: 매번 다른 이유 — 시간대 + 분석결과 기반 개인화 한 줄 제안
 * MVP: 시간대 기반만 (날씨 API는 Phase 2)
 */

import { Sparkles } from 'lucide-react';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

// 시간대별 인사이트 생성 (P-UX3: Dynamic Value)
function generateDailyInsight(analyses: AnalysisSummary[]): string {
  const hour = new Date().getHours();
  const season = analyses.find((a) => a.type === 'personal-color')?.summary;
  const skinScore = analyses.find((a) => a.type === 'skin')?.skinScore;

  // 아침 (6-11)
  if (hour >= 6 && hour < 12) {
    if (skinScore && skinScore < 70) {
      return '아침 세안 후 수분 세럼을 꼼꼼히 발라주세요';
    }
    if (season) {
      return season + '에 어울리는 오늘의 메이크업을 확인해보세요';
    }
    return '좋은 아침이에요! 오늘의 루틴을 확인해볼까요?';
  }

  // 오후 (12-17)
  if (hour >= 12 && hour < 18) {
    if (skinScore && skinScore < 60) {
      return '오후에는 미스트로 수분을 보충해주세요';
    }
    return '오후 루틴도 잊지 마세요';
  }

  // 저녁 (18-23)
  if (hour >= 18) {
    return '하루 마무리 스킨케어 루틴을 시작해볼까요?';
  }

  // 새벽 (0-5)
  return '충분한 수면이 최고의 스킨케어예요';
}

interface ActiveDailyInsightProps {
  analyses: AnalysisSummary[];
}

export default function ActiveDailyInsight({ analyses }: ActiveDailyInsightProps) {
  const insight = generateDailyInsight(analyses);

  return (
    <div
      className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-2xl p-5 border border-violet-200/50 dark:border-violet-800/30"
      data-testid="home-active-daily-insight"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 rounded-xl">
          <Sparkles className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{insight}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {analyses.length}개 분석 기반 맞춤 제안
          </p>
        </div>
      </div>
    </div>
  );
}
