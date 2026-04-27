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

// next/link mock (Link가 href만 사용)
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
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

  it('"다시 시도" 버튼이 /analysis/integrated로 링크됨', () => {
    render(<PartialSuccessBanner axesCompleted={['personal_color']} axesFailed={['body']} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/analysis/integrated');
  });
});
