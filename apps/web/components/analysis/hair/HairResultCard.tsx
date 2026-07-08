'use client';

/**
 * H-1 헤어분석 결과 카드
 *
 * 얼굴형 기반 헤어스타일 추천 + 텍스처 분류 + 계절별 케어 + 스타일 매칭
 *
 * @description 얼굴형 분석, 헤어스타일 추천, 헤어컬러 추천, 텍스처 카드, 계절 팁, 스타일 갤러리
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
import type { TextureClassification } from '@/lib/analysis/hair';
import type { SeasonalRecommendation, StyleMatchResult } from '@/lib/analysis/hair';
import {
  getTextureInfo,
  classifyTexture,
  getTextureGroupLabel,
  getRecommendedProductCategories,
} from '@/lib/analysis/hair';
import { getSeasonalRecommendation } from '@/lib/analysis/hair';
import { matchStyles } from '@/lib/analysis/hair';

interface HairResultCardProps {
  result: HairAnalysisResult;
  showDetails?: boolean;
}

// 얼굴형별 아이콘/색상 매핑
const FACE_SHAPE_STYLES: Record<FaceShapeType, { bg: string; text: string; icon: string }> = {
  oval: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-800 dark:text-emerald-300',
    icon: '🥚',
  },
  round: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-800 dark:text-rose-300',
    icon: '🔵',
  },
  square: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-800 dark:text-amber-300',
    icon: '🟧',
  },
  heart: {
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    text: 'text-pink-800 dark:text-pink-300',
    icon: '💗',
  },
  oblong: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-800 dark:text-blue-300',
    icon: '📏',
  },
  diamond: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-800 dark:text-violet-300',
    icon: '💎',
  },
  rectangle: {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    text: 'text-slate-800 dark:text-slate-300',
    icon: '🟫',
  },
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

  // 자가입력 경로: 사진 분석 신뢰도는 최대 95%라 100은 "직접 입력" 신호 (신뢰도 수치 위장 금지)
  const isSelfInput = faceShapeAnalysis.confidence >= 100;

  // 신뢰도 등급
  const confidenceGrade = useMemo(() => {
    if (isSelfInput) return { label: '입력하신 값 기준', color: 'text-slate-600' };
    if (faceShapeAnalysis.confidence >= 85)
      return { label: '매우 높음', color: 'text-emerald-600' };
    if (faceShapeAnalysis.confidence >= 70) return { label: '높음', color: 'text-blue-600' };
    if (faceShapeAnalysis.confidence >= 55) return { label: '보통', color: 'text-amber-600' };
    return { label: '낮음', color: 'text-red-600' };
  }, [isSelfInput, faceShapeAnalysis.confidence]);

  // 적합도 높은 순으로 정렬
  const sortedStyles = useMemo(() => {
    return [...styleRecommendations].sort((a, b) => b.suitability - a.suitability);
  }, [styleRecommendations]);

  // 텍스처 분류 (현재 헤어 정보가 있으면 활용)
  const textureInfo = useMemo((): TextureClassification | null => {
    const hairInfo = result.currentHairInfo;
    if (!hairInfo?.texture) return null;
    const code = classifyTexture(hairInfo.texture as 'straight' | 'wavy' | 'curly' | 'coily', {
      thickness: hairInfo.thickness as 'fine' | 'medium' | 'thick' | undefined,
    });
    return getTextureInfo(code);
  }, [result.currentHairInfo]);

  // 계절별 추천 (텍스처 정보가 있으면 맞춤형)
  const seasonalRec = useMemo((): SeasonalRecommendation | null => {
    if (!textureInfo) return null;
    return getSeasonalRecommendation(textureInfo.code);
  }, [textureInfo]);

  // 3-Factor 스타일 매칭 (얼굴형 + 텍스처 + 퍼스널컬러)
  const styleMatches = useMemo((): StyleMatchResult[] => {
    if (!textureInfo) return [];
    return matchStyles(
      {
        faceShape: faceShapeAnalysis.faceShape,
        textureCode: textureInfo.code,
        preferredLength: result.currentHairInfo?.length as 'short' | 'medium' | 'long' | undefined,
      },
      5
    );
  }, [faceShapeAnalysis.faceShape, textureInfo, result.currentHairInfo?.length]);

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
              {isSelfInput ? '직접 입력' : `신뢰도 ${faceShapeAnalysis.confidence}%`}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">{confidenceGrade.label}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* 텍스처 카드 (텍스처 정보가 있으면 탭 위에 표시) */}
        {textureInfo && <TextureCard textureInfo={textureInfo} data-testid="texture-card" />}

        {/* 탭 컨텐츠 */}
        <Tabs defaultValue="styles" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="styles" aria-label="추천 헤어스타일 보기">
              스타일
            </TabsTrigger>
            <TabsTrigger value="matching" aria-label="3-Factor 스타일 매칭 보기">
              매칭
            </TabsTrigger>
            <TabsTrigger value="colors" aria-label="추천 헤어 컬러 보기">
              컬러
            </TabsTrigger>
            <TabsTrigger value="seasonal" aria-label="계절별 케어 팁 보기">
              계절 케어
            </TabsTrigger>
            <TabsTrigger value="care" aria-label="헤어 케어 팁 보기">
              관리
            </TabsTrigger>
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
                      className="w-12 h-12 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
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

          {/* 3-Factor 스타일 매칭 탭 */}
          <TabsContent value="matching" className="mt-4">
            {styleMatches.length > 0 ? (
              <div className="space-y-3" data-testid="style-gallery">
                <p className="text-sm text-muted-foreground mb-2">
                  얼굴형 + 텍스처 + 퍼스널컬러를 종합한 맞춤 스타일 추천
                </p>
                {styleMatches.map((match, idx) => (
                  <StyleMatchCard key={match.name} match={match} rank={idx + 1} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>텍스처 정보가 필요해요.</p>
                <p className="text-xs mt-1">
                  헤어 상세 분석을 진행하면 맞춤 스타일을 추천받을 수 있어요.
                </p>
              </div>
            )}
          </TabsContent>

          {/* 계절별 케어 팁 탭 */}
          <TabsContent value="seasonal" className="mt-4">
            {seasonalRec ? (
              <SeasonalTipsSection recommendation={seasonalRec} />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>텍스처 정보가 필요해요.</p>
                <p className="text-xs mt-1">
                  헤어 상세 분석을 진행하면 계절별 맞춤 케어를 받을 수 있어요.
                </p>
              </div>
            )}
          </TabsContent>

          {/* 케어 팁 탭 */}
          <TabsContent value="care" className="mt-4">
            <div className="space-y-3">
              {careTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg flex items-start gap-3"
                >
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
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-300">
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
                className="w-10 h-10 rounded-lg shadow-sm cursor-pointer hover:scale-110 transition-transform border border-gray-200 dark:border-gray-700"
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
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-12 text-right">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

/**
 * 텍스처 분류 카드 — Andre Walker 12-Type 표시
 */
function TextureCard({
  textureInfo,
}: {
  textureInfo: TextureClassification;
  'data-testid'?: string;
}) {
  // 수분 필요도에 따른 색상
  // 수분 필요도 3단계 색상 매핑
  const getMoistureColor = (need: number): string => {
    if (need >= 4) return 'text-blue-600 dark:text-blue-400';
    if (need >= 3) return 'text-cyan-600 dark:text-cyan-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };
  const moistureColor = getMoistureColor(textureInfo.moistureNeed);

  const recommendedProducts = getRecommendedProductCategories(textureInfo.code);

  return (
    <div
      className="mb-4 p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
      data-testid="texture-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600 text-white text-sm">
              Type {textureInfo.code.toUpperCase()}
            </Badge>
            <span className="font-semibold">{textureInfo.label}</span>
            <span className="text-xs text-muted-foreground">({textureInfo.labelEn})</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{textureInfo.description}</p>
          <p className="text-xs text-muted-foreground mt-0.5">컬 패턴: {textureInfo.curlPattern}</p>
        </div>
        <div className="text-right shrink-0 ml-3">
          <p className="text-xs text-muted-foreground">그룹</p>
          <p className="text-sm font-medium">{getTextureGroupLabel(textureInfo.group)}</p>
        </div>
      </div>

      {/* 특성 지표 */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="text-center p-2 bg-white/60 dark:bg-black/20 rounded-md">
          <p className="text-xs text-muted-foreground">관리 난이도</p>
          <p className="text-lg font-bold">{textureInfo.maintenanceLevel}/5</p>
        </div>
        <div className="text-center p-2 bg-white/60 dark:bg-black/20 rounded-md">
          <p className="text-xs text-muted-foreground">수분 필요도</p>
          <p className={`text-lg font-bold ${moistureColor}`}>{textureInfo.moistureNeed}/5</p>
        </div>
        <div className="text-center p-2 bg-white/60 dark:bg-black/20 rounded-md">
          <p className="text-xs text-muted-foreground">볼륨</p>
          <p className="text-sm font-medium capitalize">{textureInfo.volumeCharacteristic}</p>
        </div>
      </div>

      {/* 취약 요인 & 케어 키워드 */}
      <div className="mt-3 flex flex-wrap gap-1">
        {textureInfo.vulnerabilities.map((v, i) => (
          <Badge key={i} variant="destructive" className="text-xs">
            {v}
          </Badge>
        ))}
        {textureInfo.careKeywords.map((k, i) => (
          <Badge key={`care-${i}`} variant="secondary" className="text-xs">
            {k}
          </Badge>
        ))}
      </div>

      {/* 추천 제품 카테고리 */}
      {recommendedProducts.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-1">추천 제품 카테고리</p>
          <div className="flex flex-wrap gap-1">
            {recommendedProducts.map((p, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {p}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 3-Factor 스타일 매칭 카드
 */
function StyleMatchCard({ match, rank }: { match: StyleMatchResult; rank: number }) {
  const { breakdown } = match;

  return (
    <div
      className="p-4 border rounded-lg hover:border-primary transition-colors"
      data-testid="style-match-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
            <h5 className="font-medium">{match.name}</h5>
            <Badge variant="secondary" className="text-xs">
              {HAIR_LENGTH_LABELS[match.length] || match.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{match.description}</p>
        </div>
        <div className="ml-4 text-right">
          <div className="text-2xl font-bold text-primary">{match.matchScore}</div>
          <p className="text-xs text-muted-foreground">종합점수</p>
        </div>
      </div>

      {/* 점수 분해 바 */}
      <div className="mt-3 space-y-1">
        <ScoreBar label="얼굴형" value={breakdown.faceShapeScore} max={40} color="bg-emerald-500" />
        <ScoreBar label="텍스처" value={breakdown.textureScore} max={30} color="bg-purple-500" />
        <ScoreBar label="컬러" value={breakdown.colorSeasonScore} max={20} color="bg-amber-500" />
        <ScoreBar label="길이" value={breakdown.lengthBonus} max={10} color="bg-blue-500" />
      </div>

      {/* 매칭 이유 */}
      {match.matchReasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {match.matchReasons.map((reason, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {reason}
            </Badge>
          ))}
        </div>
      )}

      <Progress value={match.matchScore} className="mt-3 h-2" />
    </div>
  );
}

/**
 * 점수 분해 바
 */
function ScoreBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-10">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-10 text-right">
        {value}/{max}
      </span>
    </div>
  );
}

/**
 * 계절별 케어 팁 섹션
 */
function SeasonalTipsSection({ recommendation }: { recommendation: SeasonalRecommendation }) {
  return (
    <div className="space-y-4" data-testid="seasonal-tips">
      {/* 현재 계절 헤더 */}
      <div className="flex items-center gap-2">
        <Badge className="bg-gradient-to-r from-sky-500 to-orange-500 text-white">
          {recommendation.seasonLabel} 케어 가이드
        </Badge>
      </div>

      {/* 환경 위험 요인 */}
      <div>
        <h5 className="text-sm font-medium mb-2">주의해야 할 환경 요인</h5>
        <div className="flex flex-wrap gap-2">
          {recommendation.hazardLabels.map((label, i) => (
            <Badge key={i} variant="destructive" className="text-xs">
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* 일반 케어 팁 */}
      <div>
        <h5 className="text-sm font-medium mb-2">기본 관리</h5>
        <div className="space-y-2">
          {recommendation.generalTips.map((tip, i) => (
            <div
              key={i}
              className="p-2 bg-sky-50 dark:bg-sky-950/20 rounded-md flex items-start gap-2"
            >
              <span className="text-xs shrink-0 mt-0.5">&#x2714;</span>
              <p className="text-sm">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 텍스처별 특화 팁 */}
      {recommendation.textureTips.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">내 텍스처 맞춤 팁</h5>
          <div className="space-y-2">
            {recommendation.textureTips.map((tip, i) => (
              <div
                key={i}
                className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded-md flex items-start gap-2"
              >
                <span className="text-xs shrink-0 mt-0.5">&#x2728;</span>
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 추천 제품 */}
      {recommendation.productCategories.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">추천 제품</h5>
          <div className="flex flex-wrap gap-1">
            {recommendation.productCategories.map((product, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {product}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 주의사항 */}
      {recommendation.warnings.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2 text-amber-600">주의사항</h5>
          <div className="space-y-2">
            {recommendation.warnings.map((warning, i) => (
              <div
                key={i}
                className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800"
              >
                <p className="text-sm text-amber-800 dark:text-amber-300">{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HairResultCard;
