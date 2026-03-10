/**
 * BeautyCareTab 테스트
 * WS-3: 케어 탭 렌더링 검증
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = vi.fn();

// Mock 하위 컴포넌트
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('@/components/beauty/SkinAgeCalculator', () => ({
  SkinAgeCalculator: () => <div data-testid="skin-age-calculator" />,
}));
vi.mock('@/components/beauty/SkincareRoutineCard', () => ({
  SkincareRoutineCard: () => <div data-testid="skincare-routine-card" />,
}));

import BeautyCareTab from '@/components/beauty/BeautyCareTab';
import type { RoutineItem } from '@/types/hybrid';

const mockRouter = { push: mockPush, replace: vi.fn(), back: vi.fn() } as never;
const mockMorningRoutine: RoutineItem[] = [
  {
    order: 1,
    category: 'cleanser',
    productName: '젠틀 클렌저',
    timing: 'morning',
    duration: '1분',
  },
];
const mockEveningRoutine: RoutineItem[] = [
  {
    order: 1,
    category: 'cleanser',
    productName: '클렌징 오일',
    timing: 'evening',
    duration: '2분',
  },
];

describe('BeautyCareTab', () => {
  it('data-testid="beauty-care-tab"이 존재한다', () => {
    render(
      <BeautyCareTab
        hasAnalysis={true}
        router={mockRouter}
        morningRoutine={mockMorningRoutine}
        eveningRoutine={mockEveningRoutine}
      />
    );
    expect(screen.getByTestId('beauty-care-tab')).toBeInTheDocument();
  });

  it('hasAnalysis=true일 때 루틴 카드가 렌더링된다', () => {
    render(
      <BeautyCareTab
        hasAnalysis={true}
        router={mockRouter}
        morningRoutine={mockMorningRoutine}
        eveningRoutine={mockEveningRoutine}
      />
    );
    expect(screen.getByTestId('skincare-routine-card')).toBeInTheDocument();
  });

  it('hasAnalysis=true일 때 피부나이 계산기가 렌더링된다', () => {
    render(
      <BeautyCareTab
        hasAnalysis={true}
        router={mockRouter}
        morningRoutine={mockMorningRoutine}
        eveningRoutine={mockEveningRoutine}
      />
    );
    expect(screen.getByTestId('skin-age-calculator')).toBeInTheDocument();
  });

  it('hasAnalysis=false일 때 분석 CTA가 표시된다', () => {
    render(
      <BeautyCareTab
        hasAnalysis={false}
        router={mockRouter}
        morningRoutine={mockMorningRoutine}
        eveningRoutine={mockEveningRoutine}
      />
    );
    expect(screen.getByText(/루틴과 성분 정보를 받을 수 있어요/)).toBeInTheDocument();
    expect(screen.getByText('피부 분석하기')).toBeInTheDocument();
  });

  it('CTA 클릭 시 /onboarding/skin으로 이동한다', async () => {
    const user = userEvent.setup();
    render(
      <BeautyCareTab
        hasAnalysis={false}
        router={mockRouter}
        morningRoutine={mockMorningRoutine}
        eveningRoutine={mockEveningRoutine}
      />
    );

    await user.click(screen.getByText('피부 분석하기'));
    expect(mockPush).toHaveBeenCalledWith('/onboarding/skin');
  });

  it('이너뷰티 추천 섹션이 항상 표시된다', () => {
    render(
      <BeautyCareTab
        hasAnalysis={false}
        router={mockRouter}
        morningRoutine={mockMorningRoutine}
        eveningRoutine={mockEveningRoutine}
      />
    );
    expect(screen.getByTestId('beauty-supplements')).toBeInTheDocument();
    expect(screen.getByText('이너뷰티 추천')).toBeInTheDocument();
  });

  it('주의 성분 알림 섹션이 표시된다', () => {
    render(
      <BeautyCareTab
        hasAnalysis={false}
        router={mockRouter}
        morningRoutine={mockMorningRoutine}
        eveningRoutine={mockEveningRoutine}
      />
    );
    expect(screen.getByTestId('beauty-warnings')).toBeInTheDocument();
  });
});
