'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ProblemMarker } from './ProblemMarker';
import type { ProblemArea } from '@/types/skin-problem-area';

interface SkinImageViewerProps {
  imageUrl: string;
  problemAreas: ProblemArea[];
  onAreaClick: (area: ProblemArea) => void;
  selectedAreaId?: string | null;
  className?: string;
}

/**
 * 피부 이미지 뷰어 + 문제 영역 마커
 * - 이미지 위에 마커 오버레이
 * - 마커 클릭 시 해당 영역 선택
 * - 선택된 영역 하이라이트
 */
export function SkinImageViewer({
  imageUrl,
  problemAreas,
  onAreaClick,
  selectedAreaId,
  className,
}: SkinImageViewerProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  if (imageError) {
    return (
      <div
        className={cn(
          'relative w-full aspect-[3/4] bg-muted rounded-lg flex items-center justify-center',
          className
        )}
      >
        <p className="text-muted-foreground text-sm">이미지를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div
      className={cn('relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden', className)}
      data-testid="skin-image-viewer"
    >
      {/* 피부 이미지 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="피부 분석 이미지"
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
          isImageLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* 로딩 플레이스홀더 */}
      {!isImageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* 문제 영역 마커들 */}
      {isImageLoaded &&
        problemAreas.map((area) => (
          <ProblemMarker
            key={area.id}
            area={area}
            onClick={() => onAreaClick(area)}
            isSelected={selectedAreaId === area.id}
            showLabel={selectedAreaId === null || selectedAreaId === area.id}
          />
        ))}

      {/* 선택된 영역 하이라이트 오버레이 */}
      {selectedAreaId && (
        <div
          className="absolute inset-0 bg-black/20 pointer-events-none transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* 안내 문구 */}
      {problemAreas.length > 0 && !selectedAreaId && (
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <span className="text-xs text-white bg-black/50 px-3 py-1 rounded-full">
            마커를 탭하여 상세 정보 확인
          </span>
        </div>
      )}
    </div>
  );
}
