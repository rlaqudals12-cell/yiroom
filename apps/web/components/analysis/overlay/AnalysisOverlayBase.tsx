'use client';

/**
 * P1-1: AnalysisOverlayBase — 오버레이 공통 래퍼
 *
 * @description 이미지 위에 SVG/Canvas 오버레이를 렌더링하는 공통 컨테이너.
 * ResizeObserver로 이미지 크기 변화를 감지하여 오버레이를 동기화.
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md 섹션 2.1
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// 타입
// =============================================================================

export interface OverlayDimensions {
  /** 표시 영역 너비 (px) */
  width: number;
  /** 표시 영역 높이 (px) */
  height: number;
  /** 원본 이미지 너비 (px) */
  naturalWidth: number;
  /** 원본 이미지 높이 (px) */
  naturalHeight: number;
  /** 표시 대비 원본 스케일 팩터 */
  scale: number;
}

export interface AnalysisOverlayBaseProps {
  /** 분석 이미지 URL */
  imageUrl: string;
  /** 이미지 대체 텍스트 */
  imageAlt: string;
  /** 컨테이너 최대 너비 (px, 기본 480) */
  maxWidth?: number;
  /** SVG 또는 Canvas 오버레이 children */
  children: (dimensions: OverlayDimensions) => React.ReactNode;
  /** 접근성: 스크린 리더용 텍스트 대안 */
  srOnlyDescription?: string;
  /** 추가 className */
  className?: string;
  /** 이미지 로드 실패 시 콜백 */
  onImageError?: () => void;
}

// =============================================================================
// 컴포넌트
// =============================================================================

/** 분석 결과 시각적 오버레이의 공통 컨테이너 */
export function AnalysisOverlayBase({
  imageUrl,
  imageAlt,
  maxWidth = 480,
  children,
  srOnlyDescription,
  className,
  onImageError,
}: AnalysisOverlayBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = useState<OverlayDimensions | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 이미지 로드 완료 시 치수 계산
  const updateDimensions = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const displayWidth = img.clientWidth;
    const displayHeight = img.clientHeight;
    const scale = displayWidth / img.naturalWidth;

    setDimensions({
      width: displayWidth,
      height: displayHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      scale,
    });
  }, []);

  // 이미지 로드 핸들러
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
    updateDimensions();
  }, [updateDimensions]);

  // 이미지 에러 핸들러
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
    onImageError?.();
  }, [onImageError]);

  // ResizeObserver로 컨테이너 크기 변화 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [updateDimensions]);

  return (
    <div
      ref={containerRef}
      data-testid="analysis-overlay-base"
      className={cn('relative inline-block w-full', className)}
      style={{ maxWidth }}
    >
      {/* 이미지 레이어 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt={imageAlt}
        className="w-full h-auto rounded-lg"
        onLoad={handleImageLoad}
        onError={handleImageError}
        draggable={false}
      />

      {/* 오버레이 레이어 (이미지 위에 절대 위치) */}
      {imageLoaded && dimensions && !imageError && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          {/* children에 dimensions 전달하여 정확한 좌표 계산 가능 */}
          <div className="pointer-events-auto">{children(dimensions)}</div>
        </div>
      )}

      {/* 에러 상태 */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">이미지를 불러올 수 없습니다</p>
        </div>
      )}

      {/* 접근성: 스크린 리더 대안 텍스트 */}
      {srOnlyDescription && (
        <div className="sr-only" role="img" aria-label={srOnlyDescription}>
          {srOnlyDescription}
        </div>
      )}
    </div>
  );
}
