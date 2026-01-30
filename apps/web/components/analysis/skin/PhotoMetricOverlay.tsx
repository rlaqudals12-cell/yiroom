'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

/**
 * 피부 분석 지표 타입 (경쟁사 스타일)
 * 룰루랩, 퍼펙트코프 스타일의 8가지 지표
 */
export type SkinMetricType =
  | 'wrinkles' // 주름
  | 'darkCircles' // 다크서클
  | 'texture' // 텍스처
  | 'spots' // 잡티
  | 'redness' // 홍조
  | 'hydration' // 수분
  | 'oil' // 유분
  | 'acne'; // 여드름

/** 지표별 메타데이터 */
const METRIC_META: Record<
  SkinMetricType,
  {
    label: string;
    color: string; // 테두리/배지 색상
    bgColor: string; // 배경 색상
    position: { x: number; y: number }; // 배지 위치 (%)
    anchor: { x: number; y: number }; // 연결선 끝점 (얼굴 위 %)
  }
> = {
  wrinkles: {
    label: '주름',
    color: 'rgb(34, 197, 94)', // green-500
    bgColor: 'rgba(34, 197, 94, 0.1)',
    position: { x: 5, y: 15 },
    anchor: { x: 30, y: 25 },
  },
  darkCircles: {
    label: '다크서클',
    color: 'rgb(239, 68, 68)', // red-500
    bgColor: 'rgba(239, 68, 68, 0.1)',
    position: { x: 85, y: 15 },
    anchor: { x: 70, y: 40 },
  },
  texture: {
    label: '텍스처',
    color: 'rgb(168, 85, 247)', // purple-500
    bgColor: 'rgba(168, 85, 247, 0.1)',
    position: { x: 88, y: 38 },
    anchor: { x: 65, y: 50 },
  },
  spots: {
    label: '잡티',
    color: 'rgb(6, 182, 212)', // cyan-500
    bgColor: 'rgba(6, 182, 212, 0.1)',
    position: { x: 2, y: 38 },
    anchor: { x: 35, y: 45 },
  },
  redness: {
    label: '홍조',
    color: 'rgb(249, 115, 22)', // orange-500
    bgColor: 'rgba(249, 115, 22, 0.1)',
    position: { x: 90, y: 62 },
    anchor: { x: 70, y: 55 },
  },
  hydration: {
    label: '수분',
    color: 'rgb(59, 130, 246)', // blue-500
    bgColor: 'rgba(59, 130, 246, 0.1)',
    position: { x: 0, y: 62 },
    anchor: { x: 30, y: 60 },
  },
  oil: {
    label: '유분',
    color: 'rgb(234, 179, 8)', // yellow-500
    bgColor: 'rgba(234, 179, 8, 0.1)',
    position: { x: 8, y: 82 },
    anchor: { x: 40, y: 70 },
  },
  acne: {
    label: '여드름',
    color: 'rgb(34, 197, 94)', // green-500
    bgColor: 'rgba(34, 197, 94, 0.1)',
    position: { x: 75, y: 78 },
    anchor: { x: 55, y: 72 },
  },
};

/** 점수 기반 색상 반환 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'rgb(34, 197, 94)'; // green
  if (score >= 60) return 'rgb(59, 130, 246)'; // blue
  if (score >= 40) return 'rgb(234, 179, 8)'; // yellow
  return 'rgb(239, 68, 68)'; // red
}

/** 점수 기반 테두리 색상 */
function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-green-500';
  if (score >= 60) return 'border-blue-500';
  if (score >= 40) return 'border-yellow-500';
  return 'border-red-500';
}

export interface MetricScore {
  type: SkinMetricType;
  score: number;
}

export interface PhotoMetricOverlayProps {
  /** 사용자 얼굴 사진 URL */
  imageUrl: string;
  /** 지표별 점수 */
  metrics: MetricScore[];
  /** 선택된 지표 */
  selectedMetric?: SkinMetricType | null;
  /** 지표 클릭 콜백 */
  onMetricClick?: (metric: SkinMetricType) => void;
  /** 추가 클래스 */
  className?: string;
  /** 연결선 표시 여부 */
  showConnectors?: boolean;
  /** 오버레이 표시 여부 */
  showOverlay?: boolean;
}

/**
 * 경쟁사 스타일 피부 분석 결과 시각화
 * - 실제 얼굴 사진 배경
 * - 원형 점수 배지 (사진 주변)
 * - 연결선으로 관련 영역 표시
 * - 반투명 오버레이 (선택 시)
 */
