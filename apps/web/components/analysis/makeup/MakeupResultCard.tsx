'use client';

/**
 * M-1 메이크업 분석 결과 카드
 *
 * 퍼스널컬러 연계 메이크업 추천 결과 표시
 *
 * @description 언더톤, 눈/입술/얼굴형 분석, 컬러 및 스타일 추천
 * @see docs/specs/SDD-MAKEUP-ANALYSIS.md
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { selectByKey, mapToClass } from '@/lib/utils/conditional-helpers';
import type { MakeupAnalysisResult, ColorRecommendation } from '@/lib/mock/makeup-analysis';

interface MakeupResultCardProps {
  result: MakeupAnalysisResult;
  showDetails?: boolean;
}

// 언더톤별 스타일
const UNDERTONE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  warm: { bg: 'bg-amber-50', text: 'text-amber-800', icon: '🌅' },
  cool: { bg: 'bg-sky-50', text: 'text-sky-800', icon: '❄️' },
  neutral: { bg: 'bg-gray-50', text: 'text-gray-800', icon: '⚖️' },
};

// 메이크업 스타일 정보
const STYLE_INFO: Record<string, { emoji: string; name: string }> = {
  natural: { emoji: '🌿', name: '내추럴' },
  glam: { emoji: '✨', name: '글램' },
  cute: { emoji: '🎀', name: '큐트' },
  chic: { emoji: '🖤', name: '시크' },
  vintage: { emoji: '🌹', name: '빈티지' },
  edgy: { emoji: '⚡', name: '엣지' },
};

// 피부 고민 정보
const CONCERN_INFO: Record<string, { emoji: string; name: string }> = {
  'dark-circles': { emoji: '🌑', name: '다크서클' },
  redness: { emoji: '🔴', name: '홍조' },
  'uneven-tone': { emoji: '🎨', name: '피부톤 불균일' },
  'large-pores': { emoji: '⭕', name: '넓은 모공' },
  'oily-tzone': { emoji: '💧', name: 'T존 번들거림' },
  'dry-patches': { emoji: '🏜️', name: '건조 부위' },
  'acne-scars': { emoji: '🔘', name: '트러블 흔적' },
  'fine-lines': { emoji: '〰️', name: '잔주름' },
};

export function MakeupResultCard({ result, showDetails = true }: MakeupResultCardProps) {
  const undertoneStyle = UNDERTONE_STYLES[result.undertone] || UNDERTONE_STYLES.neutral;

  // 분석 신뢰도 등급
  const reliabilityGrade = useMemo(() => {
    switch (result.analysisReliability) {
      case 'high':
        return { label: '높음', color: 'text-emerald-600' };
      case 'medium':
        return { label: '보통', color: 'text-amber-600' };
      case 'low':
        return { label: '낮음', color: 'text-red-600' };
      default:
        return { label: '보통', color: 'text-amber-600' };
    }
  }, [result.analysisReliability]);

  // 종합 점수 등급
  const scoreGrade = useMemo(() => {
    if (result.overallScore >= 80) return { label: '매우 좋음', color: 'text-emerald-600' };
    if (result.overallScore >= 60) return { label: '좋음', color: 'text-blue-600' };
    if (result.overallScore >= 40) return { label: '보통', color: 'text-amber-600' };
    return { label: '관리 필요', color: 'text-red-600' };
  }, [result.overallScore]);

  return (
    <Card className="w-full" data-testid="makeup-result-card">
      {/* 헤더: 언더톤 결과 */}
      <CardHeader className={`${undertoneStyle.bg} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{undertoneStyle.icon}</span>
            <div>
              <CardTitle className={`text-2xl ${undertoneStyle.text}`}>
                {result.undertoneLabel}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">메이크업 분석 결과</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{result.overallScore}</div>
            <p className={`text-sm ${scoreGrade.color}`}>{scoreGrade.label}</p>
          </div>
        </div>

        {/* 특징 뱃지 */}
        <div className="flex flex-wrap gap-2 mt-4" data-testid="makeup-feature-badges">
          <Badge variant="secondary" aria-label={`눈 모양: ${result.eyeShapeLabel}`}>
            👁️ {result.eyeShapeLabel}
          </Badge>
          <Badge variant="secondary" aria-label={`입술 모양: ${result.lipShapeLabel}`}>
            💋 {result.lipShapeLabel}
          </Badge>
          <Badge variant="secondary" aria-label={`얼굴형: ${result.faceShapeLabel}`}>
            🔷 {result.faceShapeLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* 인사이트 */}
        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <p className="text-sm leading-relaxed">{result.insight}</p>
        </div>

        {/* 탭 컨텐츠 */}
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-4" aria-label="메이크업 분석 결과 탭">
            <TabsTrigger value="colors">추천 컬러</TabsTrigger>
            <TabsTrigger value="styles">추천 스타일</TabsTrigger>
            <TabsTrigger value="tips">메이크업 팁</TabsTrigger>
            <TabsTrigger value="metrics">피부 지표</TabsTrigger>
          </TabsList>

          {/* 추천 컬러 탭 */}
          <TabsContent value="colors" className="mt-4">
            <div className="space-y-6">
              {result.colorRecommendations.map((category, idx) => (
                <ColorCategoryCard key={idx} category={category} />
              ))}
            </div>
          </TabsContent>

          {/* 추천 스타일 탭 */}
          <TabsContent value="styles" className="mt-4">
            <div className="grid grid-cols-3 gap-3">
              {result.recommendedStyles.map((styleId, idx) => {
                const style = STYLE_INFO[styleId] || { emoji: '💄', name: styleId };
                return (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg text-center hover:border-primary transition-colors"
                  >
                    <span className="text-2xl">{style.emoji}</span>
                    <p className="font-medium mt-2">{style.name}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      #{idx + 1} 추천
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* 고민 영역 */}
            {result.concerns.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">집중 케어 영역</h4>
                <div className="flex flex-wrap gap-2">
                  {result.concerns.map((concernId, idx) => {
                    const concern = CONCERN_INFO[concernId] || { emoji: '❓', name: concernId };
                    return (
                      <Badge key={idx} variant="outline">
                        {concern.emoji} {concern.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 메이크업 팁 탭 */}
          <TabsContent value="tips" className="mt-4">
            <div className="space-y-4">
              {result.makeupTips.map((tipGroup, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 font-medium text-sm">
                    {tipGroup.category}
                  </div>
                  <div className="p-4 space-y-2">
                    {tipGroup.tips.map((tip, tipIdx) => (
                      <div key={tipIdx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <p className="text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* 피부 지표 탭 */}
          <TabsContent value="metrics" className="mt-4">
            <div className="space-y-4">
              {result.metrics.map((metric, idx) => (
                <MetricBar key={idx} metric={metric} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 퍼스널컬러 연동 정보 */}
        {showDetails && result.personalColorConnection && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">퍼스널컬러 연동</h4>
            <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{result.personalColorConnection.season}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {result.personalColorConnection.note}
                  </p>
                </div>
                <Badge
                  variant={
                    result.personalColorConnection.compatibility === 'high'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  호환성:{' '}
                  {selectByKey(result.personalColorConnection.compatibility, {
                    high: '높음',
                    medium: '보통',
                  }, '낮음')}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* 분석 신뢰도 */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">분석 신뢰도</span>
          <Badge variant="secondary" className={reliabilityGrade.color}>
            {reliabilityGrade.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 컬러 카테고리 카드
 */
function ColorCategoryCard({ category }: { category: ColorRecommendation }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-3">{category.categoryLabel}</h4>
      <div className="flex flex-wrap gap-3">
        {category.colors.map((color, idx) => (
          <TooltipProvider key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex items-center gap-2 p-2 border rounded-lg hover:border-primary transition-colors cursor-pointer"
                  aria-label={`${color.name} (${color.hex})`}
                >
                  <div
                    className="w-8 h-8 rounded-lg shadow-sm border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{color.name}</p>
                    <p className="text-xs text-muted-foreground">{color.hex}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{color.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}

/**
 * 피부 지표 바
 */
function MetricBar({
  metric,
}: {
  metric: { id: string; label: string; value: number; status: string; description: string };
}) {
  const statusColors = {
    good: 'bg-emerald-500',
    normal: 'bg-amber-500',
    warning: 'bg-red-500',
  };

  const barColor = statusColors[metric.status as keyof typeof statusColors] || statusColors.normal;

  return (
    <div className="space-y-1" data-testid={`metric-${metric.id}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" id={`metric-label-${metric.id}`}>
          {metric.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{metric.value}점</span>
          <Badge
            variant="outline"
            className={mapToClass(metric.status, {
              good: 'text-emerald-600 border-emerald-200',
              warning: 'text-red-600 border-red-200',
            }, 'text-amber-600 border-amber-200')}
          >
            {selectByKey(metric.status, { good: '양호', warning: '주의' }, '보통')}
          </Badge>
        </div>
      </div>
      <div
        className="h-2 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={metric.value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={`metric-label-${metric.id}`}
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${metric.value}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{metric.description}</p>
    </div>
  );
}

export default MakeupResultCard;
