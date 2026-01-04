'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ============================================
// 타입 정의
// ============================================

export interface BeforeAfterSliderProps {
  /** Before 이미지 URL 또는 HTMLImageElement */
  beforeImage: string | HTMLImageElement;
  /** After 이미지 URL 또는 HTMLImageElement */
  afterImage: string | HTMLImageElement;
  /** 초기 슬라이더 위치 (0-100) */
  initialPosition?: number;
  /** 슬라이더 방향 */
  direction?: 'horizontal' | 'vertical';
  /** 슬라이더 핸들 표시 여부 */
  showHandle?: boolean;
  /** Before/After 라벨 표시 여부 */
  showLabels?: boolean;
  /** Before 라벨 텍스트 */
  beforeLabel?: string;
  /** After 라벨 텍스트 */
  afterLabel?: string;
  /** 위치 변경 콜백 */
  onPositionChange?: (position: number) => void;
  /** 드래그 시작 콜백 */
  onDragStart?: () => void;
  /** 드래그 종료 콜백 */
  onDragEnd?: () => void;
  /** 추가 클래스 */
  className?: string;
  /** 컨테이너 높이 (기본: aspect-square) */
  aspectRatio?: 'square' | '3/4' | '4/3' | '16/9' | 'auto';
}

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * Before/After 인터랙티브 슬라이더
 *
 * 기능:
 * - 마우스/터치 드래그로 분할선 이동
 * - 키보드 접근성 (Arrow 키)
 * - requestAnimationFrame 최적화
 * - 모바일 터치 지원
 */
