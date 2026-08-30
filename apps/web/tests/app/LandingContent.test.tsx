/**
 * 랜딩(비로그인 첫인상) 구조 회귀 테스트 — 2026-08 랜딩 리뷰 확정 수리분
 *
 * i18n mock이 키를 그대로 돌려주므로 카피 값 검증은 tests/lib/i18n/messages.test.ts가 담당하고,
 * 여기서는 마크업·위계·접근성(시맨틱/aria)만 고정한다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';

// getCardPalette를 부분 실패시켜 "톤 ↔ 문구 인덱스 드리프트"를 재현할 수 있게 한다
const paletteState = vi.hoisted(() => ({ nullTone: null as string | null }));

vi.mock('@/lib/share/tone-palettes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/share/tone-palettes')>();
  return {
    ...actual,
    getCardPalette: (tone: string, locale: string) =>
      paletteState.nullTone === tone ? null : actual.getCardPalette(tone as never, locale as never),
  };
});

// 랜딩은 비로그인 화면이 정본(로그인 사용자는 page.tsx가 /home으로 보냄)
vi.mock('@clerk/nextjs', () => ({
  SignedOut: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: () => null,
  SignUpButton: ({
    children,
    forceRedirectUrl,
    signInForceRedirectUrl,
  }: {
    children: React.ReactNode;
    forceRedirectUrl?: string;
    signInForceRedirectUrl?: string;
  }) => (
    <div
      data-testid="clerk-sign-up-button"
      data-force-redirect-url={forceRedirectUrl}
      data-sign-in-force-redirect-url={signInForceRedirectUrl}
    >
      {children}
    </div>
  ),
}));

import { LandingContent } from '@/app/LandingContent';

/** 카드 내부 h2(진단명 히어로)를 제외한 랜딩 지면의 섹션 헤딩 */
function sectionHeadings(): HTMLElement[] {
  return screen
    .getAllByRole('heading', { level: 2 })
    .filter((h) => h.closest('[data-testid="persona-share-card"]') === null);
}

describe('LandingContent — 랜딩 구조', () => {
  beforeEach(() => {
    paletteState.nullTone = null;
  });

  it('히어로 카드에 정적 회전 클래스가 없다 (PhotocardTilt와 이중 회전 방지)', () => {
    render(<LandingContent />);

    const tilt = screen.getByTestId('photocard-tilt');
    const heroCard = within(tilt).getByTestId('persona-share-card');
    expect(heroCard.className).toContain('shadow-xl');
    expect(heroCard.className).not.toMatch(/rotate/);
  });

  it('12톤 스트립이 ul/li 시맨틱 + 색이름 aria-label을 갖는다', () => {
    render(<LandingContent />);

    const strip = screen.getByTestId('landing-spectrum');
    expect(strip.tagName).toBe('UL');

    const items = within(strip).getAllByRole('listitem');
    expect(items).toHaveLength(12);
    items.forEach((li) => {
      expect(li.getAttribute('aria-label')?.trim()).toBeTruthy();
      // 12등분 시 27px 슬라이버가 되는 소형 뷰포트 대비 최소 폭 + 가로 스크롤
      expect(li.className).toContain('min-w-[52px]');
    });
    expect(strip.className).toContain('overflow-x-auto');
  });

  it('섹션 헤딩이 세리프 문법으로 통일된다 (임의값 text-[22px] 잔존 0)', () => {
    render(<LandingContent />);

    const headings = sectionHeadings();
    expect(headings.length).toBeGreaterThanOrEqual(5);
    headings.forEach((h) => {
      expect(h.className).toContain('font-serif');
      expect(h.className).not.toContain('text-[22px]');
    });
  });

  it('솔리드 CTA는 히어로·하단 2개뿐이고 중간 팔레트 CTA는 텍스트 링크다', () => {
    const { container } = render(<LandingContent />);

    const solidCtas = container.querySelectorAll('[class*="bg-[#EC4899]"]');
    expect(solidCtas).toHaveLength(2);

    // 팔레트 섹션 CTA — 버튼 요소이되 솔리드 스타일이 아니다
    const paletteCta = screen.getByRole('button', { name: /paletteCta/ });
    expect(paletteCta.className).not.toContain('bg-[#EC4899]');
    expect(paletteCta.className).toContain('text-[#C56A84]');
  });

  it('로그아웃 CTA 3곳은 가입 모달을 거쳐 온보딩으로 이동한다', () => {
    render(<LandingContent />);

    const signUpCtas = screen.getAllByTestId('clerk-sign-up-button');
    expect(signUpCtas).toHaveLength(3);
    signUpCtas.forEach((cta) => {
      expect(cta).toHaveAttribute('data-force-redirect-url', '/analysis/integrated?onboarding=1');
      // 가입 모달에서 기존 계정으로 전환한 사용자는 일반 분석 진입으로 보낸다.
      expect(cta).toHaveAttribute('data-sign-in-force-redirect-url', '/analysis/integrated');
    });
  });

  it('미리보기 스크롤러가 그림자 여유(py-6 -my-6)와 소형 뷰포트 축소를 갖는다', () => {
    const { container } = render(<LandingContent />);

    const scroller = container.querySelector('div.overflow-x-auto.snap-x');
    expect(scroller).not.toBeNull();
    expect(scroller?.className).toContain('py-6');
    expect(scroller?.className).toContain('-my-6');

    const scaled = scroller?.querySelectorAll('.scale-\\[0\\.8\\]') ?? [];
    expect(scaled.length).toBe(3);
  });

  it('미리보기 카드 3장이 각자의 톤 문구로 렌더된다', () => {
    render(<LandingContent />);

    const heroes = screen.getAllByTestId('persona-share-hero').map((el) => el.textContent);
    // [0] = 히어로 카드(sample1Tone), 이후가 미리보기 3장
    expect(heroes).toEqual(['sample1Tone', 'sample2Tone', 'sample3Tone', 'sample4Tone']);
  });

  it('팔레트가 없는 톤이 섞여도 남은 카드의 문구가 밀리지 않는다 (인덱스 드리프트 봉합)', () => {
    // 두 번째 미리보기(deep-winter = sample3) 팔레트만 실패시킨다
    paletteState.nullTone = 'deep-winter';

    render(<LandingContent />);

    const heroes = screen.getAllByTestId('persona-share-hero').map((el) => el.textContent);
    expect(heroes).toEqual(['sample1Tone', 'sample2Tone', 'sample4Tone']);
    expect(screen.queryByText('sample3Tone')).not.toBeInTheDocument();
  });
});
