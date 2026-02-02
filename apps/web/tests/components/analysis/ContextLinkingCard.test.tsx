import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ContextLinkingCard } from '@/components/analysis/ContextLinkingCard';

// Next.js Link 컴포넌트 모킹
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('ContextLinkingCard', () => {
  describe('모듈 연결 렌더링', () => {
    it('퍼스널컬러 모듈에서 메이크업, 헤어 추천을 표시해야 함', () => {
      render(<ContextLinkingCard currentModule="personal-color" />);

      expect(screen.getByTestId('context-linking-card')).toBeInTheDocument();
      expect(screen.getByText('다음 분석도 해보세요')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-makeup')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-hair')).toBeInTheDocument();
    });

    it('피부 모듈에서 메이크업 추천을 표시해야 함', () => {
      render(<ContextLinkingCard currentModule="skin" />);

      expect(screen.getByTestId('context-linking-card')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-makeup')).toBeInTheDocument();
    });

    it('체형 모듈에서 운동, 영양 추천을 표시해야 함', () => {
      render(<ContextLinkingCard currentModule="body" />);

      expect(screen.getByTestId('context-linking-card')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-workout')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-nutrition')).toBeInTheDocument();
    });

    it('얼굴형 모듈에서 헤어, 메이크업 추천을 표시해야 함', () => {
      render(<ContextLinkingCard currentModule="face" />);

      expect(screen.getByTestId('context-linking-card')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-hair')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-makeup')).toBeInTheDocument();
    });

    it('헤어 모듈에서 퍼스널컬러 추천을 표시해야 함', () => {
      render(<ContextLinkingCard currentModule="hair" />);

      expect(screen.getByTestId('context-linking-card')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-personal-color')).toBeInTheDocument();
    });

    it('메이크업 모듈에서 퍼스널컬러, 피부 추천을 표시해야 함', () => {
      render(<ContextLinkingCard currentModule="makeup" />);

      expect(screen.getByTestId('context-linking-card')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-personal-color')).toBeInTheDocument();
      expect(screen.getByTestId('context-link-skin')).toBeInTheDocument();
    });
  });

  describe('완료된 모듈 필터링', () => {
    it('완료된 모듈은 추천 목록에서 제외해야 함', () => {
      render(<ContextLinkingCard currentModule="personal-color" completedModules={['makeup']} />);

      expect(screen.getByTestId('context-linking-card')).toBeInTheDocument();
      // 메이크업은 완료되어 제외됨
      expect(screen.queryByTestId('context-link-makeup')).not.toBeInTheDocument();
      // 헤어는 여전히 표시됨
      expect(screen.getByTestId('context-link-hair')).toBeInTheDocument();
    });

    it('모든 추천 모듈이 완료되면 컴포넌트를 렌더링하지 않아야 함', () => {
      const { container } = render(
        <ContextLinkingCard currentModule="personal-color" completedModules={['makeup', 'hair']} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('연결 정의 없는 모듈', () => {
    it('연결 정의가 없는 모듈은 컴포넌트를 렌더링하지 않아야 함', () => {
      const { container } = render(<ContextLinkingCard currentModule="unknown-module" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('링크 href', () => {
    it('각 추천 모듈의 링크가 올바른 href를 가져야 함', () => {
      render(<ContextLinkingCard currentModule="body" />);

      const workoutLink = screen.getByTestId('context-link-workout');
      const nutritionLink = screen.getByTestId('context-link-nutrition');

      expect(workoutLink).toHaveAttribute('href', '/workout/onboarding/step1');
      expect(nutritionLink).toHaveAttribute('href', '/nutrition');
    });

    it('기본 분석 모듈 링크가 올바른 href를 가져야 함', () => {
      render(<ContextLinkingCard currentModule="hair" />);

      const personalColorLink = screen.getByTestId('context-link-personal-color');
      expect(personalColorLink).toHaveAttribute('href', '/analysis/personal-color');
    });
  });

  describe('접근성', () => {
    it('섹션에 올바른 역할이 있어야 함', () => {
      render(<ContextLinkingCard currentModule="personal-color" />);

      const section = screen.getByTestId('context-linking-card');
      expect(section.tagName).toBe('SECTION');
    });

    it('제목이 h3 태그로 렌더링되어야 함', () => {
      render(<ContextLinkingCard currentModule="personal-color" />);

      const heading = screen.getByText('다음 분석도 해보세요');
      expect(heading.tagName).toBe('H3');
    });
  });
});
