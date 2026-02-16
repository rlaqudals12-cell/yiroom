'use client';

/**
 * H-1 헤어분석 결과 카드
 *
 * 얼굴형 기반 헤어스타일 추천 결과 표시
 *
 * @description 얼굴형 분석, 헤어스타일 추천, 헤어컬러 추천
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type {
  HairAnalysisResult,
  FaceShapeType,
  HairstyleRecommendation,
  HairColorRecommendation,
} from '@/lib/analysis/hair';

interface HairResultCardProps {
  result: HairAnalysisResult;
  showDetails?: boolean;
}

// 얼굴형별 아이콘/색상 매핑
const FACE_SHAPE_STYLES: Record<FaceShapeType, { bg: string; text: string; icon: string }> = {
  oval: { bg: 'bg-emerald-50', text: 'text-emerald-800', icon: '🥚' },
  round: { bg: 'bg-rose-50', text: 'text-rose-800', icon: '🔵' },
  square: { bg: 'bg-amber-50', text: 'text-amber-800', icon: '🟧' },
  heart: { bg: 'bg-pink-50', text: 'text-pink-800', icon: '💗' },
  oblong: { bg: 'bg-blue-50', text: 'text-blue-800', icon: '📏' },
  diamond: { bg: 'bg-violet-50', text: 'text-violet-800', icon: '💎' },
  rectangle: { bg: 'bg-slate-50', text: 'text-slate-800', icon: '🟫' },
};

// 헤어 길이 라벨
const HAIR_LENGTH_LABELS: Record<string, string> = {
  short: '숏',
  medium: '미디엄',
  long: '롱',
};

export function HairResultCard({ result, showDetails = true }: HairResultCardProps) {
  const { faceShapeAnalysis, styleRecommendations, hairColorAnalysis, careTips } = result;
  const shapeStyle = FACE_SHAPE_STYLES[faceShapeAnalysis.faceShape] || FACE_SHAPE_STYLES.oval;

  // 신뢰도 등급
  const confidenceGrade = useMemo(() => {
    if (faceShapeAnalysis.confidence >= 85)
      return { label: '매우 높음', color: 'text-emerald-600' };
    if (faceShapeAnalysis.confidence >= 70) return { label: '높음', color: 'text-blue-600' };
    if (faceShapeAnalysis.confidence >= 55) return { label: '보통', color: 'text-amber-600' };
    return { label: '낮음', color: 'text-red-600' };
  }, [faceShapeAnalysis.confidence]);

  // 적합도 높은 순으로 정렬
  const sortedStyles = useMemo(() => {
    return [...styleRecommendations].sort((a, b) => b.suitability - a.suitability);
  }, [styleRecommendations]);

  return (
    <Card className="w-full" data-testid="hair-result-card">
      {/* 헤더: 얼굴형 결과 */}
      <CardHeader className={`${shapeStyle.bg} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{shapeStyle.icon}</span>
            <div>
              <CardTitle className={`text-2xl ${shapeStyle.text}`}>
                {faceShapeAnalysis.faceShapeLabel}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">얼굴형 분석 결과</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className={confidenceGrade.color}>
              신뢰도 {faceShapeAnalysis.confidence}%
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">{confidenceGrade.label}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* 탭 컨텐츠 */}
        <Tabs defaultValue="styles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="styles">추천 스타일</TabsTrigger>
            <TabsTrigger value="colors">헤어 컬러</TabsTrigger>
            <TabsTrigger value="care">케어 팁</TabsTrigger>
          </TabsList>

          {/* 추천 스타일 탭 */}
          <TabsContent value="styles" className="mt-4">
            <div className="space-y-4">
              {sortedStyles.map((style, idx) => (
                <StyleCard key={idx} style={style} rank={idx + 1} />
              ))}
            </div>
          </TabsContent>

          {/* 헤어 컬러 탭 */}
          <TabsContent value="colors" className="mt-4">
            <div className="space-y-4">
              {/* 현재 헤어컬러 (있는 경우) */}
              {hairColorAnalysis?.currentColor && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">현재 헤어 컬러</h4>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg shadow-sm border border-gray-200"
                      style={{ backgroundColor: hairColorAnalysis.currentColor.hexColor }}
                    />
                    <div>
                      <p className="font-medium">{hairColorAnalysis.currentColor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        피부톤 매칭: {hairColorAnalysis.skinToneMatch}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 추천 헤어 컬러 */}
              <div>
                <h4 className="text-sm font-medium mb-3">추천 헤어 컬러</h4>
                <div className="grid grid-cols-2 gap-3">
                  {hairColorAnalysis?.recommendedColors.map((color, idx) => (
                    <ColorCard key={idx} color={color} />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 케어 팁 탭 */}
          <TabsContent value="care" className="mt-4">
            <div className="space-y-3">
              {careTips.map((tip, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
                  <span className="text-lg">💡</span>
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 얼굴 비율 정보 (상세 모드) */}
        {showDetails && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">얼굴 비율 분석</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold">
                  {faceShapeAnalysis.ratios.lengthToWidthRatio.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">길이/너비 비율</p>
              </div>
              <div>
                <p className="text-xl font-bold">
                  {(faceShapeAnalysis.ratios.foreheadWidth * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">이마 너비</p>
              </div>
              <div>
                <p className="text-xl font-bold">
                  {(faceShapeAnalysis.ratios.jawWidth * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">턱 너비</p>
              </div>
            </div>

            {/* 비율 바 */}
            <div className="mt-4 space-y-2">
              <RatioBar
                label="이마"
                value={faceShapeAnalysis.ratios.foreheadWidth}
                maxValue={0.35}
              />
              <RatioBar
                label="광대"
                value={faceShapeAnalysis.ratios.cheekboneWidth}
                maxValue={0.35}
              />
              <RatioBar label="턱" value={faceShapeAnalysis.ratios.jawWidth} maxValue={0.35} />
            </div>
          </div>
        )}

        {/* 현재 헤어 정보 */}
        {result.currentHairInfo && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">현재 헤어 정보</h4>
            <div className="flex flex-wrap gap-2">
              {result.currentHairInfo.length && (
                <Badge variant="outline">
                  {HAIR_LENGTH_LABELS[result.currentHairInfo.length] ||
                    result.currentHairInfo.length}
                </Badge>
              )}
              {result.currentHairInfo.texture && (
                <Badge variant="outline">{result.currentHairInfo.texture}</Badge>
              )}
              {result.currentHairInfo.thickness && (
                <Badge variant="outline">{result.currentHairInfo.thickness}</Badge>
              )}
              {result.currentHairInfo.scalpCondition && (
                <Badge variant="outline">{result.currentHairInfo.scalpCondition}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Fallback 알림 */}
        {result.usedFallback && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              AI 분석이 지연되어 예측 결과를 표시하고 있어요. 정확한 분석을 위해 재분석을 권장해요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 스타일 추천 카드
 */
function StyleCard({ style, rank }: { style: HairstyleRecommendation; rank: number }) {
  return (
    <div className="p-4 border rounded-lg hover:border-primary transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
            <h5 className="font-medium">{style.name}</h5>
            <Badge variant="secondary" className="text-xs">
              {HAIR_LENGTH_LABELS[style.length] || style.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{style.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {style.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="ml-4 text-right">
          <div className="text-2xl font-bold text-primary">{style.suitability}%</div>
          <p className="text-xs text-muted-foreground">적합도</p>
        </div>
      </div>
      {/* 적합도 프로그레스 바 */}
      <Progress value={style.suitability} className="mt-3 h-2" />
    </div>
  );
}

/**
 * 헤어 컬러 추천 카드
 */
function ColorCard({ color }: { color: HairColorRecommendation }) {
  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="w-10 h-10 rounded-lg shadow-sm cursor-pointer hover:scale-110 transition-transform border border-gray-200"
                style={{ backgroundColor: color.hexColor }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{color.hexColor}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{color.name}</p>
          <p className="text-xs text-muted-foreground">{color.seasonMatch}</p>
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">
          {color.suitability}%
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {color.tags.slice(0, 2).map((tag, idx) => (
          <Badge key={idx} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/**
 * 비율 바 컴포넌트
 */
function RatioBar({ label, value, maxValue }: { label: string; value: number; maxValue: number }) {
  const percentage = Math.min(100, (value / maxValue) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-8">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-12 text-right">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export default HairResultCard;
