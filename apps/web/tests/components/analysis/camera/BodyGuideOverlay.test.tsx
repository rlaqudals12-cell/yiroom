/**
 * BodyGuideOverlay 컴포넌트 테스트
 * @description 전신 촬영 가이드 오버레이 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BodyGuideOverlay } from '@/components/analysis/camera/BodyGuideOverlay';

describe('BodyGuideOverlay', () => {
  describe('렌더링', () => {
    it('정면 각도로 렌더링된다', () => {
      render(<BodyGuideOverlay angle="front" />);

      expect(screen.getByTestId('body-guide-overlay')).toBeInTheDocument();
      expect(screen.getByText('정면')).toBeInTheDocument();
      expect(screen.getByText('정면을 바라봐주세요')).toBeInTheDocument();
      expect(screen.getByText('전신이 프레임 안에 들어오도록 해주세요')).toBeInTheDocument();
    });

    it('좌측면 각도로 렌더링된다', () => {
      render(<BodyGuideOverlay angle="left_side" />);

      expect(screen.getByText('좌측면')).toBeInTheDocument();
      expect(screen.getByText('왼쪽 옆모습을 보여주세요')).toBeInTheDocument();
      expect(screen.getByText('왼쪽 어깨와 골반 라인이 보이도록 해주세요')).toBeInTheDocument();
    });

    it('우측면 각도로 렌더링된다', () => {
      render(<BodyGuideOverlay angle="right_side" />);

      expect(screen.getByText('우측면')).toBeInTheDocument();
      expect(screen.getByText('오른쪽 옆모습을 보여주세요')).toBeInTheDocument();
      expect(screen.getByText('오른쪽 어깨와 골반 라인이 보이도록 해주세요')).toBeInTheDocument();
    });

    it('후면 각도로 렌더링된다', () => {
      render(<BodyGuideOverlay angle="back" />);

      expect(screen.getByText('후면')).toBeInTheDocument();
      expect(screen.getByText('뒷모습을 보여주세요')).toBeInTheDocument();
      expect(screen.getByText('어깨와 허리 라인이 보이도록 해주세요')).toBeInTheDocument();
    });
  });

  describe('스타일', () => {
    it('SVG 전신 가이드가 포함된다', () => {
      const { container } = render(<BodyGuideOverlay angle="front" />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('추가 className이 적용된다', () => {
      render(<BodyGuideOverlay angle="front" className="test-class" />);

      expect(screen.getByTestId('body-guide-overlay')).toHaveClass('test-class');
    });
  });
});
