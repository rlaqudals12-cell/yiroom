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

// i18n 배선 후 서버 컴포넌트는 async — next-intl 목이 t(key)=>key 반환하므로 키 문자열로 검증.
describe('PartialSuccessBanner', () => {
  it('axesFailed 비어있으면 렌더링 안 함', async () => {
    const { container } = render(
      await PartialSuccessBanner({ axesCompleted: ['personal_color'], axesFailed: [] })
    );
    expect(container.querySelector('[data-testid="partial-success-banner"]')).toBeNull();
  });

  it('실패 축이 있으면 배너 표시', async () => {
    render(
      await PartialSuccessBanner({
        axesCompleted: ['personal_color', 'skin'],
        axesFailed: ['body', 'hair'],
      })
    );
    expect(screen.getByTestId('partial-success-banner')).toBeInTheDocument();
    expect(screen.getByText('partialSuccess.title')).toBeInTheDocument();
  });

  it('실패 축 이름이 i18n 키로 매핑됨', async () => {
    render(
      await PartialSuccessBanner({
        axesCompleted: ['personal_color'],
        axesFailed: ['body', 'hair'],
      })
    );
    expect(screen.getByText(/axes\.body, axes\.hair/)).toBeInTheDocument();
  });

  it('성공 축이 함께 표시됨', async () => {
    render(
      await PartialSuccessBanner({
        axesCompleted: ['personal_color', 'skin'],
        axesFailed: ['body'],
      })
    );
    expect(screen.getByText(/axes\.personalColor, axes\.skin/)).toBeInTheDocument();
  });

  it('실패한 축은 개별 분석으로 다시 시도 안내 문구(키) 표시', async () => {
    render(await PartialSuccessBanner({ axesCompleted: ['personal_color'], axesFailed: ['body'] }));
    expect(screen.getByText('partialSuccess.retryHint')).toBeInTheDocument();
  });

  it('실패한 각 축이 개별 분석 경로(forceNew)로 딥링크됨 (통합 재실행 아님)', async () => {
    render(
      await PartialSuccessBanner({
        axesCompleted: ['personal_color'],
        axesFailed: ['body', 'hair'],
      })
    );
    const bodyLink = screen.getByTestId('partial-retry-body');
    const hairLink = screen.getByTestId('partial-retry-hair');
    expect(bodyLink).toHaveAttribute('href', '/analysis/body?forceNew=true');
    expect(hairLink).toHaveAttribute('href', '/analysis/hair?forceNew=true');
    // 통합 전체 재실행(/analysis/integrated)으로 링크하지 않음
    const allLinks = screen.getAllByRole('link');
    expect(allLinks.every((l) => l.getAttribute('href') !== '/analysis/integrated')).toBe(true);
  });

  it('실패 축 개수만큼 재시도 링크가 생성됨', async () => {
    render(
      await PartialSuccessBanner({
        axesCompleted: ['personal_color'],
        axesFailed: ['skin', 'body', 'makeup'],
      })
    );
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });
});
