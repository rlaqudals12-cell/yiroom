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
      expect(screen.getByText('영상 준비 중')).toBeInTheDocument();
    });

    it('준비 중 안내 메시지가 표시된다', () => {
      render(<YouTubeEmbed />);
      expect(screen.getByText('곧 가이드 영상이 추가됩니다')).toBeInTheDocument();
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
      expect(screen.getByText('영상을 불러올 수 없어요')).toBeInTheDocument();
    });
  });
});
