'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Palette, Sparkles } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import AnalysisCard from './AnalysisCard';
import QuickActions from './QuickActions';
import EmptyState from './EmptyState';

interface AnalysisSummary {
  id: string;
  type: 'personal-color' | 'skin' | 'body';
  createdAt: Date;
  summary: string;
  seasonType?: string;
  skinScore?: number;
  bodyType?: string;
}

interface AnalysisSectionProps {
  analyses: AnalysisSummary[];
  hasPersonalColor: boolean;
  defaultExpanded?: boolean;
}

/**
 * 분석 결과 섹션 (Zone 3 - Collapsible)
 * - 분석 결과가 있으면 카드 그리드 표시
 * - 분석 시작 버튼 (QuickActions)
 * - 결과 없으면 빈 상태 표시
 */
export default function AnalysisSection({
  analyses,
  hasPersonalColor,
  defaultExpanded,
}: AnalysisSectionProps) {
  // 분석 결과가 없으면 기본 펼침, 있으면 기본 접힘
  const [isOpen, setIsOpen] = useState(defaultExpanded ?? analyses.length === 0);

  const hasAnalyses = analyses.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <section
        className="bg-muted/30 rounded-xl border border-border/50 overflow-hidden"
        data-testid="analysis-section"
      >
        {/* 섹션 헤더 (Collapsible Trigger) */}
        <CollapsibleTrigger asChild>
          <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-module-personal-color-light flex items-center justify-center">
                <Palette className="w-4 h-4 text-module-personal-color" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">내 분석 프로필</h2>
                <p className="text-sm text-muted-foreground">
                  {hasAnalyses
                    ? `${analyses.length}개 분석 완료`
                    : '분석을 시작해보세요'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasPersonalColor && (
                <div className="px-2 py-1 bg-module-personal-color-light rounded-full">
                  <span className="text-xs font-medium text-module-personal-color">
                    PC 완료
                  </span>
                </div>
              )}
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* 콘텐츠 */}
        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-6">
            {/* 분석 결과가 없는 경우 */}
            {!hasAnalyses && !hasPersonalColor && (
              <EmptyState />
            )}

            {/* 분석 결과 카드 그리드 */}
            {hasAnalyses && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyses.map((analysis) => (
                  <AnalysisCard key={analysis.id} analysis={analysis} />
                ))}
              </div>
            )}

            {/* 분석 시작 버튼 (QuickActions) - PC 완료 후에만 다른 분석 유도 */}
            {(hasPersonalColor || hasAnalyses) && (
              <div className="pt-4 border-t border-border/50">
                <QuickActions hasPersonalColor={hasPersonalColor} />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}
