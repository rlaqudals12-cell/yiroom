import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Next.js Link mock
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { vi } from 'vitest';
import QuickActionCard from '@/components/workout/common/QuickActionCard';

describe('QuickActionCard', () => {
  const defaultProps = {
    icon: <span data-testid="test-icon">icon</span>,
    label: '운동 기록',
    href: '/workout/history',
  };

  it('라벨을 표시한다', () => {
    render(<QuickActionCard {...defaultProps} />);
    expect(screen.getByText('운동 기록')).toBeInTheDocument();
  });

  it('아이콘을 렌더링한다', () => {
    render(<QuickActionCard {...defaultProps} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('올바른 href로 링크를 생성한다', () => {
    render(<QuickActionCard {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/workout/history');
  });

  it('접근성 aria-label을 포함한다', () => {
    render(<QuickActionCard {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', '운동 기록 페이지로 이동');
  });

  it('추가 className을 적용한다', () => {
    render(<QuickActionCard {...defaultProps} className="custom-class" />);
    const link = screen.getByRole('link');
    expect(link.className).toContain('custom-class');
  });

  it('기본 className이 빈 문자열이다', () => {
    render(<QuickActionCard {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link.className).toContain('bg-card');
  });
});
