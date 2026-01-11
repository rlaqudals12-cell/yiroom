/**
 * 범용 AI 상담 CTA 테스트
 * @description Phase K - 각 도메인별 AI 상담 CTA 버튼 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// next/navigation 모킹
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

import { ConsultantCTA } from '@/components/coach/ConsultantCTA';

describe('ConsultantCTA', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('기본 버튼 모드', () => {
    it('피부 상담 버튼을 렌더링한다', () => {
      render(<ConsultantCTA category="skin" />);

      expect(screen.getByTestId('skin-consultant-cta')).toBeInTheDocument();
      expect(screen.getByText('AI 피부 상담')).toBeInTheDocument();
    });

    it('퍼스널컬러 상담 버튼을 렌더링한다', () => {
      render(<ConsultantCTA category="personalColor" />);

      expect(screen.getByTestId('personalColor-consultant-cta')).toBeInTheDocument();
      expect(screen.getByText('AI 컬러 상담')).toBeInTheDocument();
    });

    it('패션 상담 버튼을 렌더링한다', () => {
      render(<ConsultantCTA category="fashion" />);

      expect(screen.getByTestId('fashion-consultant-cta')).toBeInTheDocument();
      expect(screen.getByText('AI 코디 상담')).toBeInTheDocument();
    });

    it('영양 상담 버튼을 렌더링한다', () => {
      render(<ConsultantCTA category="nutrition" />);

      expect(screen.getByTestId('nutrition-consultant-cta')).toBeInTheDocument();
      expect(screen.getByText('AI 영양 상담')).toBeInTheDocument();
    });

    it('운동 상담 버튼을 렌더링한다', () => {
      render(<ConsultantCTA category="workout" />);

      expect(screen.getByTestId('workout-consultant-cta')).toBeInTheDocument();
      expect(screen.getByText('AI 운동 상담')).toBeInTheDocument();
    });

    it('클릭 시 코치 페이지로 이동한다', () => {
      render(<ConsultantCTA category="skin" />);

      fireEvent.click(screen.getByTestId('skin-consultant-cta'));

      expect(mockPush).toHaveBeenCalledWith('/coach?category=skin');
    });

    it('추가 파라미터와 함께 이동한다', () => {
      render(
        <ConsultantCTA category="skin" params={{ skinType: 'oily', concerns: 'acne,pore' }} />
      );

      fireEvent.click(screen.getByTestId('skin-consultant-cta'));

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('category=skin'));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('skinType=oily'));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('concerns=acne'));
    });

    it('fullWidth 옵션이 적용된다', () => {
      render(<ConsultantCTA category="fashion" fullWidth />);

      const button = screen.getByTestId('fashion-consultant-cta');
      expect(button).toHaveClass('w-full');
    });

    it('variant 옵션이 적용된다', () => {
      render(<ConsultantCTA category="workout" variant="default" />);

      const button = screen.getByTestId('workout-consultant-cta');
      // default variant는 특정 클래스를 가짐
      expect(button).toBeInTheDocument();
    });
  });

  describe('빠른 질문 모드', () => {
    it('빠른 질문 버튼들을 렌더링한다', () => {
      render(<ConsultantCTA category="skin" showQuickQuestions />);

      expect(screen.getByText('AI에게 물어보기')).toBeInTheDocument();
      expect(screen.getByText('제 피부에 맞는 루틴 알려줘요')).toBeInTheDocument();
    });

    it('퍼스널컬러 빠른 질문을 렌더링한다', () => {
      render(<ConsultantCTA category="personalColor" showQuickQuestions />);

      expect(screen.getByText('내 시즌에 맞는 립 색상 추천해줘')).toBeInTheDocument();
    });

    it('패션 빠른 질문을 렌더링한다', () => {
      render(<ConsultantCTA category="fashion" showQuickQuestions />);

      expect(screen.getByText('오늘 뭐 입을까?')).toBeInTheDocument();
    });

    it('영양 빠른 질문을 렌더링한다', () => {
      render(<ConsultantCTA category="nutrition" showQuickQuestions />);

      expect(screen.getByText('냉장고 재료로 뭐 해먹지?')).toBeInTheDocument();
    });

    it('운동 빠른 질문을 렌더링한다', () => {
      render(<ConsultantCTA category="workout" showQuickQuestions />);

      expect(screen.getByText('오늘 운동 뭐하면 좋을까?')).toBeInTheDocument();
    });

    it('빠른 질문 클릭 시 질문과 함께 이동한다', () => {
      render(<ConsultantCTA category="nutrition" showQuickQuestions />);

      fireEvent.click(screen.getByText('냉장고 재료로 뭐 해먹지?'));

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('category=nutrition'));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q='));
    });

    it('더 많은 질문하기 버튼이 표시된다', () => {
      render(<ConsultantCTA category="workout" showQuickQuestions />);

      expect(screen.getByText('더 많은 질문하기 →')).toBeInTheDocument();
    });

    it('더 많은 질문하기 클릭 시 코치 페이지로 이동한다', () => {
      render(<ConsultantCTA category="fashion" showQuickQuestions />);

      fireEvent.click(screen.getByText('더 많은 질문하기 →'));

      expect(mockPush).toHaveBeenCalledWith('/coach?category=fashion');
    });
  });

  describe('접근성', () => {
    it('data-testid가 올바르게 설정된다', () => {
      const { rerender } = render(<ConsultantCTA category="skin" />);
      expect(screen.getByTestId('skin-consultant-cta')).toBeInTheDocument();

      rerender(<ConsultantCTA category="personalColor" />);
      expect(screen.getByTestId('personalColor-consultant-cta')).toBeInTheDocument();
    });

    it('빠른 질문 모드에서도 testid가 유지된다', () => {
      render(<ConsultantCTA category="fashion" showQuickQuestions />);
      expect(screen.getByTestId('fashion-consultant-cta')).toBeInTheDocument();
    });
  });
});
