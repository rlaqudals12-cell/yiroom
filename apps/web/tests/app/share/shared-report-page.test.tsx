/**
 * 공개 스타일 리포트 페이지 — 실형상 렌더 + 폴백 정직 고지
 *
 * 왜 페이지 단위로도 검증하는가: 이 화면은 **비로그인 수신자**가 보는 유일한 표면이라
 * (1) 통합 경로의 실제 저장 형상에서 크래시 없이 렌더돼야 하고
 * (2) 샘플(Mock) 대체 사실이 소유자 화면과 똑같이 보여야 한다.
 *
 * @see lib/share/report.ts
 * @see app/share/report/[token]/page.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PublicStyleReport } from '@/lib/share/report';

vi.mock('lucide-react', () => ({ AlertTriangle: () => null }));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
vi.mock('next/navigation', () => ({ notFound: () => notFound() }));

const getSharedReport = vi.fn();
vi.mock('@/lib/share/report', () => ({ getSharedReport: () => getSharedReport() }));

/** 통합 경로가 실제로 만들어내는 공개 payload */
function baseReport(overrides: Partial<PublicStyleReport> = {}): PublicStyleReport {
  return {
    createdAt: '2026-08-17T00:00:00Z',
    persona: '따뜻한 가을의 사람',
    fallbackAxes: [],
    personalColor: {
      season: 'autumn',
      undertone: 'warm',
      // 통합 경로는 색 이름이 없다 (hex 문자열 배열 저장)
      bestColors: [
        { hex: '#D2B48C', name: '' },
        { hex: '#8B4513', name: '' },
      ],
    },
    skin: { skinType: 'combination', overallScore: 72, foundation: '웜 베이지' },
    body: { bodyType: 'N', styleTips: ['보트넥', '일자핏'] },
    hair: { hairType: 'straight', scalpType: 'normal', faceShape: 'oval' },
    makeup: {
      undertone: 'warm',
      recommendations: ['복합성 피부에는 세미 매트 피니시 + 중간 커버가 어울려요.'],
    },
    ...overrides,
  };
}

async function renderPage() {
  const { default: SharedReportPage } = await import('@/app/share/report/[token]/page');
  return render(await SharedReportPage({ params: Promise.resolve({ token: 'a'.repeat(32) }) }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('공개 스타일 리포트 페이지', () => {
  it('통합 경로 실형상에서 크래시 없이 렌더된다', async () => {
    getSharedReport.mockResolvedValue(baseReport());

    await renderPage();

    expect(screen.getByTestId('shared-report-page')).toBeInTheDocument();
    expect(
      screen.getByText('복합성 피부에는 세미 매트 피니시 + 중간 커버가 어울려요.', {
        exact: false,
      })
    ).toBeInTheDocument();
  });

  it('색 이름이 없어도 팔레트 스와치를 렌더한다 (통합 경로 hex 문자열)', async () => {
    getSharedReport.mockResolvedValue(baseReport());

    const { container } = await renderPage();

    const swatches = container.querySelectorAll('span[style*="background-color"]');
    expect(swatches.length).toBeGreaterThanOrEqual(2);
  });

  it('폴백이 없으면 "AI 분석 기반"을 표기하고 고지 배너는 없다', async () => {
    getSharedReport.mockResolvedValue(baseReport());

    await renderPage();

    expect(screen.getByText(/AI 분석 기반/)).toBeInTheDocument();
    expect(screen.queryByTestId('shared-report-fallback-notice')).toBeNull();
  });

  it('폴백 축이 있으면 샘플 고지를 렌더한다 (수신자 오인 차단)', async () => {
    getSharedReport.mockResolvedValue(baseReport({ fallbackAxes: ['personal_color', 'skin'] }));

    await renderPage();

    const notice = screen.getByTestId('shared-report-fallback-notice');
    expect(notice).toBeInTheDocument();
    expect(notice.textContent).toContain('퍼스널컬러, 피부');
    expect(notice.textContent).toContain('샘플');
    expect(notice.textContent).toContain('실제 분석 결과가 아니므로');
  });

  it('폴백이 있으면 "AI 분석 기반" 문구를 걷어낸다 (거짓 표기 금지)', async () => {
    getSharedReport.mockResolvedValue(baseReport({ fallbackAxes: ['skin'] }));

    await renderPage();

    expect(screen.queryByText(/AI 분석 기반/)).toBeNull();
    expect(screen.getByText(/샘플\(예시\)로 대체된 축이 포함/)).toBeInTheDocument();
  });

  it('무효 토큰은 notFound로 처리한다', async () => {
    getSharedReport.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });
});
