/**
 * 연말 리뷰 레이아웃 테스트
 *
 * 2026-07 감사: /year-review는 W/N(운동·영양)·소셜 기반 + 하드코딩 가짜 데이터라
 * ADR-098 숨김 정책과 동일하게 WELLNESS_PHASE2 게이팅으로 /home 리다이렉트한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';
import YearReviewLayout from '@/app/(main)/year-review/layout';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('YearReviewLayout (WELLNESS_PHASE2 게이팅)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('WELLNESS_PHASE2 플래그가 꺼져 있다', () => {
    // 현행 제품 상태 전제: Phase 2 보류 (ADR-098)
    expect(FEATURE_FLAGS.WELLNESS_PHASE2).toBe(false);
  });

  it('플래그 off 상태에서 /home으로 리다이렉트한다', () => {
    render(
      <YearReviewLayout>
        <div data-testid="test-child">Test Content</div>
      </YearReviewLayout>
    );

    expect(redirect).toHaveBeenCalledWith('/home');
  });
});
