'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// CDN URL for face-api.js models
const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

/**
 * 얼굴 영역 타입 (피부 분석용)
 */
export type FaceZoneType =
  | 'forehead' // 이마
  | 'tZone' // T존 (이마+코)
  | 'leftCheek' // 왼쪽 볼
  | 'rightCheek' // 오른쪽 볼
  | 'nose' // 코
  | 'leftEye' // 왼쪽 눈가
  | 'rightEye' // 오른쪽 눈가
  | 'chin' // 턱
  | 'uZone'; // U존 (볼+턱)

/**
 * 영역별 분석 점수
 */
export interface ZoneScore {
  zone: FaceZoneType;
  score: number;
  label: string;
  concerns?: string[];
}

/**
 * 점수에 따른 색상 반환 (히트맵 스타일)
 */
function getHeatMapColor(score: number, opacity: number = 0.4): string {
  // 점수가 낮을수록 빨강 (주의 필요), 높을수록 초록 (양호)
  if (score >= 80) return `rgba(34, 197, 94, ${opacity})`; // green
  if (score >= 60) return `rgba(59, 130, 246, ${opacity})`; // blue
  if (score >= 40) return `rgba(234, 179, 8, ${opacity})`; // yellow
  return `rgba(239, 68, 68, ${opacity})`; // red
}

/**
 * 점수 등급 텍스트
 */
function getScoreGrade(score: number): string {
  if (score >= 80) return '우수';
  if (score >= 60) return '양호';
  if (score >= 40) return '보통';
  return '주의';
}

export interface FaceLandmarkHeatMapProps {
  /** 얼굴 이미지 URL */
  imageUrl: string;
  /** 영역별 점수 */
  zoneScores: ZoneScore[];
  /** 추가 클래스 */
  className?: string;
  /** 히트맵 표시 여부 */
  showHeatMap?: boolean;
  /** 랜드마크 점 표시 여부 */
  showLandmarks?: boolean;
  /** 라벨 표시 여부 */
  showLabels?: boolean;
  /** 선택된 영역 */
  selectedZone?: FaceZoneType | null;
  /** 영역 클릭 콜백 */
  onZoneClick?: (zone: FaceZoneType) => void;
}

/**
 * face-api.js를 사용한 정밀 얼굴 영역 히트맵 시각화
 *
 * - 실제 얼굴 랜드마크 감지로 정확한 영역 매핑
 * - 피부 분석 점수 기반 히트맵 오버레이
 * - 경쟁사 수준의 전문가적 시각화
 */
