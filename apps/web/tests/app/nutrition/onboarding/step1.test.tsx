/**
 * N-1 온보딩 Step 1 컴포넌트 테스트
 * 3단계 통합 온보딩 구조
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NutritionStep1Page from '@/app/(main)/nutrition/onboarding/step1/page';
import { useNutritionInputStore } from '@/lib/stores/nutritionInputStore';
import { act } from '@testing-library/react';

// i18n 전환(next-intl) 이후 페이지가 nutritionOnboarding 네임스페이스 키를 사용하므로,
// 전역 setup mock(키 그대로 반환) 대신 실제 ko.json 문구로 로컬 mock하여
// 사용자 노출 문구 기준의 검증을 유지한다.
// 참고: nutrition layout은 ADR-098(WELLNESS_PHASE2=false)로 redirect('/home')하지만,
// 이 테스트는 페이지 클라이언트 컴포넌트를 직접 렌더하므로 layout 게이팅과 무관하다.
vi.mock('next-intl', () => {
  const messages: Record<string, string> = {
    loading: '정보를 불러오는 중...',
    disclaimerTitle: '서비스 이용 안내',
    disclaimerBody:
      '본 서비스는 전문 의료 조언을 대체하지 않아요. 특정 질환이 있거나 임신 중인 경우 전문가와 상담 후 이용해 주세요.',
    step1GoalTitle: '식사 목표',
    step1GoalDesc: '원하는 목표를 선택해 주세요',
    goal_weight_loss: '체중 감량',
    goal_weight_loss_desc: '살 빼기에 맞춘 식단',
    goal_maintain: '체중 유지',
    goal_maintain_desc: '균형 잡힌 식단',
    goal_muscle: '근육 증가',
    goal_muscle_desc: '고단백 식단',
    goal_skin: '피부 개선',
    goal_skin_desc: '피부 친화 식단',
    goal_health: '건강 관리',
    goal_health_desc: '균형 영양 식단',
    step1BasicInfoTitle: '기본 정보',
    step1BasicInfoDesc: '칼로리 계산을 위한 정보를 입력해 주세요',
    c1DataLoaded: '체형 분석 데이터에서 키/체중을 불러왔어요 (직접 수정 가능)',
    genderLabel: '성별',
    gender_male: '남성',
    gender_female: '여성',
    birthDateLabel: '생년월일',
    heightLabel: '키 (cm)',
    weightLabel: '체중 (kg)',
    activityLevelLabel: '활동 수준',
    activityLevelPlaceholder: '선택해 주세요',
    summaryGoal: '목표:',
  };
  return {
    useTranslations: () => (key: string) => messages[key] ?? key,
  };
});

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
        // eslint-disable-next-line sonarjs/no-nested-functions
        order: () => ({
          limit: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    }),
  }),
}));

// next/navigation mock (redirect 포함 — 전역 setup mock을 파일 로컬 mock이 대체하므로 보강)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
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
    expect(screen.getByText(/전문 의료 조언을 대체하지 않아요/)).toBeInTheDocument();
  });

  it('shows goal descriptions', async () => {
    render(<NutritionStep1Page />);

    await screen.findByText('살 빼기에 맞춘 식단');

    expect(screen.getByText('살 빼기에 맞춘 식단')).toBeInTheDocument();
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
