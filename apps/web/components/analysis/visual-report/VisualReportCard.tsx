'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, User, Palette, Scissors, Heart, Clock } from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { GradeDisplay } from './GradeDisplay';
import { StrengthsFirst } from './StrengthsFirst';
import { ANALYSIS_TYPE_COLORS } from './constants';
import type { VisualReportCardProps } from './types';
import { selectByKey } from '@/lib/utils/conditional-helpers';

// 분석 타입별 아이콘
const ANALYSIS_ICONS = {
  skin: Sparkles,
  body: User,
  'personal-color': Palette,
  hair: Scissors,
  makeup: Heart,
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
  hairMetrics,
  hairTypeLabel,
  makeupMetrics,
  undertoneLabel,
  analyzedAt,
  className,
}: VisualReportCardProps) {
  const t = useTranslations('visualReport');
  const colorTheme = ANALYSIS_TYPE_COLORS[analysisType];
  const TypeIcon = ANALYSIS_ICONS[analysisType];
  const labelKey = {
    skin: 'skinLabel',
    body: 'bodyLabel',
    'personal-color': 'personalColorLabel',
    hair: 'hairLabel',
    makeup: 'makeupLabel',
  } as const;
  const label = t(labelKey[analysisType]);

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
                {t('report', { label })}
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
                {t('bodyType')}{' '}
                <span className="font-medium text-foreground">
                  {t('typeSuffix', { label: bodyTypeLabel || bodyType })}
                </span>
              </p>
            )}
            {analysisType === 'personal-color' && seasonType && (
              <p className="text-sm text-muted-foreground mt-1">
                {t('season')}{' '}
                <span className="font-medium text-foreground">{seasonLabel || seasonType}</span>
              </p>
            )}
            {analysisType === 'hair' && hairTypeLabel && (
              <p className="text-sm text-muted-foreground mt-1">
                {t('hairType')} <span className="font-medium text-foreground">{hairTypeLabel}</span>
              </p>
            )}
            {analysisType === 'makeup' && undertoneLabel && (
              <p className="text-sm text-muted-foreground mt-1">
                {t('undertone')}{' '}
                <span className="font-medium text-foreground">{undertoneLabel}</span>
              </p>
            )}
          </CardHeader>
          <CardContent>
            {/* 등급 표시 - 분석 타입별 맞춤 메시지 */}
            <GradeDisplay
              score={displayScore}
              label={
                selectByKey(
                  analysisType,
                  {
                    skin: t('skinScore'),
                    body: t('bodyScore'),
                    hair: t('hairScore'),
                    makeup: t('makeupScore'),
                  },
                  t('defaultScore')
                )!
              }
              analysisType={analysisType}
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
        metrics={skinMetrics || hairMetrics || makeupMetrics}
        strengths={bodyStrengths}
        measurements={bodyMeasurements}
        bestColors={bestColors}
      />
    </div>
  );
}

export default VisualReportCard;