export function FaceLandmarkHeatMap({
  imageUrl,
  zoneScores,
  className,
  showHeatMap = true,
  showLandmarks = false,
  showLabels = true,
  selectedZone,
  onZoneClick,
}: FaceLandmarkHeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<faceapi.WithFaceLandmarks<
    { detection: faceapi.FaceDetection },
    faceapi.FaceLandmarks68
  > | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // 점수 맵 생성
  const scoreMap = useMemo(() => {
    const map = new Map<FaceZoneType, ZoneScore>();
    zoneScores.forEach((z) => map.set(z.zone, z));
    return map;
  }, [zoneScores]);

  // 모델 로드
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 필요한 모델만 로드 (face landmark detection)
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
        ]);

        setModelsLoaded(true);
        console.log('[FaceLandmarkHeatMap] Models loaded successfully');
      } catch (err) {
        console.error('[FaceLandmarkHeatMap] Model loading error:', err);
        setError('모델 로드 실패');
      }
    };

    if (!modelsLoaded) {
      loadModels();
    }
  }, [modelsLoaded]);

  // 이미지 로드 및 얼굴 감지
  useEffect(() => {
    if (!modelsLoaded || !imageUrl) return;

    const detectFace = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 이미지 로드
        const img = await faceapi.fetchImage(imageUrl);

        if (imageRef.current) {
          imageRef.current.src = imageUrl;
        }

        setImageDimensions({ width: img.width, height: img.height });

        // 얼굴 및 랜드마크 감지
        const detectionResult = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detectionResult) {
          setDetection(detectionResult);
          console.log('[FaceLandmarkHeatMap] Face detected with 68 landmarks');
        } else {
          console.log('[FaceLandmarkHeatMap] No face detected');
          setError('얼굴을 감지할 수 없어요');
        }
      } catch (err) {
        console.error('[FaceLandmarkHeatMap] Detection error:', err);
        setError('얼굴 감지 실패');
      } finally {
        setIsLoading(false);
      }
    };

    detectFace();
  }, [modelsLoaded, imageUrl]);

  // 캔버스에 히트맵 그리기
  useEffect(() => {
    if (!detection || !canvasRef.current || !showHeatMap) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = imageDimensions.width;
    canvas.height = imageDimensions.height;

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const landmarks = detection.landmarks;
    const positions = landmarks.positions;

    // 68 랜드마크 기반 영역 계산
    // 0-16: 턱 라인, 17-21: 왼쪽 눈썹, 22-26: 오른쪽 눈썹
    // 27-30: 코 브릿지, 31-35: 코 아래, 36-41: 왼쪽 눈
    // 42-47: 오른쪽 눈, 48-67: 입

    /**
     * 영역별 랜드마크 좌표로 폴리곤 그리기
     * points는 { x, y } 형태의 객체 배열 (faceapi.Point 또는 일반 객체)
     */
    const drawZone = (
      zone: FaceZoneType,
      points: Array<{ x: number; y: number }>,
      score: number
    ) => {
      if (points.length < 3) return;

      const color = getHeatMapColor(score);
      const isSelected = selectedZone === zone;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();

      // 채우기
      ctx.fillStyle = isSelected ? getHeatMapColor(score, 0.6) : color;
      ctx.fill();

      // 테두리 (선택 시 강조)
      if (isSelected) {
        ctx.strokeStyle = getHeatMapColor(score, 1);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    };

    // faceapi.Point를 { x, y } 객체로 변환하는 헬퍼
    const toXY = (pt: faceapi.Point): { x: number; y: number } => ({ x: pt.x, y: pt.y });

    // 이마 영역 (눈썹 위)
    const foreheadScore = scoreMap.get('forehead')?.score ?? scoreMap.get('tZone')?.score ?? 70;
    const foreheadPoints = [
      toXY(positions[0]),
      { x: positions[17].x, y: positions[17].y - 50 },
      { x: positions[19].x, y: positions[19].y - 60 },
      { x: positions[24].x, y: positions[24].y - 60 },
      { x: positions[26].x, y: positions[26].y - 50 },
      toXY(positions[16]),
      toXY(positions[26]),
      toXY(positions[17]),
    ];
    drawZone('forehead', foreheadPoints, foreheadScore);

    // T존 (코)
    const tZoneScore = scoreMap.get('tZone')?.score ?? scoreMap.get('nose')?.score ?? 70;
    const tZonePoints = [27, 28, 29, 30, 35, 31].map((i) => toXY(positions[i]));
    drawZone('tZone', tZonePoints, tZoneScore);

    // 왼쪽 볼
    const leftCheekScore = scoreMap.get('leftCheek')?.score ?? scoreMap.get('uZone')?.score ?? 70;
    const leftCheekPoints = [1, 2, 3, 4, 48, 31, 39].map((i) => toXY(positions[i]));
    drawZone('leftCheek', leftCheekPoints, leftCheekScore);

    // 오른쪽 볼
    const rightCheekScore = scoreMap.get('rightCheek')?.score ?? scoreMap.get('uZone')?.score ?? 70;
    const rightCheekPoints = [15, 14, 13, 12, 54, 35, 42].map((i) => toXY(positions[i]));
    drawZone('rightCheek', rightCheekPoints, rightCheekScore);

    // 왼쪽 눈가
    const leftEyeScore = scoreMap.get('leftEye')?.score ?? 70;
    const leftEyePoints = [36, 37, 38, 39, 40, 41].map((i) => toXY(positions[i]));
    drawZone('leftEye', leftEyePoints, leftEyeScore);

    // 오른쪽 눈가
    const rightEyeScore = scoreMap.get('rightEye')?.score ?? 70;
    const rightEyePoints = [42, 43, 44, 45, 46, 47].map((i) => toXY(positions[i]));
    drawZone('rightEye', rightEyePoints, rightEyeScore);

    // 턱
    const chinScore = scoreMap.get('chin')?.score ?? scoreMap.get('uZone')?.score ?? 70;
    const chinPoints = [5, 6, 7, 8, 9, 10, 11, 57].map((i) => toXY(positions[i]));
    drawZone('chin', chinPoints, chinScore);

    // 랜드마크 점 표시 (디버그용)
    if (showLandmarks) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      positions.forEach((point, idx) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fill();
        // 인덱스 표시 (디버그)
        ctx.fillStyle = 'white';
        ctx.font = '8px sans-serif';
        ctx.fillText(idx.toString(), point.x + 3, point.y);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      });
    }
  }, [detection, imageDimensions, showHeatMap, showLandmarks, scoreMap, selectedZone]);

  // 재시도 핸들러
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setDetection(null);
    // 이미지 다시 로드 트리거
    const newUrl = imageUrl.includes('?')
      ? `${imageUrl}&retry=${Date.now()}`
      : `${imageUrl}?retry=${Date.now()}`;
    if (imageRef.current) {
      imageRef.current.src = newUrl;
    }
  };

  // 영역 중심점 계산 (라벨 표시용)
  const getZoneCenterFromLandmarks = (zone: FaceZoneType): { x: number; y: number } | null => {
    if (!detection) return null;

    const positions = detection.landmarks.positions;
    const scale = containerRef.current
      ? containerRef.current.clientWidth / imageDimensions.width
      : 1;

    const calcCenter = (indices: number[]): { x: number; y: number } => {
      const pts = indices.map((i) => positions[i]);
      const x = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
      const y = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
      return { x: x * scale, y: y * scale };
    };

    switch (zone) {
      case 'forehead':
        return { ...calcCenter([19, 24]), y: calcCenter([19, 24]).y - 30 * scale };
      case 'tZone':
        return calcCenter([27, 28, 29, 30]);
      case 'leftCheek':
        return calcCenter([2, 3, 31, 39]);
      case 'rightCheek':
        return calcCenter([13, 14, 35, 42]);
      case 'leftEye':
        return calcCenter([37, 38, 40, 41]);
      case 'rightEye':
        return calcCenter([43, 44, 46, 47]);
      case 'chin':
        return calcCenter([7, 8, 9, 57]);
      case 'nose':
        return calcCenter([30, 31, 35]);
      case 'uZone':
        return calcCenter([5, 6, 10, 11]);
      default:
        return null;
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)} data-testid="face-landmark-heatmap">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          AI 정밀 피부 분석
          {detection && (
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              68포인트 랜드마크 감지 완료
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative w-full aspect-[3/4] max-h-[500px] bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900"
        >
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 z-20">
              <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
              <p className="text-white text-sm">
                {!modelsLoaded ? 'AI 모델 로딩 중...' : '얼굴 분석 중...'}
              </p>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-20">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-white text-sm mb-3">{error}</p>
              <Button variant="secondary" size="sm" onClick={handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            </div>
          )}

          {/* 배경 이미지 */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="피부 분석 얼굴 이미지"
              className="w-full h-full object-cover"
              onError={() => setError('이미지 로드 실패')}
            />
          </div>

          {/* 히트맵 캔버스 오버레이 */}
          {detection && showHeatMap && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ mixBlendMode: 'multiply' }}
            />
          )}

          {/* 라벨 오버레이 */}
          {detection && showLabels && (
            <div className="absolute inset-0 pointer-events-none">
              {zoneScores.map((zs) => {
                const center = getZoneCenterFromLandmarks(zs.zone);
                if (!center) return null;

                const isSelected = selectedZone === zs.zone;
                const scoreColor = getHeatMapColor(zs.score, 1);

                return (
                  <button
                    key={zs.zone}
                    className={cn(
                      'absolute transform -translate-x-1/2 -translate-y-1/2',
                      'pointer-events-auto cursor-pointer',
                      'transition-transform hover:scale-110',
                      isSelected && 'scale-110'
                    )}
                    style={{ left: center.x, top: center.y }}
                    onClick={() => onZoneClick?.(zs.zone)}
                  >
                    <div
                      className={cn(
                        'flex flex-col items-center gap-1 px-2 py-1 rounded-lg',
                        'bg-white/95 dark:bg-slate-900/95 shadow-lg backdrop-blur-sm',
                        'border-2 transition-all',
                        isSelected && 'ring-2 ring-offset-1'
                      )}
                      style={{ borderColor: scoreColor }}
                    >
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {zs.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold" style={{ color: scoreColor }}>
                          {zs.score}
                        </span>
                        <span className="text-[8px] text-muted-foreground">
                          {getScoreGrade(zs.score)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 얼굴 미감지 fallback */}
          {!detection && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <User className="w-20 h-20 opacity-30" />
                <p className="text-sm">얼굴 감지 대기 중</p>
              </div>
            </div>
          )}

          {/* 하단 그라데이션 */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
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
          {detection && (
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              영역을 탭하면 상세 정보를 볼 수 있어요
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FaceLandmarkHeatMap;
