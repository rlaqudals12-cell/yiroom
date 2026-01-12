'use client';

/**
 * 드래그 가능한 의류 레이어 컴포넌트
 */

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { DraggableClothingLayerProps } from '@/types/virtual-fitting';

export function DraggableClothingLayer({
  item,
  position,
  scale,
  rotation,
  opacity,
  isSelected,
  onPositionChange,
  onScaleChange,
  onRotationChange,
  onClick,
}: DraggableClothingLayerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const layerRef = useRef<HTMLDivElement>(null);

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  // 드래그 중
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      onPositionChange({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, onPositionChange]);

  // 터치 이벤트 (모바일 대응)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    onClick();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const touch = e.touches[0];
      onPositionChange({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStart, onPositionChange]);

  return (
    <div
      ref={layerRef}
      data-testid="draggable-clothing-layer"
      className={cn(
        'absolute cursor-move touch-none select-none transition-shadow',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isDragging && 'cursor-grabbing'
      )}
      style={{
        left: position.x,
        top: position.y,
        width: scale.width,
        height: scale.height,
        transform: `rotate(${rotation}deg)`,
        opacity,
        zIndex: isSelected
          ? 1000
          : item.id === 'outer'
            ? 4
            : item.id === 'top'
              ? 3
              : item.id === 'bottom'
                ? 2
                : 1,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <Image
        src={item.imageUrl}
        alt={item.name || item.type}
        fill
        className="object-contain pointer-events-none"
        draggable={false}
        unoptimized
      />

      {/* 선택 시 핸들 표시 */}
      {isSelected && (
        <>
          {/* 크기 조절 핸들 */}
          <div
            className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize rounded-full border-2 border-primary bg-white shadow-md"
            onMouseDown={(e) => {
              e.stopPropagation();
              // 크기 조절 로직 (간단한 구현)
              const startX = e.clientX;
              const startWidth = scale.width;
              const handleResize = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const newWidth = Math.max(50, startWidth + deltaX);
                const aspectRatio = scale.height / scale.width;
                onScaleChange({
                  width: newWidth,
                  height: newWidth * aspectRatio,
                });
              };
              const handleMouseUp = () => {
                window.removeEventListener('mousemove', handleResize);
                window.removeEventListener('mouseup', handleMouseUp);
              };
              window.addEventListener('mousemove', handleResize);
              window.addEventListener('mouseup', handleMouseUp);
            }}
          />

          {/* 회전 핸들 */}
          <div
            className="absolute -top-6 left-1/2 h-4 w-4 -translate-x-1/2 cursor-pointer rounded-full border-2 border-primary bg-white shadow-md"
            onMouseDown={(e) => {
              e.stopPropagation();
              // 회전 로직 (간단한 구현)
              const rect = layerRef.current?.getBoundingClientRect();
              if (!rect) return;
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const handleRotate = (moveEvent: MouseEvent) => {
                const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                onRotationChange((angle * 180) / Math.PI);
              };
              const handleMouseUp = () => {
                window.removeEventListener('mousemove', handleRotate);
                window.removeEventListener('mouseup', handleMouseUp);
              };
              window.addEventListener('mousemove', handleRotate);
              window.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </>
      )}
    </div>
  );
}
