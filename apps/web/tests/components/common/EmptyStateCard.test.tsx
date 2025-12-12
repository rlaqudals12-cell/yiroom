/**
 * EmptyStateCard 컴포넌트 테스트
 * - 프리셋별 렌더링
 * - 커스텀 props 적용
 * - 액션 버튼 동작
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyStateCard } from '@/components/common';

// Next.js Link 모킹
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  ),
}));

describe('EmptyStateCard', () => {
  describe('프리셋 렌더링', () => {
    it('nutrition 프리셋 - 기본 텍스트 표시', () => {
      render(<EmptyStateCard preset="nutrition" />);

      expect(screen.getByText('식단 기록이 없어요')).toBeInTheDocument();
      expect(
        screen.getByText('오늘 먹은 음식을 기록하고 영양 분석을 받아보세요.')
      ).toBeInTheDocument();
      expect(screen.getByText('식단 기록하기')).toBeInTheDocument();
    });

    it('workout 프리셋 - 기본 텍스트 표시', () => {
      render(<EmptyStateCard preset="workout" />);

      expect(screen.getByText('운동 기록이 없어요')).toBeInTheDocument();
      expect(
        screen.getByText('운동을 시작하고 건강한 습관을 만들어보세요.')
      ).toBeInTheDocument();
      expect(screen.getByText('운동 시작하기')).toBeInTheDocument();
    });

    it('report 프리셋 - 기본 텍스트 표시', () => {
      render(<EmptyStateCard preset="report" />);

      expect(screen.getByText('기록이 없어요')).toBeInTheDocument();
      expect(
        screen.getByText('식단이나 운동 기록이 있어야 리포트를 볼 수 있어요.')
      ).toBeInTheDocument();
    });

    it('analysis 프리셋 - 기본 텍스트 표시', () => {
      render(<EmptyStateCard preset="analysis" />);

      expect(screen.getByText('분석 결과가 없어요')).toBeInTheDocument();
      expect(
        screen.getByText('퍼스널 컬러 진단부터 시작해보세요.')
      ).toBeInTheDocument();
    });
  });

  describe('커스텀 props', () => {
    it('프리셋 텍스트를 커스텀 텍스트로 덮어쓰기', () => {
      render(
        <EmptyStateCard
          preset="nutrition"
          title="커스텀 제목"
          description="커스텀 설명"
          actionLabel="커스텀 버튼"
        />
      );

      expect(screen.getByText('커스텀 제목')).toBeInTheDocument();
      expect(screen.getByText('커스텀 설명')).toBeInTheDocument();
      expect(screen.getByText('커스텀 버튼')).toBeInTheDocument();
    });

    it('custom 프리셋 - 모든 값 커스텀 지정', () => {
      render(
        <EmptyStateCard
          preset="custom"
          title="완전 커스텀"
          description="커스텀 설명입니다"
          actionLabel="액션"
          actionHref="/custom"
        />
      );

      expect(screen.getByText('완전 커스텀')).toBeInTheDocument();
      expect(screen.getByText('커스텀 설명입니다')).toBeInTheDocument();
    });

    it('data-testid 적용', () => {
      render(
        <EmptyStateCard preset="nutrition" data-testid="custom-empty-state" />
      );

      expect(screen.getByTestId('custom-empty-state')).toBeInTheDocument();
    });

    it('className 적용', () => {
      render(<EmptyStateCard preset="nutrition" className="mt-8" />);

      const card = screen.getByTestId('empty-state-card');
      expect(card).toHaveClass('mt-8');
    });
  });

  describe('액션 버튼', () => {
    it('Link 버튼 - actionHref가 있으면 링크로 렌더링', () => {
      render(
        <EmptyStateCard
          preset="nutrition"
          actionLabel="링크 버튼"
          actionHref="/nutrition"
        />
      );

      const link = screen.getByTestId('mock-link');
      expect(link).toHaveAttribute('href', '/nutrition');
    });

    it('onClick 버튼 - onAction이 있으면 클릭 핸들러 호출', () => {
      const onAction = vi.fn();
      render(
        <EmptyStateCard
          preset="custom"
          title="테스트"
          actionLabel="클릭 버튼"
          onAction={onAction}
        />
      );

      fireEvent.click(screen.getByText('클릭 버튼'));
      expect(onAction).toHaveBeenCalled();
    });

    it('보조 액션 버튼 렌더링', () => {
      render(
        <EmptyStateCard
          preset="report"
          secondaryActionLabel="운동 기록하기"
          secondaryActionHref="/workout"
        />
      );

      expect(screen.getByText('운동 기록하기')).toBeInTheDocument();
    });

    it('보조 액션 onClick 핸들러', () => {
      const onSecondaryAction = vi.fn();
      render(
        <EmptyStateCard
          preset="custom"
          title="테스트"
          secondaryActionLabel="보조 버튼"
          onSecondaryAction={onSecondaryAction}
        />
      );

      fireEvent.click(screen.getByText('보조 버튼'));
      expect(onSecondaryAction).toHaveBeenCalled();
    });
  });

  describe('children 렌더링', () => {
    it('커스텀 children 콘텐츠 렌더링', () => {
      render(
        <EmptyStateCard preset="custom" title="테스트">
          <div data-testid="custom-content">커스텀 콘텐츠</div>
        </EmptyStateCard>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('커스텀 콘텐츠')).toBeInTheDocument();
    });
  });
});
