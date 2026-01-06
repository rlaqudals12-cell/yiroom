'use client';

import { Sparkles, TrendingUp, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeInUp } from '@/components/animations';
import { MetricBar } from './MetricBar';
import { POSITIVE_MESSAGES, ANALYSIS_TYPE_COLORS } from './constants';
import type { StrengthsFirstProps } from './types';

/**
 * 강점 우선 표시 컴포넌트
 * 긍정적 UX: 강점을 먼저 보여주고, 성장 가능성은 부드럽게 표현
 *
 * @example
 * ```tsx
 * // 피부 분석
 * <StrengthsFirst
 *   analysisType="skin"
 *   metrics={[{ id: 'hydration', name: '수분', value: 85 }, ...]}
 * />
 *
 * // 체형 분석
 * <StrengthsFirst
 *   analysisType="body"
 *   strengths={['균형 잡힌 어깨', '좋은 비율']}
 *   measurements={[{ name: '어깨', value: 75 }, ...]}
 * />
 * ```
 */
export function StrengthsFirst({
  analysisType,
  metrics,
  strengths,
  measurements,
  bestColors,
  maxStrengths = 3,
  maxGrowthAreas = 2,
  className,
}: StrengthsFirstProps) {
  const colorTheme = ANALYSIS_TYPE_COLORS[analysisType];

  // 메트릭 기반 강점/성장 분류 (피부 분석)
  const processedItems = (() => {
    if (metrics && metrics.length > 0) {
      const sorted = [...metrics].sort((a, b) => b.value - a.value);
      return {
        strengthItems: sorted.slice(0, maxStrengths),
        growthItems: sorted.slice(-maxGrowthAreas).reverse(),
      };
    }

    // 체형 분석: measurements 기반
    if (measurements && measurements.length > 0) {
      const sorted = [...measurements].sort((a, b) => b.value - a.value);
      return {
        strengthItems: sorted.slice(0, maxStrengths).map((m) => ({
          id: m.name,
          name: m.name,
          value: m.value,
          description: m.description,
        })),
        growthItems: sorted
          .slice(-maxGrowthAreas)
          .reverse()
          .map((m) => ({
            id: m.name,
            name: m.name,
            value: m.value,
            description: m.description,
          })),
      };
    }

    return { strengthItems: [], growthItems: [] };
  })();

  // 퍼스널 컬러: 베스트 컬러 표시
  if (analysisType === 'personal-color' && bestColors && bestColors.length > 0) {
    return (
      <FadeInUp delay={1} className={cn('w-full', className)}>
        <Card className={cn('border', colorTheme.border)}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className={cn('w-5 h-5', colorTheme.text)} />
              나의 베스트 컬러
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {bestColors.slice(0, 6).map((color, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  />
                  <span className="text-xs text-muted-foreground">{color.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeInUp>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 강점 섹션 */}
      <FadeInUp delay={1}>
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-300">
              <Sparkles className="w-5 h-5" />
              {POSITIVE_MESSAGES.strengthsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {processedItems.strengthItems.length > 0 ? (
              processedItems.strengthItems.map((item, index) => (
                <MetricBar
                  key={item.id || item.name}
                  name={item.name}
                  value={item.value}
                  showGrade
                  delay={(index + 2) as 0 | 1 | 2 | 3 | 4 | 5}
                />
              ))
            ) : strengths && strengths.length > 0 ? (
              // 텍스트 기반 강점 (체형 분석 레거시)
              <ul className="space-y-2">
                {strengths.slice(0, maxStrengths).map((strength, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {strength}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{POSITIVE_MESSAGES.strengthsEmpty}</p>
            )}
          </CardContent>
        </Card>
      </FadeInUp>

      {/* 성장 가능성 섹션 */}
      {processedItems.growthItems.length > 0 && (
        <FadeInUp delay={4}>
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-300">
                <TrendingUp className="w-5 h-5" />
                {POSITIVE_MESSAGES.growthTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {processedItems.growthItems.map((item, index) => (
                <MetricBar
                  key={item.id || item.name}
                  name={item.name}
                  value={item.value}
                  showGrade
                  delay={(index + 5) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7}
                />
              ))}
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                이 항목들{POSITIVE_MESSAGES.growthSuffix}
              </p>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {/* 모든 항목이 우수한 경우 */}
      {processedItems.growthItems.length === 0 && processedItems.strengthItems.length > 0 && (
        <FadeInUp delay={4}>
          <Card className="border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-cyan-700 dark:text-cyan-300">
                {POSITIVE_MESSAGES.growthEmpty}
              </p>
            </CardContent>
          </Card>
        </FadeInUp>
      )}
    </div>
  );
}

export default StrengthsFirst;
