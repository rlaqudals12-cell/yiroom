/**
 * P1-1 테스트: AnalysisOverlayBase 공통 래퍼
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisOverlayBase } from '@/components/analysis/overlay/AnalysisOverlayBase';

// ResizeObserver mock
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

describe('AnalysisOverlayBase', () => {
  const defaultProps = {
    imageUrl: '/test-image.jpg',
    imageAlt: '테스트 이미지',
    children: vi.fn().mockReturnValue(<div data-testid="overlay-child">오버레이</div>),
  };

  it('should render with data-testid', () => {
    render(<AnalysisOverlayBase {...defaultProps} />);
    expect(screen.getByTestId('analysis-overlay-base')).toBeInTheDocument();
  });

  it('should render image with correct alt', () => {
    render(<AnalysisOverlayBase {...defaultProps} />);
    const img = screen.getByAltText('테스트 이미지');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test-image.jpg');
  });

  it('should render sr-only description when provided', () => {
    render(<AnalysisOverlayBase {...defaultProps} srOnlyDescription="피부 분석 결과: 복합성" />);
    expect(screen.getByText('피부 분석 결과: 복합성')).toHaveClass('sr-only');
  });

  it('should not render sr-only div when not provided', () => {
    const { container } = render(<AnalysisOverlayBase {...defaultProps} />);
    // sr-only 텍스트 대안이 없을 때 sr-only 컨테이너가 없어야 함
    const srOnly = container.querySelector('.sr-only');
    expect(srOnly).not.toBeInTheDocument();
  });

  it('should show error message on image load failure', () => {
    render(<AnalysisOverlayBase {...defaultProps} />);
    const img = screen.getByAltText('테스트 이미지');
    fireEvent.error(img);
    expect(screen.getByText('이미지를 불러올 수 없습니다')).toBeInTheDocument();
  });

  it('should call onImageError callback on load failure', () => {
    const onImageError = vi.fn();
    render(<AnalysisOverlayBase {...defaultProps} onImageError={onImageError} />);
    const img = screen.getByAltText('테스트 이미지');
    fireEvent.error(img);
    expect(onImageError).toHaveBeenCalledTimes(1);
  });

  it('should apply maxWidth style', () => {
    render(<AnalysisOverlayBase {...defaultProps} maxWidth={320} />);
    const container = screen.getByTestId('analysis-overlay-base');
    expect(container).toHaveStyle({ maxWidth: '320px' });
  });

  it('should apply custom className', () => {
    render(<AnalysisOverlayBase {...defaultProps} className="my-custom" />);
    const container = screen.getByTestId('analysis-overlay-base');
    expect(container.className).toContain('my-custom');
  });
});
