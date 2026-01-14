'use client';

import { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Loader2 } from 'lucide-react';

// CDN URL for face-api.js models
const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

/**
 * 피부 분석 지표 타입 (경쟁사 스타일)
 */
export type SkinMetricType =
  | 'wrinkles' // 주름 → 이마
  | 'darkCircles' // 다크서클 → 눈 밑
  | 'texture' // 텍스처 → 오른쪽 볼
  | 'spots' // 잡티 → 왼쪽 볼
  | 'redness' // 홍조 → 볼
  | 'hydration' // 수분 → 왼쪽 볼 아래
  | 'oil' // 유분 → 코 (T존)
  | 'acne'; // 여드름 → 턱

/**
 * 지표별 메타데이터
 * dlib 68-point 랜드마크 기준:
 * - 턱: 0-16, 눈썹: 17-26, 코: 27-35
 * - 오른쪽 눈: 36-41, 왼쪽 눈: 42-47, 입: 48-67
 * 참조: https://pyimagesearch.com/2017/04/03/facial-landmarks-dlib-opencv-python/
 */
const METRIC_META: Record<
  SkinMetricType,
  {
    label: string;
    badgeSide: 'left' | 'right';
    landmarkIndices: number[];
    yOffsetPercent?: number; // Y축 오프셋 (% 단위, 양수=아래, 음수=위)
    xOffsetPercent?: number; // X축 오프셋 (% 단위, 양수=오른쪽, 음수=왼쪽)
  }
> = {
  wrinkles: {
    label: '주름',
    badgeSide: 'left',
    landmarkIndices: [19, 20, 23, 24], // 눈썹 중앙 (이마)
    yOffsetPercent: -8, // 눈썹 위로 8%
  },
  darkCircles: {
    label: '다크서클',
    badgeSide: 'right',
    landmarkIndices: [46, 47], // 왼쪽 눈 아래 포인트만
    yOffsetPercent: 8, // 눈 아래로 8%
  },
  texture: {
    label: '텍스처',
    badgeSide: 'right',
    landmarkIndices: [14, 15], // 오른쪽 볼 턱라인 (화면 왼쪽)
    yOffsetPercent: -8, // 위로 올림
    xOffsetPercent: -5, // 볼 안쪽으로
  },
  spots: {
    label: '잡티',
    badgeSide: 'left',
    landmarkIndices: [1, 2], // 왼쪽 볼 턱라인 (화면 오른쪽)
    yOffsetPercent: -8, // 위로 올림
    xOffsetPercent: 5, // 볼 안쪽으로
  },
  redness: {
    label: '홍조',
    badgeSide: 'right',
    landmarkIndices: [13, 14], // 오른쪽 볼 중앙
    yOffsetPercent: -12, // 볼 위쪽으로
    xOffsetPercent: -5,
  },
  hydration: {
    label: '수분',
    badgeSide: 'left',
    landmarkIndices: [3, 4], // 왼쪽 볼 아래
    yOffsetPercent: -5,
    xOffsetPercent: 5,
  },
  oil: {
    label: '유분',
    badgeSide: 'left',
    landmarkIndices: [27, 28, 29], // 코 브릿지 (T존)
    yOffsetPercent: 3,
  },
  acne: {
    label: '여드름',
    badgeSide: 'right',
    landmarkIndices: [8, 9, 57], // 턱 중앙
    yOffsetPercent: 2,
  },
};

/** 점수 기반 색상 반환 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'rgb(34, 197, 94)'; // green
  if (score >= 60) return 'rgb(59, 130, 246)'; // blue
  if (score >= 40) return 'rgb(234, 179, 8)'; // yellow
  return 'rgb(239, 68, 68)'; // red
}

export interface MetricScore {
  type: SkinMetricType;
  score: number;
}

export interface PhotoMetricOverlayV2Props {
  imageUrl: string;
  metrics: MetricScore[];
  selectedMetric?: SkinMetricType | null;
  onMetricClick?: (metric: SkinMetricType) => void;
  className?: string;
  showConnectors?: boolean;
}

/**
 * face-api.js 68포인트 랜드마크 기반 피부 분석 결과 시각화
 * - 실제 얼굴 위치에 정확히 지표 배치
 * - 연결선이 실제 얼굴 영역을 가리킴
 */
