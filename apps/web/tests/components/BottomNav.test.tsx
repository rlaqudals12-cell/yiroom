import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// lucide-react 아이콘 mock
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    ...actual,
    Home: createMockIcon('Home'),
    Sparkles: createMockIcon('Sparkles'),
    Shirt: createMockIcon('Shirt'),
    ClipboardList: createMockIcon('ClipboardList'),
    User: createMockIcon('User'),
  };
});

// next/navigation 모킹
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/home'),
}));

import { BottomNav } from '@/components/BottomNav';

describe('BottomNav', () => {
  it('하단 네비게이션을 렌더링한다', () => {
    render(<BottomNav />);

    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });

  it('5개의 네비게이션 링크를 표시한다', () => {
    render(<BottomNav />);

    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('뷰티')).toBeInTheDocument();
    expect(screen.getByText('스타일')).toBeInTheDocument();
    expect(screen.getByText('기록')).toBeInTheDocument();
    expect(screen.getByText('나')).toBeInTheDocument();
  });

  it('각 링크가 올바른 href를 가진다', () => {
    render(<BottomNav />);

    // role="menuitem"으로 접근성 지원
    expect(screen.getByRole('menuitem', { name: /홈/ })).toHaveAttribute('href', '/home');
    expect(screen.getByRole('menuitem', { name: /뷰티/ })).toHaveAttribute('href', '/beauty');
    expect(screen.getByRole('menuitem', { name: /스타일/ })).toHaveAttribute('href', '/style');
    expect(screen.getByRole('menuitem', { name: /기록/ })).toHaveAttribute('href', '/record');
    expect(screen.getByRole('menuitem', { name: /나/ })).toHaveAttribute('href', '/profile');
  });

  it('현재 경로에 해당하는 링크가 활성화 스타일을 가진다', () => {
    render(<BottomNav />);

    // /home 경로에서 홈 링크가 활성화됨
    const homeLink = screen.getByRole('menuitem', { name: /홈/ });
    expect(homeLink).toHaveClass('text-primary');
  });
});

describe('BottomNav 경로 매칭', () => {
  it('/beauty 경로에서 뷰티 탭이 활성화된다', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/beauty');

    render(<BottomNav />);

    const beautyLink = screen.getByRole('menuitem', { name: /뷰티/ });
    expect(beautyLink).toHaveClass('text-primary');
  });

  it('/style 하위 경로에서 스타일 탭이 활성화된다', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/style/outfit');

    render(<BottomNav />);

    const styleLink = screen.getByRole('menuitem', { name: /스타일/ });
    expect(styleLink).toHaveClass('text-primary');
  });

  it('/record 경로에서 기록 탭이 활성화된다', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/record');

    render(<BottomNav />);

    const recordLink = screen.getByRole('menuitem', { name: /기록/ });
    expect(recordLink).toHaveClass('text-primary');
  });

  it('/profile 경로에서 나 탭이 활성화된다', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/profile');

    render(<BottomNav />);

    const profileLink = screen.getByRole('menuitem', { name: /나/ });
    expect(profileLink).toHaveClass('text-primary');
  });
});