export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  initialPosition = 50,
  direction = 'horizontal',
  showHandle = true,
  showLabels = true,
  beforeLabel = 'Before',
  afterLabel = 'After',
  onPositionChange,
  onDragStart,
  onDragEnd,
  className,
  aspectRatio = 'square',
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoaded, setIsLoaded] = useState({ before: false, after: false });

  // 이미지 URL 처리
  const beforeSrc = typeof beforeImage === 'string' ? beforeImage : beforeImage.src;
  const afterSrc = typeof afterImage === 'string' ? afterImage : afterImage.src;

  // Aspect ratio 클래스
  const aspectClass = useMemo(() => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case '3/4':
        return 'aspect-[3/4]';
      case '4/3':
        return 'aspect-[4/3]';
      case '16/9':
        return 'aspect-video';
      case 'auto':
        return '';
      default:
        return 'aspect-square';
    }
  }, [aspectRatio]);

  // 위치 업데이트 (requestAnimationFrame 최적화)
  const rafRef = useRef<number | null>(null);
  const updatePosition = useCallback(
    (newPosition: number) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const clampedPosition = Math.max(0, Math.min(100, newPosition));
        setPosition(clampedPosition);
        onPositionChange?.(clampedPosition);
      });
    },
    [onPositionChange]
  );

  // 마우스/터치 위치를 퍼센트로 변환
  const getPositionFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return position;

      const rect = containerRef.current.getBoundingClientRect();

      if (direction === 'horizontal') {
        const x = clientX - rect.left;
        return (x / rect.width) * 100;
      } else {
        const y = clientY - rect.top;
        return (y / rect.height) * 100;
      }
    },
    [direction, position]
  );

  // 드래그 시작
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
      onDragStart?.();

      // 초기 위치 설정
      if ('touches' in e) {
        const touch = e.touches[0];
        updatePosition(getPositionFromEvent(touch.clientX, touch.clientY));
      } else {
        updatePosition(getPositionFromEvent(e.clientX, e.clientY));
      }
    },
    [getPositionFromEvent, onDragStart, updatePosition]
  );

  // 드래그 중
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(getPositionFromEvent(e.clientX, e.clientY));
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      updatePosition(getPositionFromEvent(touch.clientX, touch.clientY));
    };

    const handleEnd = () => {
      setIsDragging(false);
      onDragEnd?.();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, getPositionFromEvent, onDragEnd, updatePosition]);

  // 키보드 접근성
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 2;

      if (direction === 'horizontal') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          updatePosition(position - step);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          updatePosition(position + step);
        }
      } else {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          updatePosition(position - step);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          updatePosition(position + step);
        }
      }
    },
    [direction, position, updatePosition]
  );

  // 이미지 로드 상태
  const handleBeforeLoad = () => setIsLoaded((prev) => ({ ...prev, before: true }));
  const handleAfterLoad = () => setIsLoaded((prev) => ({ ...prev, after: true }));
  const allLoaded = isLoaded.before && isLoaded.after;

  // 클린업
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // 스타일 계산
  const isHorizontal = direction === 'horizontal';
  const clipBefore = isHorizontal
    ? `inset(0 ${100 - position}% 0 0)`
    : `inset(0 0 ${100 - position}% 0)`;
  const clipAfter = isHorizontal ? `inset(0 0 0 ${position}%)` : `inset(${position}% 0 0 0)`;

  const handlePosition = isHorizontal
    ? { left: `${position}%`, top: '50%', transform: 'translate(-50%, -50%)' }
    : { top: `${position}%`, left: '50%', transform: 'translate(-50%, -50%)' };

  const lineStyle = isHorizontal
    ? { left: `${position}%`, top: 0, bottom: 0, width: '2px', transform: 'translateX(-50%)' }
    : { top: `${position}%`, left: 0, right: 0, height: '2px', transform: 'translateY(-50%)' };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg bg-muted select-none',
        aspectClass,
        isDragging && 'cursor-grabbing',
        !isDragging && 'cursor-ew-resize',
        className
      )}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      role="slider"
      aria-label="Before After 비교 슬라이더"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-testid="before-after-slider"
    >
      {/* Before 이미지 */}
      <div className="absolute inset-0" style={{ clipPath: clipBefore }}>
        <img
          src={beforeSrc}
          alt={beforeLabel}
          className="w-full h-full object-cover"
          onLoad={handleBeforeLoad}
          draggable={false}
        />
        {showLabels && allLoaded && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded">
              {beforeLabel}
            </span>
          </div>
        )}
      </div>

      {/* After 이미지 */}
      <div className="absolute inset-0" style={{ clipPath: clipAfter }}>
        <img
          src={afterSrc}
          alt={afterLabel}
          className="w-full h-full object-cover"
          onLoad={handleAfterLoad}
          draggable={false}
        />
        {showLabels && allLoaded && (
          <div className={cn('absolute top-3', isHorizontal ? 'right-3' : 'right-3')}>
            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
              {afterLabel}
            </span>
          </div>
        )}
      </div>

      {/* 분할선 */}
      {allLoaded && (
        <div className="absolute bg-white shadow-lg pointer-events-none" style={lineStyle} />
      )}

      {/* 드래그 핸들 */}
      {showHandle && allLoaded && (
        <div
          className={cn(
            'absolute z-10 w-10 h-10 rounded-full bg-white shadow-lg',
            'flex items-center justify-center',
            'border-2 border-primary',
            'pointer-events-none',
            isDragging && 'scale-110'
          )}
          style={handlePosition}
        >
          {isHorizontal ? (
            <div className="flex gap-0.5">
              <ChevronLeft className="w-4 h-4 text-primary" />
              <ChevronRight className="w-4 h-4 text-primary" />
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <ChevronLeft className="w-4 h-4 text-primary rotate-90" />
              <ChevronLeft className="w-4 h-4 text-primary -rotate-90" />
            </div>
          )}
        </div>
      )}

      {/* 로딩 상태 */}
      {!allLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ============================================
// 프리셋 컴포넌트
// ============================================

export interface SliderPresetButtonsProps {
  /** 현재 프리셋 */
  activePreset: 'subtle' | 'natural' | 'enhanced';
  /** 프리셋 변경 핸들러 */
  onPresetChange: (preset: 'subtle' | 'natural' | 'enhanced') => void;
  /** 비활성화 */
  disabled?: boolean;
  /** 클래스 */
  className?: string;
}

/**
 * 프리셋 선택 버튼 그룹
 */
export function SliderPresetButtons({
  activePreset,
  onPresetChange,
  disabled,
  className,
}: SliderPresetButtonsProps) {
  const presets: Array<{ key: 'subtle' | 'natural' | 'enhanced'; label: string }> = [
    { key: 'subtle', label: '미묘하게' },
    { key: 'natural', label: '자연스럽게' },
    { key: 'enhanced', label: '강조' },
  ];

  return (
    <div className={cn('flex gap-2', className)}>
      {presets.map((preset) => (
        <button
          key={preset.key}
          onClick={() => onPresetChange(preset.key)}
          disabled={disabled}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full transition-colors',
            'border',
            activePreset === preset.key
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-foreground border-border hover:bg-muted',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// 위치 표시 컴포넌트
// ============================================

export interface SliderPositionIndicatorProps {
  /** 현재 위치 (0-100) */
  position: number;
  /** 클래스 */
  className?: string;
}

/**
 * 슬라이더 위치 표시
 */
export function SliderPositionIndicator({ position, className }: SliderPositionIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span className="text-muted-foreground">Before</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-75"
          style={{ width: `${position}%` }}
        />
      </div>
      <span className="text-muted-foreground">After</span>
    </div>
  );
}