export function PhotoMetricOverlayV2({
  imageUrl,
  metrics,
  selectedMetric,
  onMetricClick,
  className,
  showConnectors = true,
}: PhotoMetricOverlayV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMetric, setHoveredMetric] = useState<SkinMetricType | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [landmarks, setLandmarks] = useState<faceapi.Point[] | null>(null);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const activeMetric = hoveredMetric || selectedMetric;

  // 모델 로드
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        ]);
        setModelsLoaded(true);
        console.log('[PhotoMetricOverlayV2] Models loaded');
      } catch (err) {
        console.error('[PhotoMetricOverlayV2] Model load error:', err);
        setIsLoading(false);
      }
    };

    if (!modelsLoaded) {
      loadModels();
    }
  }, [modelsLoaded]);

  // 얼굴 감지
  useEffect(() => {
    if (!modelsLoaded || !imageUrl) return;

    const detectFace = async () => {
      setIsLoading(true);
      try {
        const img = await faceapi.fetchImage(imageUrl);
        setImageSize({ width: img.width, height: img.height });

        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detection) {
          setLandmarks(detection.landmarks.positions);
          console.log('[PhotoMetricOverlayV2] Face detected with 68 landmarks');
        } else {
          console.log('[PhotoMetricOverlayV2] No face detected, using fallback');
          setLandmarks(null);
        }
      } catch (err) {
        console.error('[PhotoMetricOverlayV2] Detection error:', err);
        setLandmarks(null);
      } finally {
        setIsLoading(false);
      }
    };

    detectFace();
  }, [modelsLoaded, imageUrl]);

  // 컨테이너 크기 업데이트
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDisplaySize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 이미지 영역 크기 계산 (컨테이너의 70% x 85%)
  const imgAreaWidth = displaySize.width * 0.7;
  const imgAreaHeight = displaySize.height * 0.85;

  // 랜드마크 인덱스에서 앵커 포인트 계산 (퍼센트 단위 오프셋 적용)
  // object-cover 고려: 이미지가 컨테이너를 채우도록 스케일됨
  const getAnchorPoint = (
    landmarkIndices: number[],
    yOffsetPercent: number = 0,
    xOffsetPercent: number = 0
  ): { x: number; y: number } => {
    if (!landmarks || landmarks.length === 0 || imageSize.width === 0) {
      // Fallback: 고정 좌표 (이미지 영역 내 퍼센트)
      return { x: 50, y: 50 };
    }

    // object-cover 스케일 계산
    // 이미지가 영역을 완전히 채우도록 더 큰 스케일 사용
    const scaleX = imgAreaWidth / imageSize.width;
    const scaleY = imgAreaHeight / imageSize.height;
    const scale = Math.max(scaleX, scaleY); // object-cover는 더 큰 비율 사용

    // 크롭 오프셋 계산 (중앙 정렬)
    const scaledWidth = imageSize.width * scale;
    const scaledHeight = imageSize.height * scale;
    const cropOffsetX = (scaledWidth - imgAreaWidth) / 2;
    const cropOffsetY = (scaledHeight - imgAreaHeight) / 2;

    // 중심점 계산
    let sumX = 0,
      sumY = 0;
    let count = 0;
    landmarkIndices.forEach((idx) => {
      if (landmarks[idx]) {
        sumX += landmarks[idx].x;
        sumY += landmarks[idx].y;
        count++;
      }
    });

    if (count === 0) return { x: 50, y: 50 };

    // 원본 이미지 좌표 → 스케일된 좌표 → 크롭 오프셋 적용
    const scaledX = (sumX / count) * scale - cropOffsetX;
    const scaledY = (sumY / count) * scale - cropOffsetY;

    // 이미지 영역 내 퍼센트로 변환 (0-100%)
    const percentX = (scaledX / imgAreaWidth) * 100;
    const percentY = (scaledY / imgAreaHeight) * 100;

    // 퍼센트 단위 오프셋 적용 (이미지 크기와 무관하게 일관됨)
    return {
      x: percentX + xOffsetPercent,
      y: percentY + yOffsetPercent,
    };
  };

  // 배지 위치 계산 (좌측 또는 우측)
  const getBadgePosition = (side: 'left' | 'right', index: number): { x: number; y: number } => {
    const leftMetrics = metrics.filter((m) => METRIC_META[m.type].badgeSide === 'left');
    const rightMetrics = metrics.filter((m) => METRIC_META[m.type].badgeSide === 'right');

    const sameMetrics = side === 'left' ? leftMetrics : rightMetrics;
    const metricIndex = sameMetrics.findIndex((m) => metrics.indexOf(m) === index);
    const totalInSide = sameMetrics.length;

    // Y 위치: 균등 분배 (10% ~ 90%)
    const yStep = 80 / Math.max(totalInSide - 1, 1);
    const y = 10 + metricIndex * yStep;

    // X 위치: 좌측 5%, 우측 95%
    const x = side === 'left' ? 5 : 95;

    return { x, y };
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          AI 피부 분석 결과
          {landmarks && (
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              68포인트 랜드마크
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative w-full aspect-[3/4] max-h-[500px] bg-gradient-to-b from-sky-100 to-sky-200 dark:from-slate-800 dark:to-slate-900"
        >
          {/* 로딩 */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}

          {/* 배경 이미지 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[70%] h-[85%]">
              {imageError ? (
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
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
                  }}
                />
              )}
            </div>
          </div>

          {/* 연결선 SVG */}
          {showConnectors && !isLoading && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 5 }}
            >
              {metrics.map(({ type, score }, index) => {
                const meta = METRIC_META[type];
                const isActive = activeMetric === type;
                const badgePos = getBadgePosition(meta.badgeSide, index);
                const anchor = getAnchorPoint(
                  meta.landmarkIndices,
                  meta.yOffsetPercent || 0,
                  meta.xOffsetPercent || 0
                );

                // 이미지 영역 오프셋 (컨테이너 내 위치)
                // 이미지는 중앙 정렬, 70% 너비, 85% 높이
                const imgOffsetX = 15; // (100 - 70) / 2
                const imgOffsetY = 7.5; // (100 - 85) / 2
                const imgWidth = 70;
                const imgHeight = 85;

                // anchor는 이미지 영역 내 퍼센트 (0-100%)
                // 컨테이너 기준 퍼센트로 변환
                const anchorInContainer = {
                  x: imgOffsetX + (anchor.x / 100) * imgWidth,
                  y: imgOffsetY + (anchor.y / 100) * imgHeight,
                };

                // 배지 중심 (% 기준)
                const badgeCenterX = badgePos.x;
                const badgeCenterY = badgePos.y;

                return (
                  <g key={type}>
                    <line
                      x1={`${badgeCenterX}%`}
                      y1={`${badgeCenterY}%`}
                      x2={`${anchorInContainer.x}%`}
                      y2={`${anchorInContainer.y}%`}
                      stroke={isActive ? getScoreColor(score) : 'rgba(255,255,255,0.6)'}
                      strokeWidth={isActive ? 2 : 1}
                      strokeDasharray={isActive ? 'none' : '4,2'}
                    />
                    <circle
                      cx={`${anchorInContainer.x}%`}
                      cy={`${anchorInContainer.y}%`}
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
          {!isLoading &&
            metrics.map(({ type, score }, index) => {
              const meta = METRIC_META[type];
              const isActive = activeMetric === type;
              const scoreColor = getScoreColor(score);
              const badgePos = getBadgePosition(meta.badgeSide, index);

              return (
                <button
                  key={type}
                  className={cn(
                    'absolute z-10 flex flex-col items-center transition-all duration-200',
                    'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                    isActive && 'scale-110'
                  )}
                  style={{
                    left: `${badgePos.x}%`,
                    top: `${badgePos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => onMetricClick?.(type)}
                  onMouseEnter={() => setHoveredMetric(type)}
                  onMouseLeave={() => setHoveredMetric(null)}
                >
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

export default PhotoMetricOverlayV2;
