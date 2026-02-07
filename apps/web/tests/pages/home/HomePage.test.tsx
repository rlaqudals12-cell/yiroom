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

import { HomeHeader } from '@/app/(main)/home/_components/HomeHeader';
import { HomeGreeting } from '@/app/(main)/home/_components/HomeGreeting';
import HomeTodayRecommendation from '@/app/(main)/home/_components/HomeTodayRecommendation';

describe('HomeHeader', () => {
  it('이룸 로고가 표시된다', () => {
    render(<HomeHeader />);

    expect(screen.getByText('이룸')).toBeInTheDocument();
  });

  it('알림 링크에 aria-label이 있다', () => {
    render(<HomeHeader />);

    const notificationLink = screen.getByRole('link', { name: /알림 확인/ });
    expect(notificationLink).toBeInTheDocument();
    expect(notificationLink).toHaveAttribute('href', '/notifications');
  });

  it('검색 링크에 aria-label이 있다', () => {
    render(<HomeHeader />);

    const searchLink = screen.getByRole('link', { name: /검색 페이지로 이동/ });
    expect(searchLink).toBeInTheDocument();
    expect(searchLink).toHaveAttribute('href', '/search');
  });

  it('아이콘에 aria-hidden이 적용되어 있다', () => {
    const { container } = render(<HomeHeader />);

    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });
});

describe('HomeGreeting', () => {
  it('사용자 이름이 인사말에 표시된다', () => {
    render(<HomeGreeting userName="테스터" />);

    expect(screen.getByText(/테스터님/)).toBeInTheDocument();
  });

  it('시간 기반 인사말이 표시된다', () => {
    render(<HomeGreeting userName="회원" />);

    const greetings = ['좋은 아침이에요', '좋은 오후예요', '좋은 저녁이에요', '좋은 밤이에요'];
    const hasGreeting = greetings.some((greeting) => screen.queryByText(new RegExp(greeting)));

    expect(hasGreeting).toBe(true);
  });

  it('서브 메시지가 표시된다', () => {
    render(<HomeGreeting userName="회원" />);

    expect(screen.getByText(/오늘도 나다운 하루/)).toBeInTheDocument();
  });
});

describe('HomeTodayRecommendation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('오늘의 추천 섹션이 표시된다', () => {
    render(<HomeTodayRecommendation />);

    expect(screen.getByText('오늘의 추천')).toBeInTheDocument();
  });

  it('피부 맞춤 추천 버튼이 표시된다', () => {
    render(<HomeTodayRecommendation />);

    expect(screen.getByText('피부 맞춤')).toBeInTheDocument();
    expect(screen.getByText('스킨케어 추천')).toBeInTheDocument();
  });

  it('체형 맞춤 추천 버튼이 표시된다', () => {
    render(<HomeTodayRecommendation />);

    expect(screen.getByText('체형 맞춤')).toBeInTheDocument();
    expect(screen.getByText('코디 추천')).toBeInTheDocument();
  });

  it('피부 맞춤 버튼 클릭 시 /beauty로 이동한다', async () => {
    const user = userEvent.setup();
    render(<HomeTodayRecommendation />);

    const beautyButton = screen.getByRole('button', { name: /피부 맞춤 제품 추천 보기/ });
    await user.click(beautyButton);

    expect(mockPush).toHaveBeenCalledWith('/beauty');
  });

  it('체형 맞춤 버튼 클릭 시 /style로 이동한다', async () => {
    const user = userEvent.setup();
    render(<HomeTodayRecommendation />);

    const styleButton = screen.getByRole('button', { name: /체형 맞춤 코디 추천 보기/ });
    await user.click(styleButton);

    expect(mockPush).toHaveBeenCalledWith('/style');
  });

  it('추천 섹션에 aria-label이 있다', () => {
    render(<HomeTodayRecommendation />);

    expect(screen.getByRole('region', { name: /오늘의 맞춤 추천/ })).toBeInTheDocument();
  });

  it('아이콘에 aria-hidden이 적용되어 있다', () => {
    const { container } = render(<HomeTodayRecommendation />);

    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });
});
