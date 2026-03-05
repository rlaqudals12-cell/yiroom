/**
 * ResultPageInsights 컴포넌트 테스트
 * @description 분석 결과 페이지 크로스 모듈 인사이트 표시
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultPageInsights from '@/components/insights/ResultPageInsights';

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

  it('분석 1개 이하이면 렌더링하지 않는다', () => {
    mockAnalyses.mockReturnValue({
      analyses: [{ id: 'pc_1', type: 'personal-color', createdAt: new Date() }],
      analysisCount: 1,
      isLoading: false,
    });

    const { container } = render(<ResultPageInsights currentModule="skin" />);

    expect(container.firstChild).toBeNull();
  });

  it('2개 이상 분석 완료 시 인사이트를 표시한다', () => {
    mockAnalyses.mockReturnValue({
      analyses: [
        { id: 'pc_1', type: 'personal-color', createdAt: new Date(), seasonType: 'Spring' },
        { id: 'skin_1', type: 'skin', createdAt: new Date(), skinScore: 65 },
      ],
      analysisCount: 2,
      isLoading: false,
    });

    render(<ResultPageInsights currentModule="skin" />);

    expect(screen.getByTestId('result-page-insights')).toBeInTheDocument();
    expect(screen.getByText('통합 인사이트')).toBeInTheDocument();
  });

  it('인사이트 제목과 설명을 표시한다', () => {
    mockAnalyses.mockReturnValue({
      analyses: [
        { id: 'pc_1', type: 'personal-color', createdAt: new Date(), seasonType: 'Spring' },
        { id: 'skin_1', type: 'skin', createdAt: new Date(), skinScore: 65 },
      ],
      analysisCount: 2,
      isLoading: false,
    });

    render(<ResultPageInsights currentModule="skin" />);

    expect(screen.getByText('봄 웜톤과 스킨케어')).toBeInTheDocument();
    expect(screen.getByText('따뜻한 톤에 맞는 스킨케어를 추천해드려요')).toBeInTheDocument();
    expect(screen.getByText('컬러 매치 팁')).toBeInTheDocument();
  });

  it('인사이트 개수 배지를 표시한다', () => {
    mockAnalyses.mockReturnValue({
      analyses: [
        { id: 'pc_1', type: 'personal-color', createdAt: new Date(), seasonType: 'Spring' },
        { id: 'skin_1', type: 'skin', createdAt: new Date(), skinScore: 65 },
      ],
      analysisCount: 2,
      isLoading: false,
    });

    render(<ResultPageInsights currentModule="skin" />);

    expect(screen.getByText('2개')).toBeInTheDocument();
  });

  it('알 수 없는 모듈이면 렌더링하지 않는다', () => {
    mockAnalyses.mockReturnValue({
      analyses: [
        { id: 'pc_1', type: 'personal-color', createdAt: new Date(), seasonType: 'Spring' },
        { id: 'skin_1', type: 'skin', createdAt: new Date(), skinScore: 65 },
      ],
      analysisCount: 2,
      isLoading: false,
    });

    // MODULE_MAP에 없는 모듈이므로 generateInsightsForModule 호출 전에 빈 배열 반환
    const { container } = render(<ResultPageInsights currentModule="unknown-module" />);

    expect(container.firstChild).toBeNull();
  });

  it('className이 적용된다', () => {
    mockAnalyses.mockReturnValue({
      analyses: [
        { id: 'pc_1', type: 'personal-color', createdAt: new Date(), seasonType: 'Spring' },
        { id: 'skin_1', type: 'skin', createdAt: new Date(), skinScore: 65 },
      ],
      analysisCount: 2,
      isLoading: false,
    });

    render(<ResultPageInsights currentModule="skin" className="mt-4" />);

    const container = screen.getByTestId('result-page-insights');
    expect(container.className).toContain('mt-4');
  });
});
