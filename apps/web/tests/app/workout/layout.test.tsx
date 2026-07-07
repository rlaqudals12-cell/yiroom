/**
 * W-1 운동 모듈 레이아웃 테스트
 *
 * ADR-098 (2026-04): 운동 모듈 UI 숨김 — WELLNESS_PHASE2=false라
 * 서버 레이아웃(layout.tsx)은 redirect('/home')를 호출한다.
 * 기존 UI 검증(헤더/뒤로가기 등)은 WorkoutLayoutClient를 직접 렌더해 유지한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';
import WorkoutLayout from '@/app/(main)/workout/layout';
import WorkoutLayoutClient from '@/app/(main)/workout/WorkoutLayoutClient';

// next/navigation mock (redirect 포함 — setup.ts 기본 mock에는 redirect가 없음)
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
  useRouter: () => ({
    back: vi.fn(),
    push: vi.fn(),
  }),
}));

describe('WorkoutLayout (서버 레이아웃 — ADR-098 게이팅)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('WELLNESS_PHASE2 플래그가 꺼져 있다', () => {
    // 현행 제품 상태 전제: Phase 2 보류 (ADR-098)
    expect(FEATURE_FLAGS.WELLNESS_PHASE2).toBe(false);
  });

  it('플래그 off 상태에서 /home으로 리다이렉트한다', () => {
    render(
      <WorkoutLayout>
        <div data-testid="test-child">Test Content</div>
      </WorkoutLayout>
    );

    expect(redirect).toHaveBeenCalledWith('/home');
  });
});

describe('WorkoutLayoutClient (플래그 on 시 UI)', () => {
  it('renders children correctly', () => {
    render(
      <WorkoutLayoutClient>
        <div data-testid="test-child">Test Content</div>
      </WorkoutLayoutClient>
    );
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('displays page title', () => {
    render(
      <WorkoutLayoutClient>
        <div>Test</div>
      </WorkoutLayoutClient>
    );
    expect(screen.getByText('운동 추천')).toBeInTheDocument();
  });

  it('has back button with aria-label', () => {
    render(
      <WorkoutLayoutClient>
        <div>Test</div>
      </WorkoutLayoutClient>
    );
    const backButton = screen.getByLabelText('뒤로 가기');
    expect(backButton).toBeInTheDocument();
  });

  it('has correct background color on main element', () => {
    render(
      <WorkoutLayoutClient>
        <div>Test</div>
      </WorkoutLayoutClient>
    );
    const main = screen.getByRole('main');
    expect(main).toHaveClass('bg-muted');
  });

  it('content area has max-width 480px', () => {
    render(
      <WorkoutLayoutClient>
        <div data-testid="content">Test</div>
      </WorkoutLayoutClient>
    );
    // 콘텐츠를 감싸는 div가 max-w-[480px]를 가져야 함
    const content = screen.getByTestId('content');
    expect(content.parentElement).toHaveClass('max-w-[480px]');
  });

  it('back button is clickable', () => {
    render(
      <WorkoutLayoutClient>
        <div>Test</div>
      </WorkoutLayoutClient>
    );

    const backButton = screen.getByLabelText('뒤로 가기');
    // 버튼이 클릭 가능한지 확인 (disabled가 아닌지)
    expect(backButton).not.toBeDisabled();
    // 클릭 이벤트가 에러 없이 실행되는지 확인
    expect(() => fireEvent.click(backButton)).not.toThrow();
  });
});
