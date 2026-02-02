'use client';

/**
 * Phase D: S-1 피부 분석 결과 요약 카드
 *
 * 상담 페이지 상단에 표시되는 분석 결과 요약
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Sparkles, Sun, AlertCircle } from 'lucide-react';
import type { SkinAnalysisSummary } from '@/types/skin-consultation';

interface SkinSummaryCardProps {
  /** S-1 분석 결과 요약 */
  analysis: SkinAnalysisSummary;
  /** 카드 클릭 핸들러 (상세 보기) */
  onClick?: () => void;
}

/**
 * 피부 분석 결과 요약 카드
 */
export default function SkinSummaryCard({ analysis, onClick }: SkinSummaryCardProps) {
  // 점수에 따른 상태 색상
  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  // 점수에 따른 배경 색상
  const getScoreBgColor = (score: number): string => {
    if (score >= 70) return 'bg-emerald-50 dark:bg-emerald-950/30';
    if (score >= 40) return 'bg-amber-50 dark:bg-amber-950/30';
    return 'bg-red-50 dark:bg-red-950/30';
  };

  return (
    <Card
      className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border-pink-200/50 dark:border-pink-800/50 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      data-testid="skin-summary-card"
    >
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-sm text-foreground">내 피부 분석 결과</span>
          <Badge variant="secondary" className="text-[10px]">
            {analysis.analyzedAt.toLocaleDateString('ko-KR')} 분석
          </Badge>
        </div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          {/* 수분 */}
          <div className={`rounded-lg p-2 ${getScoreBgColor(analysis.hydration)}`}>
            <Droplets className={`w-4 h-4 mx-auto mb-1 ${getScoreColor(analysis.hydration)}`} />
            <div className={`text-lg font-bold ${getScoreColor(analysis.hydration)}`}>
              {analysis.hydration}
            </div>
            <div className="text-[10px] text-muted-foreground">수분</div>
          </div>

          {/* 유분 */}
          <div className={`rounded-lg p-2 ${getScoreBgColor(100 - analysis.oiliness)}`}>
            <Sparkles className={`w-4 h-4 mx-auto mb-1 ${getScoreColor(100 - analysis.oiliness)}`} />
            <div className={`text-lg font-bold ${getScoreColor(100 - analysis.oiliness)}`}>
              {analysis.oiliness}
            </div>
            <div className="text-[10px] text-muted-foreground">유분</div>
          </div>

          {/* 민감도 */}
          <div className={`rounded-lg p-2 ${getScoreBgColor(100 - analysis.sensitivity)}`}>
            <Sun className={`w-4 h-4 mx-auto mb-1 ${getScoreColor(100 - analysis.sensitivity)}`} />
            <div className={`text-lg font-bold ${getScoreColor(100 - analysis.sensitivity)}`}>
              {analysis.sensitivity}
            </div>
            <div className="text-[10px] text-muted-foreground">민감도</div>
          </div>
        </div>

        {/* 피부 타입 + 주요 고민 */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{analysis.skinType} 피부 타입</p>

          {/* 주요 고민 배지 */}
          {analysis.concerns && analysis.concerns.length > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {analysis.concerns.length}개 고민
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
