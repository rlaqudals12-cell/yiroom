/**
 * Home 페이지 서브 컴포넌트 테스트
 * /home
 *
 * page.tsx는 async Server Component이므로
 * 개별 서브 컴포넌트를 직접 테스트한다.
 *
 * - HomeHeader: 이룸 로고, 알림/검색 링크
 * - HomeGreeting: 시간 기반 인사말
 * - HomeTodayRecommendation: 오늘의 추천 (뷰티/스타일)
 *
 * Phase 5 i18n 적용 후: 컴포넌트가 useTranslations/getTranslations를 사용하므로
 * 테스트에서는 i18n 키 이름으로 검증한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => ({
    push: mockPush,
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
import HomeTodayRecommendation from '@/app/(main)/home/_components/HomeTodayRecommendation';

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

describe('HomeTodayRecommendation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('오늘의 추천 섹션이 표시된다', () => {
    render(<HomeTodayRecommendation />);

    expect(screen.getByText('todayRecommendation')).toBeInTheDocument();
  });

  it('피부 맞춤 추천 버튼이 표시된다', () => {
    render(<HomeTodayRecommendation />);

    expect(screen.getByText('skinCustom')).toBeInTheDocument();
    expect(screen.getByText('skincareRecommend')).toBeInTheDocument();
  });

  it('체형 맞춤 추천 버튼이 표시된다', () => {
    render(<HomeTodayRecommendation />);

    expect(screen.getByText('bodyCustom')).toBeInTheDocument();
    expect(screen.getByText('outfitRecommend')).toBeInTheDocument();
  });

  it('피부 맞춤 버튼 클릭 시 /beauty로 이동한다', async () => {
    const user = userEvent.setup();
    render(<HomeTodayRecommendation />);

    const beautyButton = screen.getByRole('button', { name: /skinRecommendLabel/ });
    await user.click(beautyButton);

    expect(mockPush).toHaveBeenCalledWith('/beauty');
  });

  it('체형 맞춤 버튼 클릭 시 /style로 이동한다', async () => {
    const user = userEvent.setup();
    render(<HomeTodayRecommendation />);

    const styleButton = screen.getByRole('button', { name: /bodyRecommendLabel/ });
    await user.click(styleButton);

    expect(mockPush).toHaveBeenCalledWith('/style');
  });

  it('추천 섹션에 aria-label이 있다', () => {
    render(<HomeTodayRecommendation />);

    expect(screen.getByRole('region', { name: /todayRecommendationLabel/ })).toBeInTheDocument();
  });

  it('아이콘에 aria-hidden이 적용되어 있다', () => {
    const { container } = render(<HomeTodayRecommendation />);

    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });
});
