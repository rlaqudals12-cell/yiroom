'use client';

/**
 * Home State: Growing (분석 1-3개)
 *
 * 감정 목표: "더 알고 싶다" (Behavioral)
 * 정보 블록: 4개 (발견 + 프로그레스 + 인과 추천 + 최근 본 제품)
 */

import { Sparkles, CheckCircle2 } from 'lucide-react';
import type { AnalysisSummary, AnalysisType } from '@/hooks/useAnalysisStatus';
import { AnalysisProgressBar } from '@/components/home/AnalysisProgressBar';
import GrowingNextStep from './GrowingNextStep';
import HomeRecentlyViewed from './HomeRecentlyViewed';

// 분석 타입별 아이콘/라벨
const ANALYSIS_LABELS: Record<AnalysisType, { label: string; color: string }> = {
  'personal-color': { label: '퍼스널 컬러', color: 'text-pink-500' },
  skin: { label: '피부', color: 'text-blue-500' },
  body: { label: '체형', color: 'text-green-500' },
  hair: { label: '헤어', color: 'text-amber-500' },
  makeup: { label: '메이크업', color: 'text-purple-500' },
  'oral-health': { label: '구강건강', color: 'text-cyan-500' },
};

interface HomeStateGrowingProps {
  analysisCount: number;
  analyses: AnalysisSummary[];
}

export default function HomeStateGrowing({ analysisCount, analyses }: HomeStateGrowingProps) {
  return (
    <div className="space-y-5" data-testid="home-state-growing">
      {/* 발견 디스커버리 (정보 블록 1) */}
      <div data-testid="home-growing-discovery">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h2 className="font-semibold text-foreground">
              나에 대해 {analysisCount}가지를 발견했어요
            </h2>
          </div>

          {/* 완료된 분석 칩 */}
          <div className="flex flex-wrap gap-2 mb-4">
            {analyses.map((analysis) => {
              const meta = ANALYSIS_LABELS[analysis.type];
              return (
                <div
                  key={analysis.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 rounded-full"
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${meta?.color || 'text-violet-500'}`} />
                  <span className="text-xs font-medium text-foreground">
                    {meta?.label || analysis.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{analysis.summary}</span>
                </div>
              );
            })}
          </div>

          {/* 프로그레스 바 (정보 블록 2) */}
          <AnalysisProgressBar completed={analysisCount} total={6} />
        </div>
      </div>

      {/* 인과 연결 다음 추천 (정보 블록 3) */}
      <GrowingNextStep analyses={analyses} />

      {/* 최근 본 제품 (정보 블록 4) */}
      <HomeRecentlyViewed />
    </div>
  );
}
