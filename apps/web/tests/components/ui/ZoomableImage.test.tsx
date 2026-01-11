import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ZoomableImage } from '@/components/ui/ZoomableImage';

// Mock Next.js Image - 로드 성공 시뮬레이션
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onLoad,
    onError,
    className,
    ...props
  }: {
    src: string;
    alt: string;
    onLoad?: () => void;
    onError?: () => void;
    className?: string;
  }) => {
    // 렌더링 후 자동으로 onLoad 호출 (정상 케이스)
    setTimeout(() => {
      if (src && !src.includes('error')) {
        onLoad?.();
      } else {
        onError?.();
      }
    }, 0);

    return <img src={src} alt={alt} className={className} {...props} data-testid="mock-image" />;
  },
}));

describe('ZoomableImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('이미지 컨테이너를 렌더링한다', () => {
      render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" />);
      expect(screen.getByTestId('zoomable-image')).toBeInTheDocument();
    });

    it('이미지를 렌더링한다', () => {
      render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" />);
      expect(screen.getByTestId('mock-image')).toBeInTheDocument();
    });

    it('alt 텍스트가 정확하게 설정된다', () => {
      render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" />);
      expect(screen.getByAltText('테스트 이미지')).toBeInTheDocument();
    });

    it('className이 적용된다', () => {
      render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" className="w-full h-96" />);
      expect(screen.getByTestId('zoomable-image')).toHaveClass('w-full', 'h-96');
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중에 스피너를 표시한다', () => {
      render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" />);
      // 로딩 스피너가 표시됨 (animate-spin 클래스)
      const spinner = screen.getByTestId('zoomable-image').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('이미지 로드 완료 후 스피너가 사라진다', async () => {
      render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" />);

      await waitFor(() => {
        const spinner = screen.getByTestId('zoomable-image').querySelector('.animate-spin');
        expect(spinner).not.toBeInTheDocument();
      });
    });
  });

  describe('에러 처리', () => {
    it('이미지 로드 실패 시 에러 UI를 표시한다', async () => {
      render(<ZoomableImage src="/error.jpg" alt="에러 이미지" />);

      await waitFor(() => {
        expect(screen.getByTestId('zoomable-image-error')).toBeInTheDocument();
        expect(screen.getByText('이미지를 불러올 수 없습니다')).toBeInTheDocument();
      });
    });

    it('이미지 로드 실패 시 onError 콜백을 호출한다', async () => {
      const onError = vi.fn();
      render(<ZoomableImage src="/error.jpg" alt="에러 이미지" onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('줌 기능', () => {
    it('더블클릭 시 줌인된다', async () => {
      render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" />);

      await waitFor(() => {
        expect(
          screen.getByTestId('zoomable-image').querySelector('.animate-spin')
        ).not.toBeInTheDocument();
      });

      const container = screen.getByTestId('zoomable-image');
      fireEvent.doubleClick(container);

      // 줌 레벨 표시가 나타나야 함
      await waitFor(() => {
        expect(screen.getByText(/\d+%/)).toBeInTheDocument();
      });
    });

    it('마우스 휠로 줌인/줌아웃된다', async () => {
      render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" />);

      await waitFor(() => {
        expect(
          screen.getByTestId('zoomable-image').querySelector('.animate-spin')
        ).not.toBeInTheDocument();
      });

      const container = screen.getByTestId('zoomable-image');

      // 줌인 (휠 업)
      fireEvent.wheel(container, { deltaY: -100 });

      // 줌 레벨 표시
      await waitFor(() => {
        expect(screen.getByText(/\d+%/)).toBeInTheDocument();
      });
    });

    it('onZoomChange 콜백이 호출된다', async () => {
      const onZoomChange = vi.fn();
      render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" onZoomChange={onZoomChange} />);

      await waitFor(() => {
        expect(
          screen.getByTestId('zoomable-image').querySelector('.animate-spin')
        ).not.toBeInTheDocument();
      });

      const container = screen.getByTestId('zoomable-image');
      fireEvent.doubleClick(container);

      await waitFor(() => {
        expect(onZoomChange).toHaveBeenCalled();
      });
    });
  });

  describe('줌 제한', () => {
    it('minZoom 이하로 줌아웃되지 않는다', async () => {
      const onZoomChange = vi.fn();
      render(
        <ZoomableImage
          src="/test.jpg"
          alt="테스트 이미지"
          minZoom={1}
          maxZoom={3}
          onZoomChange={onZoomChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('zoomable-image').querySelector('.animate-spin')
        ).not.toBeInTheDocument();
      });

      const container = screen.getByTestId('zoomable-image');

      // 줌아웃 시도 (휠 다운)
      fireEvent.wheel(container, { deltaY: 1000 });

      // 최소 줌(1) 이상 유지
      await waitFor(() => {
        const calls = onZoomChange.mock.calls;
        const zoomValues = calls.map((call) => call[0]);
        zoomValues.forEach((zoom) => {
          expect(zoom).toBeGreaterThanOrEqual(1);
        });
      });
    });

    it('maxZoom 이상으로 줌인되지 않는다', async () => {
      const onZoomChange = vi.fn();
      render(
        <ZoomableImage
          src="/test.jpg"
          alt="테스트 이미지"
          minZoom={1}
          maxZoom={2}
          onZoomChange={onZoomChange}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('zoomable-image').querySelector('.animate-spin')
        ).not.toBeInTheDocument();
      });

      const container = screen.getByTestId('zoomable-image');

      // 여러 번 줌인 시도
      for (let i = 0; i < 20; i++) {
        fireEvent.wheel(container, { deltaY: -100 });
      }

      // 최대 줌(2) 이하 유지
      await waitFor(() => {
        const calls = onZoomChange.mock.calls;
        const zoomValues = calls.map((call) => call[0]);
        zoomValues.forEach((zoom) => {
          expect(zoom).toBeLessThanOrEqual(2);
        });
      });
    });
  });

  describe('드래그 기능', () => {
    it('줌인 상태에서 드래그 커서로 변경된다', async () => {
      render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" />);

      await waitFor(() => {
        expect(
          screen.getByTestId('zoomable-image').querySelector('.animate-spin')
        ).not.toBeInTheDocument();
      });

      const container = screen.getByTestId('zoomable-image');

      // 줌인
      fireEvent.doubleClick(container);

      await waitFor(() => {
        expect(container).toHaveStyle({ cursor: 'grab' });
      });
    });
  });

  describe('focusPoint', () => {
    it('focusPoint 변경 시 해당 위치로 이동한다', async () => {
      const { rerender } = render(<ZoomableImage src="/test.jpg" alt="테스트 이미지" />);

      await waitFor(() => {
        expect(
          screen.getByTestId('zoomable-image').querySelector('.animate-spin')
        ).not.toBeInTheDocument();
      });

      // focusPoint 설정
      rerender(<ZoomableImage src="/test.jpg" alt="테스트 이미지" focusPoint={{ x: 50, y: 50 }} />);

      // 줌이 적용되고 줌 레벨 표시가 나타나야 함
      await waitFor(() => {
        expect(screen.getByText(/\d+%/)).toBeInTheDocument();
      });
    });
  });
});
