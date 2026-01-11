'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ZoomableImageProps {
  src: string;
  alt: string;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  focusPoint?: { x: number; y: number };
  className?: string;
  onZoomChange?: (zoom: number) => void;
  onError?: () => void;
}

/**
 * 확대/축소 가능한 이미지 컴포넌트
 * - 핀치 줌 (모바일)
 * - 마우스 휠 줌 (데스크톱)
 * - 더블탭/더블클릭 줌
 * - 드래그하여 이동
 */
export function ZoomableImage({
  src,
  alt,
  initialZoom = 1,
  minZoom = 1,
  maxZoom = 3,
  focusPoint,
  className,
  onZoomChange,
  onError,
}: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 이미지 로딩/에러 상태
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 핀치 줌 상태
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);

  // 더블탭 감지
  const lastTapRef = useRef<number>(0);

  // 이미지 로드 완료 핸들러
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  // 이미지 에러 핸들러
  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  /**
   * focusPoint 변경 시 해당 위치로 자동 이동 및 줌
   * - 문제 영역 마커 클릭 시 해당 위치를 화면 중앙에 표시
   * - 좌표는 이미지 기준 % (0-100)
   */
  useEffect(() => {
    if (focusPoint && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // 포커스 포인트를 컨테이너 중앙으로 이동시키는 위치 계산
      // 수식: 컨테이너 중앙 위치 - (포커스 포인트 % * 이미지 크기 * 줌)
      const newX = (rect.width / 2 - (focusPoint.x / 100) * rect.width * zoom) * -1;
      const newY = (rect.height / 2 - (focusPoint.y / 100) * rect.height * zoom) * -1;

      setPosition({ x: newX, y: newY });
      setZoom(Math.min(2, maxZoom)); // 포커스 시 2배 줌
    }
  }, [focusPoint, maxZoom, zoom]);

  // 줌 변경 콜백
  useEffect(() => {
    onZoomChange?.(zoom);
  }, [zoom, onZoomChange]);

  /**
   * 줌 설정 (경계 제한 포함)
   * - centerX, centerY가 제공되면 해당 점을 중심으로 줌
   * - 마우스/터치 위치를 기준으로 자연스러운 줌 효과 구현
   */
  const handleZoom = useCallback(
    (newZoom: number, centerX?: number, centerY?: number) => {
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

      if (containerRef.current && centerX !== undefined && centerY !== undefined) {
        // 줌 중심점 기준 위치 조정
        // 예: 마우스 위치에서 줌하면 그 점이 화면에서 같은 위치에 유지됨
        // 수식: 새 위치 = 중심점 - (중심점 - 현재 위치) * 줌 비율
        const zoomRatio = clampedZoom / zoom;
        const newX = centerX - (centerX - position.x) * zoomRatio;
        const newY = centerY - (centerY - position.y) * zoomRatio;

        setPosition({ x: newX, y: newY });
      }

      setZoom(clampedZoom);
    },
    [minZoom, maxZoom, zoom, position]
  );

  // 마우스 휠 줌
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        handleZoom(zoom + delta, e.clientX - rect.left, e.clientY - rect.top);
      }
    },
    [handleZoom, zoom]
  );

  // 더블클릭/더블탭 줌
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const centerX = clientX - rect.left;
      const centerY = clientY - rect.top;

      // 이미 확대되어 있으면 원래대로
      if (zoom > minZoom) {
        setZoom(minZoom);
        setPosition({ x: 0, y: 0 });
      } else {
        handleZoom(2, centerX, centerY);
      }
    },
    [handleZoom, minZoom, zoom]
  );

  // 터치 시작
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        // 핀치 줌 시작
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        setLastPinchDistance(distance);
      } else if (e.touches.length === 1) {
        // 더블탭 감지
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          handleDoubleClick(e);
        }
        lastTapRef.current = now;

        // 드래그 시작
        if (zoom > minZoom) {
          setIsDragging(true);
          setDragStart({
            x: e.touches[0].clientX - position.x,
            y: e.touches[0].clientY - position.y,
          });
        }
      }
    },
    [handleDoubleClick, minZoom, position, zoom]
  );

  // 터치 이동
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDistance !== null) {
        // 핀치 줌
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = distance / lastPinchDistance;
        handleZoom(zoom * scale);
        setLastPinchDistance(distance);
      } else if (e.touches.length === 1 && isDragging) {
        // 드래그
        setPosition({
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y,
        });
      }
    },
    [dragStart, handleZoom, isDragging, lastPinchDistance, zoom]
  );

  // 터치 종료
  const handleTouchEnd = useCallback(() => {
    setLastPinchDistance(null);
    setIsDragging(false);
  }, []);

  // 마우스 드래그
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom > minZoom) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }
    },
    [minZoom, position, zoom]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [dragStart, isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 에러 상태 UI
  if (hasError) {
    return (
      <div
        className={cn(
          'relative overflow-hidden flex items-center justify-center bg-muted',
          className
        )}
        data-testid="zoomable-image-error"
      >
        <div className="text-center p-4">
          <p className="text-muted-foreground text-sm">이미지를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden select-none touch-none', className)}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: zoom > minZoom ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      data-testid="zoomable-image"
    >
      {/* 로딩 스피너 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      <div
        className="transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className={cn('object-contain pointer-events-none', isLoading && 'opacity-0')}
          sizes="100vw"
          priority
          draggable={false}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* 줌 레벨 표시 */}
      {zoom > minZoom && !isLoading && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}
