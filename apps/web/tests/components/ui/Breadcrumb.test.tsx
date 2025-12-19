/**
 * Breadcrumb 컴포넌트 테스트
 * Task 3.3: 브레드크럼 컴포넌트
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Breadcrumb, BreadcrumbSkeleton } from '@/components/ui/Breadcrumb';

describe('Breadcrumb', () => {
  describe('렌더링', () => {
    it('기본 브레드크럼을 렌더링한다', () => {
      render(
        <Breadcrumb
          items={[
            { label: '운동', href: '/workout' },
            { label: '온보딩' },
          ]}
        />
      );

      expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('운동')).toBeInTheDocument();
      expect(screen.getByText('온보딩')).toBeInTheDocument();
    });

    it('홈 아이콘을 표시한다', () => {
      render(
        <Breadcrumb
          items={[{ label: '페이지' }]}
        />
      );

      expect(screen.getByTestId('breadcrumb-home')).toBeInTheDocument();
      expect(screen.getByLabelText('홈으로 이동')).toBeInTheDocument();
    });

    it('showHome=false일 때 홈 아이콘을 숨긴다', () => {
      render(
        <Breadcrumb
          items={[{ label: '페이지' }]}
          showHome={false}
        />
      );

      expect(screen.queryByTestId('breadcrumb-home')).not.toBeInTheDocument();
    });

    it('빈 items 배열일 때 아무것도 렌더링하지 않는다', () => {
      const { container } = render(<Breadcrumb items={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('여러 항목을 올바르게 렌더링한다', () => {
      render(
        <Breadcrumb
          items={[
            { label: '분석', href: '/analysis' },
            { label: '퍼스널컬러', href: '/analysis/personal-color' },
            { label: '결과' },
          ]}
        />
      );

      expect(screen.getByTestId('breadcrumb-item-0')).toHaveTextContent('분석');
      expect(screen.getByTestId('breadcrumb-item-1')).toHaveTextContent('퍼스널컬러');
      expect(screen.getByTestId('breadcrumb-item-2')).toHaveTextContent('결과');
    });
  });

  describe('링크', () => {
    it('href가 있는 항목은 링크로 렌더링된다', () => {
      render(
        <Breadcrumb
          items={[
            { label: '운동', href: '/workout' },
            { label: '현재 페이지' },
          ]}
        />
      );

      const linkItem = screen.getByTestId('breadcrumb-item-0');
      expect(linkItem.tagName).toBe('A');
      expect(linkItem).toHaveAttribute('href', '/workout');
    });

    it('마지막 항목은 항상 현재 페이지로 표시된다', () => {
      render(
        <Breadcrumb
          items={[
            { label: '운동', href: '/workout' },
            { label: '현재 페이지', href: '/workout/current' },
          ]}
        />
      );

      const lastItem = screen.getByTestId('breadcrumb-item-1');
      expect(lastItem.tagName).toBe('SPAN');
      expect(lastItem).toHaveAttribute('aria-current', 'page');
    });

    it('홈 링크를 커스터마이즈할 수 있다', () => {
      render(
        <Breadcrumb
          items={[{ label: '페이지' }]}
          homeHref="/dashboard"
        />
      );

      expect(screen.getByTestId('breadcrumb-home')).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('접근성', () => {
    it('nav 요소에 aria-label이 있다', () => {
      render(<Breadcrumb items={[{ label: '페이지' }]} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', '브레드크럼');
    });

    it('현재 페이지에 aria-current="page"가 있다', () => {
      render(
        <Breadcrumb
          items={[
            { label: '이전', href: '/prev' },
            { label: '현재' },
          ]}
        />
      );

      const currentPage = screen.getByText('현재');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('홈 아이콘에 aria-label이 있다', () => {
      render(<Breadcrumb items={[{ label: '페이지' }]} />);

      expect(screen.getByLabelText('홈으로 이동')).toBeInTheDocument();
    });
  });

  describe('스타일', () => {
    it('className prop을 적용한다', () => {
      render(
        <Breadcrumb
          items={[{ label: '페이지' }]}
          className="custom-class"
        />
      );

      expect(screen.getByTestId('breadcrumb')).toHaveClass('custom-class');
    });
  });
});

describe('BreadcrumbSkeleton', () => {
  it('기본 스켈레톤을 렌더링한다', () => {
    render(<BreadcrumbSkeleton />);

    expect(screen.getByTestId('breadcrumb-skeleton')).toBeInTheDocument();
  });

  it('지정된 개수의 항목을 렌더링한다', () => {
    render(<BreadcrumbSkeleton itemCount={5} />);

    const skeleton = screen.getByTestId('breadcrumb-skeleton');
    // 홈 아이콘 (1) + 항목 개수 (5) 만큼의 구분자가 있어야 함
    const separators = skeleton.querySelectorAll('[aria-hidden="true"]');
    expect(separators.length).toBe(5);
  });

  it('접근성 라벨이 있다', () => {
    render(<BreadcrumbSkeleton />);

    expect(screen.getByLabelText('브레드크럼 로딩 중')).toBeInTheDocument();
  });
});
