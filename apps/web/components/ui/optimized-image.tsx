'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback, memo } from 'react';

/**
 * Task 6.4: 이미지 최적화 컴포넌트
 *
 * next/image를 래핑하여 다음 기능 제공:
 * - 로딩 상태 표시 (blur placeholder)
 * - 에러 상태 시 fallback 표시
 * - 반응형 이미지 지원
 * - 메모이제이션으로 불필요한 리렌더링 방지
 */

export interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  /** 이미지 로드 실패 시 표시할 폴백 이미지 URL 또는 컴포넌트 */
  fallback?: string | React.ReactNode;
  /** 폴백이 이모지/텍스트인 경우 배경 스타일 */
  fallbackBgClassName?: string;
  /** 로딩 중 표시 여부 */
  showLoadingState?: boolean;
  /** 로딩 애니메이션 스타일 */
  loadingClassName?: string;
  /** 이미지 컨테이너 className */
  containerClassName?: string;
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallback,
  fallbackBgClassName = 'bg-gradient-to-br from-muted/50 to-muted',
  showLoadingState = true,
  loadingClassName = 'animate-pulse bg-muted',
  containerClassName = '',
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  // src가 없거나 에러 발생 시 폴백 표시
  if (!src || hasError) {
    if (typeof fallback === 'string') {
      // 폴백이 URL인 경우 next/image로 표시
      return (
        <div className={`relative overflow-hidden ${containerClassName}`}>
          <Image
            src={fallback}
            alt={alt || 'fallback image'}
            className={className}
            {...props}
          />
        </div>
      );
    }

    // 폴백이 컴포넌트(이모지 등)인 경우
    return (
      <div
        className={`flex items-center justify-center ${fallbackBgClassName} ${containerClassName}`}
        style={{ width: props.width, height: props.height }}
        role="img"
        aria-label={alt}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* 로딩 상태 표시 */}
      {showLoadingState && isLoading && (
        <div
          className={`absolute inset-0 ${loadingClassName}`}
          aria-hidden="true"
        />
      )}

      <Image
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
});

export default OptimizedImage;

/**
 * 운동 썸네일 전용 컴포넌트
 * YouTube 썸네일 URL 자동 생성 및 최적화
 */
export interface ExerciseThumbnailProps {
  /** YouTube 비디오 ID (11자리) */
  videoId?: string;
  /** YouTube 전체 URL (videoId가 없을 때 URL에서 ID 추출) */
  videoUrl?: string;
  /** 직접 지정한 썸네일 URL */
  thumbnailUrl?: string;
  /** 운동 카테고리 (폴백 이모지 결정용) */
  category?: 'upper' | 'lower' | 'core' | 'cardio';
  /** 이미지 alt 텍스트 */
  alt: string;
  /** 이미지 너비 */
  width?: number;
  /** 이미지 높이 */
  height?: number;
  /** 추가 className */
  className?: string;
  /** 컨테이너 className */
  containerClassName?: string;
}

// 카테고리별 폴백 이모지
const CATEGORY_FALLBACK_EMOJI: Record<string, string> = {
  upper: '💪',
  lower: '🦵',
  core: '🧘',
  cardio: '🏃',
};

export const ExerciseThumbnail = memo(function ExerciseThumbnail({
  videoId,
  videoUrl,
  thumbnailUrl,
  category = 'upper',
  alt,
  width = 320,
  height = 180,
  className = '',
  containerClassName = '',
}: ExerciseThumbnailProps) {
  // YouTube 썸네일 URL 생성 우선순위:
  // 1. thumbnailUrl (직접 지정된 썸네일)
  // 2. videoId (비디오 ID로 썸네일 생성)
  // 3. videoUrl (전체 URL에서 ID 추출 후 썸네일 생성)
  const resolvedThumbnailUrl =
    thumbnailUrl ||
    (videoId ? getYouTubeThumbnail(videoId) : null) ||
    (videoUrl ? getYouTubeThumbnail(videoUrl) : null);

  const fallbackEmoji = CATEGORY_FALLBACK_EMOJI[category] || '🏋️';

  return (
    <OptimizedImage
      src={resolvedThumbnailUrl || ''}
      alt={alt}
      width={width}
      height={height}
      className={`object-cover ${className}`}
      containerClassName={containerClassName}
      fallback={<span className="text-5xl">{fallbackEmoji}</span>}
      fallbackBgClassName="bg-gradient-to-br from-muted/50 to-muted"
    />
  );
});

/**
 * YouTube URL 또는 ID에서 비디오 ID 추출
 * @param videoIdOrUrl - YouTube 비디오 ID 또는 URL
 * @returns 11자리 비디오 ID 또는 null
 */
export function extractYouTubeVideoId(videoIdOrUrl: string): string | null {
  if (!videoIdOrUrl) return null;

  // YouTube URL 패턴 체크
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^[a-zA-Z0-9_-]{11}$/, // 11자리 ID 직접 입력
  ];

  for (const pattern of patterns) {
    const match = videoIdOrUrl.match(pattern);
    if (match) {
      const id = match[1] || match[0];
      // 유효한 ID인지 확인 (11자리)
      if (id && id.length === 11) {
        return id;
      }
    }
  }

  return null;
}

/**
 * YouTube 비디오 ID에서 썸네일 URL 추출
 * @param videoIdOrUrl - YouTube 비디오 ID 또는 URL
 * @param quality - 썸네일 품질 (default, hqdefault, mqdefault, sddefault, maxresdefault)
 */
export function getYouTubeThumbnail(
  videoIdOrUrl: string,
  quality: 'default' | 'hqdefault' | 'mqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'
): string | null {
  const videoId = extractYouTubeVideoId(videoIdOrUrl);

  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * 이미지 URL이 유효한지 체크
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
