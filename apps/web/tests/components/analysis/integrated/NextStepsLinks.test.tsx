/**
 * NextStepsLinks 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  ChevronRight: () => null,
  Palette: () => null,
  Sparkles: () => null,
  Shirt: () => null,
  Scissors: () => null,
  Brush: () => null,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { NextStepsLinks } from '@/app/(main)/analysis/integrated/result/[sessionId]/_components/NextStepsLinks';

describe('NextStepsLinks', () => {
  it('완료된 축이 없으면 null 반환', () => {
    const { container } = render(<NextStepsLinks axesCompleted={[]} />);
    expect(container.querySelector('[data-testid="next-steps-links"]')).toBeNull();
  });

  it('완료된 축만 CTA 표시 (PC만 성공)', () => {
    render(<NextStepsLinks axesCompleted={['personal_color']} />);
    expect(screen.getByText(/내 색 기반 화장품 보기/)).toBeInTheDocument();
    expect(screen.queryByText(/스킨케어 루틴/)).toBeNull();
  });

  it('여러 축 성공 시 여러 링크 표시', () => {
    render(<NextStepsLinks axesCompleted={['personal_color', 'skin', 'body']} />);
    expect(screen.getByText(/내 색 기반 화장품 보기/)).toBeInTheDocument();
    expect(screen.getByText(/피부 타입 맞춤 추천/)).toBeInTheDocument();
    expect(screen.getByText(/체형별 코디 가이드/)).toBeInTheDocument();
  });

  it('헤어 성공 시 헤어 페이지로 링크', () => {
    render(<NextStepsLinks axesCompleted={['hair']} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/analysis/hair');
  });

  it('메이크업 성공 시 메이크업 튜토리얼 링크', () => {
    render(<NextStepsLinks axesCompleted={['makeup']} />);
    expect(screen.getByText(/메이크업 튜토리얼/)).toBeInTheDocument();
  });
});
