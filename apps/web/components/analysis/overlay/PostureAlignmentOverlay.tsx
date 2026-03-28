'use client';

/**
 * B-6: 자세 정렬선 오버레이
 *
 * @description 기준선 vs 실제 정렬 편차 시각화 (정면/측면)
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md §3.3
 */

import { useRef, useEffect, useCallback } from 'react';
import type { Landmark33 } from '@/lib/analysis/body-v2/types';
import { AnalysisOverlayBase } from './AnalysisOverlayBase';
import { drawAlignmentLines, drawSkeleton } from './internal/skeleton-renderer';
import type { OverlayMode } from './internal/overlay-tokens';

export interface PostureAlignmentOverlayProps {
  imageUrl: string;
  landmarks: Landmark33[] | null;
  view: 'front' | 'side';
  measurements: {
    shoulderSymmetry?: number;
    pelvisSymmetry?: number;
    kneeAlignment?: number;
    headForwardAngle?: number;
    thoracicKyphosis?: number;
    lumbarLordosis?: number;
    pelvicTilt?: number;
  };
  postureType: string;
  mode?: OverlayMode;
}

export function PostureAlignmentOverlay({
  imageUrl,
  landmarks,
  view,
  measurements,
  postureType,
  mode = 'strength',
}: PostureAlignmentOverlayProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderCanvas = useCallback(
    (width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !landmarks || landmarks.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      const opts = {
        canvasWidth: width,
        canvasHeight: height,
        imageWidth: 1,
        imageHeight: 1,
        mode,
      };

      // 스켈레톤 (배경 — 얇은 선으로)
      drawSkeleton(ctx, landmarks, { ...opts, mode: 'strength' });

      // 정렬선 (핵심 시각화)
      drawAlignmentLines(ctx, landmarks, view, opts);
    },
    [landmarks, view, mode]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    renderCanvas(rect.width, rect.height);
  }, [renderCanvas]);

  // sr-only 설명
  const srParts = [`자세 분석 결과: ${postureType}`, `${view === 'front' ? '정면' : '측면'} 분석`];
  if (view === 'front') {
    if (measurements.shoulderSymmetry !== undefined)
      srParts.push(`어깨 대칭도 ${measurements.shoulderSymmetry}`);
    if (measurements.pelvisSymmetry !== undefined)
      srParts.push(`골반 대칭도 ${measurements.pelvisSymmetry}`);
  } else {
    if (measurements.headForwardAngle !== undefined)
      srParts.push(`목 전방 경사 ${measurements.headForwardAngle}`);
    if (measurements.thoracicKyphosis !== undefined)
      srParts.push(`등 굽음 ${measurements.thoracicKyphosis}`);
  }
  const srDescription = srParts.join(', ');

  if (!landmarks || landmarks.length === 0) {
    return <div data-testid="posture-alignment-overlay" />;
  }

  return (
    <div data-testid="posture-alignment-overlay" className="relative">
      <AnalysisOverlayBase
        imageUrl={imageUrl}
        imageAlt={`자세 분석 ${view === 'front' ? '정면' : '측면'} 사진`}
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
      <div className="sr-only" role="img" aria-label={srDescription}>
        {srDescription}
      </div>
    </div>
  );
}
