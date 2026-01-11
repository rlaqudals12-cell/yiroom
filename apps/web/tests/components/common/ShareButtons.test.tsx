import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButtons } from '@/components/common/ShareButtons';

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Link2: () => <svg data-testid="link-icon" />,
    Check: () => <svg data-testid="check-icon" />,
    Download: () => <svg data-testid="download-icon" />,
  };
});

// Mock share utils
vi.mock('@/lib/share/social', () => ({
  shareToX: vi.fn(),
  shareToKakao: vi.fn().mockResolvedValue(true),
  downloadShareImage: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/share/shareUtils', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ShareButtons', () => {
  const mockContent = {
    title: '테스트 제목',
    description: '테스트 설명',
    url: 'https://yiroom.app/test',
    imageUrl: 'https://yiroom.app/image.png',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('공유 버튼 컨테이너를 렌더링한다', () => {
    render(<ShareButtons content={mockContent} />);
    expect(screen.getByTestId('share-buttons')).toBeInTheDocument();
  });

  it('X 공유 버튼이 있다', () => {
    render(<ShareButtons content={mockContent} />);
    expect(screen.getByRole('button', { name: /X에 공유/i })).toBeInTheDocument();
  });

  it('카카오톡 공유 버튼이 있다', () => {
    render(<ShareButtons content={mockContent} />);
    expect(screen.getByRole('button', { name: /카카오톡 공유/i })).toBeInTheDocument();
  });

  it('링크 복사 버튼이 있다', () => {
    render(<ShareButtons content={mockContent} />);
    expect(screen.getByRole('button', { name: /링크 복사/i })).toBeInTheDocument();
  });

  it('X 버튼 클릭 시 shareToX가 호출된다', async () => {
    const { shareToX } = await import('@/lib/share/social');

    render(<ShareButtons content={mockContent} />);
    fireEvent.click(screen.getByRole('button', { name: /X에 공유/i }));

    expect(shareToX).toHaveBeenCalledWith(mockContent);
  });

  it('카카오톡 버튼 클릭 시 shareToKakao가 호출된다', async () => {
    const { shareToKakao } = await import('@/lib/share/social');

    render(<ShareButtons content={mockContent} />);
    fireEvent.click(screen.getByRole('button', { name: /카카오톡 공유/i }));

    await waitFor(() => {
      expect(shareToKakao).toHaveBeenCalledWith(mockContent);
    });
  });

  it('링크 복사 버튼 클릭 시 copyToClipboard가 호출된다', async () => {
    const { copyToClipboard } = await import('@/lib/share/shareUtils');

    render(<ShareButtons content={mockContent} />);
    fireEvent.click(screen.getByRole('button', { name: /링크 복사/i }));

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith(mockContent.url);
    });
  });

  it('링크 복사 성공 시 토스트가 표시된다', async () => {
    const { toast } = await import('sonner');

    render(<ShareButtons content={mockContent} />);
    fireEvent.click(screen.getByRole('button', { name: /링크 복사/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('링크가 복사되었습니다');
    });
  });

  describe('Instagram 버튼', () => {
    it('기본적으로 Instagram 버튼이 숨겨져 있다', () => {
      render(<ShareButtons content={mockContent} />);
      expect(screen.queryByRole('button', { name: /Instagram/i })).not.toBeInTheDocument();
    });

    it('showInstagram이 true이고 imageUrl이 있으면 버튼이 표시된다', () => {
      render(<ShareButtons content={mockContent} showInstagram />);
      expect(screen.getByRole('button', { name: /Instagram/i })).toBeInTheDocument();
    });

    it('Instagram 버튼 클릭 시 downloadShareImage가 호출된다', async () => {
      const { downloadShareImage } = await import('@/lib/share/social');

      render(<ShareButtons content={mockContent} showInstagram />);
      fireEvent.click(screen.getByRole('button', { name: /Instagram/i }));

      await waitFor(() => {
        expect(downloadShareImage).toHaveBeenCalledWith(mockContent.imageUrl, 'yiroom-result');
      });
    });

    it('imageUrl이 없으면 Instagram 버튼이 숨겨진다', () => {
      const contentWithoutImage = { ...mockContent, imageUrl: undefined };
      render(<ShareButtons content={contentWithoutImage} showInstagram />);
      expect(screen.queryByRole('button', { name: /Instagram/i })).not.toBeInTheDocument();
    });
  });

  it('커스텀 className을 적용한다', () => {
    render(<ShareButtons content={mockContent} className="custom-class" />);
    expect(screen.getByTestId('share-buttons')).toHaveClass('custom-class');
  });
});
