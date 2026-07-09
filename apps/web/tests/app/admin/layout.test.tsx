/**
 * 관리자 레이아웃 게이팅 테스트
 * - 비관리자/비로그인 접근 시 홈으로 리다이렉트되는지 검증 (보안)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Mock next/navigation redirect — 호출 시 렌더를 중단시키기 위해 throw
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

// Mock admin 인증 유틸
vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
  getAdminInfo: vi.fn(),
}));

// Mock 사이드바 (Clerk/DB 의존 제거)
vi.mock('@/app/admin/_components/AdminSidebar', () => ({
  AdminSidebar: () => <aside data-testid="admin-sidebar">Sidebar</aside>,
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

import AdminLayout from '@/app/admin/layout';
import { isAdmin, getAdminInfo } from '@/lib/admin';
import { redirect } from 'next/navigation';

describe('AdminLayout 게이팅', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('비관리자는 홈(/)으로 리다이렉트된다', async () => {
    vi.mocked(isAdmin).mockResolvedValue(false);
    vi.mocked(getAdminInfo).mockResolvedValue(null);

    // redirect가 throw하도록 모킹했으므로 렌더 시도가 에러로 중단됨
    await expect(
      (async () => {
        const ui = await AdminLayout({ children: <div>secret</div> });
        render(ui);
      })()
    ).rejects.toThrow('REDIRECT:/');

    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('관리자는 리다이렉트 없이 콘텐츠가 렌더된다', async () => {
    vi.mocked(isAdmin).mockResolvedValue(true);
    vi.mocked(getAdminInfo).mockResolvedValue({
      id: 'user_admin',
      email: 'admin@example.com',
      name: '관리자',
      role: 'admin',
      imageUrl: null,
    } as never);

    const ui = await AdminLayout({ children: <div data-testid="admin-child">secret</div> });
    const { getByTestId } = render(ui);

    expect(redirect).not.toHaveBeenCalled();
    expect(getByTestId('admin-child')).toBeInTheDocument();
    expect(getByTestId('admin-sidebar')).toBeInTheDocument();
  });
});
