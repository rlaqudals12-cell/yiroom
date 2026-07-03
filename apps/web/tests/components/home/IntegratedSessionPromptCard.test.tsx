/**
 * IntegratedSessionPromptCard 컴포넌트 테스트
 *
 * @see app/(main)/home/_components/IntegratedSessionPromptCard.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  Sparkles: () => null,
  ChevronRight: () => null,
  Check: () => null,
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [k: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// useLatestIntegratedSession 훅 mock
const mockHookReturn = { session: null, isLoading: false, error: null } as {
  session: { id: string; axes_completed: string[] } | null;
  isLoading: boolean;
  error: Error | null;
};

vi.mock('@/hooks/useLatestIntegratedSession', () => ({
  useLatestIntegratedSession: () => mockHookReturn,
}));

import { IntegratedSessionPromptCard } from '@/app/(main)/home/_components/IntegratedSessionPromptCard';

describe('IntegratedSessionPromptCard', () => {
  beforeEach(() => {
    mockHookReturn.session = null;
    mockHookReturn.isLoading = false;
    mockHookReturn.error = null;
  });

  it('로딩 중이면 스켈레톤 렌더링', () => {
    mockHookReturn.isLoading = true;
    render(<IntegratedSessionPromptCard />);
    expect(screen.getByTestId('integrated-prompt-skeleton')).toBeInTheDocument();
  });

  it('세션 없으면 "5축 한 번에 알아보기" CTA 표시', () => {
    render(<IntegratedSessionPromptCard />);
    expect(screen.getByTestId('integrated-prompt-cta')).toBeInTheDocument();
    expect(screen.getByText(/내 정체성 5축 한 번에 알아보기/)).toBeInTheDocument();
  });

  it('세션 없으면 CTA 링크가 /analysis/integrated로', () => {
    render(<IntegratedSessionPromptCard />);
    const link = screen.getByTestId('integrated-prompt-cta');
    expect(link).toHaveAttribute('href', '/analysis/integrated');
  });

  it('세션 있으면 "최신 통합 결과 보기" 링크 표시', () => {
    mockHookReturn.session = {
      id: '7a3f1234-5678-4abc-def0-0123456789ab',
      axes_completed: ['personal_color', 'skin', 'body'],
    };
    render(<IntegratedSessionPromptCard />);
    expect(screen.getByTestId('integrated-prompt-existing')).toBeInTheDocument();
    expect(screen.getByText(/최신 통합 결과 보기/)).toBeInTheDocument();
    // "5축 중 N개 완료"는 프로필 전체 완성도(예: 5/5)와 정면 모순되어
    // 세션 커버리지 의미가 드러나는 문구로 교체 (2026-07-04)
    expect(screen.getByText(/이 결과에 3개 축이 담겨 있어요/)).toBeInTheDocument();
  });

  it('세션 있으면 링크가 /analysis/integrated/result/[id]로', () => {
    mockHookReturn.session = {
      id: '7a3f1234-5678-4abc-def0-0123456789ab',
      axes_completed: ['personal_color'],
    };
    render(<IntegratedSessionPromptCard />);
    const link = screen.getByTestId('integrated-prompt-existing');
    expect(link).toHaveAttribute(
      'href',
      '/analysis/integrated/result/7a3f1234-5678-4abc-def0-0123456789ab'
    );
  });

  it('에러 발생 시 세션 없는 경우처럼 안전하게 CTA 노출', () => {
    mockHookReturn.error = new Error('DB unreachable');
    render(<IntegratedSessionPromptCard />);
    expect(screen.getByTestId('integrated-prompt-cta')).toBeInTheDocument();
    expect(screen.queryByTestId('integrated-prompt-existing')).toBeNull();
  });
});
