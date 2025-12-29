import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BeforeAfterViewer } from '@/components/common/BeforeAfterViewer';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    ArrowLeftRight: () => <span data-testid="icon-arrow-lr">↔</span>,
    ToggleLeft: () => <span data-testid="icon-toggle-left">◀</span>,
    ToggleRight: () => <span data-testid="icon-toggle-right">▶</span>,
  };
});

// next/image 모킹
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      data-testid="before-after-image"
    />
  ),
}));

describe('BeforeAfterViewer', () => {
  const defaultProps = {
    beforeImage: '/images/before.jpg',
    afterImage: '/images/after.jpg',
  };

  describe('Slider Mode (default)', () => {
    it('renders the viewer with test id', () => {
      render(<BeforeAfterViewer {...defaultProps} />);
      expect(screen.getByTestId('before-after-viewer')).toBeInTheDocument();
    });

    it('displays both before and after images', () => {
      render(<BeforeAfterViewer {...defaultProps} />);
      const images = screen.getAllByTestId('before-after-image');
      expect(images.length).toBe(2);
    });

    it('shows default labels', () => {
      render(<BeforeAfterViewer {...defaultProps} />);
      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });

    it('shows custom labels', () => {
      render(
        <BeforeAfterViewer
          {...defaultProps}
          beforeLabel="이전"
          afterLabel="이후"
        />
      );
      expect(screen.getByText('이전')).toBeInTheDocument();
      expect(screen.getByText('이후')).toBeInTheDocument();
    });

    it('displays slider handle icon', () => {
      render(<BeforeAfterViewer {...defaultProps} />);
      expect(screen.getByTestId('icon-arrow-lr')).toBeInTheDocument();
    });

    it('has accessible aria-label', () => {
      render(
        <BeforeAfterViewer
          {...defaultProps}
          beforeLabel="이전"
          afterLabel="이후"
        />
      );
      const viewer = screen.getByRole('img', { name: '이전와 이후 비교 이미지' });
      expect(viewer).toBeInTheDocument();
    });

    it('has cursor-ew-resize class for slider', () => {
      render(<BeforeAfterViewer {...defaultProps} />);
      const viewer = screen.getByTestId('before-after-viewer');
      expect(viewer.className).toContain('cursor-ew-resize');
    });
  });

  describe('Side-by-Side Mode', () => {
    it('renders with side-by-side layout', () => {
      render(<BeforeAfterViewer {...defaultProps} mode="side-by-side" />);
      expect(screen.getByTestId('before-after-viewer')).toBeInTheDocument();
    });

    it('displays both images side by side', () => {
      render(<BeforeAfterViewer {...defaultProps} mode="side-by-side" />);
      const images = screen.getAllByTestId('before-after-image');
      expect(images.length).toBe(2);
    });

    it('shows labels on both images', () => {
      render(
        <BeforeAfterViewer
          {...defaultProps}
          mode="side-by-side"
          beforeLabel="시술 전"
          afterLabel="시술 후"
        />
      );
      expect(screen.getByText('시술 전')).toBeInTheDocument();
      expect(screen.getByText('시술 후')).toBeInTheDocument();
    });

    it('has grid layout class', () => {
      render(<BeforeAfterViewer {...defaultProps} mode="side-by-side" />);
      const viewer = screen.getByTestId('before-after-viewer');
      expect(viewer.className).toContain('grid-cols-2');
    });

    it('has accessible aria-label', () => {
      render(<BeforeAfterViewer {...defaultProps} mode="side-by-side" />);
      const viewer = screen.getByRole('group', { name: 'Before와 After 비교 이미지' });
      expect(viewer).toBeInTheDocument();
    });
  });

  describe('Toggle Mode', () => {
    it('renders with toggle button', () => {
      render(<BeforeAfterViewer {...defaultProps} mode="toggle" />);
      expect(screen.getByTestId('before-after-viewer')).toBeInTheDocument();
    });

    it('shows before image initially', () => {
      render(<BeforeAfterViewer {...defaultProps} mode="toggle" />);
      expect(screen.getByText('Before')).toBeInTheDocument();
    });

    it('shows toggle button with after label initially', () => {
      render(<BeforeAfterViewer {...defaultProps} mode="toggle" />);
      expect(screen.getByRole('button', { name: 'After 보기' })).toBeInTheDocument();
    });

    it('toggles to after image when button clicked', () => {
      render(
        <BeforeAfterViewer
          {...defaultProps}
          mode="toggle"
          beforeLabel="이전"
          afterLabel="이후"
        />
      );

      const toggleButton = screen.getByRole('button', { name: '이후 보기' });
      fireEvent.click(toggleButton);

      // 이후 라벨이 표시됨
      expect(screen.getByText('이후')).toBeInTheDocument();
      // 버튼이 "이전 보기"로 변경됨
      expect(screen.getByRole('button', { name: '이전 보기' })).toBeInTheDocument();
    });

    it('toggles back to before image', () => {
      render(
        <BeforeAfterViewer
          {...defaultProps}
          mode="toggle"
          beforeLabel="이전"
          afterLabel="이후"
        />
      );

      // 이후로 토글
      const toggleButton = screen.getByRole('button', { name: '이후 보기' });
      fireEvent.click(toggleButton);

      // 다시 이전으로 토글
      const backButton = screen.getByRole('button', { name: '이전 보기' });
      fireEvent.click(backButton);

      // 이전 라벨이 표시됨
      expect(screen.getByText('이전')).toBeInTheDocument();
    });

    it('displays only one image at a time', () => {
      render(<BeforeAfterViewer {...defaultProps} mode="toggle" />);
      const images = screen.getAllByTestId('before-after-image');
      expect(images.length).toBe(1);
    });

    it('shows toggle left icon when showing after', () => {
      render(<BeforeAfterViewer {...defaultProps} mode="toggle" />);

      // After 상태로 전환
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      expect(screen.getByTestId('icon-toggle-right')).toBeInTheDocument();
    });
  });

  describe('Common Props', () => {
    it('applies custom className', () => {
      render(
        <BeforeAfterViewer
          {...defaultProps}
          className="custom-viewer-class"
        />
      );
      const viewer = screen.getByTestId('before-after-viewer');
      expect(viewer.className).toContain('custom-viewer-class');
    });

    it('uses custom alt prefix', () => {
      render(
        <BeforeAfterViewer
          {...defaultProps}
          altPrefix="피부 상태"
          mode="side-by-side"
        />
      );
      const images = screen.getAllByTestId('before-after-image');
      expect(images[0]).toHaveAttribute('alt', '피부 상태 - Before');
      expect(images[1]).toHaveAttribute('alt', '피부 상태 - After');
    });

    it('accepts custom height', () => {
      render(<BeforeAfterViewer {...defaultProps} height={400} />);
      const viewer = screen.getByTestId('before-after-viewer');
      expect(viewer).toHaveStyle({ height: '400px' });
    });
  });
});
