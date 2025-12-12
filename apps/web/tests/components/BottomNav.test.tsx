import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNav } from '@/components/BottomNav';

// next/navigation 모킹
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}));

describe('BottomNav', () => {
  it('하단 네비게이션을 렌더링한다', () => {
    render(<BottomNav />);

    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });

  it('4개의 네비게이션 링크를 표시한다', () => {
    render(<BottomNav />);

    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('영양')).toBeInTheDocument();
    expect(screen.getByText('운동')).toBeInTheDocument();
    expect(screen.getByText('리포트')).toBeInTheDocument();
  });

  it('각 링크가 올바른 href를 가진다', () => {
    render(<BottomNav />);

    // role="menuitem"으로 변경됨 (접근성 개선)
    expect(screen.getByRole('menuitem', { name: /홈/ })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('menuitem', { name: /영양/ })).toHaveAttribute('href', '/nutrition');
    expect(screen.getByRole('menuitem', { name: /운동/ })).toHaveAttribute('href', '/workout');
    expect(screen.getByRole('menuitem', { name: /리포트/ })).toHaveAttribute('href', '/reports');
  });

  it('현재 경로에 해당하는 링크가 활성화 스타일을 가진다', () => {
    render(<BottomNav />);

    // /dashboard 경로에서 홈 링크가 활성화됨
    const homeLink = screen.getByRole('menuitem', { name: /홈/ });
    expect(homeLink).toHaveClass('text-primary');
  });
});

describe('BottomNav 경로 매칭', () => {
  it('/nutrition 경로에서 영양 탭이 활성화된다', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/nutrition');

    render(<BottomNav />);

    // 영양 링크 확인 (role="menuitem")
    const nutritionLink = screen.getByRole('menuitem', { name: /영양/ });
    expect(nutritionLink).toHaveClass('text-primary');
  });

  it('/workout 하위 경로에서 운동 탭이 활성화된다', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/workout/session');

    render(<BottomNav />);

    const workoutLink = screen.getByRole('menuitem', { name: /운동/ });
    expect(workoutLink).toHaveClass('text-primary');
  });

  it('/reports 하위 경로에서 리포트 탭이 활성화된다', async () => {
    const { usePathname } = await import('next/navigation');
    vi.mocked(usePathname).mockReturnValue('/reports/weekly/2024-01-01');

    render(<BottomNav />);

    const reportsLink = screen.getByRole('menuitem', { name: /리포트/ });
    expect(reportsLink).toHaveClass('text-primary');
  });
});
