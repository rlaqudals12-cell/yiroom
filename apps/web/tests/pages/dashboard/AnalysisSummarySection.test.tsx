import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalysisSummarySection from '@/app/(main)/dashboard/_components/AnalysisSummarySection';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockAnalyses: AnalysisSummary[] = [
  {
    id: 'pc-1',
    type: 'personal-color',
    createdAt: new Date(),
    summary: '봄 웜톤',
    seasonType: 'Spring',
  },
  {
    id: 'skin-1',
    type: 'skin',
    createdAt: new Date(),
    summary: '85점',
    skinScore: 85,
  },
];

describe('AnalysisSummarySection', () => {
  it('섹션이 올바른 data-testid로 렌더링된다', () => {
    render(<AnalysisSummarySection analyses={mockAnalyses} />);
    expect(screen.getByTestId('analysis-summary-section')).toBeInTheDocument();
  });

  it('내 분석 요약 헤더가 표시된다', () => {
    render(<AnalysisSummarySection analyses={mockAnalyses} />);
    expect(screen.getByText('내 분석 요약')).toBeInTheDocument();
  });

  it('전체 보기 링크가 표시된다', () => {
    render(<AnalysisSummarySection analyses={mockAnalyses} />);
    expect(screen.getByText('전체 보기')).toBeInTheDocument();
  });

  it('완료된 분석들이 표시된다', () => {
    render(<AnalysisSummarySection analyses={mockAnalyses} />);

    expect(screen.getByTestId('analysis-summary-personal-color')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-summary-skin')).toBeInTheDocument();
  });

  it('분석 요약 값이 표시된다', () => {
    render(<AnalysisSummarySection analyses={mockAnalyses} />);

    expect(screen.getByText('봄 웜톤')).toBeInTheDocument();
    expect(screen.getByText('85점')).toBeInTheDocument();
  });

  it('미완료 분석 개수가 표시된다', () => {
    render(<AnalysisSummarySection analyses={mockAnalyses} />);

    // 6개 중 2개 완료 → 4개 남음
    expect(screen.getByText('4개 분석이 남았어요')).toBeInTheDocument();
  });

  it('추가 분석 버튼이 표시된다', () => {
    render(<AnalysisSummarySection analyses={mockAnalyses} />);
    expect(screen.getByText('추가 분석')).toBeInTheDocument();
  });

  it('분석 카드 클릭 시 결과 페이지로 이동', () => {
    render(<AnalysisSummarySection analyses={mockAnalyses} />);

    const personalColorCard = screen.getByTestId('analysis-summary-personal-color');
    expect(personalColorCard).toHaveAttribute('href', '/analysis/personal-color/result/pc-1');

    const skinCard = screen.getByTestId('analysis-summary-skin');
    expect(skinCard).toHaveAttribute('href', '/analysis/skin/result/skin-1');
  });

  it('모든 분석 완료 시 미완료 섹션이 숨겨진다', () => {
    const allAnalyses: AnalysisSummary[] = [
      { id: '1', type: 'personal-color', createdAt: new Date(), summary: '봄 웜톤' },
      { id: '2', type: 'skin', createdAt: new Date(), summary: '85점' },
      { id: '3', type: 'body', createdAt: new Date(), summary: '모래시계형' },
      { id: '4', type: 'hair', createdAt: new Date(), summary: '직모' },
      { id: '5', type: 'makeup', createdAt: new Date(), summary: '웜톤' },
      { id: '6', type: 'oral-health', createdAt: new Date(), summary: '90점' },
    ];

    render(<AnalysisSummarySection analyses={allAnalyses} />);

    // 모든 분석 완료 시 "N개 분석이 남았어요" 텍스트가 없어야 함
    expect(screen.queryByText(/분석이 남았어요/)).not.toBeInTheDocument();
  });

  it('빈 분석 배열 처리', () => {
    render(<AnalysisSummarySection analyses={[]} />);

    expect(screen.getByTestId('analysis-summary-section')).toBeInTheDocument();
    expect(screen.getByText('6개 분석이 남았어요')).toBeInTheDocument();
  });

  it('분석 타입별 라벨이 표시된다', () => {
    render(<AnalysisSummarySection analyses={mockAnalyses} />);

    expect(screen.getByText('퍼스널 컬러')).toBeInTheDocument();
    expect(screen.getByText('피부')).toBeInTheDocument();
  });
});
