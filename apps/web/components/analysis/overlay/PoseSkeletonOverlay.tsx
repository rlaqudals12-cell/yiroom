'use client';

/**
 * B-3 + B-4: 체형 스켈레톤 오버레이 (Canvas + 접근성)
 *
 * @description MediaPipe 33관절 기반 체형 시각화. Canvas 렌더링 + sr-only 텍스트 대안.
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md §3.2
 * @see docs/adr/ADR-097-visual-overlay-anonymous-share.md D7 (Canvas 접근성)
 */

import { useRef, useEffect, useCallback } from 'react';
import type { Landmark33 } from '@/lib/analysis/body-v2/types';
import { AnalysisOverlayBase } from './AnalysisOverlayBase';
import { drawSkeleton, drawRatioLabels } from './internal/skeleton-renderer';
import type { OverlayMode } from './internal/overlay-tokens';

export interface PoseSkeletonOverlayProps {
  imageUrl: string;
  landmarks: Landmark33[] | null;
  measurements: {
    shoulderWidth?: number;
    waistWidth?: number;
    hipWidth?: number;
    shoulderTilt?: number;
    pelvisTilt?: number;
  };
  bodyType: string;
  mode?: OverlayMode;
}

export function PoseSkeletonOverlay({
  imageUrl,
  landmarks,
  measurements,
  bodyType,
  mode = 'strength',
}: PoseSkeletonOverlayProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas 렌더링 콜백
  const renderCanvas = useCallback(
    (width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !landmarks || landmarks.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Canvas 크기 설정 (devicePixelRatio 고려)
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // 클리어
      ctx.clearRect(0, 0, width, height);

      const opts = {
        canvasWidth: width,
        canvasHeight: height,
        imageWidth: 1, // 정규화 좌표 (0-1) 사용
        imageHeight: 1,
        mode,
      };

      // 스켈레톤 렌더링
      drawSkeleton(ctx, landmarks, opts);

      // 비율 수치 라벨
      drawRatioLabels(ctx, landmarks, measurements, opts);
    },
    [landmarks, measurements, mode]
  );

  // 렌더링 트리거
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    renderCanvas(rect.width, rect.height);
  }, [renderCanvas]);

  // sr-only 접근성 텍스트 (ADR-097 D7)
  const srDescription = [
    `체형 분석 결과: ${bodyType}형`,
    measurements.shoulderWidth !== undefined && `어깨 비율 ${measurements.shoulderWidth}`,
    measurements.hipWidth !== undefined && `골반 비율 ${measurements.hipWidth}`,
    measurements.shoulderTilt !== undefined &&
      `어깨 기울기 ${measurements.shoulderTilt.toFixed(1)}도`,
    measurements.pelvisTilt !== undefined && `골반 기울기 ${measurements.pelvisTilt.toFixed(1)}도`,
  ]
    .filter(Boolean)
    .join(', ');

  // landmarks null이면 오버레이 비표시
  if (!landmarks || landmarks.length === 0) {
    return <div data-testid="pose-skeleton-overlay" />;
  }

  return (
    <div data-testid="pose-skeleton-overlay" className="relative">
      <AnalysisOverlayBase
        imageUrl={imageUrl}
        imageAlt="체형 분석 사진"
        srOnlyDescription={srDescription}
      >
        {() => (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          />
        )}
      </AnalysisOverlayBase>
      {/* B-4: sr-only 접근성 텍스트 대안 */}
      <div className="sr-only" role="img" aria-label={srDescription}>
        {srDescription}
      </div>
    </div>
  );
}
