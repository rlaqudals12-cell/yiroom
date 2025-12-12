/**
 * EmptyState 컴포넌트 테스트
 * @description 대시보드 빈 상태 컴포넌트 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '@/app/(main)/dashboard/_components/EmptyState';

// next/link mock
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}));

describe('EmptyState', () => {
  it('빈 상태 메시지를 렌더링한다', () => {
    render(<EmptyState />);

    expect(screen.getByText('아직 분석 결과가 없어요')).toBeInTheDocument();
  });

  it('퍼스널 컬러 진단 권유 메시지를 표시한다', () => {
    render(<EmptyState />);

    expect(screen.getByText(/퍼스널 컬러 진단을 먼저 진행하면/)).toBeInTheDocument();
    expect(screen.getByText(/더 정확한 추천을 받을 수 있어요/)).toBeInTheDocument();
  });

  it('퍼스널 컬러 진단 시작 버튼을 렌더링한다', () => {
    render(<EmptyState />);

    expect(screen.getByRole('button', { name: /퍼스널 컬러 진단 시작하기/ })).toBeInTheDocument();
  });

  it('퍼스널 컬러 진단 페이지로 링크된다', () => {
    render(<EmptyState />);

    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/analysis/personal-color');
  });
});
