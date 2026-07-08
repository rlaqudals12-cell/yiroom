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
    MessageCircle: createMockIcon('MessageCircle'),
    Sparkles: createMockIcon('Sparkles'),
    Shirt: createMockIcon('Shirt'),
    User: createMockIcon('User'),
  };
});

// next/navigation 모킹
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  usePathname: vi.fn(() => '/home'),
}));

// ADR-114: 5탭 단일 IA — [오늘][물어보기][뷰티][스타일][나]. '기록' 탭 제거(라우트 유지).
import { BottomNav } from '@/components/BottomNav';

describe('BottomNav', () => {
  it('하단 네비게이션을 렌더링한다', () => {
    render(<BottomNav />);

    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });

  it('5탭(오늘/물어보기/뷰티/스타일/나)을 표시한다', () => {
    render(<BottomNav />);

    expect(screen.getByText('오늘')).toBeInTheDocument();
    expect(screen.getByText('물어보기')).toBeInTheDocument();
    expect(screen.getByText('뷰티')).toBeInTheDocument();
    expect(screen.getByText('스타일')).toBeInTheDocument();
    expect(screen.getByText('나')).toBeInTheDocument();
  });

  it('물어보기 탭이 가운데(3번째)에 위치한다', () => {
    render(<BottomNav />);

    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(5);
    expect(items[2]).toHaveAttribute('href', '/coach');
  });

  it("'기록' 탭은 노출되지 않는다 (ADR-114)", () => {
    render(<BottomNav />);

    expect(screen.queryByText('기록')).not.toBeInTheDocument();
  });

  it('각 링크가 올바른 href를 가진다', () => {
    render(<BottomNav />);

    // role="menuitem"으로 접근성 지원
    expect(screen.getByRole('menuitem', { name: /오늘/ })).toHaveAttribute('href', '/home');
    expect(screen.getByRole('menuitem', { name: /물어보기/ })).toHaveAttribute('href', '/coach');
    expect(screen.getByRole('menuitem', { name: /뷰티/ })).toHaveAttribute('href', '/beauty');
    expect(screen.getByRole('menuitem', { name: /스타일/ })).toHaveAttribute('href', '/style');
    expect(screen.getByRole('menuitem', { name: /나/ })).toHaveAttribute('href', '/profile');
  });

  it('현재 경로에 해당하는 링크가 활성화 스타일을 가진다', () => {
    render(<BottomNav />);

    // /home 경로에서 '오늘' 링크가 활성화됨
    const todayLink = screen.getByRole('menuitem', { name: /오늘/ });
    expect(todayLink).toHaveClass('text-primary');
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

  it('/coach 경로에서 물어보기 탭이 활성화된다', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/coach');

    render(<BottomNav />);

    const coachLink = screen.getByRole('menuitem', { name: /물어보기/ });
    expect(coachLink).toHaveClass('text-primary');
  });

  it('/profile 경로에서 나 탭이 활성화된다', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/profile');

    render(<BottomNav />);

    const profileLink = screen.getByRole('menuitem', { name: /나/ });
    expect(profileLink).toHaveClass('text-primary');
  });
});
