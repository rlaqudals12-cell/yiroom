/**
 * SkinConsultantCTA Component Tests
 * @description Phase D - AI 피부 상담 CTA 버튼 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Next.js navigation 모킹
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

import { SkinConsultantCTA } from '@/components/skin/SkinConsultantCTA';

describe('SkinConsultantCTA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('렌더링', () => {
    it('기본 버튼이 렌더링된다', () => {
      render(<SkinConsultantCTA />);

      expect(screen.getByTestId('skin-consultant-cta')).toBeInTheDocument();
      expect(screen.getByText('AI 피부 상담')).toBeInTheDocument();
    });

    it('fullWidth 옵션이 적용된다', () => {
      render(<SkinConsultantCTA fullWidth />);

      const button = screen.getByTestId('skin-consultant-cta');
      expect(button.className).toContain('w-full');
    });

    it('className이 추가된다', () => {
      render(<SkinConsultantCTA className="custom-class" />);

      const button = screen.getByTestId('skin-consultant-cta');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('클릭 동작', () => {
    it('클릭 시 코치 페이지로 이동한다', () => {
      render(<SkinConsultantCTA />);

      fireEvent.click(screen.getByTestId('skin-consultant-cta'));

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/coach'));
    });

    it('skin 카테고리가 쿼리에 포함된다', () => {
      render(<SkinConsultantCTA />);

      fireEvent.click(screen.getByTestId('skin-consultant-cta'));

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('category=skin'));
    });

    it('피부 타입이 쿼리에 포함된다', () => {
      render(<SkinConsultantCTA skinType="건성" />);

      fireEvent.click(screen.getByTestId('skin-consultant-cta'));

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('skinType='));
    });

    it('피부 고민이 쿼리에 포함된다', () => {
      render(<SkinConsultantCTA concerns={['건조', '민감']} />);

      fireEvent.click(screen.getByTestId('skin-consultant-cta'));

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('concerns='));
    });

    it('피부 타입이 없으면 skinType 쿼리가 생략된다', () => {
      render(<SkinConsultantCTA />);

      fireEvent.click(screen.getByTestId('skin-consultant-cta'));

      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).not.toContain('skinType=');
    });

    it('피부 고민이 없으면 concerns 쿼리가 생략된다', () => {
      render(<SkinConsultantCTA concerns={[]} />);

      fireEvent.click(screen.getByTestId('skin-consultant-cta'));

      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).not.toContain('concerns=');
    });
  });

  describe('variant 옵션', () => {
    it('default variant가 적용된다', () => {
      render(<SkinConsultantCTA variant="default" />);

      expect(screen.getByTestId('skin-consultant-cta')).toBeInTheDocument();
    });

    it('outline variant가 적용된다', () => {
      render(<SkinConsultantCTA variant="outline" />);

      expect(screen.getByTestId('skin-consultant-cta')).toBeInTheDocument();
    });

    it('ghost variant가 적용된다', () => {
      render(<SkinConsultantCTA variant="ghost" />);

      expect(screen.getByTestId('skin-consultant-cta')).toBeInTheDocument();
    });
  });

  describe('컨텍스트 전달', () => {
    it('모든 컨텍스트가 URL에 인코딩된다', () => {
      render(<SkinConsultantCTA skinType="건성" concerns={['건조', '모공']} />);

      fireEvent.click(screen.getByTestId('skin-consultant-cta'));

      const calledUrl = mockPush.mock.calls[0][0];
      expect(calledUrl).toContain('category=skin');
      expect(calledUrl).toContain('skinType=');
      expect(calledUrl).toContain('concerns=');
    });
  });
});
