'use client';

/**
 * PC-2 퍼스널컬러 v2 결과 카드
 *
 * Lab 12톤 시스템 기반 분석 결과 표시
 *
 * @description 12톤 시각화, 베스트/워스트 팔레트, 메이크업/스타일링 추천
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PersonalColorV2Result, TwelveTone, Season } from '@/lib/analysis/personal-color-v2';
import { TWELVE_TONE_LABELS, SEASON_DESCRIPTIONS } from '@/lib/analysis/personal-color-v2';

interface ResultCardV2Props {
  result: PersonalColorV2Result;
  showDetails?: boolean;
}

// 12톤 시즌별 색상 매핑
const SEASON_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  spring: { bg: 'bg-amber-50', text: 'text-amber-800', accent: 'bg-amber-500' },
  summer: { bg: 'bg-rose-50', text: 'text-rose-800', accent: 'bg-rose-400' },
  autumn: { bg: 'bg-orange-50', text: 'text-orange-800', accent: 'bg-orange-600' },
  winter: { bg: 'bg-slate-50', text: 'text-slate-800', accent: 'bg-slate-700' },
};

// 언더톤 라벨
const UNDERTONE_LABELS: Record<string, string> = {
  warm: '웜톤',
  cool: '쿨톤',
  neutral: '뉴트럴',
};

// 시즌 라벨
const SEASON_LABELS: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

export function ResultCardV2({ result, showDetails = true }: ResultCardV2Props) {
  // classification에서 season 접근
  const season = result.classification.season;
  const seasonStyle = SEASON_COLORS[season] || SEASON_COLORS.spring;

  // 신뢰도 등급
  const confidenceGrade = useMemo(() => {
    const confidence = result.classification.confidence;
    if (confidence >= 90) return { label: '매우 높음', color: 'text-emerald-600' };
    if (confidence >= 75) return { label: '높음', color: 'text-blue-600' };
    if (confidence >= 60) return { label: '보통', color: 'text-amber-600' };
    return { label: '낮음', color: 'text-red-600' };
  }, [result.classification.confidence]);

  // 톤 라벨
  const toneLabel = TWELVE_TONE_LABELS[result.classification.tone] || result.classification.tone;
  const seasonLabel = SEASON_LABELS[season] || season;
  const seasonDescription = SEASON_DESCRIPTIONS[season];

  return (
    <Card className="w-full" data-testid="personal-color-result-v2">
      {/* 헤더: 12톤 결과 */}
      <CardHeader className={`${seasonStyle.bg} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`text-2xl ${seasonStyle.text}`}>
              {toneLabel}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {seasonLabel} - {UNDERTONE_LABELS[result.classification.undertone]}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className={confidenceGrade.color}>
              신뢰도 {result.classification.confidence.toFixed(0)}%
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {confidenceGrade.label}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* 시즌 설명 */}
        {seasonDescription && (
          <p className="text-sm text-muted-foreground mb-6">
            {seasonDescription}
          </p>
        )}

        {/* 탭 컨텐츠 */}
        <Tabs defaultValue="palette" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="palette">컬러 팔레트</TabsTrigger>
            <TabsTrigger value="makeup">메이크업</TabsTrigger>
            <TabsTrigger value="styling">스타일링</TabsTrigger>
          </TabsList>

          {/* 컬러 팔레트 탭 */}
          <TabsContent value="palette" className="mt-4">
            <div className="space-y-4">
              {/* 베스트 컬러 (mainColors) */}
              <div>
                <h4 className="text-sm font-medium mb-2">베스트 컬러</h4>
                <div className="flex flex-wrap gap-2">
                  <TooltipProvider>
                    {result.palette?.mainColors?.map((color: string, idx: number) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <div
                            className="w-10 h-10 rounded-lg shadow-sm cursor-pointer hover:scale-110 transition-transform border border-gray-200"
                            style={{ backgroundColor: color }}
                            data-testid={`best-color-${idx}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{color}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </div>

              {/* 워스트 컬러 (avoidColors) */}
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                  피해야 할 컬러
                </h4>
                <div className="flex flex-wrap gap-2">
                  <TooltipProvider>
                    {result.palette?.avoidColors?.map((color: string, idx: number) => (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <div
                            className="w-8 h-8 rounded-lg opacity-60 cursor-pointer hover:opacity-100 transition-opacity border border-gray-200"
                            style={{ backgroundColor: color }}
                            data-testid={`worst-color-${idx}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{color}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              </div>

              {/* 액센트 컬러 */}
              {result.palette?.accentColors && result.palette.accentColors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">액센트 컬러</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.palette.accentColors.map((color: string, idx: number) => (
                      <div
                        key={idx}
                        className="w-8 h-8 rounded-full shadow-sm border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 메이크업 탭 (palette 내 lipColors, eyeshadowColors, blushColors) */}
          <TabsContent value="makeup" className="mt-4">
            <div className="space-y-4">
              {/* 립 컬러 */}
              <div>
                <h4 className="text-sm font-medium mb-2">추천 립 컬러</h4>
                <div className="flex flex-wrap gap-2">
                  {result.palette?.lipColors?.map((color: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 아이 컬러 */}
              <div>
                <h4 className="text-sm font-medium mb-2">추천 아이 컬러</h4>
                <div className="flex flex-wrap gap-2">
                  {result.palette?.eyeshadowColors?.map((color: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 블러셔 */}
              <div>
                <h4 className="text-sm font-medium mb-2">추천 블러셔</h4>
                <div className="flex flex-wrap gap-2">
                  {result.palette?.blushColors?.map((color: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 스타일링 탭 */}
          <TabsContent value="styling" className="mt-4">
            <div className="space-y-4">
              {/* 의류 컬러 */}
              <div>
                <h4 className="text-sm font-medium mb-2">추천 의류 컬러</h4>
                <div className="flex flex-wrap gap-2">
                  {result.stylingRecommendations?.clothing?.map((color: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 액세서리 (jewelry) */}
              <div>
                <h4 className="text-sm font-medium mb-2">추천 액세서리</h4>
                <div className="flex flex-wrap gap-2">
                  {result.stylingRecommendations?.jewelry?.map((color: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 메탈 추천 */}
              {result.stylingRecommendations?.metals && (
                <div>
                  <h4 className="text-sm font-medium mb-2">추천 메탈</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.stylingRecommendations.metals.map((metal, idx) => (
                      <Badge key={idx} variant="outline">
                        {metal === 'gold' ? '골드' : metal === 'silver' ? '실버' : '로즈골드'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Lab 색공간 정보 (상세 모드) - detailedAnalysis.skinToneLab */}
        {showDetails && result.detailedAnalysis?.skinToneLab && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">피부색 Lab 분석</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{result.detailedAnalysis.skinToneLab.L.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">L* (밝기)</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{result.detailedAnalysis.skinToneLab.a.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">a* (적-녹)</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{result.detailedAnalysis.skinToneLab.b.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">b* (황-청)</p>
              </div>
            </div>
          </div>
        )}

        {/* Fallback 알림 */}
        {result.usedFallback && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              AI 분석이 지연되어 예측 결과를 표시하고 있습니다.
              정확한 분석을 위해 재분석을 권장합니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ResultCardV2;
