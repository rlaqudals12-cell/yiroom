/**
 * N-1 온보딩 Step 1 컴포넌트 테스트
 * 3단계 통합 온보딩 구조
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NutritionStep1Page from '@/app/(main)/nutrition/onboarding/step1/page';
import { useNutritionInputStore } from '@/lib/stores/nutritionInputStore';
import { act } from '@testing-library/react';

// Clerk mock
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: true,
    isLoaded: true,
  }),
}));

// Supabase mock
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

// next/navigation mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('NutritionStep1Page', () => {
  beforeEach(() => {
    // store 초기화
    act(() => {
      useNutritionInputStore.getState().resetAll();
    });
  });

  it('renders all 5 goal options', async () => {
    render(<NutritionStep1Page />);

    // 로딩 완료 대기
    await screen.findByText('체중 감량');

    expect(screen.getByText('체중 감량')).toBeInTheDocument();
    expect(screen.getByText('체중 유지')).toBeInTheDocument();
    expect(screen.getByText('근육 증가')).toBeInTheDocument();
    expect(screen.getByText('피부 개선')).toBeInTheDocument();
    expect(screen.getByText('건강 관리')).toBeInTheDocument();
  });

  it('renders page title and description', async () => {
    render(<NutritionStep1Page />);

    await screen.findByText('식사 목표');

    expect(screen.getByText('식사 목표')).toBeInTheDocument();
    expect(screen.getByText('원하는 목표를 선택해 주세요')).toBeInTheDocument();
  });

  it('renders progress indicator for step 1 of 3', async () => {
    render(<NutritionStep1Page />);

    // 로딩 완료 대기
    await screen.findByText('식사 목표');

    // ProgressIndicator가 1/3을 표시해야 함 (3단계 구조)
    expect(screen.getByText('1/3 단계')).toBeInTheDocument();
  });

  it('renders disclaimer notice', async () => {
    render(<NutritionStep1Page />);

    await screen.findByText('서비스 이용 안내');

    expect(screen.getByText('서비스 이용 안내')).toBeInTheDocument();
    expect(screen.getByText(/전문 의료 조언을 대체하지 않습니다/)).toBeInTheDocument();
  });

  it('shows goal descriptions', async () => {
    render(<NutritionStep1Page />);

    await screen.findByText('칼로리 적자 식단');

    expect(screen.getByText('칼로리 적자 식단')).toBeInTheDocument();
    expect(screen.getByText('균형 잡힌 식단')).toBeInTheDocument();
    expect(screen.getByText('고단백 식단')).toBeInTheDocument();
    expect(screen.getByText('피부 친화 식단')).toBeInTheDocument();
    expect(screen.getByText('균형 영양 식단')).toBeInTheDocument();
  });

  it('updates store when goal is selected', async () => {
    render(<NutritionStep1Page />);

    await screen.findByText('체중 감량');

    // 체중 감량 선택 - SelectionCard는 mode='single'일 때 role="radio"
    const weightLossButton = screen.getByRole('radio', { name: /체중 감량/i });
    fireEvent.click(weightLossButton);

    expect(useNutritionInputStore.getState().goal).toBe('weight_loss');
  });

  it('disables next button when no goal selected', async () => {
    render(<NutritionStep1Page />);

    await screen.findByText('식사 목표');

    // 다음 버튼 찾기
    const nextButton = screen.getByRole('button', { name: /다음/i });

    // 비활성화 또는 disabled 상태 확인
    expect(nextButton).toBeDisabled();
  });

  it('enables next button when all fields are filled', async () => {
    // 모든 필수 필드 설정 (3단계 통합 온보딩에서는 목표 외에 추가 정보도 필요)
    act(() => {
      useNutritionInputStore.getState().setGoal('weight_loss');
      useNutritionInputStore.getState().setGender('male');
      useNutritionInputStore.getState().setBirthDate('1990-01-01');
      useNutritionInputStore.getState().setHeight(170);
      useNutritionInputStore.getState().setWeight(70);
      useNutritionInputStore.getState().setActivityLevel('moderate');
    });

    render(<NutritionStep1Page />);

    await screen.findByText('식사 목표');

    const nextButton = screen.getByRole('button', { name: /다음/i });
    expect(nextButton).not.toBeDisabled();
  });
});
