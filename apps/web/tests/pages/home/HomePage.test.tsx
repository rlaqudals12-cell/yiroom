/**
 * Home 페이지 서브 컴포넌트 테스트
 * /home
 *
 * page.tsx는 async Server Component이므로
 * 개별 서브 컴포넌트를 직접 테스트한다.
 *
 * - HomeHeader: 이룸 로고, 알림/검색 링크
 * - HomeGreeting: 시간 기반 인사말
 *
 * (HomeTodayRecommendation은 ADR-098 후속 정리에서 orphan 제거됨)
 *
 * Phase 5 i18n 적용 후: 컴포넌트가 useTranslations/getTranslations를 사용하므로
 * 테스트에서는 i18n 키 이름으로 검증한다.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock useAnalysisStatus hook
vi.mock('@/hooks/useAnalysisStatus', () => ({
  useAnalysisStatus: () => ({
    isLoading: false,
    isNewUser: false,
    analyses: {
      personalColor: { id: '1', season: 'spring' },
      skin: { id: '2' },
      body: { id: '3' },
    },
  }),
}));

// Mock timezone utils (HomeGreeting에서 사용)
vi.mock('@/lib/utils/timezone', () => ({
  getUserTimezone: () => Promise.resolve('Asia/Seoul'),
  getCurrentHourInTimezone: () => 10, // 오전 10시 → morningGreeting
}));

import { HomeHeader } from '@/app/(main)/home/_components/HomeHeader';
import { HomeGreeting } from '@/app/(main)/home/_components/HomeGreeting';

describe('HomeHeader', () => {
  it('브랜드명이 표시된다', async () => {
    render(await HomeHeader());

    expect(screen.getByText('brandName')).toBeInTheDocument();
  });

  it('알림 링크에 aria-label이 있다', async () => {
    render(await HomeHeader());

    const notificationLink = screen.getByRole('link', { name: /notificationLabel/ });
    expect(notificationLink).toBeInTheDocument();
    expect(notificationLink).toHaveAttribute('href', '/notifications');
  });

  it('검색 링크에 aria-label이 있다', async () => {
    render(await HomeHeader());

    const searchLink = screen.getByRole('link', { name: /searchLabel/ });
    expect(searchLink).toBeInTheDocument();
    expect(searchLink).toHaveAttribute('href', '/search');
  });

  it('아이콘에 aria-hidden이 적용되어 있다', async () => {
    const { container } = render(await HomeHeader());

    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });
});

describe('HomeGreeting', () => {
  it('인사말 키가 렌더링된다', async () => {
    render(await HomeGreeting({ userName: '테스터' }));

    // getTranslations mock → t(key) returns key
    expect(screen.getByText(/morningGreeting/)).toBeInTheDocument();
  });

  it('인사말 suffix가 렌더링된다', async () => {
    render(await HomeGreeting({ userName: '테스터' }));

    expect(screen.getByText(/greetingSuffix/)).toBeInTheDocument();
  });

  it('서브 메시지가 표시된다', async () => {
    render(await HomeGreeting({ userName: '회원' }));

    expect(screen.getByText('dailyMotivation')).toBeInTheDocument();
  });
});
