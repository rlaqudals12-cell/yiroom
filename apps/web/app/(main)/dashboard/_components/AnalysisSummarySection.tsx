'use client';

import Link from 'next/link';
import { Palette, Sparkles, User, Scissors, Heart, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

// 분석 타입별 메타 정보
const ANALYSIS_META = {
  'personal-color': {
    icon: Palette,
    label: '퍼스널 컬러',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    href: '/analysis/personal-color/result',
  },
  skin: {
    icon: Sparkles,
    label: '피부',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    href: '/analysis/skin/result',
  },
  body: {
    icon: User,
    label: '체형',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    href: '/analysis/body/result',
  },
  hair: {
    icon: Scissors,
    label: '헤어',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    href: '/analysis/hair/result',
  },
  makeup: {
    icon: Heart,
    label: '메이크업',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    href: '/analysis/makeup/result',
  },
};

interface AnalysisSummarySectionProps {
  analyses: AnalysisSummary[];
}

/**
 * 기존 사용자용 분석 요약 섹션
 * - 분석이 1개 이상인 사용자에게 표시
 * - 완료된 분석 결과 요약 카드
 * - 추가 분석 유도 버튼
 */
export default function AnalysisSummarySection({ analyses }: AnalysisSummarySectionProps) {
  // 미완료 분석 타입 계산
  const completedTypes = new Set(analyses.map((a) => a.type));
  const allTypes = ['personal-color', 'skin', 'body', 'hair', 'makeup'] as const;
  const incompleteTypes = allTypes.filter((t) => !completedTypes.has(t));

  return (
    <section
      className="bg-card rounded-2xl border border-border/50 p-5"
      data-testid="analysis-summary-section"
    >
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">내 분석 요약</h2>
        <Link
          href="/analysis"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          전체 보기
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 분석 결과 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {analyses.map((analysis) => {
          const meta = ANALYSIS_META[analysis.type];
          const Icon = meta.icon;
          const resultHref =
            analysis.type === 'personal-color'
              ? `/analysis/personal-color/result/${analysis.id}`
              : `${meta.href}/${analysis.id}`;

          return (
            <Link
              key={analysis.id}
              href={resultHref}
              className="group"
              data-testid={`analysis-summary-${analysis.type}`}
            >
              <div className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                {/* 아이콘 + 라벨 */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg ${meta.bgColor} flex items-center justify-center`}
                  >
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{meta.label}</span>
                </div>

                {/* 요약 값 */}
                <p className="font-semibold text-foreground truncate" title={analysis.summary}>
                  {analysis.summary}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 미완료 분석 유도 */}
      {incompleteTypes.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {incompleteTypes.length}개 분석이 남았어요
            </p>
            <div className="flex items-center gap-2">
              {incompleteTypes.slice(0, 3).map((type) => {
                const meta = ANALYSIS_META[type];
                const Icon = meta.icon;
                const analysisHref =
                  type === 'personal-color' ? '/analysis/personal-color' : `/analysis/${type}`;

                return (
                  <Link
                    key={type}
                    href={analysisHref}
                    className={`w-8 h-8 rounded-lg ${meta.bgColor} flex items-center justify-center hover:scale-110 transition-transform`}
                    title={`${meta.label} 분석하기`}
                  >
                    <Icon className={`w-4 h-4 ${meta.color}`} />
                  </Link>
                );
              })}
              <Button variant="outline" size="sm" asChild className="gap-1">
                <Link href="/analysis">
                  <Plus className="w-4 h-4" />
                  추가 분석
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
