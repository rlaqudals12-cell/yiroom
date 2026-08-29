/**
 * IntegratedSessionPromptCard 컴포넌트 테스트
 *
 * @see app/(main)/home/_components/IntegratedSessionPromptCard.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  // 톤 정합 스윕(7/23): 장식 Sparkles → Palette(기능 아이콘)로 교체됨
  Palette: () => null,
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

  it('독립형 스켈레톤도 다크 섬 없이 시맨틱 지면 토큰을 쓴다', () => {
    mockHookReturn.isLoading = true;
    render(<IntegratedSessionPromptCard />);

    const skeleton = screen.getByTestId('integrated-prompt-skeleton');
    expect(skeleton).toHaveClass('border-border', 'bg-secondary/50');
    expect(skeleton.className).not.toMatch(/zinc|bg-white/);
  });

  it('세션 없으면 "5가지 한 번에 알아보기" CTA 표시', () => {
    render(<IntegratedSessionPromptCard />);
    expect(screen.getByTestId('integrated-prompt-cta')).toBeInTheDocument();
    expect(screen.getByText(/내 정체성 5가지 한 번에 알아보기/)).toBeInTheDocument();
  });

  it('세션 없으면 CTA 링크가 /analysis/integrated로', () => {
    render(<IntegratedSessionPromptCard />);
    const link = screen.getByTestId('integrated-prompt-cta');
    expect(link).toHaveAttribute('href', '/analysis/integrated');
  });

  it('홈의 접힌 후속 영역에서는 브랜드 CTA 색을 제거한 embedded 표현을 쓴다', () => {
    render(<IntegratedSessionPromptCard embedded />);
    const link = screen.getByTestId('integrated-prompt-cta');

    expect(link).toHaveClass('bg-secondary/40');
    expect(link).not.toHaveClass('bg-primary');
  });

  it('세션 있으면 "내 정체성 카드·리포트 보기" 링크 표시 (카드 존재를 라벨이 알림 — 7/18 발견성 감사)', () => {
    mockHookReturn.session = {
      id: '7a3f1234-5678-4abc-def0-0123456789ab',
      axes_completed: ['personal_color', 'skin', 'body'],
    };
    render(<IntegratedSessionPromptCard />);
    expect(screen.getByTestId('integrated-prompt-existing')).toBeInTheDocument();
    expect(screen.getByText(/내 정체성 카드·리포트 보기/)).toBeInTheDocument();
    // "5축 중 N개 완료"(프로필 완성도와 모순) → "N개 축"(개발 용어) →
    // 담긴 분석을 구체적으로 나열 (2026-07-06, 사용자 용어 피드백)
    expect(screen.getByText(/퍼스널컬러·피부·체형 분석이 담겨 있어요/)).toBeInTheDocument();
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

  it('기존 세션 링크는 하드코딩 핑크 대신 시맨틱 토큰을 쓴다', () => {
    mockHookReturn.session = {
      id: '7a3f1234-5678-4abc-def0-0123456789ab',
      axes_completed: ['personal_color'],
    };
    render(<IntegratedSessionPromptCard />);

    const link = screen.getByTestId('integrated-prompt-existing');
    expect(link).toHaveClass('border-border', 'bg-card');
    expect(link.className).not.toContain('pink');
  });

  it('에러 발생 시 세션 없는 경우처럼 안전하게 CTA 노출', () => {
    mockHookReturn.error = new Error('DB unreachable');
    render(<IntegratedSessionPromptCard />);
    expect(screen.getByTestId('integrated-prompt-cta')).toBeInTheDocument();
    expect(screen.queryByTestId('integrated-prompt-existing')).toBeNull();
  });
});
