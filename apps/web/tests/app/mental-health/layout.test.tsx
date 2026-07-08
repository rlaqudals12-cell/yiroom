/**
 * 멘탈 헬스 레이아웃 테스트
 *
 * 2026-07 감사: /mental-health는 W/N 인접 + 도달 불가 고아 라우트라
 * ADR-098 숨김 정책과 동일하게 WELLNESS_PHASE2 게이팅으로 /home 리다이렉트한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { redirect } from 'next/navigation';
import { FEATURE_FLAGS } from '@yiroom/shared';
import MentalHealthLayout from '@/app/(main)/mental-health/layout';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('MentalHealthLayout (WELLNESS_PHASE2 게이팅)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('WELLNESS_PHASE2 플래그가 꺼져 있다', () => {
    expect(FEATURE_FLAGS.WELLNESS_PHASE2).toBe(false);
  });

  it('플래그 off 상태에서 /home으로 리다이렉트한다', () => {
    render(
      <MentalHealthLayout>
        <div data-testid="test-child">Test Content</div>
      </MentalHealthLayout>
    );

    expect(redirect).toHaveBeenCalledWith('/home');
  });
});
