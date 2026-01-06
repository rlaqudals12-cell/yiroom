/**
 * FaceGuideOverlay 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FaceGuideOverlay } from '@/components/analysis/camera/FaceGuideOverlay';

describe('FaceGuideOverlay', () => {
  describe('렌더링', () => {
    it('정면 각도로 렌더링된다', () => {
      render(<FaceGuideOverlay angle="front" />);

      expect(screen.getByTestId('face-guide-overlay')).toBeInTheDocument();
      expect(screen.getByText('정면')).toBeInTheDocument();
      expect(screen.getByText('정면을 바라봐주세요')).toBeInTheDocument();
    });

    it('좌측 각도로 렌더링된다', () => {
      render(<FaceGuideOverlay angle="left" />);

      expect(screen.getByText('좌측 45°')).toBeInTheDocument();
      expect(screen.getByText('왼쪽으로 살짝 돌려주세요')).toBeInTheDocument();
    });

    it('우측 각도로 렌더링된다', () => {
      render(<FaceGuideOverlay angle="right" />);

      expect(screen.getByText('우측 45°')).toBeInTheDocument();
      expect(screen.getByText('오른쪽으로 살짝 돌려주세요')).toBeInTheDocument();
    });
  });

  describe('스타일', () => {
    it('SVG 얼굴 가이드가 포함된다', () => {
      const { container } = render(<FaceGuideOverlay angle="front" />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('추가 className이 적용된다', () => {
      render(<FaceGuideOverlay angle="front" className="test-class" />);

      expect(screen.getByTestId('face-guide-overlay')).toHaveClass('test-class');
    });
  });
});
