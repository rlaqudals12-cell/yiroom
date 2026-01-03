'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LightMode, PigmentMaps, FaceLandmark } from '@/types/visual-analysis';
import { analyzeDeviceCapability } from '@/lib/analysis/device-capability';
import { extractFaceLandmarks, createFaceMask } from '@/lib/analysis/face-landmark';
import { analyzeSkingPigments } from '@/lib/analysis/skin-heatmap';
import { preloadFaceMesh } from '@/lib/analysis/mediapipe-loader';
import LightModeTab, { LightModeLegend } from './LightModeTab';
import SkinHeatmapCanvas, { HeatmapMetrics } from './SkinHeatmapCanvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface VisualAnalysisTabProps {
  /** 분석 이미지 URL */
  imageUrl: string;
  /** 추가 클래스 */
  className?: string;
}

type AnalysisState = 'idle' | 'loading' | 'analyzing' | 'ready' | 'error';

/**
 * S-1+ 상세 시각화 탭 컴포넌트
 * - 피부 결과 페이지에 탭으로 통합
 * - 광원 모드 전환 (일반/편광/UV/피지)
 * - 히트맵 오버레이
 */
export default function VisualAnalysisTab({ imageUrl, className }: VisualAnalysisTabProps) {
  const [state, setState] = useState<AnalysisState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lightMode, setLightMode] = useState<LightMode>('normal');

  // 분석 결과
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [landmarks, setLandmarks] = useState<FaceLandmark[] | null>(null);
  const [faceMask, setFaceMask] = useState<Uint8Array | null>(null);
  const [pigmentMaps, setPigmentMaps] = useState<PigmentMaps | null>(null);
  const [pigmentSummary, setPigmentSummary] = useState<{
    melanin_avg: number;
    hemoglobin_avg: number;
  } | null>(null);

  // 기기 성능
  const deviceCapability = analyzeDeviceCapability();

  /**
   * 이미지 로드
   */
  const loadImage = useCallback((): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = imageUrl;
    });
  }, [imageUrl]);

  /**
   * 전체 분석 파이프라인
   */
  const runAnalysis = useCallback(async () => {
    if (!imageUrl) return;

    setState('loading');
    setError(null);

    try {
      // 1. 이미지 로드
      const loadedImage = await loadImage();
      setImage(loadedImage);

      setState('analyzing');

      // 2. 랜드마크 추출 (MediaPipe 또는 Mock)
      const landmarkResult = await extractFaceLandmarks(loadedImage, {
        useMock: deviceCapability.tier === 'low',
      });

      if (!landmarkResult) {
        throw new Error('얼굴을 감지할 수 없습니다');
      }

      setLandmarks(landmarkResult.landmarks);

      // 3. 얼굴 마스크 생성
      const mask = createFaceMask(
        landmarkResult.landmarks,
        loadedImage.naturalWidth || loadedImage.width,
        loadedImage.naturalHeight || loadedImage.height
      );
      setFaceMask(mask);

      // 4. 색소 분석
      const { pigmentMaps: maps, summary } = await analyzeSkingPigments(
        loadedImage,
        landmarkResult.landmarks
      );

      setPigmentMaps(maps);
      setPigmentSummary({
        melanin_avg: summary.melanin_avg,
        hemoglobin_avg: summary.hemoglobin_avg,
      });

      setState('ready');
    } catch (err) {
      console.error('[VisualAnalysisTab] 분석 오류:', err);
      setError(err instanceof Error ? err.message : '분석에 실패했습니다');
      setState('error');
    }
  }, [imageUrl, loadImage, deviceCapability.tier]);

  // 컴포넌트 마운트 시 분석 시작
  useEffect(() => {
    if (imageUrl && state === 'idle') {
      // MediaPipe 프리로드
      preloadFaceMesh();
      runAnalysis();
    }
  }, [imageUrl, state, runAnalysis]);

  // 로딩 상태
  if (state === 'loading' || state === 'analyzing') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader>
          <CardTitle className="text-base">상세 시각화 분석</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="w-full aspect-[3/4] rounded-lg" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 flex-1" />
            ))}
          </div>
          <p className="text-sm text-center text-muted-foreground">
            {state === 'loading' ? '이미지 로드 중...' : '피부 분석 중...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // 에러 상태
  if (state === 'error') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader>
          <CardTitle className="text-base">상세 시각화 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error || '분석에 실패했습니다'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 준비 완료
  if (state === 'ready' && image && faceMask && pigmentMaps) {
    return (
      <Card className={cn('overflow-hidden', className)} data-testid="visual-analysis-tab">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span>상세 시각화 분석</span>
            <span className="text-xs font-normal text-muted-foreground">
              (
              {deviceCapability.tier === 'high'
                ? '고화질'
                : deviceCapability.tier === 'medium'
                  ? '표준'
                  : '경량'}{' '}
              모드)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 광원 모드 탭 */}
          <LightModeTab activeMode={lightMode} onModeChange={setLightMode} />

          {/* 히트맵 캔버스 */}
          <SkinHeatmapCanvas
            image={image}
            faceMask={faceMask}
            pigmentMaps={pigmentMaps}
            lightMode={lightMode}
            opacity={0.6}
          />

          {/* 범례 */}
          <div className="flex justify-center">
            <LightModeLegend mode={lightMode} />
          </div>

          {/* 수치 표시 */}
          {pigmentSummary && (
            <HeatmapMetrics
              melaninAvg={pigmentSummary.melanin_avg}
              hemoglobinAvg={pigmentSummary.hemoglobin_avg}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // 대기 상태
  return null;
}
