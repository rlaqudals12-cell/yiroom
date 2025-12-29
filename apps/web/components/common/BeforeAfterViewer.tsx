'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeftRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// 뷰어 모드 타입
export type ViewerMode = 'slider' | 'side-by-side' | 'toggle';

export interface BeforeAfterViewerProps {
  /** Before 이미지 URL */
  beforeImage: string;
  /** After 이미지 URL */
  afterImage: string;
  /** Before 라벨 */
  beforeLabel?: string;
  /** After 라벨 */
  afterLabel?: string;
  /** 뷰어 모드 */
  mode?: ViewerMode;
  /** 이미지 Alt 텍스트 */
  altPrefix?: string;
  /** 이미지 높이 (aspect ratio 유지) */
  height?: number;
  /** 추가 className */
  className?: string;
}

/**
 * 비포/애프터 이미지 비교 컴포넌트
 * - slider: 슬라이더로 좌우 비교
 * - side-by-side: 나란히 표시
 * - toggle: 토글 버튼으로 전환
 */
export function BeforeAfterViewer({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  mode = 'slider',
  altPrefix = '이미지',
  height = 300,
  className,
}: BeforeAfterViewerProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showAfter, setShowAfter] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // 슬라이더 드래그 처리
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  // Slider 모드
  if (mode === 'slider') {
    return (
      <div
        ref={containerRef}
        className={cn('relative overflow-hidden rounded-xl cursor-ew-resize select-none', className)}
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        data-testid="before-after-viewer"
        role="img"
        aria-label={`${beforeLabel}와 ${afterLabel} 비교 이미지`}
      >
        {/* Before 이미지 (전체) */}
        <div className="absolute inset-0">
          <Image
            src={beforeImage}
            alt={`${altPrefix} - ${beforeLabel}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Before 라벨 */}
          <span className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
            {beforeLabel}
          </span>
        </div>

        {/* After 이미지 (클리핑) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          <Image
            src={afterImage}
            alt={`${altPrefix} - ${afterLabel}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* After 라벨 */}
          <span className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
            {afterLabel}
          </span>
        </div>

        {/* 슬라이더 핸들 */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* 핸들 아이콘 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
      </div>
    );
  }

  // Side-by-side 모드
  if (mode === 'side-by-side') {
    return (
      <div
        className={cn('grid grid-cols-2 gap-2 rounded-xl overflow-hidden', className)}
        data-testid="before-after-viewer"
        role="group"
        aria-label={`${beforeLabel}와 ${afterLabel} 비교 이미지`}
      >
        {/* Before */}
        <div className="relative" style={{ height }}>
          <Image
            src={beforeImage}
            alt={`${altPrefix} - ${beforeLabel}`}
            fill
            className="object-cover rounded-l-xl"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <span className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
            {beforeLabel}
          </span>
        </div>

        {/* After */}
        <div className="relative" style={{ height }}>
          <Image
            src={afterImage}
            alt={`${altPrefix} - ${afterLabel}`}
            fill
            className="object-cover rounded-r-xl"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <span className="absolute top-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
            {afterLabel}
          </span>
        </div>
      </div>
    );
  }

  // Toggle 모드
  return (
    <div
      className={cn('relative rounded-xl overflow-hidden', className)}
      data-testid="before-after-viewer"
    >
      {/* 이미지 */}
      <div className="relative" style={{ height }}>
        <Image
          src={showAfter ? afterImage : beforeImage}
          alt={`${altPrefix} - ${showAfter ? afterLabel : beforeLabel}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* 현재 상태 라벨 */}
        <span className="absolute top-3 left-3 px-2 py-1 bg-black/60 text-white text-xs rounded">
          {showAfter ? afterLabel : beforeLabel}
        </span>
      </div>

      {/* 토글 버튼 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAfter(!showAfter)}
          className="gap-2 shadow-lg"
          aria-label={showAfter ? `${beforeLabel} 보기` : `${afterLabel} 보기`}
        >
          {showAfter ? (
            <>
              <ToggleRight className="h-4 w-4" aria-hidden="true" />
              {beforeLabel} 보기
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4" aria-hidden="true" />
              {afterLabel} 보기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default BeforeAfterViewer;
