/**
 * 루트 레이아웃 — 하단 탭바 노출 조건 테스트
 *
 * 회귀 방지: 비로그인 랜딩(`/`)에 5탭 탭바가 렌더돼 "가입도 안 했는데 앱 셸 안"으로
 * 읽히던 결함(2026-08 랜딩 리뷰). 탭바를 감출 땐 본문 하단 패딩도 함께 풀려야 한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { auth } from '@clerk/nextjs/server';
import { getLocale } from 'next-intl/server';

// next/font/google — Vite에는 Next 폰트 로더가 없어 직접 모킹
vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'font-inter' }),
  Noto_Sans_KR: () => ({ variable: 'font-noto-sans-kr' }),
  Noto_Serif_KR: () => ({ variable: 'font-noto-serif-kr' }),
}));

vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@clerk/localizations', () => ({ koKR: {}, enUS: {} }));
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('ko'),
  getMessages: vi.fn().mockResolvedValue({}),
}));

// 레이아웃 껍데기(프로바이더·배너·계측)는 이 테스트의 관심사가 아니다 — 통과만 시킨다
vi.mock('@vercel/analytics/next', () => ({ Analytics: () => null }));
vi.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }));
vi.mock('@/components/Navbar', () => ({ default: () => <header data-testid="navbar" /> }));
vi.mock('@/components/OfflineBanner', () => ({ OfflineBanner: () => null }));
vi.mock('@/components/StaleDeploymentBanner', () => ({ StaleDeploymentBanner: () => null }));
vi.mock('@/components/common', () => ({
  PWAInstallPrompt: () => null,
  OrganizationJsonLd: () => null,
  WebApplicationJsonLd: () => null,
}));
vi.mock('@/components/providers/DynamicToaster', () => ({ DynamicToaster: () => null }));
vi.mock('@/components/providers/sync-user-provider', () => ({
  SyncUserProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/providers/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/providers/gender-provider', () => ({
  GenderProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/providers/i18n-provider', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/providers/web-vitals-provider', () => ({ WebVitalsProvider: () => null }));
vi.mock('@/components/gamification', () => ({
  GamificationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import RootLayout from '@/app/layout';

async function renderLayout(): Promise<void> {
  const ui = await RootLayout({ children: <div data-testid="page-child">본문</div> });
  render(ui);
}

describe('RootLayout — 하단 탭바 게이팅', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLocale).mockResolvedValue('ko');
  });

  it('비로그인이면 하단 탭바를 렌더하지 않는다 (랜딩 `/` 포함)', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    await renderLayout();

    expect(screen.getByTestId('page-child')).toBeInTheDocument();
    expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument();
  });

  it('비로그인이면 본문 하단 탭바 패딩도 해제한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);

    await renderLayout();

    const main = document.querySelector('main#main-content');
    expect(main).not.toBeNull();
    expect(main?.className ?? '').not.toContain('pb-bottom-nav');
  });

  it('로그인 상태면 하단 탭바와 본문 패딩을 유지한다', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as never);

    await renderLayout();

    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    const main = document.querySelector('main#main-content');
    expect(main?.className).toContain('pb-bottom-nav');
    expect(main?.className).toContain('md:pb-0');
  });

  it.each(['ko', 'en', 'ja', 'zh'])(
    '요청 로케일이 %s여도 한국어 OG 카피의 실제 로케일만 출력한다',
    async (locale) => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);
      vi.mocked(getLocale).mockResolvedValue(locale);

      await renderLayout();

      const primaryLocales = document.head.querySelectorAll(`meta[property='og:locale']`);
      const alternateLocales = document.head.querySelectorAll(
        `meta[property='og:locale:alternate']`
      );

      expect(primaryLocales).toHaveLength(1);
      expect(primaryLocales[0]).toHaveAttribute('content', 'ko_KR');
      expect(alternateLocales).toHaveLength(0);
    }
  );
});
