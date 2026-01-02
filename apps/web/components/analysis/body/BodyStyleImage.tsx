'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { type BodyType3 } from '@/lib/mock/body-analysis';
import { ImageIcon, Loader2 } from 'lucide-react';

/**
 * 체형 타입별 스타일 이미지 경로
 * - AI 생성 이미지 (체형별 3장씩)
 * - 실제 사용 시 public/images/body-types/ 에 이미지 추가 필요
 */
const STYLE_IMAGES: Record<
  BodyType3,
  Array<{
    src: string;
    alt: string;
    style: string;
  }>
> = {
  S: [
    {
      src: '/images/body-types/straight-formal.jpg',
      alt: '스트레이트 체형 포멀 스타일',
      style: '포멀',
    },
    {
      src: '/images/body-types/straight-casual.jpg',
      alt: '스트레이트 체형 캐주얼 스타일',
      style: '캐주얼',
    },
    {
      src: '/images/body-types/straight-minimal.jpg',
      alt: '스트레이트 체형 미니멀 스타일',
      style: '미니멀',
    },
  ],
  W: [
    {
      src: '/images/body-types/wave-feminine.jpg',
      alt: '웨이브 체형 페미닌 스타일',
      style: '페미닌',
    },
    {
      src: '/images/body-types/wave-romantic.jpg',
      alt: '웨이브 체형 로맨틱 스타일',
      style: '로맨틱',
    },
    {
      src: '/images/body-types/wave-elegant.jpg',
      alt: '웨이브 체형 엘레강스 스타일',
      style: '엘레강스',
    },
  ],
  N: [
    {
      src: '/images/body-types/natural-casual.jpg',
      alt: '내추럴 체형 캐주얼 스타일',
      style: '캐주얼',
    },
    {
      src: '/images/body-types/natural-relaxed.jpg',
      alt: '내추럴 체형 릴렉스드 스타일',
      style: '릴렉스드',
    },
    {
      src: '/images/body-types/natural-oversized.jpg',
      alt: '내추럴 체형 오버사이즈 스타일',
      style: '오버사이즈',
    },
  ],
};

// 체형별 배경 그라데이션
const BODY_TYPE_GRADIENTS: Record<BodyType3, string> = {
  S: 'from-blue-50 to-indigo-100',
  W: 'from-pink-50 to-rose-100',
  N: 'from-green-50 to-emerald-100',
};

// 체형별 테두리 색상
const BODY_TYPE_BORDERS: Record<BodyType3, string> = {
  S: 'border-blue-200 hover:border-blue-400',
  W: 'border-pink-200 hover:border-pink-400',
  N: 'border-green-200 hover:border-green-400',
};

interface BodyStyleImageProps {
  bodyType: BodyType3;
  className?: string;
  showLabels?: boolean;
  onImageClick?: (index: number) => void;
}

/**
 * 체형별 스타일 이미지 컴포넌트
 * - AI 생성 이미지로 스타일 예시 제공
 * - 체형별 3가지 스타일 이미지 표시
 * - 이미지 없을 경우 플레이스홀더 표시
 */
export function BodyStyleImage({
  bodyType,
  className,
  showLabels = true,
  onImageClick,
}: BodyStyleImageProps) {
  const [loadErrors, setLoadErrors] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<Set<number>>(new Set([0, 1, 2]));
  const images = STYLE_IMAGES[bodyType];
  const gradient = BODY_TYPE_GRADIENTS[bodyType];
  const borderClass = BODY_TYPE_BORDERS[bodyType];

  const handleImageError = (index: number) => {
    setLoadErrors((prev) => new Set(prev).add(index));
    setLoading((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleImageLoad = (index: number) => {
    setLoading((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  return (
    <div className={cn('grid grid-cols-3 gap-3', className)} data-testid="body-style-image">
      {images.map((image, index) => (
        <div
          key={index}
          className={cn(
            'relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all cursor-pointer',
            borderClass,
            loadErrors.has(index) && `bg-gradient-to-b ${gradient}`
          )}
          onClick={() => onImageClick?.(index)}
          role="button"
          tabIndex={0}
          aria-label={image.alt}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onImageClick?.(index);
            }
          }}
        >
          {/* 로딩 상태 */}
          {loading.has(index) && !loadErrors.has(index) && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* 이미지 또는 플레이스홀더 */}
          {!loadErrors.has(index) ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 120px"
              onError={() => handleImageError(index)}
              onLoad={() => handleImageLoad(index)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
              <ImageIcon className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <span className="text-xs text-muted-foreground text-center">
                스타일 이미지 준비 중
              </span>
            </div>
          )}

          {/* 스타일 라벨 */}
          {showLabels && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span className="text-xs font-medium text-white drop-shadow-sm">{image.style}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default BodyStyleImage;
