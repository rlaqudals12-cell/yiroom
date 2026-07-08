/**
 * 레거시 라우트 리다이렉트 테스트 (2026-07 감사)
 *
 * - /chat: /coach와 이중화된 고아(인메모리 세션 유실) → /coach가 정본
 * - /diary: 피부 일기 고아 이중 구현 → /analysis/skin/diary가 정본
 * - /analysis: 정적 메뉴판 = 홈 ProfileCardGrid와 중복 → /home이 정본 (ADR-111 One Canon)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { redirect } from 'next/navigation';
import ChatRedirect from '@/app/(main)/chat/page';
import DiaryRedirect from '@/app/(main)/diary/page';
import AnalysisHubRedirect from '@/app/(main)/analysis/page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('레거시 라우트 리다이렉트', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('/chat은 /coach로 리다이렉트한다', () => {
    render(<ChatRedirect />);
    expect(redirect).toHaveBeenCalledWith('/coach');
  });

  it('/diary는 /analysis/skin/diary로 리다이렉트한다', () => {
    render(<DiaryRedirect />);
    expect(redirect).toHaveBeenCalledWith('/analysis/skin/diary');
  });

  it('/analysis 허브는 /home으로 리다이렉트한다', () => {
    render(<AnalysisHubRedirect />);
    expect(redirect).toHaveBeenCalledWith('/home');
  });
});
