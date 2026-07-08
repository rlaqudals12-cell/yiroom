/**
 * Navbar — 5탭 단일 IA (ADR-114)
 * 데스크톱 메뉴가 모바일 BottomNav와 동일한 표면인지, 이중 IA 잔재(분석 드롭다운·
 * 대시보드·제품·캡슐)가 제거됐는지 검증한다.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Clerk — 로그인 상태를 가정 (SignedIn children 렌더)
vi.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: () => null,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  UserButton: () => <div data-testid="user-button" />,
}));

// next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

// ThemeToggle은 ThemeProvider 컨텍스트가 필요 → 스텁
vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

// next-intl은 setup.ts에서 t(key)=>key로 모킹됨 → 라벨은 키 문자열로 렌더
import Navbar from '@/components/Navbar';

describe('Navbar — 5탭 단일 IA (ADR-114)', () => {
  it('데스크톱 메뉴가 오늘/물어보기/뷰티/스타일 4링크 + 프로필(나)로 구성된다', () => {
    render(<Navbar />);

    // 메인 nav 4항목 (t(key)=>key 이므로 접근성 이름이 키 문자열)
    expect(screen.getByRole('link', { name: 'today' })).toHaveAttribute('href', '/home');
    expect(screen.getByRole('link', { name: 'coach' })).toHaveAttribute('href', '/coach');
    expect(screen.getByRole('link', { name: 'beauty' })).toHaveAttribute('href', '/beauty');
    expect(screen.getByRole('link', { name: 'style' })).toHaveAttribute('href', '/style');

    // [나] = 우측 프로필 아바타 클러스터 (중복 방지)
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'me' })).toHaveAttribute('href', '/profile');
  });

  it('이중 IA 잔재(분석 드롭다운·대시보드·제품·캡슐 진입점)가 제거됐다', () => {
    render(<Navbar />);

    const hrefs = screen
      .getAllByRole('link')
      .map((el) => el.getAttribute('href'))
      .filter(Boolean) as string[];

    // 분석 개별/통합·대시보드·제품·캡슐은 네비에서 사라짐 (5탭 표면 안에서 도달)
    expect(hrefs.some((h) => h.startsWith('/analysis'))).toBe(false);
    expect(hrefs).not.toContain('/dashboard');
    expect(hrefs).not.toContain('/products');
    expect(hrefs).not.toContain('/capsule');
  });

  it('우측 유틸(위시리스트)은 유지된다', () => {
    render(<Navbar />);
    expect(screen.getByRole('link', { name: 'wishlist' })).toHaveAttribute('href', '/wishlist');
  });
});
