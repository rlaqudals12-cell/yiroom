import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// extractYouTubeVideoId mock
vi.mock('@/components/ui/optimized-image', () => ({
  extractYouTubeVideoId: (url: string) => {
    const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  },
}));

import YouTubeEmbed from '@/components/workout/detail/YouTubeEmbed';

describe('YouTubeEmbed', () => {
  describe('영상 URL이 없는 경우', () => {
    it('플레이스홀더가 표시된다', () => {
      render(<YouTubeEmbed />);
      // i18n 마이그레이션: 플레이스홀더 텍스트는 workoutUI.youTubeEmbed0 키로 렌더링 (테스트 목은 키 반환)
      expect(screen.getByText('youTubeEmbed0')).toBeInTheDocument();
    });

    it('준비 중 안내 메시지가 표시된다', () => {
      render(<YouTubeEmbed />);
      // i18n 마이그레이션: 안내 메시지는 workoutUI.youTubeEmbed1 키로 렌더링
      expect(screen.getByText('youTubeEmbed1')).toBeInTheDocument();
    });
  });

  describe('유효한 YouTube URL', () => {
    it('iframe이 렌더링된다', () => {
      const { container } = render(
        <YouTubeEmbed videoUrl="https://www.youtube.com/watch?v=abc12345678" />
      );
      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe?.src).toContain('youtube.com/embed/abc12345678');
    });

    it('커스텀 title이 iframe에 적용된다', () => {
      const { container } = render(
        <YouTubeEmbed
          videoUrl="https://www.youtube.com/watch?v=abc12345678"
          title="스쿼트 가이드"
        />
      );
      const iframe = container.querySelector('iframe');
      expect(iframe?.title).toBe('스쿼트 가이드');
    });

    it('기본 title은 운동 가이드이다', () => {
      const { container } = render(
        <YouTubeEmbed videoUrl="https://www.youtube.com/watch?v=abc12345678" />
      );
      const iframe = container.querySelector('iframe');
      expect(iframe?.title).toBe('운동 가이드');
    });

    it('rel=0 파라미터가 포함된다', () => {
      const { container } = render(
        <YouTubeEmbed videoUrl="https://www.youtube.com/watch?v=abc12345678" />
      );
      const iframe = container.querySelector('iframe');
      expect(iframe?.src).toContain('rel=0');
    });
  });

  describe('유효하지 않은 URL', () => {
    it('에러 메시지가 표시된다', () => {
      render(<YouTubeEmbed videoUrl="https://invalid-url.com/video" />);
      // i18n 마이그레이션: 에러 메시지는 workoutUI.youTubeEmbed2 키로 렌더링
      expect(screen.getByText('youTubeEmbed2')).toBeInTheDocument();
    });
  });
});
