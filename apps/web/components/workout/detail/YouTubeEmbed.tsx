'use client';

import { extractYouTubeVideoId } from '@/components/ui/optimized-image';

interface YouTubeEmbedProps {
  videoUrl?: string;
  title?: string;
}

/**
 * YouTube 영상 임베드 컴포넌트
 * videoUrl이 없으면 플레이스홀더 표시
 */
export default function YouTubeEmbed({ videoUrl, title = '운동 가이드' }: YouTubeEmbedProps) {

  // 영상 URL이 없는 경우 플레이스홀더
  if (!videoUrl) {
    return (
      <div className="bg-muted rounded-2xl overflow-hidden">
        <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground">
          <div className="w-16 h-16 bg-muted/80 rounded-full flex items-center justify-center mb-3">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          </div>
          <p className="text-sm">영상 준비 중</p>
          <p className="text-xs mt-1">곧 가이드 영상이 추가됩니다</p>
        </div>
      </div>
    );
  }

  const videoId = extractYouTubeVideoId(videoUrl);

  // 유효하지 않은 URL인 경우
  if (!videoId) {
    return (
      <div className="bg-muted rounded-2xl overflow-hidden">
        <div className="aspect-video flex flex-col items-center justify-center text-muted-foreground">
          <p className="text-sm">영상을 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
