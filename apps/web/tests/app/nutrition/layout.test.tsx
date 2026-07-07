/**
 * N-1 Task 1.0: 영양 모듈 레이아웃 테스트
 *
 * ADR-098 (2026-04): 영양 모듈 UI 숨김 — WELLNESS_PHASE2=false라
 * 서버 레이아웃(layout.tsx)은 redirect('/home')를 호출한다.
 * 기존 UI 검증(헤더/뒤로가기 등)은 NutritionLayoutClient를 직접 렌더해 유지한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';
import NutritionLayout from '@/app/(main)/nutrition/layout';
import NutritionLayoutClient from '@/app/(main)/nutrition/NutritionLayoutClient';

// next/navigation mock (redirect 포함 — setup.ts 기본 mock에는 redirect가 없음)
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => ({
    back: mockBack,
  }),
}));

describe('NutritionLayout (서버 레이아웃 — ADR-098 게이팅)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('WELLNESS_PHASE2 플래그가 꺼져 있다', () => {
    // 현행 제품 상태 전제: Phase 2 보류 (ADR-098)
    expect(FEATURE_FLAGS.WELLNESS_PHASE2).toBe(false);
  });

  it('플래그 off 상태에서 /home으로 리다이렉트한다', () => {
    render(
      <NutritionLayout>
        <div data-testid="child">Test Content</div>
      </NutritionLayout>
    );

    expect(redirect).toHaveBeenCalledWith('/home');
  });
});

describe('NutritionLayoutClient (플래그 on 시 UI)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct max-width container', () => {
    render(
      <NutritionLayoutClient>
        <div data-testid="child">Test Content</div>
      </NutritionLayoutClient>
    );

    // 컨텐츠 영역에 max-w-[480px] 적용 확인
    const childElement = screen.getByTestId('child');
    const container = childElement.parentElement;
    expect(container).toHaveClass('max-w-[480px]');
  });

  it('renders main element with correct role', () => {
    render(
      <NutritionLayoutClient>
        <div>Test</div>
      </NutritionLayoutClient>
    );

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveClass('bg-muted');
  });

  it('renders header with title', () => {
    render(
      <NutritionLayoutClient>
        <div>Test</div>
      </NutritionLayoutClient>
    );

    expect(screen.getByText('영양 관리')).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(
      <NutritionLayoutClient>
        <div>Test</div>
      </NutritionLayoutClient>
    );

    const backButton = screen.getByRole('button', { name: /뒤로 가기/i });
    expect(backButton).toBeInTheDocument();
  });

  it('calls router.back() when back button is clicked', () => {
    render(
      <NutritionLayoutClient>
        <div>Test</div>
      </NutritionLayoutClient>
    );

    const backButton = screen.getByRole('button', { name: /뒤로 가기/i });
    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders children content', () => {
    render(
      <NutritionLayoutClient>
        <div data-testid="child-content">Custom Content</div>
      </NutritionLayoutClient>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('has sticky header', () => {
    render(
      <NutritionLayoutClient>
        <div>Test</div>
      </NutritionLayoutClient>
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('sticky', 'top-0');
  });
});
