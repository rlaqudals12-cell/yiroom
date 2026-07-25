/**
 * ResultPageInsights 컴포넌트 테스트
 * @description 분석 결과 페이지 크로스 모듈 인사이트 + 다음 행동 다리(구 ContextLinkingCard 흡수)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultPageInsights from '@/components/insights/ResultPageInsights';

// Next.js Link 컴포넌트 모킹 (다음 행동 다리의 href 검증용)
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// useAnalysisStatus 훅 모킹
const mockAnalyses = vi.fn();
vi.mock('@/hooks/useAnalysisStatus', () => ({
  useAnalysisStatus: () => mockAnalyses(),
}));

// 인사이트 생성 모킹
vi.mock('@/lib/insights', () => ({
  analysisToDataBundle: vi.fn().mockReturnValue({
    personalColor: { season: 'spring', undertone: 'warm', confidence: 80 },
    skin: { skinType: 'combination', hydrationLevel: 65, oilLevel: 35 },
  }),
  generateInsightsForModule: vi.fn().mockReturnValue([
    {
      id: 'insight_1',
      title: '봄 웜톤과 스킨케어',
      description: '따뜻한 톤에 맞는 스킨케어를 추천해드려요',
      category: 'skin_care',
      priority: 'high',
      relatedModules: ['personal_color', 'skin'],
    },
    {
      id: 'insight_2',
      title: '컬러 매치 팁',
      description: '퍼스널컬러와 어울리는 제품을 확인해보세요',
      category: 'color_match',
      priority: 'medium',
      relatedModules: ['personal_color', 'skin'],
    },
  ]),
}));

// 2개 분석(퍼스널컬러+피부) 완료 상태 헬퍼
function setupTwoAnalyses(): void {
  mockAnalyses.mockReturnValue({
    analyses: [
      { id: 'pc_1', type: 'personal-color', createdAt: new Date(), seasonType: 'Spring' },
      { id: 'skin_1', type: 'skin', createdAt: new Date(), skinScore: 65 },
    ],
    analysisCount: 2,
    isLoading: false,
  });
}

describe('ResultPageInsights', () => {
  it('로딩 중에는 렌더링하지 않는다', () => {
    mockAnalyses.mockReturnValue({
      analyses: [],
      analysisCount: 0,
      isLoading: true,
    });

    const { container } = render(<ResultPageInsights currentModule="skin" />);

    expect(container.firstChild).toBeNull();
  });

  it('분석 1개 이하이면 인사이트 없이 다음 행동 다리만 표시한다', () => {
    mockAnalyses.mockReturnValue({
      analyses: [{ id: 'pc_1', type: 'personal-color', createdAt: new Date() }],
      analysisCount: 1,
      isLoading: false,
    });

    render(<ResultPageInsights currentModule="skin" />);

    // 인사이트 블록은 없음 (2개 미만)
    expect(screen.queryByText('통합 인사이트')).not.toBeInTheDocument();
    // 다음 행동 다리는 유지됨 (새 사용자에게 가장 필요한 표면)
    expect(screen.getByTestId('context-link-daily-routine')).toBeInTheDocument();
  });

  it('2개 이상 분석 완료 시 인사이트를 표시한다', () => {
    setupTwoAnalyses();

    render(<ResultPageInsights currentModule="skin" />);

    expect(screen.getByTestId('result-page-insights')).toBeInTheDocument();
    expect(screen.getByText('통합 인사이트')).toBeInTheDocument();
  });

  it('인사이트 제목과 설명을 표시한다', () => {
    setupTwoAnalyses();

    render(<ResultPageInsights currentModule="skin" />);

    expect(screen.getByText('봄 웜톤과 스킨케어')).toBeInTheDocument();
    expect(screen.getByText('따뜻한 톤에 맞는 스킨케어를 추천해드려요')).toBeInTheDocument();
    expect(screen.getByText('컬러 매치 팁')).toBeInTheDocument();
  });

  it('인사이트 개수 배지를 표시한다', () => {
    setupTwoAnalyses();

    render(<ResultPageInsights currentModule="skin" />);

    expect(screen.getByText('2개')).toBeInTheDocument();
  });

  it('알 수 없는 모듈이면 렌더링하지 않는다', () => {
    setupTwoAnalyses();

    // MODULE_MAP/NEXT_ANALYSIS 어디에도 없는 모듈 → 인사이트도 다리도 없음
    const { container } = render(<ResultPageInsights currentModule="unknown-module" />);

    expect(container.firstChild).toBeNull();
  });

  it('className이 적용된다', () => {
    setupTwoAnalyses();

    render(<ResultPageInsights currentModule="skin" className="mt-4" />);

    const container = screen.getByTestId('result-page-insights');
    expect(container.className).toContain('mt-4');
  });

  // ── 다음 행동 다리 (구 ContextLinkingCard에서 이식) ──────────────────────

  describe('오늘의 루틴 다리', () => {
    it('오늘의 루틴 행이 /capsule/daily로 링크되어야 함', () => {
      setupTwoAnalyses();

      render(<ResultPageInsights currentModule="personal-color" />);

      const routineLink = screen.getByTestId('context-link-daily-routine');
      expect(routineLink).toBeInTheDocument();
      expect(routineLink).toHaveAttribute('href', '/capsule/daily');
      expect(screen.getByText('오늘의 루틴')).toBeInTheDocument();
    });

    it('다음 분석 후보가 모두 완료돼도 루틴 다리는 유지된다', () => {
      // hair의 유일 후보(퍼스널컬러)가 이미 완료된 상태
      setupTwoAnalyses();

      render(<ResultPageInsights currentModule="hair" />);

      expect(screen.getByTestId('context-link-daily-routine')).toBeInTheDocument();
      expect(screen.queryByTestId('context-link-personal-color')).not.toBeInTheDocument();
    });
  });

  describe('다음 분석 1행', () => {
    it('미완료 추천 분석이 1행으로 링크되어야 함', () => {
      // skin 결과에서 메이크업(미완료) 추천
      setupTwoAnalyses();

      render(<ResultPageInsights currentModule="skin" />);

      const nextLink = screen.getByTestId('context-link-makeup');
      expect(nextLink).toBeInTheDocument();
      expect(nextLink).toHaveAttribute('href', '/analysis/makeup');
    });

    it('완료한 분석은 건너뛰고 다음 후보를 추천한다', () => {
      // personal-color의 1순위 makeup이 완료됨 → 2순위 hair 노출
      mockAnalyses.mockReturnValue({
        analyses: [
          { id: 'pc_1', type: 'personal-color', createdAt: new Date() },
          { id: 'mk_1', type: 'makeup', createdAt: new Date() },
        ],
        analysisCount: 2,
        isLoading: false,
      });

      render(<ResultPageInsights currentModule="personal-color" />);

      expect(screen.queryByTestId('context-link-makeup')).not.toBeInTheDocument();
      const hairLink = screen.getByTestId('context-link-hair');
      expect(hairLink).toBeInTheDocument();
      expect(hairLink).toHaveAttribute('href', '/analysis/hair');
    });

    it('연결 정의가 없는 모듈(posture)은 다음 행동 다리를 표시하지 않는다', () => {
      setupTwoAnalyses();

      render(<ResultPageInsights currentModule="posture" />);

      // posture는 MODULE_MAP(body)으로 인사이트는 가능하지만 다리는 없음 (기존 동작 보존)
      expect(screen.queryByTestId('context-link-daily-routine')).not.toBeInTheDocument();
    });
  });
});
