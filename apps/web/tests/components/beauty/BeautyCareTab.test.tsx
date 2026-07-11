/**
 * BeautyCareTab 테스트
 * WS-3: 케어 탭 렌더링 검증
 * 감사 수리(2026-07-08): 피부나이 계산기 = 실지표(skinMetrics) + 사용자 입력 나이 기반으로 변경
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
// 이너뷰티 실제품 컴포넌트 — 자체 Supabase 조회가 있어 목킹
vi.mock('@/components/beauty/InnerBeautySupplements', () => ({
  InnerBeautySupplements: () => <div data-testid="inner-beauty-supplements" />,
}));

import BeautyCareTab from '@/components/beauty/BeautyCareTab';
import type { SkinAgeMetrics } from '@/components/beauty/SkinAgeCalculator';
import type { RoutineItem } from '@/types/hybrid';

const mockRouter = { push: mockPush, replace: vi.fn(), back: vi.fn() } as never;
const mockMorningRoutine: RoutineItem[] = [
  {
    order: 1,
    category: 'cleanser',
    note: '노폐물 제거',
    timing: 'morning',
    duration: '1분',
  },
];
const mockEveningRoutine: RoutineItem[] = [
  {
    order: 1,
    category: 'cleanser',
    note: '메이크업 클렌징',
    timing: 'evening',
    duration: '2분',
  },
];
const mockSkinMetrics: SkinAgeMetrics = {
  hydration: 72,
  oil: 45,
  wrinkles: 25,
  pores: 35,
  pigmentation: 30,
};

function renderTab(overrides: Partial<React.ComponentProps<typeof BeautyCareTab>> = {}) {
  return render(
    <BeautyCareTab
      hasAnalysis={true}
      router={mockRouter}
      morningRoutine={mockMorningRoutine}
      eveningRoutine={mockEveningRoutine}
      skinMetrics={mockSkinMetrics}
      {...overrides}
    />
  );
}

describe('BeautyCareTab', () => {
  it('data-testid="beauty-care-tab"이 존재한다', () => {
    renderTab();
    expect(screen.getByTestId('beauty-care-tab')).toBeInTheDocument();
  });

  it('hasAnalysis=true일 때 루틴 카드가 렌더링된다', () => {
    renderTab();
    expect(screen.getByTestId('skincare-routine-card')).toBeInTheDocument();
  });

  it('실지표가 있으면 나이 입력 필드가 표시되고, 나이 입력 시 계산기가 렌더링된다', async () => {
    const user = userEvent.setup();
    renderTab();

    // 나이 입력 전에는 계산기 미표시 (가짜 기본 나이 없음)
    expect(screen.queryByTestId('skin-age-calculator')).not.toBeInTheDocument();

    const ageInput = screen.getByTestId('skin-age-input');
    await user.type(ageInput, '28');

    expect(screen.getByTestId('skin-age-calculator')).toBeInTheDocument();
  });

  it('실지표·종합점수 둘 다 없으면 계산기 대신 안내가 표시된다', () => {
    renderTab({ skinMetrics: null, skinOverallScore: null });

    expect(screen.queryByTestId('skin-age-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('skin-age-calculator')).not.toBeInTheDocument();
    expect(screen.getByTestId('beauty-skin-age')).toBeInTheDocument();
    expect(screen.getByText(/피부나이를 알려드려요/)).toBeInTheDocument();
  });

  it('세부 지표가 없어도 종합 점수가 있으면 계산기를 제공한다 (통합 분석 경로 대응)', async () => {
    const user = userEvent.setup();
    renderTab({ skinMetrics: null, skinOverallScore: 70 });

    const ageInput = screen.getByTestId('skin-age-input');
    await user.type(ageInput, '28');

    expect(screen.getByTestId('skin-age-calculator')).toBeInTheDocument();
  });

  it('hasAnalysis=false일 때 분석 CTA가 표시된다', () => {
    renderTab({ hasAnalysis: false, skinMetrics: null });
    expect(screen.getByText(/루틴과 성분 정보를 받을 수 있어요/)).toBeInTheDocument();
    expect(screen.getByText('피부 분석하기')).toBeInTheDocument();
  });

  // 배치 IA-3: 미분석 첫 진입은 통합분석("첫 미팅")으로 통일 — 개별 축 단독 진입 금지(재발 방지)
  it('미분석 CTA 클릭 시 /analysis/integrated로 이동한다', async () => {
    const user = userEvent.setup();
    renderTab({ hasAnalysis: false, skinMetrics: null });

    // 이 파일은 mockPush를 초기화하지 않으므로(누적) 클릭 직전에 비워 이 테스트 범위로 한정
    mockPush.mockClear();
    await user.click(screen.getByText('피부 분석하기'));
    expect(mockPush).toHaveBeenCalledWith('/analysis/integrated');
    expect(mockPush).not.toHaveBeenCalledWith('/analysis/skin');
  });

  it('주의 성분 확인 버튼이 최신 피부 분석 결과(성분 경고 표시 위치)로 딥링크된다', async () => {
    const user = userEvent.setup();
    renderTab({ skinAnalysisId: 'skin-abc-123' });

    await user.click(screen.getByText(/내 분석 결과에서 확인하기/));
    expect(mockPush).toHaveBeenCalledWith('/analysis/skin/result/skin-abc-123');
  });

  it('분석 id가 없으면 주의 성분 버튼이 피부 분석 시작으로 폴백한다 (ADR-111: 허브 폐지)', async () => {
    const user = userEvent.setup();
    renderTab({ skinAnalysisId: null });

    await user.click(screen.getByText(/내 분석 결과에서 확인하기/));
    expect(mockPush).toHaveBeenCalledWith('/analysis/skin');
  });

  it('이너뷰티 추천 섹션이 항상 표시되고 실제품 컴포넌트가 마운트된다', () => {
    renderTab({ hasAnalysis: false, skinMetrics: null });
    expect(screen.getByTestId('beauty-supplements')).toBeInTheDocument();
    expect(screen.getByText('이너뷰티 추천')).toBeInTheDocument();
    expect(screen.getByTestId('inner-beauty-supplements')).toBeInTheDocument();
  });

  it('주의 성분 알림 섹션이 표시된다', () => {
    renderTab({ hasAnalysis: false, skinMetrics: null });
    expect(screen.getByTestId('beauty-warnings')).toBeInTheDocument();
  });
});
