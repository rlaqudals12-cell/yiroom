/**
 * PartialSuccessBanner 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// lucide-react mock
vi.mock('lucide-react', () => ({
  AlertTriangle: () => null,
  RefreshCw: () => null,
  ChevronRight: () => null,
}));

// next/link mock (href + data-testid 등 부가 props 전달)
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { PartialSuccessBanner } from '@/app/(main)/analysis/integrated/result/[sessionId]/_components/PartialSuccessBanner';

describe('PartialSuccessBanner', () => {
  it('axesFailed 비어있으면 렌더링 안 함', () => {
    const { container } = render(
      <PartialSuccessBanner axesCompleted={['personal_color']} axesFailed={[]} />
    );
    expect(container.querySelector('[data-testid="partial-success-banner"]')).toBeNull();
  });

  it('실패 축이 있으면 배너 표시', () => {
    render(
      <PartialSuccessBanner
        axesCompleted={['personal_color', 'skin']}
        axesFailed={['body', 'hair']}
      />
    );
    expect(screen.getByTestId('partial-success-banner')).toBeInTheDocument();
    expect(screen.getByText(/일부 분석이 완료되지 않았어요/)).toBeInTheDocument();
  });

  it('실패 축 이름이 한국어로 매핑됨', () => {
    render(
      <PartialSuccessBanner axesCompleted={['personal_color']} axesFailed={['body', 'hair']} />
    );
    expect(screen.getByText(/체형, 헤어/)).toBeInTheDocument();
  });

  it('성공 축이 함께 표시됨', () => {
    render(
      <PartialSuccessBanner axesCompleted={['personal_color', 'skin']} axesFailed={['body']} />
    );
    expect(screen.getByText(/퍼스널컬러, 피부/)).toBeInTheDocument();
  });

  it('실패한 축은 개별 분석으로 다시 시도 안내 문구 표시', () => {
    render(<PartialSuccessBanner axesCompleted={['personal_color']} axesFailed={['body']} />);
    expect(screen.getByText(/실패한 축은 개별 분석으로 다시 시도해주세요/)).toBeInTheDocument();
  });

  it('실패한 각 축이 개별 분석 경로(forceNew)로 딥링크됨 (통합 재실행 아님)', () => {
    render(
      <PartialSuccessBanner axesCompleted={['personal_color']} axesFailed={['body', 'hair']} />
    );
    const bodyLink = screen.getByTestId('partial-retry-body');
    const hairLink = screen.getByTestId('partial-retry-hair');
    expect(bodyLink).toHaveAttribute('href', '/analysis/body?forceNew=true');
    expect(hairLink).toHaveAttribute('href', '/analysis/hair?forceNew=true');
    // 통합 전체 재실행(/analysis/integrated)으로 링크하지 않음
    const allLinks = screen.getAllByRole('link');
    expect(allLinks.every((l) => l.getAttribute('href') !== '/analysis/integrated')).toBe(true);
  });

  it('실패 축 개수만큼 재시도 링크가 생성됨', () => {
    render(
      <PartialSuccessBanner
        axesCompleted={['personal_color']}
        axesFailed={['skin', 'body', 'makeup']}
      />
    );
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });
});
