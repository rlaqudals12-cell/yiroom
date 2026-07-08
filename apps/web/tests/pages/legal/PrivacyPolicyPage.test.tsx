/**
 * /privacy-policy 리다이렉트 테스트
 *
 * 개인정보처리방침 2벌 통합 (2026-07 감사): /privacy-policy는 정본(/privacy)으로
 * 리다이렉트한다. 기존 콘텐츠 검증 테스트는 정본 통합으로 폐기.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { redirect } from 'next/navigation';
import PrivacyPolicyRedirect from '@/app/(main)/privacy-policy/page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('PrivacyPolicyRedirect (/privacy-policy)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('정본 /privacy로 리다이렉트한다', () => {
    render(<PrivacyPolicyRedirect />);
    expect(redirect).toHaveBeenCalledWith('/privacy');
  });
});
