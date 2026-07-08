/**
 * NextStepsLinks 컴포넌트 테스트
 *
 * One Canon(ADR-111): 축별 심화 링크 — 축 이름 + 핵심 결과 1줄 + "심화 보기 →"
 * 개별 결과 페이지(축 상세의 정본)로 딥링크. (구 AxesSummaryCard/AxisDetailAccordion 흡수)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('lucide-react', () => ({
  ChevronRight: () => null,
  Palette: () => null,
  Sparkles: () => null,
  Shirt: () => null,
  Scissors: () => null,
  Brush: () => null,
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// useAnalysisStatus mock — 최신 개별 결과 유무를 테스트별로 제어
const mockAnalyses = vi.fn(() => ({ analyses: [] as Array<{ type: string; id: string }> }));
vi.mock('@/hooks/useAnalysisStatus', () => ({
  useAnalysisStatus: () => mockAnalyses(),
}));

import { NextStepsLinks } from '@/app/(main)/analysis/integrated/result/[sessionId]/_components/NextStepsLinks';

describe('NextStepsLinks', () => {
  beforeEach(() => {
    mockAnalyses.mockReturnValue({ analyses: [] });
  });

  it('완료된 축이 없으면 null 반환', () => {
    const { container } = render(<NextStepsLinks axesCompleted={[]} />);
    expect(container.querySelector('[data-testid="next-steps-links"]')).toBeNull();
  });

  it('완료된 축만 행 표시 (PC만 성공)', () => {
    render(<NextStepsLinks axesCompleted={['personal_color']} />);
    expect(screen.getByText('퍼스널컬러')).toBeInTheDocument();
    expect(screen.queryByText('피부')).toBeNull();
  });

  it('여러 축 성공 시 여러 축 이름 표시', () => {
    render(<NextStepsLinks axesCompleted={['personal_color', 'skin', 'body']} />);
    expect(screen.getByText('퍼스널컬러')).toBeInTheDocument();
    expect(screen.getByText('피부')).toBeInTheDocument();
    expect(screen.getByText('체형')).toBeInTheDocument();
  });

  it('핵심 결과 요약 1줄 표시 (한국어 라벨)', () => {
    render(
      <NextStepsLinks
        axesCompleted={['personal_color', 'skin']}
        axisSummaries={{ personal_color: '가을 웜톤 · 웜톤', skin: '복합성 · 컨디션 72점' }}
      />
    );
    expect(screen.getByText('가을 웜톤 · 웜톤')).toBeInTheDocument();
    expect(screen.getByText('복합성 · 컨디션 72점')).toBeInTheDocument();
  });

  it('요약이 없으면 폴백 문구 표시', () => {
    render(<NextStepsLinks axesCompleted={['hair']} />);
    expect(screen.getByText('결과 자세히 보기')).toBeInTheDocument();
  });

  it('최신 개별 결과가 없으면 분석 시작 경로로 폴백', () => {
    render(<NextStepsLinks axesCompleted={['hair']} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/analysis/hair');
  });

  it('최신 개별 결과가 있으면 결과 페이지로 딥링크', () => {
    mockAnalyses.mockReturnValue({
      analyses: [{ type: 'personal-color', id: 'abc123' }],
    });
    render(<NextStepsLinks axesCompleted={['personal_color']} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/analysis/personal-color/result/abc123');
  });

  it('"심화 보기" CTA 문구 표시', () => {
    render(<NextStepsLinks axesCompleted={['makeup']} />);
    expect(screen.getByText('심화 보기')).toBeInTheDocument();
  });
});
