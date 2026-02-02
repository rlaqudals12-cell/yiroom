'use client';

/**
 * S-2 피부분석 v2 6존 시각화 컴포넌트
 *
 * 6존 인터랙티브 얼굴 맵 + 존별 상세 정보
 *
 * @description 6존 시각화, 존 선택 시 상세 정보 표시, 바이탈리티 스코어
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type {
  SkinAnalysisV2Result,
  SkinZoneType,
  ZoneAnalysisV2,
} from '@/lib/analysis/skin-v2';

interface ZoneVisualizationProps {
  result: SkinAnalysisV2Result;
  showFaceMap?: boolean;
}

// 존 라벨 한국어
const ZONE_LABELS: Record<SkinZoneType, string> = {
  forehead: '이마',
  nose: '코',
  leftCheek: '왼쪽 볼',
  rightCheek: '오른쪽 볼',
  chin: '턱',
  eyeArea: '눈가',
  lipArea: '입술 주변',
};

// 존 그룹 라벨
const GROUP_LABELS = {
  tZone: 'T존',
  uZone: 'U존',
  eyeZone: '아이존',
  lipZone: '립존',
};

// 바이탈리티 등급 색상
const GRADE_COLORS: Record<string, string> = {
  S: 'bg-emerald-500',
  A: 'bg-blue-500',
  B: 'bg-amber-500',
  C: 'bg-orange-500',
  D: 'bg-red-500',
};

// 피부 타입 라벨
const SKIN_TYPE_LABELS: Record<string, string> = {
  dry: '건성',
  oily: '지성',
  combination: '복합성',
  normal: '중성',
  sensitive: '민감성',
};

// 존 위치 (SVG 좌표, 퍼센트)
const ZONE_POSITIONS: Record<SkinZoneType, { x: number; y: number; width: number; height: number }> = {
  forehead: { x: 25, y: 5, width: 50, height: 20 },
  eyeArea: { x: 15, y: 28, width: 70, height: 12 },
  nose: { x: 38, y: 40, width: 24, height: 25 },
  leftCheek: { x: 8, y: 42, width: 28, height: 25 },
  rightCheek: { x: 64, y: 42, width: 28, height: 25 },
  lipArea: { x: 30, y: 68, width: 40, height: 12 },
  chin: { x: 30, y: 82, width: 40, height: 15 },
};

export function ZoneVisualization({ result, showFaceMap = true }: ZoneVisualizationProps) {
  const [selectedZone, setSelectedZone] = useState<SkinZoneType | null>(null);

  // 선택된 존의 상세 정보
  const selectedZoneData = useMemo(() => {
    if (!selectedZone) return null;
    return result.zoneAnalysis.zones[selectedZone];
  }, [selectedZone, result.zoneAnalysis.zones]);

  // 점수 색상 결정
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4" data-testid="skin-zone-visualization">
      {/* 바이탈리티 스코어 헤더 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">피부 바이탈리티</CardTitle>
            <Badge className={`${GRADE_COLORS[result.vitalityGrade]} text-white`}>
              등급 {result.vitalityGrade}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{result.vitalityScore}</div>
            <div className="flex-1">
              <Progress value={result.vitalityScore} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {SKIN_TYPE_LABELS[result.skinType]} 피부
              </p>
            </div>
          </div>

          {/* 점수 구성 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            <ScoreItem label="수분" value={result.scoreBreakdown.hydration} />
            <ScoreItem label="탄력" value={result.scoreBreakdown.elasticity} />
            <ScoreItem label="맑음" value={result.scoreBreakdown.clarity} />
            <ScoreItem label="톤" value={result.scoreBreakdown.tone} />
          </div>
        </CardContent>
      </Card>

      {/* 6존 얼굴 맵 */}
      {showFaceMap && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">6존 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* SVG 얼굴 맵 */}
              <div className="relative w-40 h-56 sm:w-48 sm:h-64 mx-auto sm:mx-0 flex-shrink-0 bg-muted rounded-lg">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                >
                  {/* 얼굴 윤곽 */}
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="40"
                    ry="48"
                    fill="#fce7d6"
                    stroke="#d4a574"
                    strokeWidth="1"
                  />

                  {/* 각 존 영역 */}
                  {(Object.entries(ZONE_POSITIONS) as [SkinZoneType, typeof ZONE_POSITIONS.forehead][]).map(
                    ([zone, pos]) => {
                      const zoneData = result.zoneAnalysis.zones[zone];
                      const isSelected = selectedZone === zone;
                      const opacity = zoneData ? Math.min(0.8, zoneData.score / 100) : 0.3;

                      return (
                        <rect
                          key={zone}
                          x={pos.x}
                          y={pos.y}
                          width={pos.width}
                          height={pos.height}
                          rx="4"
                          fill={getScoreColor(zoneData?.score || 0)}
                          fillOpacity={opacity}
                          stroke={isSelected ? '#000' : 'transparent'}
                          strokeWidth={isSelected ? 2 : 0}
                          className="cursor-pointer transition-all hover:stroke-gray-500 hover:stroke-1"
                          onClick={() => setSelectedZone(zone)}
                          data-testid={`zone-${zone}`}
                        />
                      );
                    }
                  )}
                </svg>
              </div>

              {/* 존 선택 리스트 또는 상세 정보 */}
              <div className="flex-1">
                {selectedZoneData ? (
                  <ZoneDetailPanel
                    zone={selectedZone!}
                    data={selectedZoneData}
                    onClose={() => setSelectedZone(null)}
                  />
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-3">
                      존을 선택하여 상세 정보를 확인하세요
                    </p>
                    {(Object.keys(ZONE_LABELS) as SkinZoneType[]).map((zone) => {
                      const zoneData = result.zoneAnalysis.zones[zone];
                      return (
                        <button
                          key={zone}
                          onClick={() => setSelectedZone(zone)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <span className="text-sm">{ZONE_LABELS[zone]}</span>
                          <span
                            className={`text-sm font-medium ${
                              zoneData.score >= 70
                                ? 'text-emerald-600'
                                : zoneData.score >= 50
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {zoneData.score}점
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* T존-U존 차이 */}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">T존-U존 분석</h4>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">유분 차이</p>
                  <p className="font-medium">{result.zoneAnalysis.tUzoneDifference.oilinessDiff}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">수분 차이</p>
                  <p className="font-medium">{result.zoneAnalysis.tUzoneDifference.hydrationDiff}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">복합성 판정</p>
                  <p className="font-medium">
                    {result.zoneAnalysis.tUzoneDifference.isCombiSkin ? '예' : '아니오'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 주요 피부 고민 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">주요 피부 고민</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {result.primaryConcerns.map((concern, idx) => (
              <Badge key={idx} variant="outline">
                {concern}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 스킨케어 루틴 추천 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">추천 스킨케어 루틴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.routineRecommendations?.map((routine) => (
              <div
                key={routine.step}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {routine.step}
                </div>
                <div className="flex-1">
                  <p className="font-medium capitalize">{routine.category}</p>
                  <p className="text-sm text-muted-foreground">{routine.reason}</p>
                  {routine.ingredients.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {routine.ingredients.map((ing, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {ing}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {routine.avoidIngredients && routine.avoidIngredients.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {routine.avoidIngredients.map((ing, idx) => (
                        <Badge key={idx} variant="destructive" className="text-xs opacity-70">
                          ❌ {ing}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fallback 알림 */}
      {result.usedFallback && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ AI 분석이 지연되어 예측 결과를 표시하고 있습니다.
            정확한 분석을 위해 재분석을 권장합니다.
          </p>
        </div>
      )}
    </div>
  );
}

// 점수 아이템 컴포넌트
function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// 존 상세 패널
function ZoneDetailPanel({
  zone,
  data,
  onClose,
}: {
  zone: SkinZoneType;
  data: ZoneAnalysisV2;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{ZONE_LABELS[zone]}</h4>
        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ✕ 닫기
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{data.score}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>

      {/* 메트릭 */}
      <div className="space-y-2">
        <MetricBar label="수분" value={data.metrics.hydration} />
        <MetricBar label="유분" value={data.metrics.oiliness} />
        <MetricBar label="모공" value={data.metrics.pores} />
        <MetricBar label="질감" value={data.metrics.texture} />
        <MetricBar label="색소침착" value={data.metrics.pigmentation} />
        <MetricBar label="민감도" value={data.metrics.sensitivity} inverted />
        <MetricBar label="탄력" value={data.metrics.elasticity} />
      </div>

      {/* 고민 */}
      {data.concerns.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">주요 고민</p>
          <div className="flex flex-wrap gap-1">
            {data.concerns.map((concern, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {concern}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 추천 */}
      {data.recommendations.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">추천 케어</p>
          <ul className="text-sm space-y-1">
            {data.recommendations.slice(0, 3).map((rec, idx) => (
              <li key={idx} className="text-muted-foreground">
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 메트릭 바 컴포넌트
function MetricBar({
  label,
  value,
  inverted = false,
}: {
  label: string;
  value: number;
  inverted?: boolean;
}) {
  // 민감도 같은 경우 낮을수록 좋음 (반전)
  const getColor = () => {
    const v = inverted ? 100 - value : value;
    if (v >= 70) return 'bg-emerald-500';
    if (v >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-16 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs w-8 text-right">{value}</span>
    </div>
  );
}

export default ZoneVisualization;
