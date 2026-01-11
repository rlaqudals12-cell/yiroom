'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PostureMarker } from './PostureMarker';
import { PostureFeedbackPanel } from './PostureFeedbackPanel';
import type { PostureIssue } from '@/types/workout-posture';

interface PostureZoomViewerProps {
  imageUrl: string;
  postureIssues: PostureIssue[];
  className?: string;
}

/**
 * 운동 자세 분석 뷰어
 * - 이미지 위에 마커 오버레이
 * - PostureMarker로 문제 영역 표시
 * - PostureFeedbackPanel로 교정 가이드 제공
 */
export function PostureZoomViewer({ imageUrl, postureIssues, className }: PostureZoomViewerProps) {
  const router = useRouter();
  const [selectedIssue, setSelectedIssue] = useState<PostureIssue | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleMarkerClick = (issue: PostureIssue) => {
    setSelectedIssue(issue);
  };

  const handleExerciseClick = (exerciseId: string) => {
    router.push(`/workout/exercise/${exerciseId}`);
  };

  const handleClose = () => {
    setSelectedIssue(null);
  };

  if (imageError) {
    return (
      <div
        data-testid="posture-zoom-viewer"
        className={cn(
          'relative w-full aspect-[3/4] bg-muted rounded-xl flex items-center justify-center',
          className
        )}
      >
        <p className="text-muted-foreground text-sm">이미지를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div data-testid="posture-zoom-viewer" className={className}>
      {/* 이미지 뷰어 */}
      <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
        {/* 운동 이미지 */}
        <Image
          src={imageUrl}
          alt="운동 자세 분석"
          fill
          className={cn(
            'object-cover transition-opacity duration-300',
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {/* 로딩 플레이스홀더 */}
        {!isImageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {/* 마커 오버레이 (이미지 로드 후 표시) */}
        {isImageLoaded &&
          postureIssues.map((issue) => (
            <PostureMarker
              key={issue.id}
              issue={issue}
              onClick={() => handleMarkerClick(issue)}
              isSelected={selectedIssue?.id === issue.id}
              showLabel={selectedIssue === null || selectedIssue?.id === issue.id}
            />
          ))}

        {/* 선택된 영역 하이라이트 오버레이 */}
        {selectedIssue && (
          <div
            className="absolute inset-0 bg-black/20 pointer-events-none transition-opacity duration-200"
            aria-hidden="true"
          />
        )}

        {/* 가이드 텍스트 */}
        {isImageLoaded && !selectedIssue && postureIssues.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <span className="text-xs text-white bg-black/50 px-3 py-1 rounded-full">
              마커를 탭하여 교정 방법 확인
            </span>
          </div>
        )}

        {/* 문제 없음 표시 */}
        {isImageLoaded && postureIssues.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-emerald-500/90 text-white px-6 py-3 rounded-xl shadow-lg">
              <span className="text-lg font-medium">자세가 좋아요!</span>
            </div>
          </div>
        )}
      </div>

      {/* 피드백 패널 */}
      <PostureFeedbackPanel
        issue={selectedIssue}
        onClose={handleClose}
        onExerciseClick={handleExerciseClick}
      />
    </div>
  );
}
