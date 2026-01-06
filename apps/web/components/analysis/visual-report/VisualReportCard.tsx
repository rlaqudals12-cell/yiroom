'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, User, Palette, Clock } from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { GradeDisplay } from './GradeDisplay';
import { StrengthsFirst } from './StrengthsFirst';
import { ANALYSIS_TYPE_LABELS, ANALYSIS_TYPE_COLORS } from './constants';
import type { VisualReportCardProps } from './types';

// 분석 타입별 아이콘
const ANALYSIS_ICONS = {
  skin: Sparkles,
  body: User,
  'personal-color': Palette,
} as const;

/**
 * 통합 비주얼 리포트 카드
 * 3개 분석 타입(피부/체형/퍼스널컬러)에 공통으로 사용
 *
 * @example
 * ```tsx
 * // 피부 분석
 * <VisualReportCard
 *   analysisType="skin"
 *   overallScore={75}
 *   skinMetrics={[{ id: 'hydration', name: '수분', value: 85 }, ...]}
 * />
 *
 * // 체형 분석
 * <VisualReportCard
 *   analysisType="body"
 *   overallScore={70}
 *   bodyType="S"
 *   bodyStrengths={['균형 잡힌 어깨']}
 *   bodyMeasurements={[{ name: '어깨', value: 75 }]}
 * />
 *
 * // 퍼스널 컬러
 * <VisualReportCard
 *   analysisType="personal-color"
 *   overallScore={85}
 *   seasonType="spring"
 *   bestColors={[{ hex: '#FFB6C1', name: '연분홍' }]}
 * />
 * ```
 */
export function VisualReportCard({
  analysisType,
  overallScore,
  skinMetrics,
  bodyType,
  bodyTypeLabel,
  bodyStrengths,
  bodyMeasurements,
  seasonType,
  seasonLabel,
  confidence,
  bestColors,
  analyzedAt,
  className,
}: VisualReportCardProps) {
  const colorTheme = ANALYSIS_TYPE_COLORS[analysisType];
  const TypeIcon = ANALYSIS_ICONS[analysisType];
  const label = ANALYSIS_TYPE_LABELS[analysisType];

  // 퍼스널 컬러는 confidence를 점수로 사용
  const displayScore = analysisType === 'personal-color' && confidence ? confidence : overallScore;

  return (
    <div className={cn('space-y-4', className)} data-testid="visual-report-card">
      {/* 헤더 */}
      <FadeInUp delay={0}>
        <Card className={cn('border', colorTheme.border, colorTheme.bg)}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TypeIcon className={cn('w-5 h-5', colorTheme.text)} />
                {label} 리포트
              </CardTitle>
              {analyzedAt && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {format(analyzedAt, 'M월 d일 HH:mm', { locale: ko })}
                </span>
              )}
            </div>
            {/* 분석 타입별 서브타이틀 */}
            {analysisType === 'body' && bodyType && (
              <p className="text-sm text-muted-foreground mt-1">
                체형:{' '}
                <span className="font-medium text-foreground">{bodyTypeLabel || bodyType}타입</span>
              </p>
            )}
            {analysisType === 'personal-color' && seasonType && (
              <p className="text-sm text-muted-foreground mt-1">
                시즌:{' '}
                <span className="font-medium text-foreground">{seasonLabel || seasonType}</span>
              </p>
            )}
          </CardHeader>
          <CardContent>
            {/* 등급 표시 */}
            <GradeDisplay
              score={displayScore}
              label={
                analysisType === 'skin'
                  ? '피부 건강 점수'
                  : analysisType === 'body'
                    ? '체형 균형 점수'
                    : '진단 신뢰도'
              }
              showProgress
              showScore
              size="md"
              animate
            />
          </CardContent>
        </Card>
      </FadeInUp>

      {/* 강점 우선 섹션 */}
      <StrengthsFirst
        analysisType={analysisType}
        metrics={skinMetrics}
        strengths={bodyStrengths}
        measurements={bodyMeasurements}
        bestColors={bestColors}
      />
    </div>
  );
}

export default VisualReportCard;
