import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ImageWithFallback } from '@/components/common/ImageWithFallback';

// next/image 모킹 — onError 전달을 그대로 유지해야 폴백 전환을 검증할 수 있다
vi.mock('next/image', () => ({
  default: ({ src, alt, onError }: { src: string; alt: string; onError?: () => void }) => (
    <img src={src} alt={alt} onError={onError} />
  ),
}));

describe('ImageWithFallback', () => {
  it('src가 있으면 이미지를 렌더링한다', () => {
    render(
      <ImageWithFallback
        src="https://shopping-phinf.pstatic.net/test.jpg"
        alt="테스트 제품"
        fallback={<span>폴백</span>}
      />
    );

    const img = screen.getByAltText('테스트 제품');
    expect(img).toHaveAttribute('src', 'https://shopping-phinf.pstatic.net/test.jpg');
    expect(screen.queryByTestId('product-image-fallback')).not.toBeInTheDocument();
  });

  it('src가 null이면 폴백을 렌더링한다', () => {
    render(<ImageWithFallback src={null} alt="테스트 제품" fallback={<span>폴백</span>} />);

    expect(screen.getByTestId('product-image-fallback')).toBeInTheDocument();
    expect(screen.getByText('폴백')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '테스트 제품' })).toBeInTheDocument(); // 폴백 컨테이너의 role="img"
  });

  it('src가 빈 문자열이면 폴백을 렌더링한다', () => {
    render(<ImageWithFallback src="" alt="테스트 제품" fallback={<span>폴백</span>} />);

    expect(screen.getByTestId('product-image-fallback')).toBeInTheDocument();
  });

  it('이미지 로드 실패(onError) 시 폴백으로 전환한다 — 검은 박스 재발 방지', () => {
    render(
      <ImageWithFallback
        src="https://shopping-phinf.pstatic.net/broken.jpg"
        alt="테스트 제품"
        fallback={<span>폴백</span>}
      />
    );

    const img = screen.getByAltText('테스트 제품');
    fireEvent.error(img);

    // 실패 후 이미지는 사라지고 폴백만 남는다 (빈 <img> + 다크 bg-muted 검은 박스 금지)
    expect(screen.getByTestId('product-image-fallback')).toBeInTheDocument();
    expect(screen.getByText('폴백')).toBeInTheDocument();
    expect(screen.queryByAltText('테스트 제품')).not.toBeInTheDocument();
  });

  it('에러 후 src가 바뀌면 에러 상태를 해제하고 새 이미지를 렌더링한다 (리스트 셀 재사용)', () => {
    const { rerender } = render(
      <ImageWithFallback
        src="https://shopping-phinf.pstatic.net/broken.jpg"
        alt="테스트 제품"
        fallback={<span>폴백</span>}
      />
    );

    fireEvent.error(screen.getByAltText('테스트 제품'));
    expect(screen.getByTestId('product-image-fallback')).toBeInTheDocument();

    rerender(
      <ImageWithFallback
        src="https://shopping-phinf.pstatic.net/new.jpg"
        alt="테스트 제품"
        fallback={<span>폴백</span>}
      />
    );

    const img = screen.getByAltText('테스트 제품');
    expect(img).toHaveAttribute('src', 'https://shopping-phinf.pstatic.net/new.jpg');
    expect(screen.queryByTestId('product-image-fallback')).not.toBeInTheDocument();
  });

  it('fill=false + width/height 모드에서도 폴백이 지정 크기로 렌더링된다', () => {
    render(
      <ImageWithFallback
        src={null}
        alt="테스트 제품"
        fallback={<span>폴백</span>}
        fill={false}
        width={96}
        height={96}
      />
    );

    const fallbackBox = screen.getByTestId('product-image-fallback');
    expect(fallbackBox).toHaveStyle({ width: '96px', height: '96px' });
  });
});
