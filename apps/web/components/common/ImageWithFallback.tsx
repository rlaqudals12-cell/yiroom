'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ReactNode } from 'react';

/**
 * 이미지 로드 실패 폴백 공용 컴포넌트
 *
 * 배경: 제품 이미지 표면 대부분이 next/image에 onError 폴백이 없어,
 * 원격 이미지 로드 실패 시 빈 <img>만 남고 다크 테마의 bg-muted(#242424)가
 * "검은 박스"로 노출됐다 (2026-07 창업자 제보의 표면 원인).
 *
 * - src 부재(null/빈 문자열) 또는 onError 시 표면별 기존 폴백(fallback)을 렌더
 * - fill 모드: 부모가 relative + 크기 컨테이너라는 기존 관례를 그대로 따름
 * - unoptimized: raw <img> 표면 대체용 — 최적화 우회로 네트워크 동작은 동일하게
 *   유지하면서 폴백만 추가 (remotePatterns 미등록 호스트에도 안전)
 *
 * 참조 관례: components/inventory/common/ItemCard.tsx (onError 폴백 모범 구현)
 */

export interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  /** 로드 실패·src 부재 시 표시할 폴백 (표면별 기존 관례: Package 아이콘, 💄 이모지, 브랜드 이니셜 등) */
  fallback: ReactNode;
  /** 부모 컨테이너를 채우는 fill 모드 (기본값) — 부모는 relative + 크기 지정 필요 */
  fill?: boolean;
  /** fill=false일 때 필수 */
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  /** next/image 최적화 우회 (raw <img>와 동일한 네트워크 동작) */
  unoptimized?: boolean;
}

export function ImageWithFallback({
  src,
  alt,
  fallback,
  fill = true,
  width,
  height,
  sizes,
  className,
  priority,
  loading,
  unoptimized,
}: ImageWithFallbackProps) {
  // 실패한 src를 기억 — src prop이 바뀌면(리스트 셀 재사용) 자동으로 에러 상태 해제
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = src !== null && src !== undefined && failedSrc === src;

  if (!src || hasError) {
    return (
      <div
        className={
          fill
            ? 'absolute inset-0 flex items-center justify-center'
            : 'flex items-center justify-center'
        }
        style={!fill && width && height ? { width, height } : undefined}
        role="img"
        aria-label={alt}
        data-testid="product-image-fallback"
      >
        {fallback}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      className={className}
      priority={priority}
      loading={loading}
      unoptimized={unoptimized}
      onError={() => setFailedSrc(src)}
    />
  );
}

export default ImageWithFallback;
