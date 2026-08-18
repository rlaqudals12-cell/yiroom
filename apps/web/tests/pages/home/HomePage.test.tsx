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

import { readFileSync } from 'node:fs';
import path from 'node:path';
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
import { HomeBriefingSkeleton } from '@/app/(main)/home/_components/HomeBriefingSkeleton';

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

  it('모바일에서만 솔리드 지면으로 표시된다', async () => {
    const { container } = render(await HomeHeader());

    const header = container.querySelector('header');
    expect(header).toHaveClass('md:hidden', 'bg-surface-ground', 'border-border');
    expect(header).not.toHaveClass('backdrop-blur-xl', 'bg-white/70');
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

describe('HomeBriefingSkeleton', () => {
  it('구형 대시보드 격자 대신 히어로 1개와 짧은 보조 1개만 유지한다', () => {
    render(<HomeBriefingSkeleton />);

    expect(screen.getByTestId('home-briefing-skeleton-hero')).toBeInTheDocument();
    expect(screen.getByTestId('home-briefing-skeleton-support')).toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });
});

describe('HomePage 레이아웃 계약', () => {
  it('데스크톱 본문과 라우트 로딩을 모두 진단지 읽기 폭 48rem으로 제한한다', () => {
    const pageSource = readFileSync(
      path.join(process.cwd(), 'app', '(main)', 'home', 'page.tsx'),
      'utf8'
    );
    const loadingSource = readFileSync(
      path.join(process.cwd(), 'app', '(main)', 'home', 'loading.tsx'),
      'utf8'
    );

    expect(pageSource).toContain('mx-auto w-full max-w-3xl px-4');
    expect(loadingSource).toContain('mx-auto w-full max-w-3xl px-4');
  });
});
