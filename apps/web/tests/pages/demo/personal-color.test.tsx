/**
 * 공개 데모 결과 페이지 스모크 (/demo/personal-color)
 *
 * 첫 방문자가 보는 유일한 결과 표면이라 "진짜 진단으로 오인될 요소"가 회귀하면 안 된다.
 * - 샘플 고지가 시트 안에 존재 (캡처해도 예시임이 남는다)
 * - 신뢰도 위조(92% 등) 미표시
 * - 출처 없는 자사 통계("전체 사용자 중 N%") 부재
 * - CTA가 auth 게이팅 밖 — 서버 렌더 HTML에 존재
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DemoReportSheet } from '@/app/(main)/demo/personal-color/_components/DemoReportSheet';
import DemoPersonalColorPage from '@/app/(main)/demo/personal-color/page';

// useUserProfile — 시트 렌더용(성별 적응 데이터)
vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: { gender: 'female', heightCm: null, weightKg: null, allergies: [] },
    isLoading: false,
    error: null,
    updateGender: vi.fn().mockResolvedValue(true),
    updateProfile: vi.fn().mockResolvedValue(true),
    refetch: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe('데모 결과 페이지 — CTA 배선', () => {
  it('CTA가 auth 게이팅 없이 서버 렌더 트리에 존재한다 (배너 + 하단)', async () => {
    render(await DemoPersonalColorPage());

    const banner = screen.getByTestId('demo-banner-cta');
    const bottom = screen.getByTestId('demo-bottom-cta');
    // 미로그인도 같은 링크 — Clerk가 로그인 후 이 경로로 복귀시킨다
    expect(banner).toHaveAttribute('href', '/analysis/integrated?onboarding=1');
    expect(bottom).toHaveAttribute('href', '/analysis/integrated?onboarding=1');
  });

  it('하단 문구·CTA가 i18n 키를 통해 렌더된다 (한국어 하드코딩 제거)', async () => {
    render(await DemoPersonalColorPage());

    // setup.ts의 next-intl mock은 키를 그대로 반환한다
    expect(screen.getByText('demoBottomNote')).toBeInTheDocument();
    expect(screen.getByTestId('demo-bottom-cta')).toHaveTextContent('startFree');
  });
});

describe('데모 진단지 시트 — 정직성 가드', () => {
  it('시트 안에 샘플 고지 배지를 인쇄한다', () => {
    render(<DemoReportSheet />);

    expect(screen.getByTestId('mock-data-notice-compact')).toBeInTheDocument();
  });

  it('신뢰도 라인을 표시하지 않는다 (측정값 없음 — 92% 위조 회귀 가드)', () => {
    render(<DemoReportSheet />);

    expect(screen.queryByText(/분석 신뢰도/)).not.toBeInTheDocument();
    expect(screen.queryByText(/92%/)).not.toBeInTheDocument();
  });

  it('출처 없는 자사 통계를 표시하지 않는다', () => {
    render(<DemoReportSheet />);

    expect(screen.queryByText(/전체 사용자 중/)).not.toBeInTheDocument();
  });

  it('히어로에 12톤 진단명("트루 스프링")을 표시한다', () => {
    render(<DemoReportSheet />);

    expect(screen.getByTestId('pc-hero-title')).toHaveTextContent('트루 스프링');
  });
});
