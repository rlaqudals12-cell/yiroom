'use client';

/**
 * C-2 체형분석 v2 시각화 컴포넌트
 *
 * MediaPipe Pose 33 랜드마크 오버레이 + 체형 분류 결과
 *
 * @description 33 랜드마크 시각화, 체형 분류, 스타일링 추천
 * @see docs/specs/SDD-BODY-ANALYSIS-v2.md
 */

import { useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BodyAnalysisV2Result, Landmark33, BodyShapeType } from '@/lib/analysis/body-v2';
import { selectByKey, classifyByRange } from '@/lib/utils/conditional-helpers';

interface BodyVisualizationProps {
  result: BodyAnalysisV2Result;
  imageUrl?: string;
  showLandmarks?: boolean;
}

// 체형 아이콘 (이모지 대신 SVG 경로로 대체 가능)
const BODY_SHAPE_ICONS: Record<BodyShapeType, string> = {
  rectangle: '⬜',
  'inverted-triangle': '🔻',
  triangle: '🔺',
  oval: '⬭',
  hourglass: '⏳',
};

// 체형별 색상
const BODY_SHAPE_COLORS: Record<BodyShapeType, { bg: string; text: string }> = {
  rectangle: { bg: 'bg-slate-100', text: 'text-slate-700' },
  'inverted-triangle': { bg: 'bg-blue-100', text: 'text-blue-700' },
  triangle: { bg: 'bg-amber-100', text: 'text-amber-700' },
  oval: { bg: 'bg-rose-100', text: 'text-rose-700' },
  hourglass: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

// MediaPipe Pose 랜드마크 연결 (뼈대)
const POSE_CONNECTIONS: [number, number][] = [
  // 얼굴
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  // 상체
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  // 손
  [15, 17],
  [15, 19],
  [15, 21],
  [17, 19],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20],
  // 하체
  [23, 25],
  [25, 27],
  [27, 29],
  [27, 31],
  [29, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [28, 32],
  [30, 32],
];

// 주요 랜드마크 라벨
const KEY_LANDMARKS: Record<number, string> = {
  0: '코',
  11: '왼쪽 어깨',
  12: '오른쪽 어깨',
  23: '왼쪽 골반',
  24: '오른쪽 골반',
  27: '왼쪽 발목',
  28: '오른쪽 발목',
};

export function BodyVisualization({
  result,
  imageUrl,
  showLandmarks = true,
}: BodyVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapeStyle = BODY_SHAPE_COLORS[result.bodyShape];

  // 랜드마크 접근 (poseDetection 내부)
  const landmarks = result.poseDetection?.landmarks;

  // 랜드마크 캔버스에 그리기
  useEffect(() => {
    if (!canvasRef.current || !landmarks || !showLandmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = canvas.width;

    // 연결선 그리기
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    POSE_CONNECTIONS.forEach(([start, end]) => {
      const startLandmark = landmarks[start];
      const endLandmark = landmarks[end];
      if (startLandmark && endLandmark) {
        ctx.beginPath();
        ctx.moveTo(startLandmark.x * scale, startLandmark.y * scale);
        ctx.lineTo(endLandmark.x * scale, endLandmark.y * scale);
        ctx.stroke();
      }
    });

    // 랜드마크 점 그리기
    landmarks.forEach((landmark: Landmark33, idx: number) => {
      const isKey = KEY_LANDMARKS[idx];
      ctx.beginPath();
      ctx.arc(landmark.x * scale, landmark.y * scale, isKey ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isKey ? '#ef4444' : '#3b82f6';
      ctx.fill();

      // 가시성이 낮으면 반투명
      if (landmark.visibility < 0.5) {
        ctx.globalAlpha = 0.5;
      }
      ctx.globalAlpha = 1;
    });
  }, [landmarks, showLandmarks]);

  // 신뢰도 등급
  const confidenceGrade = useMemo(() => {
    const confidence = result.measurementConfidence;
    if (confidence >= 90) return { label: '매우 높음', color: 'text-emerald-600' };
    if (confidence >= 75) return { label: '높음', color: 'text-blue-600' };
    if (confidence >= 60) return { label: '보통', color: 'text-amber-600' };
    return { label: '낮음', color: 'text-red-600' };
  }, [result.measurementConfidence]);

  // 어깨/힙 비율 계산 (bodyRatios에서)
  const shoulderToHipRatio = useMemo(() => {
    if (!result.bodyRatios) return 1;
    const { shoulderWidth, hipWidth } = result.bodyRatios;
    return hipWidth > 0 ? shoulderWidth / hipWidth : 1;
  }, [result.bodyRatios]);

  // 스타일링 추천 배열화
  const stylingRecommendationsList = useMemo(() => {
    if (!result.stylingRecommendations) return [];
    const { tops, bottoms, outerwear, silhouettes } = result.stylingRecommendations;
    return [...(tops || []), ...(bottoms || []), ...(outerwear || []), ...(silhouettes || [])];
  }, [result.stylingRecommendations]);

  return (
    <div className="space-y-4" data-testid="body-visualization">
      {/* 체형 분류 결과 헤더 */}
      <Card>
        <CardHeader className={`${shapeStyle.bg} rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{BODY_SHAPE_ICONS[result.bodyShape]}</span>
              <div>
                <CardTitle className={`text-xl ${shapeStyle.text}`}>
                  {result.bodyShapeInfo.label}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.bodyShapeInfo.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className={confidenceGrade.color}>
                신뢰도 {result.measurementConfidence.toFixed(0)}%
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{confidenceGrade.label}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 랜드마크 시각화 + 비율 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 랜드마크 캔버스 */}
        {showLandmarks && landmarks && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">체형 랜드마크</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted rounded-lg overflow-hidden">
                {imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element -- 캔버스 오버레이 배경 이미지 (base64) */
                  <img src={imageUrl} alt="Body analysis" className="w-full h-auto opacity-50" />
                )}
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={400}
                  className={`${imageUrl ? 'absolute inset-0' : ''} w-full h-auto`}
                  data-testid="landmarks-canvas"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                빨간 점: 주요 랜드마크 | 파란 점: 기타 랜드마크
              </p>
            </CardContent>
          </Card>
        )}

        {/* 체형 비율 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">체형 비율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RatioBar
                label="어깨-힙 비율"
                value={shoulderToHipRatio}
                min={0.8}
                max={1.3}
                optimal={1.0}
              />
              <RatioBar
                label="허리-힙 비율"
                value={result.bodyRatios?.waistToHipRatio || 0.8}
                min={0.6}
                max={1.0}
                optimal={0.7}
              />
              <RatioBar
                label="상체-하체 비율"
                value={result.bodyRatios?.upperToLowerRatio || 1}
                min={0.8}
                max={1.2}
                optimal={1.0}
              />

              {/* 수치 표시 */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">{shoulderToHipRatio.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">어깨/힙</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {(result.bodyRatios?.waistToHipRatio || 0.8).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">허리/힙</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 자세 분석 (postureAnalysis) */}
      {result.postureAnalysis && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">자세 분석</CardTitle>
              <Badge
                variant={result.postureAnalysis.spineAlignment >= 70 ? 'default' : 'secondary'}
              >
                척추 정렬 {result.postureAnalysis.spineAlignment}점
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <PostureItem
                label="어깨 기울기"
                value={`${result.postureAnalysis.shoulderTilt.toFixed(1)}°`}
                isNormal={Math.abs(result.postureAnalysis.shoulderTilt) < 5}
              />
              <PostureItem
                label="골반 기울기"
                value={`${result.postureAnalysis.hipTilt.toFixed(1)}°`}
                isNormal={Math.abs(result.postureAnalysis.hipTilt) < 5}
              />
              <PostureItem
                label="머리 위치"
                value={
                  selectByKey(result.postureAnalysis.headPosition, {
                    neutral: '정상',
                    forward: '전방',
                  }, '후방')!
                }
                isNormal={result.postureAnalysis.headPosition === 'neutral'}
              />
              {result.postureAnalysis.issues.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 mb-2">자세 교정 필요:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {result.postureAnalysis.issues.map((issue, idx) => (
                      <li key={idx}>• {issue.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 스타일링 추천 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">스타일링 추천</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recommend">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recommend">추천 스타일</TabsTrigger>
              <TabsTrigger value="avoid">피해야 할 스타일</TabsTrigger>
            </TabsList>

            <TabsContent value="recommend" className="mt-4">
              <div className="space-y-2">
                {stylingRecommendationsList.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="avoid" className="mt-4">
              <div className="space-y-2">
                {result.stylingRecommendations?.avoid?.map((style: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-red-50">
                    <span className="text-red-600">✗</span>
                    <span className="text-sm">{style}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Fallback 알림 */}
      {result.usedFallback && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            AI 분석이 지연되어 예측 결과를 표시하고 있어요. 정확한 분석을 위해 재분석을 권장해요.
          </p>
        </div>
      )}
    </div>
  );
}

// 비율 바 컴포넌트
function RatioBar({
  label,
  value,
  min,
  max,
  optimal,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  optimal: number;
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  const optimalPercentage = ((optimal - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(2)}</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        {/* 최적값 마커 */}
        <div
          className="absolute w-1 h-full bg-emerald-300 z-10"
          style={{ left: `${optimalPercentage}%` }}
        />
        {/* 현재값 바 */}
        <div
          className={`h-full transition-all ${
            classifyByRange(Math.abs(value - optimal), [
              { max: 0.1, result: 'bg-emerald-500' },
              { max: 0.2, result: 'bg-amber-500' },
            ], 'bg-red-400')
          }`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
}

// 자세 항목 컴포넌트
function PostureItem({
  label,
  value,
  isNormal,
}: {
  label: string;
  value: string;
  isNormal: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${isNormal ? 'text-emerald-600' : 'text-amber-600'}`}>
        {value}
      </span>
    </div>
  );
}

export default BodyVisualization;
