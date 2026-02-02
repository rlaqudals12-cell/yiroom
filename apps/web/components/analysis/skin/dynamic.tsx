'use client';

/**
 * Skin Analysis Dynamic Imports
 * face-api.js를 사용하는 무거운 컴포넌트 지연 로딩
 *
 * 성능 최적화: face-api.js ~1MB 번들 분리
 * - PhotoMetricOverlayV2: 얼굴 랜드마크 기반 메트릭 오버레이
 * - FaceLandmarkHeatMap: 얼굴 랜드마크 히트맵 시각화
 */

import dynamic from 'next/dynamic';

// 스켈레톤 컴포넌트 - 이미지 오버레이용
function OverlaySkeleton() {
  return (
    <div className="relative w-full aspect-[3/4] bg-muted rounded-lg animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">분석 준비 중...</div>
      </div>
    </div>
  );
}

// 스켈레톤 컴포넌트 - 히트맵용
function HeatMapSkeleton() {
  return (
    <div className="relative w-full aspect-square bg-muted rounded-lg animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">히트맵 로딩 중...</div>
      </div>
    </div>
  );
}

// PhotoMetricOverlayV2 - face-api.js 사용 (지연 로딩 필수)
export const PhotoMetricOverlayV2Dynamic = dynamic(
  () =>
    import('./PhotoMetricOverlayV2').then((mod) => ({
      default: mod.PhotoMetricOverlayV2,
    })),
  {
    ssr: false,
    loading: OverlaySkeleton,
  }
);

// FaceLandmarkHeatMap - face-api.js 사용 (지연 로딩 필수)
export const FaceLandmarkHeatMapDynamic = dynamic(
  () =>
    import('./FaceLandmarkHeatMap').then((mod) => ({
      default: mod.FaceLandmarkHeatMap,
    })),
  {
    ssr: false,
    loading: HeatMapSkeleton,
  }
);

// 타입 re-export (dynamic import에서도 타입 사용 가능하도록)
export type { PhotoMetricOverlayV2Props, MetricScore, SkinMetricType } from './PhotoMetricOverlayV2';
export type { FaceLandmarkHeatMapProps, ZoneScore, FaceZoneType } from './FaceLandmarkHeatMap';