export function PhotoMetricOverlay({
  imageUrl,
  metrics,
  selectedMetric,
  onMetricClick,
  className,
  showConnectors = true,
  showOverlay = true,
}: PhotoMetricOverlayProps) {
  const [hoveredMetric, setHoveredMetric] = useState<SkinMetricType | null>(null);
  const [imageError, setImageError] = useState(false);

  // 현재 강조 중인 지표
  const activeMetric = hoveredMetric || selectedMetric;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          AI 피부 분석 결과
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative w-full aspect-[3/4] max-h-[500px] bg-gradient-to-b from-sky-100 to-sky-200 dark:from-slate-800 dark:to-slate-900">
          {/* 배경 이미지 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[70%] h-[85%]">
              {imageError ? (
                // 이미지 로드 실패 시 fallback UI
                <div className="w-full h-full rounded-lg bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex flex-col items-center justify-center gap-3">
                  <User className="w-24 h-24 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">얼굴 이미지</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="피부 분석 사진"
                  className="w-full h-full object-cover rounded-lg"
                  onError={() => setImageError(true)}
                />
              )}

              {/* 선택된 영역 오버레이 */}
              {showOverlay && activeMetric && !imageError && (
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* 하이라이트 영역 */}
                    <OverlayZone metric={activeMetric} color={METRIC_META[activeMetric].color} />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* 연결선 SVG */}
          {showConnectors && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 5 }}
            >
              {metrics.map(({ type, score }) => {
                const meta = METRIC_META[type];
                const isActive = activeMetric === type;

                // 배지 중심 위치 계산
                const badgeX = meta.position.x + 5; // 배지 중심
                const badgeY = meta.position.y + 4;

                // 앵커 위치 (이미지 영역 내)
                const imgOffsetX = 15; // 이미지 시작 X (%)
                const imgOffsetY = 7.5; // 이미지 시작 Y (%)
                const imgWidth = 70;
                const imgHeight = 85;

                const anchorX = imgOffsetX + (meta.anchor.x / 100) * imgWidth;
                const anchorY = imgOffsetY + (meta.anchor.y / 100) * imgHeight;

                return (
                  <g key={type}>
                    <line
                      x1={`${badgeX}%`}
                      y1={`${badgeY}%`}
                      x2={`${anchorX}%`}
                      y2={`${anchorY}%`}
                      stroke={isActive ? getScoreColor(score) : 'rgba(255,255,255,0.6)'}
                      strokeWidth={isActive ? 2 : 1}
                      strokeDasharray={isActive ? 'none' : '4,2'}
                    />
                    {/* 앵커 포인트 */}
                    <circle
                      cx={`${anchorX}%`}
                      cy={`${anchorY}%`}
                      r={isActive ? 5 : 3}
                      fill={isActive ? getScoreColor(score) : 'white'}
                      stroke={getScoreColor(score)}
                      strokeWidth={1.5}
                    />
                  </g>
                );
              })}
            </svg>
          )}

          {/* 점수 배지들 */}
          {metrics.map(({ type, score }) => {
            const meta = METRIC_META[type];
            const isActive = activeMetric === type;
            const scoreColor = getScoreColor(score);

            return (
              <button
                key={type}
                className={cn(
                  'absolute z-10 flex flex-col items-center transition-all duration-200',
                  'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                  isActive && 'scale-110'
                )}
                style={{
                  left: `${meta.position.x}%`,
                  top: `${meta.position.y}%`,
                }}
                onClick={() => onMetricClick?.(type)}
                onMouseEnter={() => setHoveredMetric(type)}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                {/* 원형 점수 배지 */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    'bg-white dark:bg-slate-800 shadow-lg',
                    'border-[3px] transition-all',
                    isActive && 'ring-2 ring-offset-2'
                  )}
                  style={{
                    borderColor: scoreColor,
                    boxShadow: isActive ? `0 0 20px ${scoreColor}40` : undefined,
                  }}
                >
                  <span className="text-base font-bold" style={{ color: scoreColor }}>
                    {score}
                  </span>
                </div>
                {/* 라벨 */}
                <span
                  className={cn(
                    'mt-1 text-xs font-medium px-1.5 py-0.5 rounded',
                    'bg-white/90 dark:bg-slate-800/90 shadow-sm',
                    isActive && 'font-bold'
                  )}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}

          {/* 하단 그라데이션 */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* 범례 */}
        <div className="p-4 bg-muted/50">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span>우수 (80+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>양호 (60-79)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>보통 (40-59)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span>주의 (0-39)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** 오버레이 영역 컴포넌트 */
function OverlayZone({ metric, color }: { metric: SkinMetricType; color: string }) {
  // 지표별 하이라이트 영역 정의
  const zones: Record<SkinMetricType, string> = {
    wrinkles: 'M 20 15 Q 50 10 80 15 Q 80 30 50 35 Q 20 30 20 15 Z', // 이마
    darkCircles: 'M 55 35 Q 75 32 85 40 Q 82 50 65 52 Q 55 48 55 35 Z', // 오른쪽 눈 밑
    texture: 'M 55 45 Q 75 42 90 55 Q 85 70 60 72 Q 50 65 55 45 Z', // 오른쪽 볼
    spots: 'M 10 45 Q 30 42 45 55 Q 40 70 15 72 Q 5 65 10 45 Z', // 왼쪽 볼
    redness: 'M 35 50 Q 50 45 65 50 Q 65 65 50 70 Q 35 65 35 50 Z', // 코 주변
    hydration: 'M 15 55 Q 35 50 45 60 Q 40 75 20 78 Q 10 70 15 55 Z', // 왼쪽 하단 볼
    oil: 'M 30 25 Q 50 20 70 25 Q 70 45 50 50 Q 30 45 30 25 Z', // T존
    acne: 'M 35 70 Q 50 68 65 70 Q 65 85 50 90 Q 35 85 35 70 Z', // 턱
  };

  return (
    <path
      d={zones[metric]}
      fill={color}
      fillOpacity={0.3}
      stroke={color}
      strokeWidth={0.5}
      className="animate-pulse"
    />
  );
}

export default PhotoMetricOverlay;
